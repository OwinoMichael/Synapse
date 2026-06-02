package com.synapse.ai.features.marketdata.gamma.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketRepository extends JpaRepository<MarketEntity, String> {

    Optional<MarketEntity> findByConditionId(String conditionId);

    List<MarketEntity> findByActiveAndClosedAndArchived(
            boolean active, boolean closed, boolean archived);

    Page<MarketEntity> findByCategoryAndActiveTrue(String category, Pageable pageable);

    Page<MarketEntity> findByActiveTrue(Pageable pageable);

    /** Returns all YES token IDs for active markets — used by CLOB WebSocket subscription */
    @Query("SELECT SUBSTRING_INDEX(m.clobTokenIds, '|', 1) FROM MarketEntity m WHERE m.active = true AND m.enableOrderBook = true")
    List<String> findAllActiveYesTokenIds();

    boolean existsByConditionId(String conditionId);
}