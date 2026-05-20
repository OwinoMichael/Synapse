package com.synapse.ai.features.marketdata.events;

import java.math.BigDecimal;
import java.time.Instant;

public record MarketTickEvent(
        String marketId,
        BigDecimal price,
        BigDecimal size,
        Instant timestamp,
        String side
) {}