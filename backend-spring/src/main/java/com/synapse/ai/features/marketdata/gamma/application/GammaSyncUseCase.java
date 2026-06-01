package com.synapse.ai.features.marketdata.gamma.application;

import com.synapse.ai.features.marketdata.gamma.domain.GammaMarket;
import com.synapse.ai.features.marketdata.gamma.infrastructure.client.GammaApiClient;
import com.synapse.ai.features.marketdata.gamma.infrastructure.client.GammaApiResponse;
import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketEntity;
import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Orchestrates a full Gamma sync:
 *
 *   1. Fetch all active markets from Gamma REST API (paginated)
 *   2. Map each DTO → domain → entity
 *   3. Upsert into the markets table
 *   4. Publish GammaMarketsRefreshedEvent so the CLOB WebSocket
 *      client can update its asset-id subscription list
 *
 * Called by GammaSyncScheduler on a fixed interval and once on startup.
 */
@Service
public class GammaSyncUseCase {

    private static final Logger log = LoggerFactory.getLogger(GammaSyncUseCase.class);

    private final GammaApiClient           client;
    private final GammaMarketMapper        mapper;
    private final MarketRepository         repository;
    private final ApplicationEventPublisher eventPublisher;

    public GammaSyncUseCase(
            GammaApiClient            client,
            GammaMarketMapper         mapper,
            MarketRepository          repository,
            ApplicationEventPublisher eventPublisher) {
        this.client         = client;
        this.mapper         = mapper;
        this.repository     = repository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public SyncResult syncAll() {
        log.info("Starting full Gamma market sync…");

        List<GammaApiResponse> raw     = client.fetchAllActiveMarkets();
        AtomicInteger          created = new AtomicInteger();
        AtomicInteger          updated = new AtomicInteger();
        List<String>           errors  = new ArrayList<>();

        for (GammaApiResponse dto : raw) {
            try {
                GammaMarket  domain = mapper.toDomain(dto);
                MarketEntity entity = mapper.toEntity(domain);
                upsert(entity, created, updated);
            } catch (Exception e) {
                log.error("Failed to sync market id={}: {}", dto.id(), e.getMessage());
                errors.add(dto.id());
            }
        }

        SyncResult result = new SyncResult(raw.size(), created.get(), updated.get(), errors);
        log.info("Gamma sync complete — {}", result);

        // Notify CLOB WebSocket client to refresh its subscriptions
        eventPublisher.publishEvent(new GammaMarketsRefreshedEvent(this));
        return result;
    }

    /**
     * Targeted refresh for a single market — called when the signals
     * feature needs fresh metadata for a specific conditionId.
     */
    @Transactional
    public void syncByConditionId(String conditionId) {
        GammaApiResponse dto = client.fetchByConditionId(conditionId);
        if (dto == null) {
            log.warn("No Gamma data found for conditionId={}", conditionId);
            return;
        }
        MarketEntity entity = mapper.toEntity(mapper.toDomain(dto));
        AtomicInteger c = new AtomicInteger(), u = new AtomicInteger();
        upsert(entity, c, u);
        log.info("Targeted sync conditionId={} created={} updated={}", conditionId, c.get(), u.get());
    }

    // ── Helpers ────────────────────────────────────────────────────

    private void upsert(MarketEntity entity, AtomicInteger created, AtomicInteger updated) {
        if (repository.existsByConditionId(entity.getConditionId())) {
            repository.save(entity);   // JPA merge — updates existing row
            updated.incrementAndGet();
        } else {
            repository.save(entity);
            created.incrementAndGet();
        }
    }

    // ── Result record ──────────────────────────────────────────────

    public record SyncResult(
            int total,
            int created,
            int updated,
            List<String> errors
    ) {
        @Override
        public String toString() {
            return String.format("total=%d created=%d updated=%d errors=%d",
                    total, created, updated, errors.size());
        }
    }
}