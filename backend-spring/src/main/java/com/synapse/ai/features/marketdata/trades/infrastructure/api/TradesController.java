package com.synapse.ai.features.marketdata.trades.infrastructure.api;

import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketRepository;
import com.synapse.ai.features.marketdata.trades.infrastructure.persistence.TradeEntity;
import com.synapse.ai.features.marketdata.trades.infrastructure.persistence.TradeRepository;
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

    /** GET /api/trades/recent?limit=20 */
    @GetMapping("/recent")
    public List<TradeResponse> getRecent(
            @RequestParam(defaultValue = "20") int limit
    ) {
        return tradeRepository
                .findAll(PageRequest.of(0, Math.min(limit, 100),
                        Sort.by(Sort.Direction.DESC, "timestamp")))
                .getContent()
                .stream()
                .map(t -> toResponse(t))
                .toList();
    }

    /** GET /api/trades/whales?limit=10 */
    @GetMapping("/whales")
    public List<TradeResponse> getWhales(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return tradeRepository
                .findByIsWhaleTrueOrderByTimestampDesc(
                        PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(t -> toResponse(t))
                .toList();
    }

    // ── Helpers ────────────────────────────────────────────────────

    private TradeResponse toResponse(TradeEntity t) {
        String question = marketRepository.findByConditionId(t.getMarketId())
                .map(m -> m.getQuestion())
                .orElse("Unknown market");
        String category = marketRepository.findByConditionId(t.getMarketId())
                .map(m -> m.getCategory() != null ? m.getCategory() : "Other")
                .orElse("Other");
        return new TradeResponse(
                t.getId(),
                t.getMarketId(),
                question,
                category,
                t.getSide(),
                t.getPrice()     != null ? t.getPrice().doubleValue()     : 0,
                t.getUsdcValue() != null ? t.getUsdcValue().doubleValue() : 0,
                t.isWhale(),
                t.getTimestamp().toString()
        );
    }

    public record TradeResponse(
            String  id,
            String  marketId,
            String  marketQuestion,
            String  category,
            String  side,
            double  price,
            double  usdcValue,
            boolean isWhale,
            String  timestamp
    ) {}
}