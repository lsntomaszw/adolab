package dev.adolab.domain.workitem.entity;

import java.time.LocalDateTime;

public record SyncConfig(
        Long id,
        String name,
        String areaPath,
        LocalDateTime lastSynced,
        LocalDateTime createdAt
) {}
