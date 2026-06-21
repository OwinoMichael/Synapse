package com.synapse.ai.features.marketdata.clob.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.ai.common.websocket.LiveFeedPublisher;
import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import com.synapse.ai.features.marketdata.clob.infrastructure.kafka.MarketDataKafkaPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Zero disk writes. Ticks flow: WebSocket -> normalize -> in-memory cache + STOMP push.
 * Kafka publishing DISABLED temporarily to save disk (Kafka logs eat space fast).
 * We Re-enable kafkaPublisher once on a bigger VPS for the signals feature.
 */

@Service
public class MarketDataUseCase {

    private static final Logger log = LoggerFactory.getLogger(MarketDataUseCase.class);

    private final MarketDataNormalizer     normalizer;
    private final MarketDataKafkaPublisher kafkaPublisher;
    private final LiveFeedPublisher        stompPublisher;
    private final ObjectMapper             mapper = new ObjectMapper();
    private final InMemoryTickCache    cache;

    public MarketDataUseCase(
            MarketDataNormalizer     normalizer,
            MarketDataKafkaPublisher kafkaPublisher,
            LiveFeedPublisher        stompPublisher, InMemoryTickCache cache) {
        this.normalizer     = normalizer;
        this.kafkaPublisher = kafkaPublisher;
        this.stompPublisher = stompPublisher;
        this.cache = cache;
    }

    public void handle(String rawJson) {
        List<MarketTickEvent> ticks = normalizer.normalize(rawJson);
        if (ticks.isEmpty()) return;
        ticks.forEach(tick -> {
            cache.update(tick);              // in-memory only, no disk
//            kafkaPublisher.publish(tick);  // Disabled due to storage space
            stompPublisher.publishTick(tick);
        });
    }
}