-- ============================================================================
-- AlphaCall CRM — PostgreSQL schema
-- Requires: PostgreSQL 15+, pgcrypto (gen_random_uuid), optional pg_partman
-- Conventions: uuid PKs, created_at/updated_at, FKs indexed, team RLS via
--              current_setting('app.team_id'), high-volume tables partitioned
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------- identities
CREATE TABLE teams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  settings      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES teams(id),
  email         citext NOT NULL UNIQUE,
  display_name  text NOT NULL,
  role          text NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner','admin','analyst','member','viewer')),
  api_key_hash  text,                       -- hashed; raw key never stored
  settings      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON users (team_id);

-- ------------------------------------------------------------------- chains
CREATE TABLE chains (
  id            text PRIMARY KEY,           -- 'solana' | 'ethereum' | 'base' | ...
  name          text NOT NULL,
  kind          text NOT NULL CHECK (kind IN ('evm','svm','other')),
  native_symbol text NOT NULL,
  explorer_url  text,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------- tokens
CREATE TABLE tokens (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id              text NOT NULL REFERENCES chains(id),
  contract_address      text NOT NULL,
  name                  text NOT NULL,
  ticker                text NOT NULL,
  launch_at             timestamptz,
  pair_created_at       timestamptz,
  deployer_wallet       text,
  primary_pool          text,
  website               text,
  social_links          jsonb NOT NULL DEFAULT '{}',
  is_official           boolean NOT NULL DEFAULT true,  -- false for detected copycats
  superseded_by         uuid REFERENCES tokens(id),     -- migrations / contract changes
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chain_id, contract_address)                    -- canonical identity
);
CREATE INDEX ON tokens (ticker);            -- tickers are NOT unique by design
CREATE INDEX ON tokens (chain_id, launch_at);

CREATE TABLE token_pairs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id          uuid NOT NULL REFERENCES tokens(id),
  chain_id          text NOT NULL REFERENCES chains(id),
  pair_address      text NOT NULL,
  dex               text NOT NULL,
  base_symbol       text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chain_id, pair_address)
);
CREATE INDEX ON token_pairs (token_id);

-- Time-series: partition by month (pg_partman); PK includes partition key.
CREATE TABLE token_market_snapshots (
  token_id          uuid NOT NULL REFERENCES tokens(id),
  at                timestamptz NOT NULL,
  price_usd         numeric,
  market_cap_usd    numeric,
  fdv_usd           numeric,
  liquidity_usd     numeric,
  volume_24h_usd    numeric,
  holder_count      integer,
  buys_1h           integer,
  sells_1h          integer,
  provider          text NOT NULL,
  PRIMARY KEY (token_id, at)
) PARTITION BY RANGE (at);
CREATE INDEX ON token_market_snapshots (at);

CREATE TABLE token_risk_snapshots (
  token_id              uuid NOT NULL REFERENCES tokens(id),
  at                    timestamptz NOT NULL,
  risk_score            numeric CHECK (risk_score BETWEEN 0 AND 100),
  top10_holder_pct      numeric,
  bundled_supply_pct    numeric,
  mint_authority        boolean,
  freeze_authority      boolean,
  honeypot_indicated    boolean,
  transfer_tax_bps      integer,
  wash_trading_score    numeric,
  flags                 text[] NOT NULL DEFAULT '{}',
  provider              text NOT NULL,
  PRIMARY KEY (token_id, at)
) PARTITION BY RANGE (at);

CREATE TABLE token_holder_snapshots (
  token_id          uuid NOT NULL REFERENCES tokens(id),
  at                timestamptz NOT NULL,
  holder_count      integer NOT NULL,
  top10_pct         numeric,
  top50_pct         numeric,
  smart_wallet_count integer,
  PRIMARY KEY (token_id, at)
) PARTITION BY RANGE (at);

