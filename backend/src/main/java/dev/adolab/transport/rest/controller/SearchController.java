package dev.adolab.transport.rest.controller;

import dev.adolab.domain.ai.EmbeddingService;
import dev.adolab.domain.ai.SearchService;
import dev.adolab.domain.ai.dao.EmbeddingDao;
import dev.adolab.domain.ai.dto.EmbeddingSummary;
import dev.adolab.domain.ai.dto.SmartSearchRequest;
import dev.adolab.domain.ai.dto.SmartSearchResult;
import dev.adolab.domain.sync.SyncService;
import dev.adolab.domain.workitem.dao.WorkItemCommentDao;
import dev.adolab.domain.workitem.dao.WorkItemDao;
import dev.adolab.domain.workitem.entity.WorkItem;
import dev.adolab.domain.workitem.entity.WorkItemComment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private static final Logger log = LoggerFactory.getLogger(SearchController.class);

    private final SearchService searchService;
    private final SyncService syncService;
    private final EmbeddingService embeddingService;
    private final EmbeddingDao embeddingDao;
    private final WorkItemDao workItemDao;
    private final WorkItemCommentDao commentDao;

    public SearchController(SearchService searchService, SyncService syncService,
                            EmbeddingService embeddingService, EmbeddingDao embeddingDao,
                            WorkItemDao workItemDao, WorkItemCommentDao commentDao) {
        this.searchService = searchService;
        this.syncService = syncService;
        this.embeddingService = embeddingService;
        this.embeddingDao = embeddingDao;
        this.workItemDao = workItemDao;
        this.commentDao = commentDao;
    }

    @PostMapping
    public SmartSearchResult search(@RequestBody SmartSearchRequest request) {
        Long syncConfigId = syncService.getOrCreateDefaultConfig().id();
        return searchService.smartSearch(request.query(), syncConfigId);
    }

    @PostMapping("/reindex")
    public Map<String, Object> reindex() {
        Long syncConfigId = syncService.getOrCreateDefaultConfig().id();
        List<WorkItem> allItems = workItemDao.findBySyncConfigId(syncConfigId);

        int processed = 0;
        int failed = 0;

        for (WorkItem item : allItems) {
            try {
                List<WorkItemComment> comments = commentDao.findByWorkItemId(item.id(), syncConfigId);
                embeddingService.generateForWorkItem(item, comments);
                processed++;
                if (processed % 10 == 0) {
                    log.info("Reindex progress: {}/{}", processed, allItems.size());
                }
            } catch (Exception e) {
                log.warn("Failed to generate embedding for work item {}: {}", item.id(), e.getMessage());
                failed++;
            }
        }

        log.info("Reindex complete: processed={}, failed={}, total={}", processed, failed, allItems.size());
        return Map.of(
                "processed", processed,
                "failed", failed,
                "total", allItems.size()
        );
    }

    @GetMapping("/summary/{workItemId}")
    public ResponseEntity<EmbeddingSummary> getSummary(@PathVariable Integer workItemId) {
        Long syncConfigId = syncService.getOrCreateDefaultConfig().id();
        EmbeddingSummary summary = embeddingDao.findByWorkItemId(workItemId, syncConfigId);
        return summary != null ? ResponseEntity.ok(summary) : ResponseEntity.notFound().build();
    }

    @PostMapping("/refresh/{workItemId}")
    public ResponseEntity<EmbeddingSummary> refreshEmbedding(@PathVariable Integer workItemId) {
        Long syncConfigId = syncService.getOrCreateDefaultConfig().id();
        WorkItem item = workItemDao.findById(workItemId, syncConfigId);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }

        List<WorkItemComment> comments = commentDao.findByWorkItemId(workItemId, syncConfigId);
        embeddingService.generateForWorkItem(item, comments);

        EmbeddingSummary summary = embeddingDao.findByWorkItemId(workItemId, syncConfigId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        Long syncConfigId = syncService.getOrCreateDefaultConfig().id();
        int embeddingCount = embeddingDao.countBySyncConfigId(syncConfigId);
        List<Integer> allIds = workItemDao.findAllIds(syncConfigId);
        return Map.of(
                "embeddingsCount", embeddingCount,
                "workItemsCount", allIds.size(),
                "coverage", allIds.isEmpty() ? 0 : (embeddingCount * 100 / allIds.size()) + "%"
        );
    }
}
