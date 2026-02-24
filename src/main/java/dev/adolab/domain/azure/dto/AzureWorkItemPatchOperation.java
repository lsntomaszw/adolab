package dev.adolab.domain.azure.dto;

public record AzureWorkItemPatchOperation(
        String op,
        String path,
        Object value
) {}
