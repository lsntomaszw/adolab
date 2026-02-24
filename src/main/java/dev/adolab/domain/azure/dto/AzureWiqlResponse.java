package dev.adolab.domain.azure.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AzureWiqlResponse(
        String queryType,
        List<WorkItemReference> workItems,
        List<WorkItemRelation> workItemRelations
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record WorkItemReference(int id, String url) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record WorkItemRelation(
            WorkItemReference source,
            WorkItemReference target,
            String rel
    ) {}
}
