package com.synapse.ai.features.marketdata.trades.infrastructure.api;

import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketRepository;
import com.synapse.ai.features.marketdata.trades.infrastructure.persistence.TradeEntity;
import com.synapse.ai.features.marketdata.trades.infrastructure.persistence.TradeRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trades")
@CrossOrigin(origins = {"http://localhost:3000", "https://mikeowino.cloud"})
public class TradesController {

    private final TradeRepository  tradeRepository;
    private final MarketRepository marketRepository;

    public TradesController(TradeRepository tradeRepository, MarketRepository marketRepository) {
        this.tradeRepository  = tradeRepository;
        this.marketRepository = marketRepository;
    }

    @GetMapping("/recent")
    @Cacheable(value = "trades", key = "'recent_' + #limit")
    public List<TradeResponse> getRecent(@RequestParam(defaultValue = "20") int limit) {
        return tradeRepository
                .findAll(PageRequest.of(0, Math.min(limit, 100),
                        Sort.by(Sort.Direction.DESC, "timestamp")))
                .getContent()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/whales")
    @Cacheable(value = "trades", key = "'whales_' + #limit")
    public List<TradeResponse> getWhales(@RequestParam(defaultValue = "10") int limit) {
        return tradeRepository
                .findByIsWhaleTrueOrderByTimestampDesc(
                        PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TradeResponse toResponse(TradeEntity t) {
        var marketOpt = marketRepository.findByConditionId(t.getMarketId());
        String question = marketOpt.map(m -> m.getQuestion()).orElse("Unknown market");
        String category = marketOpt.map(m -> m.getCategory() != null ? m.getCategory() : "Other").orElse("Other");
        return new TradeResponse(
                t.getId(), t.getMarketId(), question, category,
                t.getSide(),
                t.getPrice()     != null ? t.getPrice().doubleValue()     : 0,
                t.getUsdcValue() != null ? t.getUsdcValue().doubleValue() : 0,
                t.isWhale(),
                t.getTimestamp().toString()
        );
    }

    public record TradeResponse(
            String id, String marketId, String marketQuestion,
            String category, String side, double price,
            double usdcValue, boolean isWhale, String timestamp
    ) {}
}