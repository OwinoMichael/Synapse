package com.synapse.ai.features.marketdata.gamma.infrastructure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Gamma API pagination envelope.
 *
 * Gamma wraps paginated responses as:
 * {
 *   "data": [...],
 *   "next_cursor": "abc123" | "LTE=" (end sentinel) | null
 * }
 *
 * Note: some Gamma endpoints return a plain array rather than this
 * envelope. GammaApiClient.fetchByConditionId handles that case
 * separately using a TypeReference<List<GammaApiResponse>>.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GammaPagedResponse(

        @JsonProperty("data")
        List<GammaApiResponse> data,

        @JsonProperty("next_cursor")
        String nextCursor
) {}