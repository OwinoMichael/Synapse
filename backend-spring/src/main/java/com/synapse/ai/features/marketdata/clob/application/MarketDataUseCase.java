package com.synapse.ai.features.marketdata.clob.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.ai.common.websocket.LiveFeedPublisher;
import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import com.synapse.ai.features.marketdata.clob.infrastructure.kafka.MarketDataKafkaPublisher;
import com.synapse.ai.features.marketdata.clob.infrastructure.persistence.RawMarketMessageEntity;
import com.synapse.ai.features.marketdata.clob.infrastructure.persistence.RawMarketMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Orchestrates the pipeline for each raw WebSocket message:
 *
 *   1. Persist raw JSON
 *   2. Normalise → List<MarketTickEvent>
 *   3. Publish to Kafka  (for signals feature)
 *   4. Push to STOMP     (for Next.js frontend)
 */
@Service
public class MarketDataUseCase {

    private static final Logger log = LoggerFactory.getLogger(MarketDataUseCase.class);

    private final MarketDataNormalizer       normalizer;
    private final MarketDataKafkaPublisher   kafkaPublisher;
    private final RawMarketMessageRepository repository;
    private final LiveFeedPublisher          stompPublisher;
    private final ObjectMapper               mapper = new ObjectMapper();

    public MarketDataUseCase(
            MarketDataNormalizer       normalizer,
            MarketDataKafkaPublisher   kafkaPublisher,
            RawMarketMessageRepository repository,
            LiveFeedPublisher          stompPublisher) {
        this.normalizer     = normalizer;
        this.kafkaPublisher = kafkaPublisher;
        this.repository     = repository;
        this.stompPublisher = stompPublisher;
    }

    public void handle(String rawJson) {
        String eventType = extractEventType(rawJson);

        // Temporary: log first tick of each type to confirm data is flowing
        //log.info("Received WebSocket message event_type={} length={}", eventType, rawJson.length());

        repository.save(new RawMarketMessageEntity(rawJson, eventType));

        List<MarketTickEvent> ticks = normalizer.normalize(rawJson);
        if (ticks.isEmpty()) return;

        //log.info("Publishing {} ticks for event_type={}", ticks.size(), eventType);

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