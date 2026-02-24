package dev.adolab.domain.azure.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AzureCommentListResponse(
        int totalCount,
        int count,
        List<AzureComment> comments,
        String continuationToken
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AzureComment(
            int id,
            int workItemId,
            String text,
            String renderedText,
            AzureIdentity createdBy,
            String createdDate,
            AzureIdentity modifiedBy,
            String modifiedDate,
            int version
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AzureIdentity(
            String displayName,
            String uniqueName,
            String id
    ) {}
}
