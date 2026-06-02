package com.synapse.ai.features.marketdata.clob.infrastructure.persistence;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Persists the raw JSON payload from the Polymarket WebSocket before
 * any normalisation. Useful for debugging, replaying, and auditing.
 */
@Entity
@Table(name = "raw_market_messages")
public class RawMarketMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Raw JSON string received from the WebSocket */
    @Column(name = "payload", columnDefinition = "TEXT", nullable = false)
    private String payload;

    /** event_type extracted from the JSON for quick filtering */
    @Column(name = "event_type", length = 64)
    private String eventType;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt;

    protected RawMarketMessageEntity() {}

    public RawMarketMessageEntity(String payload, String eventType) {
        this.payload     = payload;
        this.eventType   = eventType;
        this.receivedAt  = Instant.now();
    }

    public Long    getId()         { return id; }
    public String  getPayload()    { return payload; }
    public String  getEventType()  { return eventType; }
    public Instant getReceivedAt() { return receivedAt; }
}