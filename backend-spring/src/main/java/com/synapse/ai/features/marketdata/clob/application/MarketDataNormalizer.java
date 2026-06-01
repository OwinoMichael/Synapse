package com.synapse.ai.features.marketdata.clob.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Converts raw Polymarket WebSocket JSON into MarketTickEvents.
 *
 * Handled event_types
 * ────────────────────────────────────────────────────────────────────
 * price_change      → one tick per entry in price_changes[]
 * last_trade_price  → single tick (actual matched trade)
 * book              → one tick per bid and ask level (order book snapshot)
 *
 * Ignored event_types (no tick emitted, logged at DEBUG)
 * ────────────────────────────────────────────────────────────────────
 * tick_size_change  → book precision change, not a price signal
 * best_bid_ask      → convenience summary, redundant with price_change
 * new_market        → metadata, handled by Gamma feature
 * market_resolved   → handled by Gamma feature
 */
@Service
public class MarketDataNormalizer {

    private static final Logger log = LoggerFactory.getLogger(MarketDataNormalizer.class);
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * @param rawJson raw JSON string from WebSocket
     * @return list of ticks (may be empty if event type is ignored or malformed)
     */
    public List<MarketTickEvent> normalize(String rawJson) {
        List<MarketTickEvent> ticks = new ArrayList<>();
        try {
            JsonNode root      = mapper.readTree(rawJson);
            String   eventType = root.path("event_type").asText("");

            switch (eventType) {
                case "price_change"     -> ticks.addAll(normalizePriceChange(root));
                case "last_trade_price" -> normalizeLastTradePrice(root).ifPresent(ticks::add);
                case "book"             -> ticks.addAll(normalizeBook(root));
                default                 -> log.debug("Ignored event_type={}", eventType);
            }

        } catch (Exception e) {
            log.error("Failed to normalize raw message: {}", rawJson, e);
        }
        return ticks;
    }

    // ── price_change ───────────────────────────────────────────────
    // Polymarket sends an array of price_changes inside one message.
    // Each entry maps to one tick.
    private List<MarketTickEvent> normalizePriceChange(JsonNode root) {
        List<MarketTickEvent> ticks = new ArrayList<>();
        String   marketId  = root.path("market").asText();
        Instant  timestamp = parseTimestamp(root.path("timestamp").asText());

        for (JsonNode pc : root.path("price_changes")) {
            String     assetId = pc.path("asset_id").asText();
            BigDecimal price   = new BigDecimal(pc.path("price").asText("0"));
            BigDecimal size    = new BigDecimal(pc.path("size").asText("0"));
            String     side    = pc.path("side").asText();

            ticks.add(new MarketTickEvent(
                    marketId, assetId, price, size, timestamp, side, "price_change"
            ));
        }
        return ticks;
    }

    // ── last_trade_price ───────────────────────────────────────────
    // Emitted when a maker and taker order is matched.
    private java.util.Optional<MarketTickEvent> normalizeLastTradePrice(JsonNode root) {
        try {
            return java.util.Optional.of(new MarketTickEvent(
                    root.path("market").asText(),
                    root.path("asset_id").asText(),
                    new BigDecimal(root.path("price").asText("0")),
                    new BigDecimal(root.path("size").asText("0")),
                    parseTimestamp(root.path("timestamp").asText()),
                    root.path("side").asText(),
                    "last_trade_price"
            ));
        } catch (Exception e) {
            log.warn("Skipping malformed last_trade_price: {}", root);
            return java.util.Optional.empty();
        }
    }

    // ── book ───────────────────────────────────────────────────────
    // Full order-book snapshot sent on first subscription and after trades.
    // Bids = BUY side, asks = SELL side.
    private List<MarketTickEvent> normalizeBook(JsonNode root) {
        List<MarketTickEvent> ticks = new ArrayList<>();
        String  marketId  = root.path("market").asText();
        String  assetId   = root.path("asset_id").asText();
        Instant timestamp = parseTimestamp(root.path("timestamp").asText());

        for (JsonNode bid : root.path("bids")) {
            ticks.add(bookTick(marketId, assetId, bid, "BUY", timestamp));
        }
        for (JsonNode ask : root.path("asks")) {
            ticks.add(bookTick(marketId, assetId, ask, "SELL", timestamp));
        }
        return ticks;
    }

    private MarketTickEvent bookTick(
            String marketId, String assetId,
            JsonNode level, String side, Instant ts) {
        return new MarketTickEvent(
                marketId, assetId,
                new BigDecimal(level.path("price").asText("0")),
                new BigDecimal(level.path("size").asText("0")),
                ts, side, "book"
        );
    }

    // ── helpers ────────────────────────────────────────────────────
    private Instant parseTimestamp(String epochMillis) {
        if (epochMillis == null || epochMillis.isBlank()) return Instant.now();
        try {
            return Instant.ofEpochMilli(Long.parseLong(epochMillis));
        } catch (NumberFormatException e) {
            return Instant.now();
        }
    }
}