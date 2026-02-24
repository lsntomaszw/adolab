package dev.adolab.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "azure.devops")
public record AzureDevOpsProperties(
        String organization,
        String project,
        String pat,
        String baseUrl,
        String apiVersion
) {

    public String workItemsUrl(String org, String project) {
        return baseUrl + "/" + org + "/" + project + "/_apis/wit/workitems";
    }

    public String wiqlUrl(String org, String project) {
        return baseUrl + "/" + org + "/" + project + "/_apis/wit/wiql";
    }

    public String workItemUrl(String org, String project, int id) {
        return baseUrl + "/" + org + "/" + project + "/_apis/wit/workitems/" + id;
    }

    public String workItemCommentsUrl(String org, String project, int workItemId) {
        return baseUrl + "/" + org + "/" + project + "/_apis/wit/workitems/" + workItemId + "/comments";
    }
}
