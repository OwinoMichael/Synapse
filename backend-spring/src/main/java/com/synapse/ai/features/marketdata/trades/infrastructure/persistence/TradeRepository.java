package com.synapse.ai.features.marketdata.trades.infrastructure.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<TradeEntity, String> {

    List<TradeEntity> findByMarketIdOrderByTimestampDesc(String marketId, Pageable pageable);

    List<TradeEntity> findByIsWhaleTrueOrderByTimestampDesc(Pageable pageable);

    List<TradeEntity> findByTimestampAfterOrderByTimestampDesc(Instant after);

    boolean existsById(String id);
}