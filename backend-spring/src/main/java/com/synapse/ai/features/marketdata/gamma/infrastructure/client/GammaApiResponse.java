package com.synapse.ai.features.marketdata.gamma.infrastructure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Jackson DTO for deserialising a single market object from the
 * Gamma API GET /markets response array.
 *
 * @JsonIgnoreProperties(ignoreUnknown = true) — Gamma returns ~50 fields;
 * we only map what Synapse actually uses.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GammaApiResponse(

        @JsonProperty("id")
        String id,

        @JsonProperty("conditionId")
        String conditionId,

        @JsonProperty("questionID")
        String questionId,

        @JsonProperty("question")
        String question,

        @JsonProperty("description")
        String description,

        /**
         * Gamma returns category inside a nested "events" array.
         * We flatten it in GammaMarketMapper.
         * This field holds the raw tag list from Gamma directly.
         */
        @JsonProperty("tags")
        List<GammaTagDto> tags,

        /**
         * clobTokenIds is a JSON array: ["<yes-token>", "<no-token>"]
         */
        @JsonProperty("clobTokenIds")
        List<String> clobTokenIds,

        /**
         * outcomePrices is a JSON-encoded string array: "[\"0.72\",\"0.28\"]"
         * Parsed manually in GammaMarketMapper.
         */
        @JsonProperty("outcomePrices")
        String outcomePrices,

        @JsonProperty("active")
        boolean active,

        @JsonProperty("closed")
        boolean closed,

        @JsonProperty("archived")
        boolean archived,

        @JsonProperty("enableOrderBook")
        boolean enableOrderBook,

        @JsonProperty("volume")
        String volume,

        @JsonProperty("volume24hr")
        String volume24hr,

        @JsonProperty("liquidity")
        String liquidity,

        @JsonProperty("endDate")
        String endDate,

        @JsonProperty("startDate")
        String startDate,

        @JsonProperty("createdAt")
        String createdAt,

        @JsonProperty("updatedAt")
        String updatedAt,

        /** Parent event — contains title and category */
        @JsonProperty("events")
        List<GammaEventDto> events
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GammaTagDto(
            @JsonProperty("id")    String id,
            @JsonProperty("label") String label
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GammaEventDto(
            @JsonProperty("id")       String id,
            @JsonProperty("title")    String title,
            @JsonProperty("category") String category
    ) {}
}