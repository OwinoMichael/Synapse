package com.synapse.ai.features.marketdata.gamma.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.ai.features.marketdata.gamma.domain.GammaMarket;
import com.synapse.ai.features.marketdata.gamma.infrastructure.client.GammaApiResponse;
import com.synapse.ai.features.marketdata.gamma.infrastructure.persistence.MarketEntity;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;


import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Maps between Gamma API DTOs, domain records, and JPA entities.
 *
 * Key mapping quirks:
 *   - outcomePrices is a JSON-encoded string: "[\"0.72\",\"0.28\"]"
 *     → parse as List<String>, pick index 0 (YES) and 1 (NO)
 *   - clobTokenIds list → pipe-joined string for DB storage
 *   - tags list → pipe-joined string for DB storage
 *   - category comes from the parent events[0].category
 *   - dates are ISO-8601 strings → Instant
 */
@Component
public class GammaMarketMapper {

    private static final Logger log    = LoggerFactory.getLogger(GammaMarketMapper.class);
    private final ObjectMapper mapper = new ObjectMapper();

    // ── DTO → Domain ───────────────────────────────────────────────

    public GammaMarket toDomain(GammaApiResponse dto) {
        List<BigDecimal> prices = parseOutcomePrices(dto.outcomePrices());
        BigDecimal yesPrice = prices.size() > 0 ? prices.get(0) : BigDecimal.ZERO;
        BigDecimal noPrice  = prices.size() > 1 ? prices.get(1) : BigDecimal.ZERO;

        String   category   = extractCategory(dto);
        List<String> tags   = extractTags(dto);

        return new GammaMarket(
                dto.id(),
                dto.conditionId(),
                dto.questionId(),
                dto.question(),
                dto.description(),
                category,
                tags,
                extractEventId(dto),
                extractEventTitle(dto),
                dto.clobTokenIds() != null ? dto.clobTokenIds() : Collections.emptyList(),
                yesPrice,
                noPrice,
                dto.active(),
                dto.closed(),
                dto.archived(),
                dto.enableOrderBook(),
                parseBigDecimal(dto.volume()),
                parseBigDecimal(dto.volume24hr()),
                parseBigDecimal(dto.liquidity()),
                parseInstant(dto.endDate()),
                parseInstant(dto.startDate()),
                parseInstant(dto.createdAt()),
                parseInstant(dto.updatedAt())
        );
    }

    // ── Domain → Entity ────────────────────────────────────────────

    public MarketEntity toEntity(GammaMarket m) {
        return MarketEntity.builder()
                .id(m.id())
                .conditionId(m.conditionId())
                .questionId(m.questionId())
                .question(m.question())
                .description(m.description())
                .category(m.category())
                .tags(m.tags() != null ? String.join("|", m.tags()) : null)
                .eventId(m.eventId())
                .eventTitle(m.eventTitle())
                .clobTokenIds(m.clobTokenIds() != null ? String.join("|", m.clobTokenIds()) : null)
                .yesPrice(m.yesPrice())
                .noPrice(m.noPrice())
                .active(m.active())
                .closed(m.closed())
                .archived(m.archived())
                .enableOrderBook(m.enableOrderBook())
                .volume(m.volume())
                .volume24h(m.volume24h())
                .liquidity(m.liquidity())
                .endDate(m.endDate())
                .startDate(m.startDate())
                .createdAt(m.createdAt())
                .updatedAt(m.updatedAt())
                .lastSyncedAt(Instant.now())
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────

    private List<BigDecimal> parseOutcomePrices(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            List<String> raw = mapper.readValue(json, new TypeReference<>() {});
            return raw.stream()
                    .map(s -> {
                        try { return new BigDecimal(s); }
                        catch (Exception e) { return BigDecimal.ZERO; }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Failed to parse outcomePrices: {}", json);
            return Collections.emptyList();
        }
    }

    private String extractCategory(GammaApiResponse dto) {
        if (dto.events() != null && !dto.events().isEmpty()) {
            return dto.events().get(0).category();
        }
        // Fallback: look in tags for known category labels
        if (dto.tags() != null) {
            return dto.tags().stream()
                    .map(GammaApiResponse.GammaTagDto::label)
                    .findFirst()
                    .orElse("Other");
        }
        return "Other";
    }

    private List<String> extractTags(GammaApiResponse dto) {
        if (dto.tags() == null) return Collections.emptyList();
        return dto.tags().stream()
                .map(GammaApiResponse.GammaTagDto::label)
                .collect(Collectors.toList());
    }

    private String extractEventId(GammaApiResponse dto) {
        if (dto.events() != null && !dto.events().isEmpty()) {
            return dto.events().get(0).id();
        }
        return null;
    }

    private String extractEventTitle(GammaApiResponse dto) {
        if (dto.events() != null && !dto.events().isEmpty()) {
            return dto.events().get(0).title();
        }
        return null;
    }

    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.isBlank()) return BigDecimal.ZERO;
        try { return new BigDecimal(value); }
        catch (Exception e) { return BigDecimal.ZERO; }
    }

    private Instant parseInstant(String value) {
        if (value == null || value.isBlank()) return null;
        try { return Instant.parse(value); }
        catch (Exception e) { return null; }
    }
}