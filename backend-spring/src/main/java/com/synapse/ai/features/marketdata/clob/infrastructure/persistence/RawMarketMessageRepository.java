package com.synapse.ai.features.marketdata.clob.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface RawMarketMessageRepository
        extends JpaRepository<RawMarketMessageEntity, Long> {

    /** Useful for replaying a specific event type window */
    List<RawMarketMessageEntity> findByEventTypeAndReceivedAtAfter(
            String eventType, Instant after);
}