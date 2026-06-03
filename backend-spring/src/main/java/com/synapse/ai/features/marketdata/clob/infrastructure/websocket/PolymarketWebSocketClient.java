package com.synapse.ai.features.marketdata.clob.infrastructure.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.ai.features.marketdata.clob.application.MarketDataUseCase;
import com.synapse.ai.features.marketdata.gamma.application.GammaMarketsRefreshedEvent;
import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * Connects to the Polymarket CLOB WebSocket market channel.
 *
 * Asset ID source priority:
 *   1. Database  — populated by Gamma sync (preferred)
 *   2. application.yml fallback — used on first startup before Gamma syncs
 *
 * Listens for GammaMarketsRefreshedEvent and re-sends its subscription
 * with the latest asset IDs from the database after every Gamma sync.
 */
@Component
public class PolymarketWebSocketClient implements WebSocket.Listener {

    private static final Logger log         = LoggerFactory.getLogger(PolymarketWebSocketClient.class);
    private static final String WSS_URL     = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
    private static final long   MAX_BACKOFF = 60L;


    private final PolymarketClobProperties fallbackAssetIds;

    private final MarketDataUseCase   useCase;
    private final MarketRepository    marketRepository;
    private final ObjectMapper        mapper    = new ObjectMapper();
    private final HttpClient          http      = HttpClient.newHttpClient();

    private volatile WebSocket                socket;
    private final    StringBuilder            buffer    = new StringBuilder();
    private final    ScheduledExecutorService scheduler =
            Executors.newSingleThreadScheduledExecutor();

    private int reconnectAttempt = 0;

    public PolymarketWebSocketClient(
            PolymarketClobProperties fallbackAssetIds, MarketDataUseCase useCase,
            MarketRepository  marketRepository) {
        this.fallbackAssetIds = fallbackAssetIds;
        this.useCase          = useCase;
        this.marketRepository = marketRepository;
    }

    @PostConstruct
    public void start() { connect(0); }

    @PreDestroy
    public void stop() {
        scheduler.shutdownNow();
        if (socket != null) socket.sendClose(WebSocket.NORMAL_CLOSURE, "shutdown").join();
    }

    @EventListener
    public void onGammaRefreshed(GammaMarketsRefreshedEvent event) {
        if (socket != null && !socket.isInputClosed()) {
            log.info("Gamma refreshed — updating CLOB subscription");
            sendSubscription(socket);
        }
    }

    private void connect(long delaySeconds) {
        Runnable task = () -> {
            log.info("Connecting to CLOB WebSocket (attempt {})...", reconnectAttempt + 1);
            try {
                http.newWebSocketBuilder().buildAsync(URI.create(WSS_URL), this).join();
            } catch (Exception e) {
                log.error("Connection failed: {}", e.getMessage());
                scheduleReconnect();
            }
        };
        if (delaySeconds == 0) scheduler.execute(task);
        else scheduler.schedule(task, delaySeconds, TimeUnit.SECONDS);
    }

    private void scheduleReconnect() {
        reconnectAttempt++;
        long delay = Math.min((long) Math.pow(2, reconnectAttempt), MAX_BACKOFF);
        log.warn("Reconnecting in {}s (attempt {})...", delay, reconnectAttempt);
        connect(delay);
    }

    @Override
    public void onOpen(WebSocket ws) {
        log.info("WebSocket opened");
        this.socket           = ws;
        this.reconnectAttempt = 0;
        sendSubscription(ws);
        ws.request(1);
    }

    @Override
    public CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) {
        buffer.append(data);
        if (last) {
            String msg = buffer.toString();
            buffer.setLength(0);
            try { useCase.handle(msg); }
            catch (Exception e) { log.error("Error handling message: {}", e.getMessage()); }
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

    private void sendSubscription(WebSocket ws) {
        try {
            List<String> ids = resolveAssetIds();
            log.info("Subscribing to {} asset IDs: {}", ids.size(), ids);
            Map<String, Object> payload = Map.of(
                    "assets_ids", ids, "type", "market", "custom_feature_enabled", true);
            ws.sendText(mapper.writeValueAsString(payload), true);
        } catch (Exception e) {
            log.error("Failed to send subscription: {}", e.getMessage());
        }
    }

    private List<String> resolveAssetIds() {
        try {
            List<String> dbIds = marketRepository.findAllActiveYesTokenIds();
            if (!dbIds.isEmpty()) return dbIds;
        } catch (Exception e) {
            log.warn("DB asset IDs unavailable, using fallback: {}", e.getMessage());
        }
        return fallbackAssetIds.getAssetIds();
    }
}