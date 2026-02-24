package dev.adolab.domain.workitem.entity;

import java.time.LocalDateTime;

public record WorkItem(
        Integer id,
        Long syncConfigId,
        Integer rev,
        String title,
        String workItemType,
        String state,
        String assignedTo,
        String description,
        Integer priority,
        String tags,
        String areaPath,
        String iterationPath,
        Integer parentId,
        Integer watermark,
        LocalDateTime createdDate,
        LocalDateTime changedDate,
        String createdBy,
        String changedBy,
        LocalDateTime syncedAt
) {}
