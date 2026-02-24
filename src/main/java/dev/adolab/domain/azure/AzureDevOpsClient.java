package dev.adolab.domain.azure;

import dev.adolab.config.AzureDevOpsProperties;
import dev.adolab.domain.azure.dto.AzureCommentListResponse;
import dev.adolab.domain.azure.dto.AzureWiqlResponse;
import dev.adolab.domain.azure.dto.AzureWorkItemResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class AzureDevOpsClient {

    private static final Logger log = LoggerFactory.getLogger(AzureDevOpsClient.class);

    private final RestClient restClient;
    private final AzureDevOpsProperties props;

    private static final int BATCH_SIZE = 200;

    public AzureDevOpsClient(RestClient azureDevOpsRestClient, AzureDevOpsProperties props) {
        this.restClient = azureDevOpsRestClient;
        this.props = props;
    }

    public AzureWorkItemResponse getWorkItem(String org, String project, int id) {
        String url = props.workItemUrl(org, project, id)
                + "?$expand=relations&api-version=" + props.apiVersion();

        log.debug("GET work item: {}", url);
        return restClient.get()
                .uri(url)
                .retrieve()
                .body(AzureWorkItemResponse.class);
    }

    public List<AzureWorkItemResponse> getWorkItems(String org, String project, List<Integer> ids) {
        return getWorkItems(org, project, ids, null);
    }

    public List<AzureWorkItemResponse> getWorkItems(String org, String project,
                                                     List<Integer> ids, List<String> fields) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        List<AzureWorkItemResponse> allItems = new ArrayList<>();
        for (int i = 0; i < ids.size(); i += BATCH_SIZE) {
            List<Integer> batch = ids.subList(i, Math.min(i + BATCH_SIZE, ids.size()));
            String idsParam = batch.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));

            StringBuilder url = new StringBuilder();
            url.append(props.workItemsUrl(org, project));
            url.append("?ids=").append(idsParam);
            url.append("&$expand=relations");
            if (fields != null && !fields.isEmpty()) {
                url.append("&fields=").append(String.join(",", fields));
            }
            url.append("&api-version=").append(props.apiVersion());

            log.debug("GET work items batch ({} items): {}", batch.size(), url);

            var response = restClient.get()
                    .uri(url.toString())
                    .retrieve()
                    .body(BatchResponse.class);

            if (response != null && response.value() != null) {
                allItems.addAll(response.value());
            }
        }
        return allItems;
    }

    public List<AzureWorkItemResponse> getWorkItemsLightweight(String org, String project,
                                                                List<Integer> ids) {
        return getWorkItems(org, project, ids, List.of("System.Id", "System.Watermark"));
    }

    public AzureWiqlResponse queryWiql(String org, String project, String wiql) {
        String url = props.wiqlUrl(org, project)
                + "?api-version=" + props.apiVersion();

        log.debug("POST WIQL: {}", wiql);
        return restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("query", wiql))
                .retrieve()
                .body(AzureWiqlResponse.class);
    }

    public AzureWiqlResponse queryWiqlLinks(String org, String project, String wiql) {
        String url = props.wiqlUrl(org, project)
                + "?api-version=" + props.apiVersion();

        log.debug("POST WIQL (links): {}", wiql);
        return restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("query", wiql))
                .retrieve()
                .body(AzureWiqlResponse.class);
    }

    public AzureCommentListResponse getWorkItemComments(String org, String project, int workItemId) {
        String url = props.workItemCommentsUrl(org, project, workItemId)
                + "?api-version=" + props.apiVersion() + "-preview.4";

        log.debug("GET comments for work item {}", workItemId);
        return restClient.get()
                .uri(url)
                .retrieve()
                .body(AzureCommentListResponse.class);
    }

    private record BatchResponse(int count, List<AzureWorkItemResponse> value) {}
}
