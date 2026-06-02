package com.synapse.ai.features.marketdata.clob.infrastructure.websocket;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "polymarket.clob")
public class PolymarketClobProperties {
    private List<String> assetIds = new ArrayList<>();

    public List<String> getAssetIds() {
        return assetIds;
    }

    public void setAssetIds(List<String> assetIds) {
        this.assetIds = assetIds;
    }
}