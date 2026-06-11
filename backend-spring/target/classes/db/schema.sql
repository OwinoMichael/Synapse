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

-- ── Raw WebSocket messages ────────────────────────────────────────────────────
-- Kept for schema compatibility but never written to in prod.
-- DataRetentionScheduler deletes all rows hourly.
CREATE TABLE IF NOT EXISTS raw_market_messages (
                                                   id           BIGSERIAL PRIMARY KEY,
                                                   payload      TEXT        NOT NULL,
                                                   event_type   VARCHAR(64),
    received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

-- ── Markets ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS markets (
                                       id                 VARCHAR(255) PRIMARY KEY,
    condition_id       VARCHAR(255) NOT NULL UNIQUE,
    question_id        VARCHAR(255),
    question           TEXT,
    description        TEXT,
    category           VARCHAR(100),
    tags               TEXT,
    event_id           VARCHAR(255),
    event_title        TEXT,
    clob_token_ids     TEXT,
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

CREATE INDEX IF NOT EXISTS idx_markets_condition_id   ON markets(condition_id);
CREATE INDEX IF NOT EXISTS idx_markets_category       ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_active_closed  ON markets(active, closed);
CREATE INDEX IF NOT EXISTS idx_markets_volume_24h     ON markets(volume_24h DESC) WHERE active = true;

-- ── Trades ────────────────────────────────────────────────────────────────────
-- Retention: 24 hours only (purged by DataRetentionScheduler)
CREATE TABLE IF NOT EXISTS trades (
                                      id             VARCHAR(255) PRIMARY KEY,
    market_id      VARCHAR(255) NOT NULL,
    asset_id       VARCHAR(255),
    side           VARCHAR(10),
    price          NUMERIC(10, 6),
    size           NUMERIC(20, 2),
    usdc_value     NUMERIC(20, 2),
    maker_address  VARCHAR(64),
    taker_address  VARCHAR(64),
    timestamp      TIMESTAMPTZ  NOT NULL,
    is_whale       BOOLEAN      NOT NULL DEFAULT FALSE
    );

CREATE INDEX IF NOT EXISTS idx_trades_market_id       ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp       ON trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_whale_timestamp ON trades(timestamp DESC) WHERE is_whale = TRUE;

-- ── Signals ───────────────────────────────────────────────────────────────────
-- Retention: 7 days (purged by DataRetentionScheduler)
CREATE TABLE IF NOT EXISTS signals (
                                       id              BIGSERIAL    PRIMARY KEY,
                                       market_id       VARCHAR(255) NOT NULL,
    market_question TEXT,
    category        VARCHAR(100),
    market_odds     NUMERIC(5, 2),
    ai_estimate     NUMERIC(5, 2),
    gap             NUMERIC(5, 2),
    confidence      VARCHAR(20),
    summary         TEXT,
    keywords        TEXT,
    sources         TEXT,
    price_history   TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
    );

CREATE INDEX IF NOT EXISTS idx_signals_market_id  ON signals(market_id);
CREATE INDEX IF NOT EXISTS idx_signals_confidence ON signals(confidence);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);
