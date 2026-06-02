package com.synapse.ai.features.marketdata.gamma.application;

import org.springframework.context.ApplicationEvent;

/**
 * Published after a Gamma sync completes.
 *
 * The CLOB WebSocket client listens for this event and re-sends its
 * subscription message with the updated list of active asset IDs
 * from the database, replacing the static application.yml list.
 */
public class GammaMarketsRefreshedEvent extends ApplicationEvent {
    public GammaMarketsRefreshedEvent(Object source) {
        super(source);
    }
}