package com.synapse.ai.features.marketdata.gamma.infrastructure.scheduler;

import com.synapse.ai.features.marketdata.gamma.application.GammaSyncUseCase;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class GammaSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(GammaSyncScheduler.class);

    private final GammaSyncUseCase syncUseCase;

    public GammaSyncScheduler(GammaSyncUseCase syncUseCase) {
        this.syncUseCase = syncUseCase;
    }

    /** Run in background thread — does NOT block Spring startup */
    @PostConstruct
    public void syncOnStartup() {
        Thread.ofVirtual().name("gamma-startup-sync").start(() -> {
            log.info("Running initial Gamma sync in background…");
            try {
                syncUseCase.syncAll();
            } catch (Exception e) {
                log.error("Initial Gamma sync failed: {}", e.getMessage());
            }
        });
    }

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