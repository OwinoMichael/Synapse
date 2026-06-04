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
import java.util.List;

/**
 * HTTP client for the Polymarket Gamma REST API.
 *
 * Base URL : https://gamma-api.polymarket.com
 * Auth     : none — fully public
 *
 * Pagination: Gamma uses cursor-based pagination via the `next_cursor`
 * field. We page until next_cursor is null or "LTE=" (end sentinel).
 * Page size is set to 100 (Gamma max) to minimise request count.
 */
@Component
public class GammaApiClient {

    private static final Logger log         = LoggerFactory.getLogger(GammaApiClient.class);
    private static final String END_CURSOR  = "LTE=";
    private static final int    PAGE_SIZE   = 100;

    @Value("${polymarket.gamma.base-url:https://gamma-api.polymarket.com}")
    private String baseUrl;

    private final HttpClient   http   = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    /**
     * Fetches all active, non-archived markets with order books enabled.
     * Pages through the full Gamma catalogue in batches of 100.
     *
     * @return flat list of all qualifying GammaApiResponse objects
     */
    public List<GammaApiResponse> fetchAllActiveMarkets() {
        List<GammaApiResponse> all    = new ArrayList<>();
        String                 cursor = null;
        int                    page   = 0;

        do {
            String url = buildMarketsUrl(cursor);
            log.info("Fetching Gamma markets page={} cursor={}", page, cursor);

            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(15))
                        .GET()
                        .build();

                HttpResponse<String> response =
                        http.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() != 200) {
                    log.error("Gamma API returned status={} body={}",
                            response.statusCode(), response.body());
                    break;
                }

                GammaPagedResponse paged;
                try {
                    paged = mapper.readValue(response.body(), GammaPagedResponse.class);
                } catch (Exception parseEx) {
                    // Gamma sometimes returns a plain array instead of paginated envelope
                    log.warn("Paginated parse failed, trying plain array: {}", parseEx.getMessage());
                    List<GammaApiResponse> plain = mapper.readValue(
                            response.body(),
                            new TypeReference<List<GammaApiResponse>>() {});
                    all.addAll(plain);
                    break; // plain array = no pagination
                }

                if (paged.data() != null) {
                    all.addAll(paged.data());
                } else if (paged.nextCursor() == null) {
                    // Empty envelope with no cursor — treat body as done
                    break;
                }

                cursor = paged.nextCursor();
                page++;

                // Respect rate limits — small delay between pages
                if (cursor != null && !END_CURSOR.equals(cursor)) {
                    Thread.sleep(250);
                }

            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.warn("Gamma fetch interrupted at page={}", page);
                break;
            } catch (Exception e) {
                log.error("Error fetching Gamma page={}: {}", page, e.getMessage());
                break;
            }

        } while (cursor != null && !END_CURSOR.equals(cursor));

        log.info("Gamma fetch complete — {} markets retrieved across {} pages", all.size(), page);
        return all;
    }

    /**
     * Fetches a single market by its condition ID.
     * Used for targeted refresh after a WebSocket price spike.
     */
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
                    response.body(),
                    new TypeReference<List<GammaApiResponse>>() {});

            return list.isEmpty() ? null : list.get(0);

        } catch (Exception e) {
            log.error("Failed to fetch market conditionId={}: {}", conditionId, e.getMessage());
            return null;
        }
    }

    // ── Helpers ────────────────────────────────────────────────────

    private String buildMarketsUrl(String cursor) {
        StringBuilder sb = new StringBuilder(baseUrl)
                .append("/markets?limit=").append(PAGE_SIZE)
                .append("&active=true")
                .append("&archived=false")
                .append("&enableOrderBook=true");

        if (cursor != null) {
            sb.append("&next_cursor=").append(cursor);
        }
        return sb.toString();
    }
}