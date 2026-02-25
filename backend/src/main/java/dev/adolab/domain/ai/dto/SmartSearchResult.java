package dev.adolab.domain.ai.dto;

import dev.adolab.domain.workitem.entity.WorkItem;

import java.util.List;

public record SmartSearchResult(
        String responseType,
        List<WorkItem> items,
        String narrative,
        String explanation
) {
    public static SmartSearchResult list(List<WorkItem> items, String explanation) {
        return new SmartSearchResult("list", items, null, explanation);
    }

    public static SmartSearchResult narrative(List<WorkItem> items, String narrative, String explanation) {
        return new SmartSearchResult("narrative", items, narrative, explanation);
    }
}
