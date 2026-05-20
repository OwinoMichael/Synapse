package com.synapse.ai.features.marketdata.infrastructure.kafka;

import com.synapse.ai.features.marketdata.events.MarketTickEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MarketDataKafkaPublisher {

    private final KafkaTemplate<String, MarketTickEvent> kafkaTemplate;

    public void publish(MarketTickEvent event) {
        kafkaTemplate.send("market-ticks", event.marketId(), event);
    }
}
