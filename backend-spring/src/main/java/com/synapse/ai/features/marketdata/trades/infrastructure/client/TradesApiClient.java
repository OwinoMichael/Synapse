package com.synapse.ai.features.marketdata.trades.infrastructure.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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

/**
 * HTTP client for the Polymarket Data API.
 *
 * Base URL : https://data-api.polymarket.com
 * Endpoint : GET /trades
 * Auth     : none
 *
 * We poll with a taker_start_ts filter so we only fetch trades
 * newer than our last poll — avoids re-processing old trades.
 */
@Component
public class TradesApiClient {

    private static final Logger log = LoggerFactory.getLogger(TradesApiClient.class);

    @Value("${polymarket.trades.base-url:https://data-api.polymarket.com}")
    private String baseUrl;

    @Value("${polymarket.trades.page-size:100}")
    private int pageSize;

    private final HttpClient   http   = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Fetch recent trades since the given Unix epoch seconds timestamp.
     * Returns an empty list on error so the scheduler keeps running.
     *
     * @param sinceEpochSeconds  only return trades after this time
     */
    public List<TradesApiResponse> fetchSince(long sinceEpochSeconds) {
        String url = baseUrl + "/trades"
                + "?limit=" + pageSize
                + "&taker_start_ts=" + sinceEpochSeconds
                + "&order=TIMESTAMP"
                + "&ascending=false";

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response =
                    http.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Trades API status={} body={}", response.statusCode(), response.body());
                return Collections.emptyList();
            }

            return mapper.readValue(
                    response.body(),
                    new TypeReference<List<TradesApiResponse>>() {});

        } catch (Exception e) {
            log.error("Failed to fetch trades since={}: {}", sinceEpochSeconds, e.getMessage());
            return Collections.emptyList();
        }
    }
}