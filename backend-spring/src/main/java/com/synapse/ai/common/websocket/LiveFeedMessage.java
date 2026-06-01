package com.synapse.ai.common.websocket;

import java.time.Instant;

/**
 * Generic STOMP message payload pushed to /topic/trades and /topic/signals.
 *
 * type values:
 *   "whale"    → trade with usdcValue >= whale threshold
 *   "trade"    → regular trade
 *   "signal"   → new AI mismatch signal
 *   "resolved" → market resolved (from Gamma sync)
 *   "spike"    → price moved >5% in short window
 */
public record LiveFeedMessage(
        String  type,
        String  marketId,
        String  marketQuestion,  // human-readable, fetched from DB
        String  category,
        String  text,            // pre-formatted display string for frontend
        double  usdcValue,       // 0 for non-trade messages
        double  price,           // current YES price (0.00–1.00)
        String  side,            // "BUY" | "SELL" | null
        boolean isWhale,
        Instant timestamp
) {
    /** Convenience factory for trade messages */
    public static LiveFeedMessage trade(
            String marketId, String question, String category,
            double usdcValue, double price, String side, boolean isWhale) {

        String formatted = isWhale
                ? String.format("🐋 Whale bet $%,.0f %s on %s", usdcValue, side, shorten(question))
                : String.format("Trade $%,.0f %s on %s", usdcValue, side, shorten(question));

        return new LiveFeedMessage(
                isWhale ? "whale" : "trade",
                marketId, question, category,
                formatted, usdcValue, price, side, isWhale,
                Instant.now()
        );
    }

    /** Convenience factory for signal messages */
    public static LiveFeedMessage signal(
            String marketId, String question, String category,
            String signalText) {
        return new LiveFeedMessage(
                "signal", marketId, question, category,
                signalText, 0, 0, null, false,
                Instant.now()
        );
    }

    private static String shorten(String q) {
        if (q == null) return "unknown market";
        return q.length() > 40 ? q.substring(0, 37) + "…" : q;
    }
}