package com.synapse.ai.features.marketdata.clob.events;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Kafka event published to the "market-ticks" topic.
 *
 * Mirrors MarketTick 1:1 for now; keeping them separate means we can
 * evolve the Kafka contract independently from the domain model.
 */
public record MarketTickEvent(
        String     marketId,
        String     assetId,
        BigDecimal price,
        BigDecimal size,
        Instant    timestamp,
        String     side,
        String     eventType
) {}