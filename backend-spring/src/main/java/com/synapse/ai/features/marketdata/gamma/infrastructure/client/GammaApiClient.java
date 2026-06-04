package com.synapse.ai.features.marketdata.gamma.infrastructure.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * HTTP client for the Polymarket Gamma REST API.
 * Gamma returns a plain JSON array (not paginated envelope).
 * We page using offset until an empty page is returned.
 */
@Component
public class GammaApiClient {

    private static final Logger log       = LoggerFactory.getLogger(GammaApiClient.class);
    private static final int    PAGE_SIZE = 100;

    @Value("${polymarket.gamma.base-url:https://gamma-api.polymarket.com}")
    private String baseUrl;

    private final HttpClient   http   = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public List<GammaApiResponse> fetchAllActiveMarkets() {
        List<GammaApiResponse> all    = new ArrayList<>();
        int                    offset = 0;
        int                    page   = 0;

        while (true) {
            String url = buildUrl(offset);
            log.info("Fetching Gamma markets page={} offset={}", page, offset);

            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(15))
                        .GET()
                        .build();

                HttpResponse<String> response =
                        http.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 422 || response.statusCode() == 404) {
                    // 422 = offset beyond available data — pagination complete
                    log.info("Gamma pagination complete at offset={} (status={})", offset, response.statusCode());
                    break;
                }

                if (response.statusCode() != 200) {
                    log.error("Gamma API status={}", response.statusCode());
                    break;
                }

                List<GammaApiResponse> pageData = mapper.readValue(
                        response.body(),
                        new TypeReference<List<GammaApiResponse>>() {});

                if (pageData.isEmpty()) {
                    log.info("Gamma fetch complete — {} markets across {} pages", all.size(), page);
                    break;
                }

                all.addAll(pageData);
                offset += PAGE_SIZE;
                page++;

                // Respect rate limits
                Thread.sleep(250);

            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Error fetching Gamma page={}: {}", page, e.getMessage());
                break;
            }
        }

        log.info("Gamma fetch complete — {} total markets", all.size());
        return all;
    }

    public GammaApiResponse fetchByConditionId(String conditionId) {
        String url = baseUrl + "/markets?conditionId=" + conditionId + "&limit=1";
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<String> response =
                    http.send(request, HttpResponse.BodyHandlers.ofString());
            List<GammaApiResponse> list = mapper.readValue(
                    response.body(), new TypeReference<List<GammaApiResponse>>() {});
            return list.isEmpty() ? null : list.get(0);
        } catch (Exception e) {
            log.error("Failed to fetch market conditionId={}: {}", conditionId, e.getMessage());
            return null;
        }
    }

    private String buildUrl(int offset) {
        return baseUrl + "/markets"
                + "?limit="            + PAGE_SIZE
                + "&active=true"
                + "&archived=false"
                + "&enableOrderBook=true"
                + "&offset="           + offset;
    }
}