package com.synapse.ai.features.marketdata.domain;

import java.math.BigDecimal;
import java.time.Instant;

public record MarketTick (
    String marketId,
    BigDecimal price,
    BigDecimal size,
    Instant timestamp,
    String side
){};
