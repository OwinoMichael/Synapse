package com.synapse.ai.features.marketdata.clob.application;

import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Holds only the LATEST tick per market in memory.
 * No disk writes at all — solves the storage problem completely
 * for live price display. History/charts use synthetic data until
 * a proper time-series store (TimescaleDB) is affordable.
 */
@Component
public class InMemoryTickCache {

    // marketId -> latest tick
    private final Map<String, MarketTickEvent> latestTicks = new ConcurrentHashMap<>();

    public void update(MarketTickEvent tick) {
        latestTicks.put(tick.marketId(), tick);
    }

    public MarketTickEvent getLatest(String marketId) {
        return latestTicks.get(marketId);
    }

    public int size() {
        return latestTicks.size();
    }
}