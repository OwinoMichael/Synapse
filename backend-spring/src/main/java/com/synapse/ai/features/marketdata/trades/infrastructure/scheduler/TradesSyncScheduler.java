package com.synapse.ai.features.marketdata.trades.infrastructure.scheduler;

import com.synapse.ai.features.marketdata.trades.application.TradesSyncUseCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Triggers TradesSyncUseCase on a fixed interval.
 *
 * 30 seconds is a good balance for the live activity feed —
 * fast enough to feel live, slow enough not to hammer the Data API.
 * Adjust via polymarket.trades.poll-interval-ms in application.yml.
 */
@Component
public class TradesSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(TradesSyncScheduler.class);

    private final TradesSyncUseCase syncUseCase;

    public TradesSyncScheduler(TradesSyncUseCase syncUseCase) {
        this.syncUseCase = syncUseCase;
    }

    @Scheduled(fixedRateString = "${polymarket.trades.poll-interval-ms:30000}")
    public void poll() {
        try {
            syncUseCase.sync();
        } catch (Exception e) {
            log.error("Trades poll failed: {}", e.getMessage());
        }
    }
}