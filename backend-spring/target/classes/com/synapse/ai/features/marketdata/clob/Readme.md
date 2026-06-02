# Feature: CLOB Market Data

> Streams live price events from the Polymarket CLOB WebSocket and publishes
> normalised ticks to Kafka for downstream consumption.

---

## Responsibility

This feature owns the **ingestion boundary** between Polymarket and the rest of
Synapse. It connects to the public Polymarket WebSocket, receives raw JSON price
events, persists them for auditability, normalises them into typed domain objects,
and fans them out to Kafka.

It does **not**:
- Interpret what a price move means (→ `signals` feature)
- Fetch market metadata like questions or categories (→ `gamma` feature)
- Serve any REST endpoints

---

## Data Flow

```
Polymarket CLOB WebSocket
wss://ws-subscriptions-clob.polymarket.com/ws/market
        │
        │  Raw JSON (fragmented, buffered)
        ▼
PolymarketWebSocketClient         [infrastructure/websocket]
        │
        │  rawJson: String
        ▼
MarketDataUseCase                 [application]
        ├──► RawMarketMessageRepository  → PostgreSQL (raw_market_messages)
        │
        │  rawJson: String
        ▼
MarketDataNormalizer              [application]
        │
        │  List<MarketTickEvent>
        ▼
MarketDataKafkaPublisher          [infrastructure/kafka]
        │
        │  key = marketId (ensures partition ordering)
        ▼
Kafka topic: market-ticks
```

---

## Package Structure

```
clob/
├── application/
│   ├── MarketDataNormalizer.java     Parse raw JSON → List<MarketTickEvent>
│   └── MarketDataUseCase.java        Orchestrate: save → normalise → publish
├── domain/
│   └── MarketTick.java               Core domain record (internal)
├── events/
│   └── MarketTickEvent.java          Kafka contract (external)
└── infrastructure/
    ├── kafka/
    │   └── MarketDataKafkaPublisher.java
    ├── persistence/
    │   ├── RawMarketMessageEntity.java
    │   └── RawMarketMessageRepository.java
    └── websocket/
        └── PolymarketWebSocketClient.java
```

---

## WebSocket Subscription

On connect, the client sends:

```json
{
  "assets_ids": ["<token_id_1>", "<token_id_2>"],
  "type": "market",
  "custom_feature_enabled": true
}
```

`custom_feature_enabled: true` enables `best_bid_ask`, `new_market`, and
`market_resolved` events (currently ignored — see table below).

Asset IDs are configured in `application.yml` under `polymarket.clob.asset-ids`.
Once the Gamma feature is implemented, these will be loaded dynamically at startup.

---

## Event Types Handled

| `event_type`       | Action                              | Notes                                      |
|--------------------|-------------------------------------|--------------------------------------------|
| `price_change`     | → Kafka tick (one per level)        | Array of price levels per message          |
| `last_trade_price` | → Kafka tick (single)               | Actual maker/taker match                   |
| `book`             | → Kafka tick (one per bid and ask)  | Full snapshot on subscribe and after trades|
| `best_bid_ask`     | Ignored                             | Redundant with `price_change`              |
| `tick_size_change` | Ignored                             | Book precision change, not a price signal  |
| `new_market`       | Ignored                             | Handled by `gamma` feature                 |
| `market_resolved`  | Ignored                             | Handled by `gamma` feature                 |

---

## Kafka Output

| Property    | Value                                                          |
|-------------|----------------------------------------------------------------|
| Topic       | `market-ticks`                                                 |
| Key         | `marketId` (condition ID / market address)                     |
| Value type  | `MarketTickEvent`                                              |
| Serialiser  | `JsonSerializer`                                               |
| Partitioning| By `marketId` — guarantees ordering per market                 |

### MarketTickEvent schema

```
marketId   String      Polymarket condition ID / market address
assetId    String      Token ID (YES or NO leg)
price      BigDecimal  0.00 – 1.00  (== YES probability for YES token)
size       BigDecimal  USDC amount; 0 = price level removed from book
timestamp  Instant     Epoch millis from Polymarket, parsed to Instant
side       String      "BUY" (YES leg) | "SELL" (NO leg)
eventType  String      "price_change" | "last_trade_price" | "book"
```

---

## Persistence

Every raw JSON message is saved to `raw_market_messages` **before** normalisation.

| Column        | Type      | Purpose                                 |
|---------------|-----------|-----------------------------------------|
| `id`          | BIGINT PK | Auto-generated                          |
| `payload`     | TEXT      | Raw JSON string from WebSocket          |
| `event_type`  | VARCHAR   | Extracted for fast filtering            |
| `received_at` | TIMESTAMP | Server-side receipt time                |

This table serves three purposes:
1. **Debugging** — inspect exactly what Polymarket sent
2. **Replay** — re-process messages if normalisation logic changes
3. **Audit** — compliance / traceability trail

---

## Reconnection Strategy

The WebSocket client uses exponential back-off on disconnect or error:

```
attempt 1 → wait 2s
attempt 2 → wait 4s
attempt 3 → wait 8s
...
capped at  → 60s
```

The reconnect counter resets to 0 on every successful `onOpen`.

---

## Configuration

```yaml
# application.yml
polymarket:
  clob:
    asset-ids:
      - "<YES token ID for market 1>"
      - "<YES token ID for market 2>"
```

Get token IDs from the Gamma API:
```
GET https://gamma-api.polymarket.com/markets
→ clob_token_ids[0]  (YES token)
→ clob_token_ids[1]  (NO token)
```

---

## Dependencies

| Dependency              | Why                                      |
|-------------------------|------------------------------------------|
| `java.net.http.WebSocket` | Built-in Java 21 WebSocket client — no extra library |
| `spring-kafka`          | KafkaTemplate for publishing             |
| `spring-data-jpa`       | RawMarketMessageRepository               |
| `jackson-databind`      | JSON parsing in normaliser               |

---

## Testing Notes

- `MarketDataNormalizer` is a pure `@Service` with no dependencies — unit test
  all event types directly with fixture JSON strings.
- Use `@EmbeddedKafka` from `spring-kafka-test` to integration test the publisher.
- The WebSocket client can be tested with a local WireMock WebSocket stub or a
  simple `java.net.http` echo server.

### Fixture JSON snippets

**price_change**
```json
{
  "event_type": "price_change",
  "market": "0xabc123",
  "timestamp": "1750000000000",
  "price_changes": [
    { "asset_id": "token1", "price": "0.72", "size": "150", "side": "BUY" }
  ]
}
```

**last_trade_price**
```json
{
  "event_type": "last_trade_price",
  "market": "0xabc123",
  "asset_id": "token1",
  "price": "0.73",
  "size": "50",
  "side": "BUY",
  "timestamp": "1750000001000"
}
```

**book**
```json
{
  "event_type": "book",
  "market": "0xabc123",
  "asset_id": "token1",
  "timestamp": "1750000002000",
  "bids": [{ "price": "0.70", "size": "200" }],
  "asks": [{ "price": "0.75", "size": "100" }]
}
```

---

## Future Improvements

- [ ] Load `asset-ids` dynamically from Gamma feature at startup instead of `application.yml`
- [ ] Dead-letter topic for messages that fail normalisation
- [ ] Prometheus metrics: messages received, ticks published, reconnect count
- [ ] Sliding window price aggregation (OHLCV) before publishing to reduce Kafka volume