-- ----------------------------------------------------------------- X social
CREATE TABLE x_accounts (
  id                    text PRIMARY KEY,            -- X account id
  username              text NOT NULL,
  display_name          text NOT NULL,
  bio                   text,
  profile_image_url     text,
  account_created_at    timestamptz,
  verified              boolean,
  known_aliases         text[] NOT NULL DEFAULT '{}',
  communities           jsonb NOT NULL DEFAULT '[]', -- TG/Discord links
  group_relationships   jsonb NOT NULL DEFAULT '[]',
  first_seen_at         timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON x_accounts (username);

CREATE TABLE x_account_snapshots (
  account_id    text NOT NULL REFERENCES x_accounts(id),
  at            timestamptz NOT NULL,
  followers     integer,
  following     integer,
  post_count    integer,
  verified      boolean,
  PRIMARY KEY (account_id, at)
) PARTITION BY RANGE (at);

CREATE TABLE x_posts (
  id                text PRIMARY KEY,               -- X post id (idempotency key)
  author_id         text NOT NULL REFERENCES x_accounts(id),
  text              text NOT NULL,
  lang              text,
  posted_at         timestamptz NOT NULL,
  url               text NOT NULL,
  kind              text NOT NULL CHECK (kind IN ('original','reply','quote','repost')),
  referenced_post_id text,
  mentioned_accounts text[] NOT NULL DEFAULT '{}',
  urls              text[] NOT NULL DEFAULT '{}',
  media             jsonb NOT NULL DEFAULT '[]',
  raw               jsonb NOT NULL,                 -- immutable provider payload
  author_followers_at_post integer,
  author_following_at_post integer,
  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  edited_at         timestamptz,
  deleted_at        timestamptz                     -- fact of deletion retained
) PARTITION BY RANGE (posted_at);
CREATE INDEX ON x_posts (author_id, posted_at);
CREATE INDEX ON x_posts (posted_at);

CREATE TABLE post_metrics_snapshots (
  post_id       text NOT NULL,                      -- FK omitted across partitions
  at            timestamptz NOT NULL,
  replies       integer, reposts integer, quotes integer,
  likes         integer, bookmarks integer, views bigint,
  PRIMARY KEY (post_id, at)
) PARTITION BY RANGE (at);

-- -------------------------------------------------------- analysis entities
CREATE TABLE token_mentions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id               text NOT NULL,
  token_id              uuid REFERENCES tokens(id),   -- NULL = unresolved/abstained
  detected_name         text,
  detected_ticker       text,
  detected_contract     text,
  detected_chain        text REFERENCES chains(id),
  resolution_method     text NOT NULL CHECK (resolution_method IN
    ('contract','dex_link','name_chain','cashtag_context','image','narrative','manual')),
  resolution_confidence numeric NOT NULL CHECK (resolution_confidence BETWEEN 0 AND 1),
  sentiment             text,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON token_mentions (token_id, created_at);
CREATE INDEX ON token_mentions (post_id);

CREATE TABLE calls (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id                   text NOT NULL,
  author_id                 text NOT NULL REFERENCES x_accounts(id),
  token_id                  uuid NOT NULL REFERENCES tokens(id),
  called_at                 timestamptz NOT NULL,         -- exact post timestamp
  category                  text NOT NULL CHECK (category IN
    ('explicit_bullish_call','implied_bullish_call','watchlist_mention',
     'neutral_discussion','news_reporting','technical_analysis',
     'narrative_commentary','bearish_warning','scam_warning','paid_promotion',
     'giveaway_engagement_farming','joke_sarcasm','repost_no_conviction',
     'exit_profit_taking','unclear')),
  is_measurable             boolean NOT NULL,
  conviction_score          numeric CHECK (conviction_score BETWEEN 0 AND 100),
  originality_score         numeric CHECK (originality_score BETWEEN 0 AND 100),
  timing_score              numeric CHECK (timing_score BETWEEN 0 AND 100),
  evidence_strength         numeric CHECK (evidence_strength BETWEEN 0 AND 100),
  contract_supplied         boolean NOT NULL DEFAULT false,
  entry_price_supplied      boolean NOT NULL DEFAULT false,
  edited                    boolean NOT NULL DEFAULT false,
  deleted                   boolean NOT NULL DEFAULT false,
  appears_sponsored         boolean NOT NULL DEFAULT false,
  ownership_disclosed       boolean,
  sponsorship_probability   numeric CHECK (sponsorship_probability BETWEEN 0 AND 1),
  ai_explanation            text,
  confidence_score          numeric CHECK (confidence_score BETWEEN 0 AND 1),
  -- attribution (filled by workers)
  price_at_call             numeric,
  mcap_at_call              numeric,
  fdv_at_call               numeric,
  liquidity_at_call         numeric,
  holders_at_call           integer,
  volume_at_call            numeric,
  returns                   jsonb NOT NULL DEFAULT '{}',  -- {m5,m15,h1,h6,h24,d3,d7,d30}
  max_price_after           numeric,
  max_mcap_after            numeric,
  headline_multiple         numeric,
  realistic_multiple        numeric,
  max_drawdown_after        numeric,
  time_to_peak_minutes      integer,
  tradable_in_out           boolean,
  outcome                   text CHECK (outcome IN
    ('open','profitable','failed','rugged','halted','migrated','abandoned','unresolved')),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON calls (author_id, called_at);
CREATE INDEX ON calls (token_id, called_at);
CREATE INDEX ON calls (is_measurable, called_at);

CREATE TABLE caller_scores (
  account_id        text PRIMARY KEY REFERENCES x_accounts(id),
  alpha_score       numeric NOT NULL CHECK (alpha_score BETWEEN 0 AND 100),
  tier              text NOT NULL CHECK (tier IN ('S','A','B','C','watchlist','high_risk')),
  components        jsonb NOT NULL,        -- every weighted component, displayed in UI
  penalties         jsonb NOT NULL DEFAULT '[]',
  sample_size       integer NOT NULL,
  ci_low            numeric,
  ci_high           numeric,
  behaviour         jsonb NOT NULL DEFAULT '{}',   -- ratios from §6 of the PRD
  performance       jsonb NOT NULL DEFAULT '{}',   -- hit rates, medians, by-chain, ...
  computed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE caller_score_history (
  account_id    text NOT NULL REFERENCES x_accounts(id),
  at            timestamptz NOT NULL,
  alpha_score   numeric NOT NULL,
  tier          text NOT NULL,
  components    jsonb NOT NULL,
  PRIMARY KEY (account_id, at)
) PARTITION BY RANGE (at);

-- --------------------------------------------------------------- narratives
CREATE TABLE narratives (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL UNIQUE,
  name              text NOT NULL,
  description       text,
  first_detected_at timestamptz NOT NULL,
  lifecycle_stage   text NOT NULL CHECK (lifecycle_stage IN
    ('dormant','emerging','accelerating','mainstream','saturated','declining','reviving')),
  related_terms     text[] NOT NULL DEFAULT '{}',
  organic_score     numeric CHECK (organic_score BETWEEN 0 AND 100),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE narrative_mentions (
  narrative_id  uuid NOT NULL REFERENCES narratives(id),
  post_id       text NOT NULL,
  token_id      uuid REFERENCES tokens(id),
  at            timestamptz NOT NULL,
  PRIMARY KEY (narrative_id, post_id)
);
CREATE INDEX ON narrative_mentions (narrative_id, at);

CREATE TABLE narrative_clusters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_id  uuid NOT NULL REFERENCES narratives(id),
  centroid      jsonb NOT NULL,           -- embedding centroid / representative terms
  member_terms  text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------ wallets & relations
CREATE TABLE wallet_addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id      text NOT NULL REFERENCES chains(id),
  address       text NOT NULL,
  label         text,
  is_deployer   boolean NOT NULL DEFAULT false,
  risk_flags    text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chain_id, address)
);

CREATE TABLE wallet_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id     uuid NOT NULL REFERENCES wallet_addresses(id),
  token_id      uuid REFERENCES tokens(id),
  tx_hash       text NOT NULL,
  kind          text NOT NULL CHECK (kind IN ('buy','sell','transfer','add_liquidity','remove_liquidity','deploy')),
  amount_usd    numeric,
  at            timestamptz NOT NULL,
  UNIQUE (wallet_id, tx_hash)
);
CREATE INDEX ON wallet_transactions (token_id, at);

CREATE TABLE caller_wallet_links (
  account_id    text NOT NULL REFERENCES x_accounts(id),
  wallet_id     uuid NOT NULL REFERENCES wallet_addresses(id),
  source        text NOT NULL CHECK (source IN ('public_disclosure','manual','inferred')),
  confidence    numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, wallet_id)
);

