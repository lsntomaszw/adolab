package dev.adolab.domain.workitem.entity;

import java.time.LocalDateTime;

public record WorkItemComment(
        Integer id,
        Integer workItemId,
        Long syncConfigId,
        String text,
        String createdBy,
        LocalDateTime createdDate,
        String modifiedBy,
        LocalDateTime modifiedDate,
        Integer version,
        LocalDateTime syncedAt
) {}
