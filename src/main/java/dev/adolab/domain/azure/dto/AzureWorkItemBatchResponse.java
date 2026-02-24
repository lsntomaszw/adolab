package dev.adolab.domain.azure.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AzureWorkItemBatchResponse(
        int count,
        List<AzureWorkItemResponse> value
) {}