CREATE TABLE caller_relationships (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_a     text NOT NULL REFERENCES x_accounts(id),
  account_b     text NOT NULL REFERENCES x_accounts(id),
  kind          text NOT NULL CHECK (kind IN
    ('same_group','shared_wallet','coordinated_posting','copy_cascade','team','alias_suspected')),
  evidence      jsonb NOT NULL DEFAULT '{}',
  confidence    numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (account_a < account_b)
);
CREATE INDEX ON caller_relationships (account_a);
CREATE INDEX ON caller_relationships (account_b);

-- ------------------------------------------------------------------ signals
CREATE TABLE signal_scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id          uuid NOT NULL REFERENCES tokens(id),
  at                timestamptz NOT NULL,
  runner_score      numeric NOT NULL CHECK (runner_score BETWEEN 0 AND 100),
  components        jsonb NOT NULL,        -- social/caller/timing/narrative/market/risk
  explanation       jsonb NOT NULL,        -- {why, positives, negatives, missing, confidence, freshness, monitoring}
  UNIQUE (token_id, at)
);
CREATE INDEX ON signal_scores (at DESC, runner_score DESC);

CREATE TABLE convergence_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id              uuid NOT NULL REFERENCES tokens(id),
  detected_at           timestamptz NOT NULL,
  first_call_at         timestamptz NOT NULL,
  caller_ids            text[] NOT NULL,
  avg_alpha_score       numeric,
  independence_score    numeric CHECK (independence_score BETWEEN 0 AND 1),
  wording_similarity    numeric CHECK (wording_similarity BETWEEN 0 AND 1),
  mcap_at_first_call    numeric,
  liquidity_at_convergence numeric,
  pre_convergence_move  numeric,
  classification        text NOT NULL CHECK (classification IN
    ('organic','possible_coordinated_campaign','confirmed_sponsored_campaign',
     'copy_trading_cascade','uncertain')),
  evidence              jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON convergence_events (token_id, detected_at);

