package dev.adolab.domain.workitem.entity;

public record WorkItemFilter(
        Long syncConfigId,
        String workItemType,
        String state,
        String assignedTo,
        String query,
        String iterationPath,
        String sortBy,
        String sortDir,
        Integer limit,
        Integer offset
) {}
