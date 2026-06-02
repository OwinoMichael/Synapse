# Feature: Trades

> Polls the Polymarket Data API every 30 seconds for recent trades,
> persists them, flags whale activity, and pushes live updates to the
> Next.js frontend via STOMP WebSocket.

---

## Responsibility

This feature owns the **trade activity layer**. It answers:
- What trades happened recently across all tracked markets?
- Which trades are large enough to be "whale" activity?
- How do we push this to the frontend in real time?

It does **not**:
- Stream raw order book data (→ `clob` feature)
- Produce AI mismatch signals (→ `signals` feature)

---

## Data Flow

```
Polymarket Data API
https://data-api.polymarket.com/trades
        │
        │  GET /trades?taker_start_ts=<last_poll>&limit=100
        │  Polled every 30 seconds
        ▼
TradesSyncScheduler          [infrastructure/scheduler]
        │
        ▼
TradesSyncUseCase            [application]
        ├──► TradesApiClient       fetch new trades
        ├──► TradeRepository       upsert (idempotent by trade ID)
        └──► LiveFeedPublisher     push to STOMP /topic/trades
                    │
                    ▼
        Next.js useLiveFeed() hook
        → Live activity feed on Dashboard
```

---

## Package Structure

```
trades/
├── application/
│   └── TradesSyncUseCase.java        Orchestrate fetch → persist → push
├── domain/
│   └── Trade.java                    Domain record
└── infrastructure/
    ├── client/
    │   ├── TradesApiClient.java       HTTP poll client
    │   └── TradesApiResponse.java     Jackson DTO
    ├── persistence/
    │   ├── TradeEntity.java           JPA entity
    │   └── TradeRepository.java       Spring Data repo
    └── scheduler/
        └── TradesSyncScheduler.java   @Scheduled every 30s
```

---

## Data API Endpoint

| Property    | Value                                              |
|-------------|----------------------------------------------------|
| Base URL    | `https://data-api.polymarket.com`                  |
| Endpoint    | `GET /trades`                                      |
| Auth        | None                                               |
| Key params  | `taker_start_ts`, `limit`, `order`, `ascending`   |

### Query strategy

Each poll sends `taker_start_ts=<last_processed_epoch>` so only new trades
are returned. On startup, looks back `lookback-seconds` (default 5 min)
to catch any trades that arrived while the service was down.

Trades are deduplicated by `id` — if a trade already exists in the DB it
is skipped, making every sync idempotent.

---

## Whale Detection

A trade is flagged as a whale when:

```
usdcValue = price × size >= whale_threshold (default $10,000 USDC)
```

Configurable via `polymarket.trades.whale-threshold` in `application.yml`.

Whale trades get a `🐋` prefix in the STOMP message text and a
`type: "whale"` field so the frontend can style them differently.

---

## Database Table

```sql
CREATE TABLE trades (
    id             VARCHAR PRIMARY KEY,
    market_id      VARCHAR NOT NULL,      -- conditionId, FK to markets.condition_id
    asset_id       VARCHAR,               -- YES or NO token
    side           VARCHAR(10),           -- BUY | SELL
    price          NUMERIC(10,6),         -- 0.00 – 1.00
    size           NUMERIC(20,2),         -- USDC amount
    usdc_value     NUMERIC(20,2),         -- price × size
    maker_address  VARCHAR(64),
    taker_address  VARCHAR(64),
    timestamp      TIMESTAMP NOT NULL,
    is_whale       BOOLEAN NOT NULL
);

CREATE INDEX idx_trades_market_id ON trades(market_id);
CREATE INDEX idx_trades_timestamp  ON trades(timestamp);
CREATE INDEX idx_trades_is_whale   ON trades(is_whale);
```

---

## STOMP Output

| Topic           | When                        | Payload type      |
|-----------------|-----------------------------|-------------------|
| `/topic/trades` | Every new trade persisted   | `LiveFeedMessage` |

### LiveFeedMessage fields

```
type           "whale" | "trade"
marketId       conditionId
marketQuestion Human-readable question (joined from markets table)
category       e.g. "Crypto", "Politics"
text           Pre-formatted display string: "🐋 Whale bet $48,000 BUY on..."
usdcValue      Numeric USDC value
price          YES price at time of trade
side           "BUY" | "SELL"
isWhale        boolean
timestamp      ISO-8601
```

---

## Configuration

```yaml
polymarket:
  trades:
    base-url: https://data-api.polymarket.com
    poll-interval-ms: 30000    # 30 seconds
    whale-threshold: 10000     # USDC
    lookback-seconds: 300      # 5 min on startup
    page-size: 100
```

---

## Frontend Integration

```tsx
import { useLiveFeed } from '@/hooks/useLiveFeed'

const { messages, connected } = useLiveFeed({ maxItems: 20 })
// messages[0] → most recent trade/whale alert
// connected   → show live indicator
```

---

## Testing Notes

- `TradesSyncUseCase` — unit test whale detection logic with various
  `price × size` combinations around the threshold boundary
- `TradesApiClient` — WireMock stub for `/trades` endpoint with
  paginated fixture responses
- `TradeRepository` — `@DataJpaTest` for idempotency: inserting the
  same trade ID twice should not throw

### Fixture JSON

```json
[
  {
    "id": "trade-001",
    "market": "0xabc123",
    "asset_id": "token-yes-001",
    "side": "BUY",
    "price": "0.78",
    "size": "61538",
    "maker_address": "0xmaker",
    "taker_address": "0xtaker",
    "timestamp": "1750000000"
  }
]
```

---

## Future Improvements

- [ ] Track 24h volume per market by summing `usdc_value` from trades table
- [ ] Alert on abnormal trade velocity (many small trades in short window)
- [ ] Expose `GET /api/trades/recent` REST endpoint for frontend fallback
- [ ] Add `market_id` index to speed up per-market trade history queries