-- ------------------------------------------------------------------- alerts
CREATE TABLE alerts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES teams(id),
  user_id       uuid NOT NULL REFERENCES users(id),
  name          text NOT NULL,
  trigger_type  text NOT NULL,            -- 15 types, validated in app layer
  conditions    jsonb NOT NULL,
  destinations  text[] NOT NULL DEFAULT '{in_app}',  -- in_app|telegram|discord|email|push|webhook
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON alerts (team_id);

CREATE TABLE alert_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id      uuid NOT NULL REFERENCES alerts(id),
  fired_at      timestamptz NOT NULL DEFAULT now(),
  what          text NOT NULL,            -- what happened
  why           text NOT NULL,            -- why it matters
  supporting    jsonb NOT NULL DEFAULT '{}',
  risks         text NOT NULL DEFAULT '',
  confidence    numeric CHECK (confidence BETWEEN 0 AND 1),
  links         jsonb NOT NULL DEFAULT '{}',  -- token/caller/post links
  delivered     jsonb NOT NULL DEFAULT '{}'   -- per-destination delivery status
);
CREATE INDEX ON alert_events (alert_id, fired_at);

-- ---------------------------------------------------------------------- CRM
CREATE TABLE crm_tags (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES teams(id),
  name          text NOT NULL,
  colour        text,
  UNIQUE (team_id, name)
);

