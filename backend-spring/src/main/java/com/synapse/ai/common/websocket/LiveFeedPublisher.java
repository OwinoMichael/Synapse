package com.synapse.ai.common.websocket;

import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketEntity;
import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketRepository;
import com.synapse.ai.features.marketdata.trades.domain.Trade;
import com.synapse.ai.features.marketdata.clob.events.MarketTickEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Pushes real-time messages to STOMP topics consumed by the Next.js frontend.
 *
 * Topics:
 *   /topic/trades        → whale alerts + live activity feed
 *   /topic/market-ticks  → live YES% price updates per market
 *   /topic/signals       → new AI mismatch signals
 *
 * Used by:
 *   - TradesSyncUseCase      → publishes trades
 *   - MarketDataUseCase      → publishes price ticks
 *   - signals feature        → publishes signal alerts (future)
 */
@Component
public class LiveFeedPublisher {

    private static final Logger log = LoggerFactory.getLogger(LiveFeedPublisher.class);

    private static final String TOPIC_TRADES = "/topic/trades";
    private static final String TOPIC_TICKS  = "/topic/market-ticks";
    private static final String TOPIC_SIGNALS= "/topic/signals";

    private final SimpMessagingTemplate messaging;
    private final MarketRepository      marketRepository;

    public LiveFeedPublisher(
            SimpMessagingTemplate messaging,
            MarketRepository      marketRepository) {
        this.messaging        = messaging;
        this.marketRepository = marketRepository;
    }

    // ── Trades ─────────────────────────────────────────────────────

    public void publishTrade(Trade trade) {
        try {
            // Enrich with market metadata from DB
            String question = "Unknown market";
            String category = "Other";

            marketRepository.findByConditionId(trade.marketId())
                    .ifPresent(m -> {
                        // captured via effectively final ref
                    });

            // Use Optional properly
            var marketOpt = marketRepository.findByConditionId(trade.marketId());
            if (marketOpt.isPresent()) {
                MarketEntity m = marketOpt.get();
                question = m.getQuestion();
                category = m.getCategory() != null ? m.getCategory() : "Other";
            }

            LiveFeedMessage msg = LiveFeedMessage.trade(
                    trade.marketId(), question, category,
                    trade.usdcValue().doubleValue(),
                    trade.price().doubleValue(),
                    trade.side(),
                    trade.isWhale()
            );

            messaging.convertAndSend(TOPIC_TRADES, msg);

            if (trade.isWhale()) {
                log.info("Whale trade published: marketId={} value=${} side={}",
                        trade.marketId(),
                        String.format("%,.0f", trade.usdcValue()),
                        trade.side());
            }

        } catch (Exception e) {
            log.error("Failed to publish trade to STOMP: {}", e.getMessage());
        }
    }

    // ── Market ticks ───────────────────────────────────────────────

    public void publishTick(MarketTickEvent event) {
        try {
            MarketTickMessage msg = new MarketTickMessage(
                    event.marketId(),
                    event.assetId(),
                    event.price(),
                    event.size(),
                    event.side(),
                    event.eventType(),
                    event.timestamp()
            );
            // Send to market-specific sub-topic so frontend can subscribe per market
            messaging.convertAndSend(TOPIC_TICKS + "/" + event.marketId(), msg);
        } catch (Exception e) {
            log.error("Failed to publish tick to STOMP: {}", e.getMessage());
        }
    }

    // ── Signals ────────────────────────────────────────────────────

    public void publishSignal(String marketId, String question, String category, String text) {
        try {
            LiveFeedMessage msg = LiveFeedMessage.signal(marketId, question, category, text);
            messaging.convertAndSend(TOPIC_SIGNALS, msg);
            log.info("Signal published: marketId={}", marketId);
        } catch (Exception e) {
            log.error("Failed to publish signal to STOMP: {}", e.getMessage());
        }
    }
}