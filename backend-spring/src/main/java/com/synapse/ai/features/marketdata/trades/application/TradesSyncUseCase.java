package com.synapse.ai.features.marketdata.trades.application;

import com.synapse.ai.features.marketdata.trades.domain.Trade;
import com.synapse.ai.features.marketdata.trades.infrastructure.client.TradesApiClient;
import com.synapse.ai.features.marketdata.trades.infrastructure.client.TradesApiResponse;
import com.synapse.ai.features.marketdata.trades.infrastructure.persistence.TradeEntity;
import com.synapse.ai.features.marketdata.trades.infrastructure.persistence.TradeRepository;
import com.synapse.ai.common.websocket.LiveFeedPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Orchestrates a trades poll cycle:
 *
 *   1. Fetch trades from Data API since last poll timestamp
 *   2. Skip already-persisted IDs (idempotent)
 *   3. Map → domain → entity → persist
 *   4. Push whale trades and recent activity to STOMP live feed
 *
 * lastPollEpoch is tracked in-memory. On restart it defaults to
 * "now minus lookback window" to avoid re-processing old trades.
 */
@Service
public class TradesSyncUseCase {

    private static final Logger log = LoggerFactory.getLogger(TradesSyncUseCase.class);

    @Value("${polymarket.trades.whale-threshold:10000}")
    private BigDecimal whaleThreshold;      // USDC — default $10k

    @Value("${polymarket.trades.lookback-seconds:300}")
    private long lookbackSeconds;           // on startup, look back 5 min

    private final TradesApiClient   client;
    private final TradeRepository   repository;
    private final LiveFeedPublisher liveFeedPublisher;

    /** Tracks the most recent trade timestamp we have processed */
    private final AtomicLong lastPollEpoch = new AtomicLong(0L);

    public TradesSyncUseCase(
            TradesApiClient   client,
            TradeRepository   repository,
            LiveFeedPublisher liveFeedPublisher) {
        this.client           = client;
        this.repository       = repository;
        this.liveFeedPublisher = liveFeedPublisher;
    }

    @Transactional
    public void sync() {
        long since = resolveLastPollEpoch();
        log.debug("Polling trades since epoch={}", since);

        List<TradesApiResponse> raw = client.fetchSince(since);
        if (raw.isEmpty()) return;

        long newestTimestamp = since;
        int  saved = 0;

        for (TradesApiResponse dto : raw) {
            try {
                if (repository.existsById(dto.id())) continue;

                Trade trade = map(dto);
                TradeEntity entity = toEntity(trade);
                repository.save(entity);
                saved++;

                // Push to STOMP live feed
                liveFeedPublisher.publishTrade(trade);

                long ts = trade.timestamp().getEpochSecond();
                if (ts > newestTimestamp) newestTimestamp = ts;

            } catch (Exception e) {
                log.error("Failed to process trade id={}: {}", dto.id(), e.getMessage());
            }
        }

        lastPollEpoch.set(newestTimestamp);
        if (saved > 0) log.info("Trades sync: saved={} total_fetched={}", saved, raw.size());
    }

    // ── Mapping ────────────────────────────────────────────────────

    private Trade map(TradesApiResponse dto) {
        BigDecimal price     = parseBD(dto.price());
        BigDecimal size      = parseBD(dto.size());
        BigDecimal usdcValue = price.multiply(size);
        boolean    isWhale   = usdcValue.compareTo(whaleThreshold) >= 0;
        Instant    timestamp = parseTimestamp(dto.timestamp());

        return new Trade(
                dto.id(), dto.market(), dto.assetId(),
                dto.side(), price, size, usdcValue,
                dto.makerAddress(), dto.takerAddress(),
                timestamp, isWhale
        );
    }

    private TradeEntity toEntity(Trade t) {
        return TradeEntity.from(
                t.id(), t.marketId(), t.assetId(),
                t.side(), t.price(), t.size(), t.usdcValue(),
                t.makerAddress(), t.takerAddress(),
                t.timestamp(), t.isWhale()
        );
    }

    // ── Helpers ────────────────────────────────────────────────────

    private long resolveLastPollEpoch() {
        long current = lastPollEpoch.get();
        if (current == 0L) {
            return Instant.now().minusSeconds(lookbackSeconds).getEpochSecond();
        }
        return current;
    }

    private BigDecimal parseBD(String v) {
        if (v == null || v.isBlank()) return BigDecimal.ZERO;
        try { return new BigDecimal(v); }
        catch (Exception e) { return BigDecimal.ZERO; }
    }

    private Instant parseTimestamp(String epochSeconds) {
        if (epochSeconds == null || epochSeconds.isBlank()) return Instant.now();
        try { return Instant.ofEpochSecond(Long.parseLong(epochSeconds)); }
        catch (Exception e) { return Instant.now(); }
    }
}