package com.synapse.ai.features.marketdata.clob.application;

import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import org.springframework.stereotype.Service;

@Service

public class MarketDataUseCase {

    private final MarketDataNormalizer normalizer;
    private final MarketDataKafkaPublisher publisher;
    private final RawMarketMessageRepository repository;

    public void handle(String rawJson) {
        repository.save(new RawMarketMessageEntity(rawJson));

        MarketTickEvent event = normalizer.normalize(rawJson);

        if (event != null) {
            publisher.publish(event);
        }
    }
}