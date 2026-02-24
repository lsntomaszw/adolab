package dev.adolab.domain.azure.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AzureWorkItemResponse(
        int id,
        int rev,
        Map<String, Object> fields,
        List<AzureRelation> relations
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AzureRelation(
            String rel,
            String url,
            Map<String, Object> attributes
    ) {}
}
