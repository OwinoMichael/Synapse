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

        @JsonProperty("transactionHash")
        String id,              // transactionHash IS the unique ID

        @JsonProperty("conditionId")
        String market,

        @JsonProperty("asset")
        String assetId,

        @JsonProperty("side")
        String side,            // "BUY" | "SELL"

        @JsonProperty("price")
        Double price,

        @JsonProperty("size")
        Double size,            // USDC amount (numeric, not string)

        @JsonProperty("proxyWallet")
        String makerAddress,

        @JsonProperty("timestamp")
        Long timestamp,         // Unix seconds

        @JsonProperty("title")
        String title,

        @JsonProperty("outcome")
        String outcome
) {}
