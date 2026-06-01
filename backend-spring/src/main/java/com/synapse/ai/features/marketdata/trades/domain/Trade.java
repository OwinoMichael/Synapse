package com.synapse.ai.features.marketdata.trades.domain;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Domain record representing a single matched trade from the
 * Polymarket Data API GET /trades endpoint.
 *
 * A trade occurs when a maker and taker order are matched on the CLOB.
 * size * price = USDC value of the trade.
 *
 * isWhale: true when USDC value >= WHALE_THRESHOLD (configurable, default $10k)
 */
public record Trade(
        String     id,
        String     marketId,       // conditionId — joins to MarketEntity
        String     assetId,        // YES or NO token ID
        String     side,           // "BUY" | "SELL"
        BigDecimal price,          // 0.00 – 1.00
        BigDecimal size,           // USDC amount
        BigDecimal usdcValue,      // price * size
        String     makerAddress,
        String     takerAddress,
        Instant    timestamp,
        boolean    isWhale
) {}