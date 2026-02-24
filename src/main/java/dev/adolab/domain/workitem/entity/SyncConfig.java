package dev.adolab.domain.workitem.entity;

import java.time.LocalDateTime;

public record SyncConfig(
        Long id,
        String name,
        Integer epicId,
        String orgName,
        String project,
        LocalDateTime lastSynced,
        LocalDateTime createdAt
) {}
