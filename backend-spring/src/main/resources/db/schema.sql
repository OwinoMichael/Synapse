-- =============================================================================
-- Synapse — PostgreSQL Schema
-- =============================================================================
-- JPA/Hibernate with ddl-auto=update will create these automatically,
-- but having explicit DDL gives you:
--   1. Version-controlled schema history
--   2. Production migrations via Flyway/Liquibase later
--   3. Ability to add constraints/indexes Hibernate won't add automatically
--
-- Run order: schema.sql is executed once on a fresh DB.
-- For incremental migrations, move to Flyway (recommended for prod).
-- =============================================================================

-- ── Raw WebSocket messages (CLOB feature) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_market_messages (
    id           BIGSERIAL PRIMARY KEY,
    payload      TEXT        NOT NULL,
    event_type   VARCHAR(64),
    received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_event_type
    ON raw_market_messages(event_type);

CREATE INDEX IF NOT EXISTS idx_raw_received_at
    ON raw_market_messages(received_at);

-- Partition hint: this table grows fast. Consider partitioning by received_at
-- (monthly) once volume exceeds a few million rows.


-- ── Markets (Gamma feature) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS markets (
    id                 VARCHAR(255) PRIMARY KEY,
    condition_id       VARCHAR(255) NOT NULL UNIQUE,  -- CLOB join key
    question_id        VARCHAR(255),
    question           TEXT,
    description        TEXT,
    category           VARCHAR(100),
    tags               TEXT,                          -- pipe-separated labels
    event_id           VARCHAR(255),
    event_title        TEXT,
    clob_token_ids     TEXT,                          -- pipe-separated: yes|no
    yes_price          NUMERIC(10, 6),
    no_price           NUMERIC(10, 6),
    active             BOOLEAN      NOT NULL DEFAULT TRUE,
    closed             BOOLEAN      NOT NULL DEFAULT FALSE,
    archived           BOOLEAN      NOT NULL DEFAULT FALSE,
    enable_order_book  BOOLEAN      NOT NULL DEFAULT FALSE,
    volume             NUMERIC(20, 2),
    volume_24h         NUMERIC(20, 2),
    liquidity          NUMERIC(20, 2),
    end_date           TIMESTAMPTZ,
    start_date         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ,
    updated_at         TIMESTAMPTZ,
    last_synced_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_markets_condition_id
    ON markets(condition_id);

CREATE INDEX IF NOT EXISTS idx_markets_category
    ON markets(category);

CREATE INDEX IF NOT EXISTS idx_markets_active_closed
    ON markets(active, closed);

CREATE INDEX IF NOT EXISTS idx_markets_enable_order_book
    ON markets(enable_order_book);


-- ── Trades (Trades feature) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trades (
    id             VARCHAR(255) PRIMARY KEY,
    market_id      VARCHAR(255) NOT NULL,   -- FK to markets.condition_id
    asset_id       VARCHAR(255),
    side           VARCHAR(10),             -- BUY | SELL
    price          NUMERIC(10, 6),
    size           NUMERIC(20, 2),
    usdc_value     NUMERIC(20, 2),          -- price × size
    maker_address  VARCHAR(64),
    taker_address  VARCHAR(64),
    timestamp      TIMESTAMPTZ  NOT NULL,
    is_whale       BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_trades_market_id
    ON trades(market_id);

CREATE INDEX IF NOT EXISTS idx_trades_timestamp
    ON trades(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_trades_is_whale
    ON trades(is_whale) WHERE is_whale = TRUE;

-- Partial index — whale-only queries are common for the live feed
CREATE INDEX IF NOT EXISTS idx_trades_whale_timestamp
    ON trades(timestamp DESC) WHERE is_whale = TRUE;


-- ── Signals (Signals feature — placeholder for future) ───────────────────────
CREATE TABLE IF NOT EXISTS signals (
    id              BIGSERIAL    PRIMARY KEY,
    market_id       VARCHAR(255) NOT NULL,
    market_question TEXT,
    category        VARCHAR(100),
    market_odds     NUMERIC(5, 2),          -- 0.00 – 100.00 (%)
    ai_estimate     NUMERIC(5, 2),
    gap             NUMERIC(5, 2),          -- market_odds - ai_estimate
    confidence      VARCHAR(20),            -- HIGH | MONITOR | NORMAL
    summary         TEXT,
    keywords        TEXT,                   -- pipe-separated
    sources         TEXT,                   -- JSON array of {name, sentiment}
    price_history   TEXT,                   -- JSON array of price points
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ             -- null = still active
);

CREATE INDEX IF NOT EXISTS idx_signals_market_id
    ON signals(market_id);

CREATE INDEX IF NOT EXISTS idx_signals_confidence
    ON signals(confidence);

CREATE INDEX IF NOT EXISTS idx_signals_created_at
    ON signals(created_at DESC);
