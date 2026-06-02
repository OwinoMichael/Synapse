package com.synapse.ai.features.marketdata.trades.infrastructure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Jackson DTO for a single trade object from:
 * GET https://data-api.polymarket.com/trades
 *
 * Sample response field names from Polymarket Data API docs.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TradesApiResponse(

        @JsonProperty("id")
        String id,

        @JsonProperty("market")
        String market,          // conditionId

        @JsonProperty("asset_id")
        String assetId,

        @JsonProperty("side")
        String side,            // "BUY" | "SELL"

        @JsonProperty("price")
        String price,

        @JsonProperty("size")
        String size,

        @JsonProperty("maker_address")
        String makerAddress,

        @JsonProperty("taker_address")
        String takerAddress,

        /** Unix timestamp in seconds */
        @JsonProperty("timestamp")
        String timestamp
) {}