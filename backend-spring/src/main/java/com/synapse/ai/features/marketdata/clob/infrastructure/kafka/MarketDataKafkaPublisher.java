package com.synapse.ai.features.marketdata.clob.infrastructure.kafka;

import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Publishes MarketTickEvents to the "market-ticks" Kafka topic.
 *
 * Partition key = marketId so that all ticks for the same market land
 * on the same partition and are consumed in order by the signals feature.
 */
@Service
public class MarketDataKafkaPublisher {

    private static final Logger log   = LoggerFactory.getLogger(MarketDataKafkaPublisher.class);
    private static final String TOPIC = "market-ticks";

    private final KafkaTemplate<String, MarketTickEvent> kafkaTemplate;

    public MarketDataKafkaPublisher(KafkaTemplate<String, MarketTickEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publish(MarketTickEvent event) {
        CompletableFuture<SendResult<String, MarketTickEvent>> future =
                kafkaTemplate.send(TOPIC, event.marketId(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish tick for marketId={}: {}",
                        event.marketId(), ex.getMessage());
            } else {
                log.trace("Tick published to {}@{} marketId={}",
                        TOPIC,
                        result.getRecordMetadata().offset(),
                        event.marketId());
            }
        });
    }
}