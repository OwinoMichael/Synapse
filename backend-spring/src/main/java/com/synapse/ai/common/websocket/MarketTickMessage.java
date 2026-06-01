package com.synapse.ai.common.websocket;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * STOMP message pushed to /topic/market-ticks.
 * Carries a live YES% price update for a specific market.
 * The Next.js frontend uses this to update the price chart and
 * market card YES% values in real time.
 */
public record MarketTickMessage(
        String     marketId,
        String     assetId,
        BigDecimal yesPrice,   // 0.00 – 1.00
        BigDecimal size,
        String     side,
        String     eventType,
        Instant    timestamp
) {}