package com.synapse.ai.features.marketdata.clob.infrastructure.kafka;

import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service

public class MarketDataKafkaPublisher {

    private final KafkaTemplate<String, MarketTickEvent> kafkaTemplate;

    public void publish(MarketTickEvent event) {
        kafkaTemplate.send("market-ticks", event.marketId(), event);
    }
}
