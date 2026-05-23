package com.synapse.ai.features.marketdata.clob.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import com.synapse.ai.features.marketdata.clob.infrastructure.kafka.MarketDataKafkaPublisher;
import com.synapse.ai.features.marketdata.clob.infrastructure.persistence.RawMarketMessageEntity;
import com.synapse.ai.features.marketdata.clob.infrastructure.persistence.RawMarketMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Orchestrates the pipeline for a single raw WebSocket message:
 *
 *   1. Persist raw JSON  (audit / replay)
 *   2. Normalise         (parse into typed MarketTickEvents)
 *   3. Publish to Kafka  (fan-out to signals feature)
 *
 * Called by PolymarketWebSocketClient on every incoming message.
 */
@Service
public class MarketDataUseCase {

    private static final Logger log = LoggerFactory.getLogger(MarketDataUseCase.class);

    private final MarketDataNormalizer          normalizer;
    private final MarketDataKafkaPublisher      publisher;
    private final RawMarketMessageRepository    repository;
    private final ObjectMapper                  mapper = new ObjectMapper();

    public MarketDataUseCase(
            MarketDataNormalizer       normalizer,
            MarketDataKafkaPublisher   publisher,
            RawMarketMessageRepository repository) {
        this.normalizer  = normalizer;
        this.publisher   = publisher;
        this.repository  = repository;
    }

    public void handle(String rawJson) {
        // 1. Persist raw message for auditing / replay
        String eventType = extractEventType(rawJson);
        repository.save(new RawMarketMessageEntity(rawJson, eventType));

        // 2. Normalise into typed events
        List<MarketTickEvent> ticks = normalizer.normalize(rawJson);

        if (ticks.isEmpty()) {
            log.debug("No ticks produced for event_type={}", eventType);
            return;
        }

        // 3. Publish each tick to Kafka
        ticks.forEach(tick -> {
            log.debug("Publishing tick marketId={} price={} side={}",
                    tick.marketId(), tick.price(), tick.side());
            publisher.publish(tick);
        });
    }

    /** Quick extract of event_type without full parse for the entity label */
    private String extractEventType(String rawJson) {
        try {
            JsonNode root = mapper.readTree(rawJson);
            return root.path("event_type").asText("unknown");
        } catch (Exception e) {
            return "unknown";
        }
    }
}