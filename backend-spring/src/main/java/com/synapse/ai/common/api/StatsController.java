package com.synapse.ai.common.api;

import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketRepository;
import com.synapse.ai.features.marketdata.trades.infrastructure.persistence.TradeRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = {"http://localhost:3000", "https://mikeowino.cloud"})
public class StatsController {

    private final MarketRepository marketRepository;
    private final TradeRepository  tradeRepository;

    public StatsController(MarketRepository marketRepository, TradeRepository tradeRepository) {
        this.marketRepository = marketRepository;
        this.tradeRepository  = tradeRepository;
    }

    /** GET /api/stats */
    @GetMapping
    public Map<String, Object> getStats() {
        long totalMarkets  = marketRepository.count();
        long activeSignals = 0; // populated once signals feature is built

        // Recent whale trades in last hour as volatility proxy
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        long spikes = tradeRepository.findByTimestampAfterOrderByTimestampDesc(oneHourAgo)
                .stream().filter(t -> t.isWhale()).count();

        String volatility = spikes > 10 ? "HIGH" : spikes > 4 ? "MEDIUM" : "LOW";

        return Map.of(
                "totalMarkets",    totalMarkets,
                "activeSignals",   activeSignals,
                "avgMismatch",     0.0,   // populated once signals feature is built
                "volatilityLevel", volatility,
                "volatilitySpikes", spikes
        );
    }

    /** GET /api/stats/heatmap */
    @GetMapping("/heatmap")
    public List<Map<String, Object>> getHeatmap() {
        List<String> categories = List.of(
                "Politics", "Crypto", "AI / Tech", "Sports", "Weather", "Science", "Other");

        return categories.stream().map(cat -> {
            long count = marketRepository.findByCategoryAndActiveTrue(
                    cat, PageRequest.of(0, 1)).getTotalElements();

            // Aggregate volume from market entities for this category
            double vol = marketRepository
                    .findByCategoryAndActiveTrue(cat, PageRequest.of(0, 200))
                    .getContent()
                    .stream()
                    .mapToDouble(m -> m.getVolume() != null ? m.getVolume().doubleValue() : 0)
                    .sum() / 1_000_000.0;

            return Map.<String, Object>of(
                    "category", cat,
                    "volume",   Math.round(vol * 10.0) / 10.0,
                    "change",   0.0,   // TODO: compare to previous sync
                    "markets",  count
            );
        }).toList();
    }
}