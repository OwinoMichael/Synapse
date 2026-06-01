package com.synapse.ai.features.marketdata.gamma.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Domain record representing one Polymarket market as returned by the
 * Gamma REST API GET /markets endpoint.
 *
 * Key relationships:
 *   - One Event  → many Markets  (e.g. "Who wins the election?" → Yes/No per candidate)
 *   - One Market → two CLOB token IDs  (YES token, NO token)
 *   - conditionId links this market to the CLOB WebSocket stream
 *   - clobTokenIds[0] = YES token, clobTokenIds[1] = NO token
 */
public record GammaMarket(
        String     id,              // Gamma internal market ID
        String     conditionId,     // links to CLOB (== marketId in MarketTick)
        String     questionId,
        String     question,        // human-readable question text
        String     description,
        String     category,        // e.g. "Politics", "Crypto", "Sports"
        List<String> tags,
        String     eventId,         // parent event
        String     eventTitle,

        // Token IDs for CLOB subscription
        List<String> clobTokenIds,  // [0]=YES token, [1]=NO token

        // Current prices from outcomePrices array
        BigDecimal  yesPrice,       // 0.00 – 1.00
        BigDecimal  noPrice,

        // Market state
        boolean    active,
        boolean    closed,
        boolean    archived,
        boolean    enableOrderBook,

        // Liquidity / volume
        BigDecimal  volume,
        BigDecimal  volume24h,
        BigDecimal  liquidity,

        // Timing
        Instant    endDate,
        Instant    startDate,
        Instant    createdAt,
        Instant    updatedAt
) {}