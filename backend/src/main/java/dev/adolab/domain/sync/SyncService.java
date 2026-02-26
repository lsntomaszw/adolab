package dev.adolab.domain.sync;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.adolab.domain.azure.AzureDevOpsClient;
import dev.adolab.domain.azure.dto.AzureCommentListResponse;
import dev.adolab.domain.azure.dto.AzureWiqlResponse;
import dev.adolab.domain.azure.dto.AzureWorkItemResponse;
import dev.adolab.domain.workitem.dao.SyncConfigDao;
import dev.adolab.domain.workitem.dao.WorkItemCommentDao;
import dev.adolab.domain.workitem.dao.WorkItemDao;
import dev.adolab.domain.workitem.entity.SyncConfig;
import dev.adolab.domain.workitem.entity.WorkItem;
import dev.adolab.domain.workitem.entity.WorkItemComment;
import dev.adolab.domain.ai.EmbeddingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import dev.adolab.config.AzureDevOpsProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final AzureDevOpsClient azureClient;
    private final AzureDevOpsProperties azureProps;
    private final SyncConfigDao syncConfigDao;
    private final WorkItemDao workItemDao;
    private final WorkItemCommentDao commentDao;
    private final ObjectMapper objectMapper;
    private final EmbeddingService embeddingService;

    public SyncService(AzureDevOpsClient azureClient,
                       AzureDevOpsProperties azureProps,
                       SyncConfigDao syncConfigDao,
                       WorkItemDao workItemDao,
                       WorkItemCommentDao commentDao,
                       ObjectMapper objectMapper,
                       EmbeddingService embeddingService) {
        this.azureClient = azureClient;
        this.azureProps = azureProps;
        this.syncConfigDao = syncConfigDao;
        this.workItemDao = workItemDao;
        this.commentDao = commentDao;
        this.objectMapper = objectMapper;
        this.embeddingService = embeddingService;
    }

    public SyncConfig getOrCreateDefaultConfig() {
        List<SyncConfig> configs = syncConfigDao.findAll();
        if (!configs.isEmpty()) {
            return configs.getFirst();
        }
        String areaPath = azureProps.areaPath();
        if (areaPath == null || areaPath.isBlank()) {
            throw new IllegalStateException("azure.devops.area-path is not configured in application.yml");
        }
        syncConfigDao.insert(areaPath, areaPath);
        return syncConfigDao.findAll().getFirst();
    }

    @Transactional
    public SyncResult sync(Long syncConfigId) {
        long startTime = System.currentTimeMillis();
        SyncConfig config = syncConfigDao.findById(syncConfigId);
        if (config == null) {
            throw new IllegalArgumentException("Sync config not found: " + syncConfigId);
        }

        String org = azureProps.organization();
        String project = azureProps.project();

        // Step 1: Get all work item IDs under the area path
        Set<Integer> azureIds = fetchWorkItemIdsByAreaPath(org, project, config.areaPath());
        log.info("Found {} work items under area path '{}'", azureIds.size(), config.areaPath());

        boolean isIncremental = config.lastSynced() != null;
        int itemsAdded = 0;
        int itemsUpdated = 0;
        int itemsDeleted = 0;
        int commentsSynced = 0;

        log.info("Sync mode: {} (lastSynced={})", isIncremental ? "INCREMENTAL" : "FULL", config.lastSynced());

        if (isIncremental) {
            // Incremental sync
            Set<Integer> existingIds = new HashSet<>(workItemDao.findAllIds(syncConfigId));
            log.info("Existing items in DB: {}", existingIds.size());

            // Detect new items
            Set<Integer> newIds = new HashSet<>(azureIds);
            newIds.removeAll(existingIds);

            // Detect deleted items
            Set<Integer> deletedIds = new HashSet<>(existingIds);
            deletedIds.removeAll(azureIds);

            // Detect changed items via watermark comparison
            Set<Integer> changedIds = new HashSet<>();
            if (!existingIds.isEmpty()) {
                List<Integer> existingInAzure = new ArrayList<>(existingIds);
                existingInAzure.retainAll(azureIds);
                long wmStart = System.currentTimeMillis();
                changedIds = detectChangedByWatermark(org, project, existingInAzure, syncConfigId);
                log.info("Watermark check: {} of {} items changed (took {}ms)",
                        changedIds.size(), existingInAzure.size(), System.currentTimeMillis() - wmStart);
            }

            log.info("Incremental summary: new={}, changed={}, deleted={}", newIds.size(), changedIds.size(), deletedIds.size());

            // Fetch and upsert changed + new items
            Set<Integer> toFetch = new HashSet<>();
            toFetch.addAll(newIds);
            toFetch.addAll(changedIds);

            if (!toFetch.isEmpty()) {
                List<AzureWorkItemResponse> items = azureClient.getWorkItems(
                        org, project, new ArrayList<>(toFetch));
                Map<Integer, WorkItem> syncedItems = new HashMap<>();
                for (AzureWorkItemResponse item : items) {
                    WorkItem wi = mapWorkItem(item, syncConfigId);
                    workItemDao.upsert(wi);
                    syncedItems.put(wi.id(), wi);
                }
                itemsAdded = newIds.size();
                itemsUpdated = changedIds.size();

                // Sync comments + generate embeddings for changed items
                for (Integer itemId : toFetch) {
                    List<WorkItemComment> comments = syncCommentsForItemAndReturn(org, project, itemId, syncConfigId);
                    commentsSynced += comments.size();
                    generateEmbeddingSafe(syncedItems.get(itemId), comments);
                }
            }

            // Delete removed items
            if (!deletedIds.isEmpty()) {
                for (Integer deletedId : deletedIds) {
                    commentDao.deleteByWorkItemId(deletedId, syncConfigId);
                }
                workItemDao.deleteByIds(new ArrayList<>(deletedIds), syncConfigId);
                itemsDeleted = deletedIds.size();
            }

        } else {
            // Full sync
            List<AzureWorkItemResponse> items = azureClient.getWorkItems(
                    org, project, new ArrayList<>(azureIds));

            Map<Integer, WorkItem> syncedItems = new HashMap<>();
            for (AzureWorkItemResponse item : items) {
                WorkItem wi = mapWorkItem(item, syncConfigId);
                workItemDao.upsert(wi);
                syncedItems.put(wi.id(), wi);
            }
            itemsAdded = items.size();

            // Sync all comments + generate embeddings
            for (Integer itemId : azureIds) {
                List<WorkItemComment> comments = syncCommentsForItemAndReturn(org, project, itemId, syncConfigId);
                commentsSynced += comments.size();
                generateEmbeddingSafe(syncedItems.get(itemId), comments);
            }
        }

        // Update last synced
        syncConfigDao.updateLastSynced(syncConfigId, LocalDateTime.now());

        long duration = System.currentTimeMillis() - startTime;
        String durationStr = String.format("%.1fs", duration / 1000.0);

        log.info("Sync completed for config {}: added={}, updated={}, deleted={}, comments={}, duration={}",
                syncConfigId, itemsAdded, itemsUpdated, itemsDeleted, commentsSynced, durationStr);

        return new SyncResult(
                syncConfigId, "completed",
                itemsAdded + itemsUpdated, itemsAdded, itemsUpdated, itemsDeleted,
                commentsSynced, durationStr
        );
    }

    private Set<Integer> fetchWorkItemIdsByAreaPath(String org, String project, String areaPath) {
        String wiql = String.format("""
                SELECT [System.Id] FROM WorkItems
                WHERE [System.AreaPath] UNDER '%s'
                """, areaPath.replace("'", "''"));

        AzureWiqlResponse response = azureClient.queryWiql(org, project, wiql);
        Set<Integer> ids = new HashSet<>();

        if (response.workItems() != null) {
            for (var wi : response.workItems()) {
                ids.add(wi.id());
            }
        }

        return ids;
    }

    private Set<Integer> detectChangedByWatermark(String org, String project,
                                                   List<Integer> itemIds,
                                                   Long syncConfigId) {
        Set<Integer> changedIds = new HashSet<>();
        List<AzureWorkItemResponse> lightweight = azureClient.getWorkItemsLightweight(
                org, project, itemIds);

        for (AzureWorkItemResponse azureItem : lightweight) {
            Integer azureWatermark = getIntField(azureItem.fields(), "System.Watermark");
            WorkItem local = workItemDao.findById(azureItem.id(), syncConfigId);
            if (local == null || local.watermark() == null
                    || !Objects.equals(local.watermark(), azureWatermark)) {
                changedIds.add(azureItem.id());
            }
        }

        log.info("Watermark detail: {} of {} items detected as changed", changedIds.size(), itemIds.size());
        return changedIds;
    }

    private List<WorkItemComment> syncCommentsForItemAndReturn(String org, String project,
                                                                  int workItemId, Long syncConfigId) {
        try {
            AzureCommentListResponse response = azureClient.getWorkItemComments(
                    org, project, workItemId);
            if (response == null || response.comments() == null || response.comments().isEmpty()) {
                return List.of();
            }

            List<WorkItemComment> comments = new ArrayList<>();
            for (AzureCommentListResponse.AzureComment ac : response.comments()) {
                WorkItemComment comment = mapComment(ac, workItemId, syncConfigId);
                commentDao.upsert(comment);
                comments.add(comment);
            }
            return comments;
        } catch (Exception e) {
            log.warn("Failed to sync comments for work item {}: {}", workItemId, e.getMessage());
            return List.of();
        }
    }

    private void generateEmbeddingSafe(WorkItem item, List<WorkItemComment> comments) {
        if (item == null) return;
        try {
            embeddingService.generateForWorkItem(item, comments);
        } catch (Exception e) {
            log.warn("Failed to generate embedding for work item {}: {}", item.id(), e.getMessage());
        }
    }

    private WorkItem mapWorkItem(AzureWorkItemResponse response, Long syncConfigId) {
        Map<String, Object> fields = response.fields();
        String rawFields = null;
        try {
            rawFields = objectMapper.writeValueAsString(fields);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize raw fields for work item {}", response.id());
        }

        // Extract parent ID from relations
        Integer parentId = null;
        if (response.relations() != null) {
            for (var rel : response.relations()) {
                if ("System.LinkTypes.Hierarchy-Reverse".equals(rel.rel())) {
                    // Parent link: URL ends with /workItems/{id}
                    String url = rel.url();
                    if (url != null) {
                        String[] parts = url.split("/");
                        try {
                            parentId = Integer.parseInt(parts[parts.length - 1]);
                        } catch (NumberFormatException ignored) {}
                    }
                    break;
                }
            }
        }

        return new WorkItem(
                response.id(),
                syncConfigId,
                response.rev(),
                getStringField(fields, "System.Title"),
                getStringField(fields, "System.WorkItemType"),
                getStringField(fields, "System.State"),
                getIdentityDisplayName(fields, "System.AssignedTo"),
                getStringField(fields, "System.Description"),
                getIntField(fields, "Microsoft.VSTS.Common.Priority"),
                getStringField(fields, "System.Tags"),
                getStringField(fields, "System.AreaPath"),
                getStringField(fields, "System.IterationPath"),
                parentId,
                getIntField(fields, "System.Watermark"),
                parseDateTime(fields, "System.CreatedDate"),
                parseDateTime(fields, "System.ChangedDate"),
                getIdentityDisplayName(fields, "System.CreatedBy"),
                getIdentityDisplayName(fields, "System.ChangedBy"),
                rawFields,
                LocalDateTime.now(),
                null
        );
    }

    private WorkItemComment mapComment(AzureCommentListResponse.AzureComment ac,
                                        int workItemId, Long syncConfigId) {
        return new WorkItemComment(
                ac.id(),
                workItemId,
                syncConfigId,
                ac.renderedText() != null && !ac.renderedText().isBlank() ? ac.renderedText() : ac.text(),
                ac.createdBy() != null ? ac.createdBy().displayName() : null,
                parseIsoDateTime(ac.createdDate()),
                ac.modifiedBy() != null ? ac.modifiedBy().displayName() : null,
                parseIsoDateTime(ac.modifiedDate()),
                ac.version(),
                LocalDateTime.now()
        );
    }

    private String getStringField(Map<String, Object> fields, String key) {
        Object val = fields.get(key);
        return val != null ? val.toString() : null;
    }

    @SuppressWarnings("unchecked")
    private String getIdentityDisplayName(Map<String, Object> fields, String key) {
        Object val = fields.get(key);
        if (val instanceof Map) {
            Object displayName = ((Map<String, Object>) val).get("displayName");
            return displayName != null ? displayName.toString() : null;
        }
        return val != null ? val.toString() : null;
    }

    private Integer getIntField(Map<String, Object> fields, String key) {
        Object val = fields.get(key);
        if (val instanceof Number) {
            return ((Number) val).intValue();
        }
        return null;
    }

    private LocalDateTime parseDateTime(Map<String, Object> fields, String key) {
        Object val = fields.get(key);
        if (val == null) return null;
        return parseIsoDateTime(val.toString());
    }

    private LocalDateTime parseIsoDateTime(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return OffsetDateTime.parse(dateStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                    .toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e2) {
                log.warn("Failed to parse date: {}", dateStr);
                return null;
            }
        }
    }
}
