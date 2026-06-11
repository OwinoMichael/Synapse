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
 * Normalise → publish to Kafka → push to STOMP.
 * Raw message persistence removed — it fills disk in prod.
 * Re-enable for local debugging only.
 */
@Service
public class MarketDataUseCase {

    private static final Logger log = LoggerFactory.getLogger(MarketDataUseCase.class);

    private final MarketDataNormalizer     normalizer;
    private final MarketDataKafkaPublisher kafkaPublisher;
    private final LiveFeedPublisher        stompPublisher;
    private final ObjectMapper             mapper = new ObjectMapper();

    public MarketDataUseCase(
            MarketDataNormalizer     normalizer,
            MarketDataKafkaPublisher kafkaPublisher,
            LiveFeedPublisher        stompPublisher) {
        this.normalizer     = normalizer;
        this.kafkaPublisher = kafkaPublisher;
        this.stompPublisher = stompPublisher;
    }

    public void handle(String rawJson) {
        String eventType = extractEventType(rawJson);

        List<MarketTickEvent> ticks = normalizer.normalize(rawJson);
        if (ticks.isEmpty()) return;

        ticks.forEach(tick -> {
            kafkaPublisher.publish(tick);
            stompPublisher.publishTick(tick);
        });
    }

    private String extractEventType(String rawJson) {
        try {
            return mapper.readTree(rawJson).path("event_type").asText("unknown");
        } catch (Exception e) {
            return "unknown";
        }
    }
}