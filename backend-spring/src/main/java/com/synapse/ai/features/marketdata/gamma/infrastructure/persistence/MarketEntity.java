package com.synapse.ai.features.marketdata.gamma.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * JPA entity for persisting Gamma market metadata.
 *
 * conditionId is the natural key — it is the same value used as
 * marketId in the CLOB WebSocket stream, so it's the join point
 * between the two features.
 */
@Entity
@Table(
        name = "markets",
        indexes = {
                @Index(name = "idx_markets_condition_id",  columnList = "condition_id",  unique = true),
                @Index(name = "idx_markets_category",      columnList = "category"),
                @Index(name = "idx_markets_active_closed", columnList = "active, closed"),
        }
)
public class MarketEntity {

    @Id
    @Column(name = "id", nullable = false)
    private String id;                  // Gamma market ID

    @Column(name = "condition_id", nullable = false, unique = true)
    private String conditionId;         // CLOB join key

    @Column(name = "question_id")
    private String questionId;

    @Column(name = "question", columnDefinition = "TEXT")
    private String question;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 100)
    private String category;

    /** Pipe-separated tag list — simple enough for this use case */
    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags;

    @Column(name = "event_id")
    private String eventId;

    @Column(name = "event_title", columnDefinition = "TEXT")
    private String eventTitle;

    /** Pipe-separated: clobTokenIds[0]=YES|clobTokenIds[1]=NO */
    @Column(name = "clob_token_ids", columnDefinition = "TEXT")
    private String clobTokenIds;

    @Column(name = "yes_price",  precision = 10, scale = 6)
    private BigDecimal yesPrice;

    @Column(name = "no_price",   precision = 10, scale = 6)
    private BigDecimal noPrice;

    @Column(name = "active",   nullable = false)
    private boolean active;

    @Column(name = "closed",   nullable = false)
    private boolean closed;

    @Column(name = "archived", nullable = false)
    private boolean archived;

    @Column(name = "enable_order_book", nullable = false)
    private boolean enableOrderBook;

    @Column(name = "volume",     precision = 20, scale = 2)
    private BigDecimal volume;

    @Column(name = "volume_24h", precision = 20, scale = 2)
    private BigDecimal volume24h;

    @Column(name = "liquidity",  precision = 20, scale = 2)
    private BigDecimal liquidity;

    @Column(name = "end_date")
    private Instant endDate;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    /** Timestamp of last successful sync from Gamma API */
    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    protected MarketEntity() {}

    // ── Getters ────────────────────────────────────────────────────
    public String     getId()             { return id; }
    public String     getConditionId()    { return conditionId; }
    public String     getQuestionId()     { return questionId; }
    public String     getQuestion()       { return question; }
    public String     getDescription()    { return description; }
    public String     getCategory()       { return category; }
    public String     getTags()           { return tags; }
    public String     getEventId()        { return eventId; }
    public String     getEventTitle()     { return eventTitle; }
    public String     getClobTokenIds()   { return clobTokenIds; }
    public BigDecimal getYesPrice()       { return yesPrice; }
    public BigDecimal getNoPrice()        { return noPrice; }
    public boolean    isActive()          { return active; }
    public boolean    isClosed()          { return closed; }
    public boolean    isArchived()        { return archived; }
    public boolean    isEnableOrderBook() { return enableOrderBook; }
    public BigDecimal getVolume()         { return volume; }
    public BigDecimal getVolume24h()      { return volume24h; }
    public BigDecimal getLiquidity()      { return liquidity; }
    public Instant    getEndDate()        { return endDate; }
    public Instant    getStartDate()      { return startDate; }
    public Instant    getCreatedAt()      { return createdAt; }
    public Instant    getUpdatedAt()      { return updatedAt; }
    public Instant    getLastSyncedAt()   { return lastSyncedAt; }

    // ── Builder ────────────────────────────────────────────────────
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final MarketEntity e = new MarketEntity();

        public Builder id(String v)             { e.id = v;             return this; }
        public Builder conditionId(String v)    { e.conditionId = v;    return this; }
        public Builder questionId(String v)     { e.questionId = v;     return this; }
        public Builder question(String v)       { e.question = v;       return this; }
        public Builder description(String v)    { e.description = v;    return this; }
        public Builder category(String v)       { e.category = v;       return this; }
        public Builder tags(String v)           { e.tags = v;           return this; }
        public Builder eventId(String v)        { e.eventId = v;        return this; }
        public Builder eventTitle(String v)     { e.eventTitle = v;     return this; }
        public Builder clobTokenIds(String v)   { e.clobTokenIds = v;   return this; }
        public Builder yesPrice(BigDecimal v)   { e.yesPrice = v;       return this; }
        public Builder noPrice(BigDecimal v)    { e.noPrice = v;        return this; }
        public Builder active(boolean v)        { e.active = v;         return this; }
        public Builder closed(boolean v)        { e.closed = v;         return this; }
        public Builder archived(boolean v)      { e.archived = v;       return this; }
        public Builder enableOrderBook(boolean v){ e.enableOrderBook = v; return this; }
        public Builder volume(BigDecimal v)     { e.volume = v;         return this; }
        public Builder volume24h(BigDecimal v)  { e.volume24h = v;      return this; }
        public Builder liquidity(BigDecimal v)  { e.liquidity = v;      return this; }
        public Builder endDate(Instant v)       { e.endDate = v;        return this; }
        public Builder startDate(Instant v)     { e.startDate = v;      return this; }
        public Builder createdAt(Instant v)     { e.createdAt = v;      return this; }
        public Builder updatedAt(Instant v)     { e.updatedAt = v;      return this; }
        public Builder lastSyncedAt(Instant v)  { e.lastSyncedAt = v;   return this; }
        public MarketEntity build()             { return e; }
    }
}