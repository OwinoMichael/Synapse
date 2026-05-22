package com.synapse.ai.features.marketdata.clob.infrastructure.websocket;


import com.synapse.ai.features.marketdata.clob.application.MarketDataUseCase;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Connects to the Polymarket CLOB WebSocket market channel and feeds
 * every incoming message to MarketDataUseCase.
 *
 * Endpoint  : wss://ws-subscriptions-clob.polymarket.com/ws/market
 * Channel   : market  (public — no auth required)
 *
 * On connect we send a subscription message specifying the asset IDs
 * (token IDs) we want to track. These come from application.yml and
 * are fetched initially from the Gamma REST API (see gamma feature).
 *
 * Reconnect : exponential back-off (1s → 2s → 4s … cap 60s)
 */
@Component
public class PolymarketWebSocketClient implements WebSocket.Listener {

    private static final Logger log = LoggerFactory.getLogger(PolymarketWebSocketClient.class);

    private static final String WSS_URL  = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
    private static final long   MAX_BACKOFF_SEC = 60L;

    @Value("${polymarket.clob.asset-ids}")
    private List<String> assetIds;          // injected from application.yml

    private final MarketDataUseCase  useCase;
    private final ObjectMapper mapper  = new ObjectMapper();
    private final HttpClient         http    = HttpClient.newHttpClient();

    private volatile WebSocket           socket;
    private final    StringBuilder       messageBuffer = new StringBuilder();
    private final ScheduledExecutorService scheduler =
            Executors.newSingleThreadScheduledExecutor();

    private int  reconnectAttempt = 0;

    public PolymarketWebSocketClient(MarketDataUseCase useCase) {
        this.useCase = useCase;
    }

    // ── Lifecycle ──────────────────────────────────────────────────

    @PostConstruct
    public void start() {
        connect(0);
    }

    @PreDestroy
    public void stop() {
        scheduler.shutdownNow();
        if (socket != null) {
            socket.sendClose(WebSocket.NORMAL_CLOSURE, "shutdown").join();
        }
    }

    // ── Connection ─────────────────────────────────────────────────

    private void connect(long delaySeconds) {
        Runnable task = () -> {
            log.info("Connecting to Polymarket CLOB WebSocket (attempt {})…",
                    reconnectAttempt + 1);
            try {
                http.newWebSocketBuilder()
                        .buildAsync(URI.create(WSS_URL), this)
                        .join();
            } catch (Exception e) {
                log.error("WebSocket connection failed: {}", e.getMessage());
                scheduleReconnect();
            }
        };

        if (delaySeconds == 0) {
            scheduler.execute(task);
        } else {
            scheduler.schedule(task, delaySeconds, TimeUnit.SECONDS);
        }
    }

    private void scheduleReconnect() {
        reconnectAttempt++;
        long delay = Math.min((long) Math.pow(2, reconnectAttempt), MAX_BACKOFF_SEC);
        log.warn("Reconnecting in {}s (attempt {})…", delay, reconnectAttempt);
        connect(delay);
    }

    // ── WebSocket.Listener callbacks ───────────────────────────────

    @Override
    public void onOpen(WebSocket ws) {
        log.info("WebSocket opened — sending subscription for {} asset IDs", assetIds.size());
        this.socket           = ws;
        this.reconnectAttempt = 0;

        sendSubscription(ws);
        ws.request(1);
    }

    /**
     * Polymarket sends large messages in fragments. We buffer until
     * last=true then hand the complete JSON to the use case.
     */
    @Override
    public CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) {
        messageBuffer.append(data);
        if (last) {
            String message = messageBuffer.toString();
            messageBuffer.setLength(0);
            handleMessage(message);
        }
        ws.request(1);
        return null;
    }

    @Override
    public CompletionStage<?> onClose(WebSocket ws, int statusCode, String reason) {
        log.warn("WebSocket closed: code={} reason={}", statusCode, reason);
        scheduleReconnect();
        return null;
    }

    @Override
    public void onError(WebSocket ws, Throwable error) {
        log.error("WebSocket error: {}", error.getMessage());
        scheduleReconnect();
    }

    // ── Helpers ────────────────────────────────────────────────────

    private void sendSubscription(WebSocket ws) {
        try {
            // Subscription payload per Polymarket docs:
            // { "assets_ids": [...], "type": "market", "custom_feature_enabled": true }
            // custom_feature_enabled = true → also receive best_bid_ask,
            // new_market, market_resolved events
            Map<String, Object> payload = Map.of(
                    "assets_ids",              assetIds,
                    "type",                    "market",
                    "custom_feature_enabled",  true
            );
            String json = mapper.writeValueAsString(payload);
            ws.sendText(json, true);
            log.debug("Subscription sent: {}", json);
        } catch (Exception e) {
            log.error("Failed to send subscription: {}", e.getMessage());
        }
    }

    private void handleMessage(String rawJson) {
        try {
            useCase.handle(rawJson);
        } catch (Exception e) {
            // Never crash the listener — just log and keep receiving
            log.error("Error handling message: {}", e.getMessage());
        }
    }
}