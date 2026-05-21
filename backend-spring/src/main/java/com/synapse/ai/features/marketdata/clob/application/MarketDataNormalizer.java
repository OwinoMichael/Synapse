package com.synapse.ai.features.marketdata.clob.application;

import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class MarketDataNormalizer {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public MarketTickEvent normalize(String rawJson) {
        // Parse JSON and map fields from Polymarket schema
        // Return MarketTickEvent
        return null;
    }
}