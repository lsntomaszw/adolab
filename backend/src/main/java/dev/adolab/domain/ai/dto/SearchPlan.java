package dev.adolab.domain.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record SearchPlan(
        @JsonProperty("response_type") String responseType,
        @JsonProperty("semantic_query") String semanticQuery,
        SearchFilters filters,
        String sort,
        String explanation
) {
    public record SearchFilters(
            List<String> states,
            @JsonProperty("not_states") List<String> notStates,
            List<String> types,
            String assignee,
            @JsonProperty("date_from") String dateFrom,
            @JsonProperty("date_to") String dateTo,
            @JsonProperty("staleness_days") Integer stalenessDays
    ) {}
}
