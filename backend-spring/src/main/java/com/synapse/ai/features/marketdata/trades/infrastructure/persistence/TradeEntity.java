package com.synapse.ai.features.marketdata.trades.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "trades",
        indexes = {
                @Index(name = "idx_trades_market_id",  columnList = "market_id"),
                @Index(name = "idx_trades_timestamp",  columnList = "timestamp"),
                @Index(name = "idx_trades_is_whale",   columnList = "is_whale"),
        }
)
public class TradeEntity {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "market_id", nullable = false)
    private String marketId;

    @Column(name = "asset_id")
    private String assetId;

    @Column(name = "side", length = 10)
    private String side;

    @Column(name = "price", precision = 10, scale = 6)
    private BigDecimal price;

    @Column(name = "size", precision = 20, scale = 2)
    private BigDecimal size;

    @Column(name = "usdc_value", precision = 20, scale = 2)
    private BigDecimal usdcValue;

    @Column(name = "maker_address", length = 64)
    private String makerAddress;

    @Column(name = "taker_address", length = 64)
    private String takerAddress;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "is_whale", nullable = false)
    private boolean isWhale;

    protected TradeEntity() {}

    public static TradeEntity from(
            String id, String marketId, String assetId,
            String side, BigDecimal price, BigDecimal size,
            BigDecimal usdcValue, String makerAddress,
            String takerAddress, Instant timestamp, boolean isWhale) {
        TradeEntity e = new TradeEntity();
        e.id           = id;
        e.marketId     = marketId;
        e.assetId      = assetId;
        e.side         = side;
        e.price        = price;
        e.size         = size;
        e.usdcValue    = usdcValue;
        e.makerAddress = makerAddress;
        e.takerAddress = takerAddress;
        e.timestamp    = timestamp;
        e.isWhale      = isWhale;
        return e;
    }

    public String     getId()           { return id; }
    public String     getMarketId()     { return marketId; }
    public String     getAssetId()      { return assetId; }
    public String     getSide()         { return side; }
    public BigDecimal getPrice()        { return price; }
    public BigDecimal getSize()         { return size; }
    public BigDecimal getUsdcValue()    { return usdcValue; }
    public String     getMakerAddress() { return makerAddress; }
    public String     getTakerAddress() { return takerAddress; }
    public Instant    getTimestamp()    { return timestamp; }
    public boolean    isWhale()         { return isWhale; }
}