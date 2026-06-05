package com.synapse.ai.features.marketdata.trades.infrastructure.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Polls the Polymarket Data API for recent trades.
 *
 * Correct endpoint per docs:
 *   GET https://data-api.polymarket.com/trades
 *   Params:
 *     conditionIds  — comma-separated list of market conditionIds
 *     t_start       — Unix timestamp (seconds), only trades after this
 *     limit         — max records (default 100)
 */
@Component
public class TradesApiClient {

    private static final Logger log = LoggerFactory.getLogger(TradesApiClient.class);

    @Value("${polymarket.trades.base-url:https://data-api.polymarket.com}")
    private String baseUrl;

    @Value("${polymarket.trades.page-size:100}")
    private int pageSize;

    private final HttpClient      http           = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper    mapper         = new ObjectMapper();
    private final MarketRepository marketRepository;

    public TradesApiClient(MarketRepository marketRepository) {
        this.marketRepository = marketRepository;
    }

    public List<TradesApiResponse> fetchSince(long sinceEpochSeconds) {
        // Get active conditionIds from DB — limit to 20 to keep URL manageable
        List<String> conditionIds = marketRepository
                .findByActiveAndClosedAndArchived(true, false, false)
                .stream()
                .limit(20)
                .map(m -> m.getConditionId())
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toList());

        if (conditionIds.isEmpty()) {
            log.warn("No active conditionIds found — skipping trades fetch");
            return Collections.emptyList();
        }

        String ids = String.join(",", conditionIds);
        String url = baseUrl + "/trades"
                + "?limit=" + pageSize
                + "&t_start=" + sinceEpochSeconds
                + "&conditionIds=" + ids;

        log.info("Fetching trades: {} markets, since={}", conditionIds.size(), sinceEpochSeconds);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response =
                    http.send(request, HttpResponse.BodyHandlers.ofString());

            log.info("Trades API status={} body_len={}", response.statusCode(), response.body().length());

            if (response.statusCode() != 200) {
                log.error("Trades API error status={} body={}", response.statusCode(),
                        response.body().substring(0, Math.min(200, response.body().length())));
                return Collections.emptyList();
            }

            return mapper.readValue(response.body(),
                    new TypeReference<List<TradesApiResponse>>() {});

        } catch (Exception e) {
            log.error("Failed to fetch trades: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}