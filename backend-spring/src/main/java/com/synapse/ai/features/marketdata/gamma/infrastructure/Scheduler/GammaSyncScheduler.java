package com.synapse.ai.features.marketdata.gamma.infrastructure.scheduler;

import com.synapse.ai.features.marketdata.gamma.application.GammaSyncUseCase;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Triggers GammaSyncUseCase on startup and on a fixed schedule.
 *
 * Why 10 minutes?
 *   - Gamma market metadata (questions, categories, token IDs) changes
 *     slowly — new markets appear, existing ones resolve or get archived.
 *   - 10 min is frequent enough to catch new markets for CLOB subscription
 *     without hammering the Gamma API.
 *   - Adjust via polymarket.gamma.sync-interval-ms in application.yml.
 */
@Component
public class GammaSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(GammaSyncScheduler.class);

    private final GammaSyncUseCase syncUseCase;

    public GammaSyncScheduler(GammaSyncUseCase syncUseCase) {
        this.syncUseCase = syncUseCase;
    }

    /** Run once on startup so the DB is populated before CLOB connects */
    @PostConstruct
    public void syncOnStartup() {
        log.info("Running initial Gamma sync on startup…");
        try {
            syncUseCase.syncAll();
        } catch (Exception e) {
            // Non-fatal — CLOB will fall back to application.yml asset-ids
            log.error("Initial Gamma sync failed: {}", e.getMessage());
        }
    }

    /** Periodic refresh — every 10 minutes */
    @Scheduled(fixedRateString = "${polymarket.gamma.sync-interval-ms:600000}")
    public void syncOnSchedule() {
        log.info("Running scheduled Gamma sync…");
        try {
            syncUseCase.syncAll();
        } catch (Exception e) {
            log.error("Scheduled Gamma sync failed: {}", e.getMessage());
        }
    }
}