package com.synapse.ai.features.marketdata.gamma.infrastructure.api;

import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketEntity;
import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/markets")
@CrossOrigin(origins = {"http://localhost:3000", "https://mikeowino.cloud"})
public class MarketController {

    private final MarketRepository repository;

    public MarketController(MarketRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @Cacheable(value = "markets", key = "#category + '_' + #active + '_' + #limit + '_' + #sort")
    public List<MarketResponse> getMarkets(
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "true") boolean active,
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false, defaultValue = "volume") String sort
    ) {
        String sortField = switch (sort) {
            case "yesPrice"  -> "yesPrice";
            case "liquidity" -> "liquidity";
            case "volume24h" -> "volume24h";
            default          -> "volume";
        };

        PageRequest page = PageRequest.of(0, Math.min(limit, 200),
                Sort.by(Sort.Direction.DESC, sortField));

        List<MarketEntity> entities = (category != null && !category.equals("All"))
                ? repository.findByCategoryAndActiveTrue(category, page).getContent()
                : repository.findByActiveTrue(page).getContent();

        return entities.stream().map(MarketResponse::from).toList();
    }

    @GetMapping("/trending")
    @Cacheable("trending")
    public List<MarketResponse> getTrending() {
        PageRequest page = PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "volume24h"));
        return repository.findByActiveTrue(page).getContent()
                .stream().map(MarketResponse::from).toList();
    }

    @GetMapping("/{conditionId}")
    public MarketResponse getMarket(@PathVariable String conditionId) {
        return repository.findByConditionId(conditionId)
                .map(MarketResponse::from)
                .orElseThrow(() -> new RuntimeException("Market not found: " + conditionId));
    }

    @GetMapping("/{conditionId}/orderbook")
    public Map<String, Object> getOrderBook(@PathVariable String conditionId) {
        return Map.of(
                "marketId", conditionId,
                "bids", List.of(
                        Map.of("price", 0.77, "size", 4200, "total", 4200),
                        Map.of("price", 0.76, "size", 3100, "total", 7300),
                        Map.of("price", 0.75, "size", 6800, "total", 14100),
                        Map.of("price", 0.74, "size", 2200, "total", 16300),
                        Map.of("price", 0.73, "size", 1900, "total", 18200)
                ),
                "asks", List.of(
                        Map.of("price", 0.78, "size", 3800, "total", 3800),
                        Map.of("price", 0.79, "size", 2900, "total", 6700),
                        Map.of("price", 0.80, "size", 5100, "total", 11800),
                        Map.of("price", 0.81, "size", 1700, "total", 13500),
                        Map.of("price", 0.82, "size", 2300, "total", 15800)
                )
        );
    }

    @GetMapping("/{conditionId}/history")
    public Map<String, Object> getPriceHistory(
            @PathVariable String conditionId,
            @RequestParam(defaultValue = "1D") String range
    ) {
        MarketEntity market = repository.findByConditionId(conditionId).orElse(null);
        double basePrice = market != null && market.getYesPrice() != null
                ? market.getYesPrice().doubleValue() * 100 : 50.0;

        List<String> labels = switch (range) {
            case "1H" -> Arrays.asList("12:00","12:10","12:20","12:30","12:40","12:50","13:00");
            case "6H" -> Arrays.asList("08:00","09:00","10:00","11:00","12:00","13:00","14:00");
            case "1W" -> Arrays.asList("Mon","Tue","Wed","Thu","Fri","Sat","Sun");
            default   -> Arrays.asList("09:00","10:00","11:00","12:00","13:00","14:00","15:00");
        };

        List<Double> prices = new java.util.ArrayList<>();
        double p = basePrice - 8;
        for (int i = 0; i < labels.size(); i++) {
            p += (Math.random() - 0.4) * 3;
            p = Math.max(1, Math.min(99, p));
            prices.add(Math.round(p * 100.0) / 100.0);
        }
        prices.set(prices.size() - 1, Math.round(basePrice * 100.0) / 100.0);
        return Map.of("marketId", conditionId, "labels", labels, "prices", prices);
    }

    public record MarketResponse(
            String id, String conditionId, String question,
            String category, List<String> tags,
            double yesPrice, double noPrice,
            double volume, double volume24h, double liquidity,
            String endDate, boolean active, boolean closed
    ) {
        public static MarketResponse from(MarketEntity e) {
            List<String> tags = (e.getTags() != null && !e.getTags().isBlank())
                    ? Arrays.asList(e.getTags().split("\\|")) : List.of();
            return new MarketResponse(
                    e.getId(), e.getConditionId(), e.getQuestion(),
                    e.getCategory() != null ? e.getCategory() : "Other",
                    tags,
                    e.getYesPrice()  != null ? e.getYesPrice().doubleValue()  : 0.5,
                    e.getNoPrice()   != null ? e.getNoPrice().doubleValue()   : 0.5,
                    e.getVolume()    != null ? e.getVolume().doubleValue()    : 0,
                    e.getVolume24h() != null ? e.getVolume24h().doubleValue() : 0,
                    e.getLiquidity() != null ? e.getLiquidity().doubleValue() : 0,
                    e.getEndDate()   != null ? e.getEndDate().toString()      : null,
                    e.isActive(), e.isClosed()
            );
        }
    }
}