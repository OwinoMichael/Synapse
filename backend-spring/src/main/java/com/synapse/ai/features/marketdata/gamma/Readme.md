# Feature: Gamma Market Data

> Polls the Polymarket Gamma REST API to fetch and persist market metadata,
> then notifies the CLOB WebSocket client to refresh its subscriptions.

---

## Responsibility

This feature owns the **market metadata layer**. It periodically fetches
the Polymarket market catalogue (questions, categories, closing dates, token IDs,
prices, volume) from the Gamma REST API and upserts it into the local database.

It does **not**:
- Handle live price streaming (→ `clob` feature)
- Produce AI signals (→ `signals` feature)

---

## Data Flow

```
Gamma REST API
https://gamma-api.polymarket.com/markets
        │
        │  GET /markets?active=true&archived=false&enableOrderBook=true
        │  Paginated (cursor-based, page size 100)
        ▼
GammaSyncScheduler           [infrastructure/scheduler]
        │  triggers on startup + every 10 min
        ▼
GammaSyncUseCase             [application]
        │
        ├──► GammaApiClient         fetch all pages
        ├──► GammaMarketMapper      DTO → domain → entity
        ├──► MarketRepository       upsert into markets table
        └──► GammaMarketsRefreshedEvent
                    │
                    ▼
        PolymarketWebSocketClient   re-sends subscription
        with updated asset IDs from DB
```

---

## Package Structure

```
gamma/
├── application/
│   ├── GammaMarketsRefreshedEvent.java   Spring event fired after each sync
│   ├── GammaMarketMapper.java            DTO ↔ domain ↔ entity mapping
│   └── GammaSyncUseCase.java             Orchestrate fetch → upsert → publish
├── domain/
│   └── GammaMarket.java                  Domain record
└── infrastructure/
    ├── client/
    │   ├── GammaApiClient.java           HTTP client with pagination
    │   ├── GammaApiResponse.java         Jackson DTO (market object)
    │   └── GammaPagedResponse.java       Pagination envelope DTO
    ├── persistence/
    │   ├── MarketEntity.java             JPA entity
    │   └── MarketRepository.java         Spring Data repo
    └── scheduler/
        └── GammaSyncScheduler.java       @PostConstruct + @Scheduled trigger
```

---

## Gamma API Endpoints Used

| Endpoint              | Usage                                      |
|-----------------------|--------------------------------------------|
| `GET /markets`        | Full paginated sync (every 10 min)         |
| `GET /markets?conditionId=X` | Targeted single-market refresh       |

Base URL: `https://gamma-api.polymarket.com`
Auth: none required

### Pagination

Gamma uses cursor-based pagination:

```
GET /markets?limit=100&active=true&archived=false&enableOrderBook=true
→ { "data": [...], "next_cursor": "abc123" }

GET /markets?limit=100&...&next_cursor=abc123
→ { "data": [...], "next_cursor": "LTE=" }   ← end sentinel
```

`"LTE="` means no more pages.

---

## Key Mapping Quirks

| Gamma field        | Issue                                      | How we handle it                        |
|--------------------|--------------------------------------------|-----------------------------------------|
| `outcomePrices`    | JSON-encoded string: `"[\"0.72\",\"0.28\"]"` | Double-parse: string → JSON → BigDecimal |
| `category`         | Nested inside `events[0].category`          | Extracted in mapper, fallback to first tag |
| `clobTokenIds`     | `[yesToken, noToken]` array                | Pipe-joined for DB: `"yes|no"`           |
| `tags`             | Array of `{id, label}` objects             | Mapped to label list, pipe-joined for DB |
| Date fields        | ISO-8601 strings                           | Parsed to `Instant`                      |

---

## Database Table

```sql
CREATE TABLE markets (
    id                 VARCHAR PRIMARY KEY,
    condition_id       VARCHAR UNIQUE NOT NULL,  -- CLOB join key
    question_id        VARCHAR,
    question           TEXT,
    description        TEXT,
    category           VARCHAR(100),
    tags               TEXT,                     -- pipe-separated
    event_id           VARCHAR,
    event_title        TEXT,
    clob_token_ids     TEXT,                     -- pipe-separated: yes|no
    yes_price          NUMERIC(10,6),
    no_price           NUMERIC(10,6),
    active             BOOLEAN NOT NULL,
    closed             BOOLEAN NOT NULL,
    archived           BOOLEAN NOT NULL,
    enable_order_book  BOOLEAN NOT NULL,
    volume             NUMERIC(20,2),
    volume_24h         NUMERIC(20,2),
    liquidity          NUMERIC(20,2),
    end_date           TIMESTAMP,
    start_date         TIMESTAMP,
    created_at         TIMESTAMP,
    updated_at         TIMESTAMP,
    last_synced_at     TIMESTAMP
);
```

`condition_id` is the natural join key to the CLOB feature — it equals
`marketId` in every `MarketTickEvent`.

---

## CLOB Integration

After every sync, `GammaMarketsRefreshedEvent` is published. The CLOB
WebSocket client listens for this event and re-sends its subscription
with the latest YES token IDs from `MarketRepository.findAllActiveYesTokenIds()`.

Startup order:
```
1. GammaSyncScheduler.syncOnStartup()   → populates DB
2. GammaMarketsRefreshedEvent fired     → CLOB client picks up DB IDs
3. PolymarketWebSocketClient connects   → subscribes with real IDs
```

If the DB is empty (very first startup, before Gamma responds),
the CLOB client falls back to the static list in `application.yml`.

---

## Configuration

```yaml
polymarket:
  gamma:
    base-url: https://gamma-api.polymarket.com
    sync-interval-ms: 600000   # 10 minutes
```

---

## Testing Notes

- `GammaMarketMapper` is a pure `@Component` — unit test with fixture JSON
  covering the `outcomePrices` double-parse, missing `events`, and empty `tags`
- `GammaApiClient` can be integration-tested with WireMock stubbing the
  `/markets` endpoint with multi-page cursor responses
- `GammaSyncUseCase` — use `@DataJpaTest` with an H2 in-memory DB to test
  the upsert logic (create vs update paths)

### Fixture JSON snippet

```json
{
  "id": "market-001",
  "conditionId": "0xabc123",
  "questionID": "q-001",
  "question": "Will the Fed cut rates in June 2026?",
  "outcomePrices": "[\"0.78\",\"0.22\"]",
  "clobTokenIds": ["token-yes-001", "token-no-001"],
  "active": true,
  "closed": false,
  "archived": false,
  "enableOrderBook": true,
  "volume": "2400000",
  "volume24hr": "120000",
  "liquidity": "450000",
  "endDate": "2026-06-30T00:00:00Z",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-05-01T00:00:00Z",
  "tags": [{ "id": "1", "label": "Politics" }],
  "events": [{ "id": "evt-001", "title": "Fed June Decision", "category": "Politics" }]
}
```

---

## Future Improvements

- [ ] Expose `GET /api/markets` REST endpoint for the Next.js frontend
- [ ] Cache hot markets in Redis to avoid DB hits on every frontend request
- [ ] Track `updatedAt` delta — only upsert markets that changed since last sync
- [ ] Alert when a subscribed market resolves (closed=true) so CLOB removes it