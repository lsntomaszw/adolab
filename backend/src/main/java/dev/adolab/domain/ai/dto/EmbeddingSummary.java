package dev.adolab.domain.ai.dto;

import java.time.LocalDateTime;

public record EmbeddingSummary(
        Integer workItemId,
        String summaryEn,
        String[] keywords,
        String modelVersion,
        LocalDateTime generatedAt
) {}
