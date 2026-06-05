package com.synapse.ai.features.marketdata.trades.infrastructure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Jackson DTO matching the Polymarket Data API GET /trades response.
 *
 * Actual field names from docs:
 * proxyWallet, side, asset, conditionId, size, price, timestamp, title, outcome
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TradesApiResponse(

        @JsonProperty("id")
        String id,

        @JsonProperty("conditionId")
        String market,          // conditionId — matches our marketId

        @JsonProperty("asset")
        String assetId,         // token ID

        @JsonProperty("side")
        String side,            // "BUY" | "SELL"

        @JsonProperty("price")
        Double price,

        @JsonProperty("size")
        Double size,            // USDC amount

        @JsonProperty("usdcSize")
        Double usdcSize,        // alternative USDC field

        @JsonProperty("proxyWallet")
        String makerAddress,

        @JsonProperty("timestamp")
        Long timestamp,         // Unix seconds

        @JsonProperty("title")
        String title,           // market question — bonus, saves a DB join

        @JsonProperty("outcome")
        String outcome          // "Yes" | "No"
) {}