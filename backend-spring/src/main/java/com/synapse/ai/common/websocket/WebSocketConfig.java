package com.synapse.ai.common.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configures the STOMP WebSocket broker that pushes real-time data
 * to the Next.js frontend.
 *
 * Topics published by Spring:
 *   /topic/trades          → live trade activity (whale alerts, feed)
 *   /topic/market-ticks    → real-time YES% price updates
 *   /topic/signals         → new AI mismatch signals
 *
 * Connection endpoint for the frontend:
 *   ws://localhost:8080/ws  (SockJS fallback also available)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Simple in-memory broker for /topic destinations
        registry.enableSimpleBroker("/topic");

        // Prefix for messages FROM client → server (not needed for push-only)
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                // Allow Next.js dev server and production origins
                .setAllowedOriginPatterns("http://localhost:3000", "https://*.synapse.app")
                // SockJS fallback for environments where raw WebSocket is blocked
                .withSockJS();
    }
}