CREATE TABLE crm_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES teams(id),
  author_id     uuid NOT NULL REFERENCES users(id),
  subject_kind  text NOT NULL CHECK (subject_kind IN ('caller','token','investigation')),
  subject_id    text NOT NULL,
  body          text NOT NULL,
  is_private    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON crm_notes (team_id, subject_kind, subject_id);

CREATE TABLE caller_lists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES teams(id),
  name          text NOT NULL,
  member_ids    text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, name)
);

-- team-scoped caller record (status/assignment/follow live here, not on x_accounts)
CREATE TABLE crm_caller_records (
  team_id       uuid NOT NULL REFERENCES teams(id),
  account_id    text NOT NULL REFERENCES x_accounts(id),
  status        text NOT NULL DEFAULT 'new_discovery' CHECK (status IN
    ('new_discovery','under_review','proven_caller','high_priority',
     'narrative_specialist','possible_promoter','coordinated_group',
     'high_risk','ignored','archived')),
  assigned_to   uuid REFERENCES users(id),
  followed_by   uuid[] NOT NULL DEFAULT '{}',
  tag_ids       uuid[] NOT NULL DEFAULT '{}',
  reminders     jsonb NOT NULL DEFAULT '[]',
  manual_wallets text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, account_id)
);

CREATE TABLE investigations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES teams(id),
  title         text NOT NULL,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open','active','resolved','archived')),
  subjects      jsonb NOT NULL DEFAULT '[]',   -- callers, tokens, wallets, posts
  findings      text,
  created_by    uuid NOT NULL REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------- ops & review
CREATE TABLE manual_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text NOT NULL CHECK (kind IN
    ('token_resolution','call_classification','sponsorship','scam_class',
     'caller_relationship','score_component')),
  subject_id    text NOT NULL,
  before        jsonb NOT NULL,
  after         jsonb,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','corrected','confirmed','rejected')),
  reviewer_id   uuid REFERENCES users(id),
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON manual_reviews (status, kind);

CREATE TABLE audit_logs (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id       uuid REFERENCES teams(id),
  user_id       uuid REFERENCES users(id),
  action        text NOT NULL,
  subject_kind  text NOT NULL,
  subject_id    text NOT NULL,
  detail        jsonb NOT NULL DEFAULT '{}',
  at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_logs (team_id, at);

CREATE TABLE provider_sync_logs (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider      text NOT NULL,
  operation     text NOT NULL,
  status        text NOT NULL CHECK (status IN ('ok','rate_limited','error','circuit_open')),
  items         integer,
  latency_ms    integer,
  error         text,
  at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON provider_sync_logs (provider, at);

-- ------------------------------------------------------------ row-level sec
-- Team-scoped tables get RLS keyed on app.team_id set by the API layer.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'alerts','crm_tags','crm_notes','caller_lists','crm_caller_records','investigations'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY team_isolation ON %I USING (team_id = current_setting(''app.team_id'')::uuid)', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------- seed data
INSERT INTO chains (id, name, kind, native_symbol, explorer_url) VALUES
  ('solana',   'Solana',          'svm', 'SOL', 'https://solscan.io'),
  ('ethereum', 'Ethereum',        'evm', 'ETH', 'https://etherscan.io'),
  ('base',     'Base',            'evm', 'ETH', 'https://basescan.org'),
  ('robinhood','Robinhood Chain', 'evm', 'ETH', NULL);
UPDATE chains SET enabled = false WHERE id = 'robinhood'; -- until indexer + market data are reliable
