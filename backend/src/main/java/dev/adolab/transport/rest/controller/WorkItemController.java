package dev.adolab.transport.rest.controller;

import dev.adolab.domain.sync.SyncService;
import dev.adolab.domain.workitem.WorkItemService;
import dev.adolab.domain.workitem.entity.WorkItem;
import dev.adolab.domain.workitem.entity.WorkItemComment;
import dev.adolab.domain.workitem.entity.WorkItemFilter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workitems")
public class WorkItemController {

    private final WorkItemService workItemService;
    private final SyncService syncService;

    public WorkItemController(WorkItemService workItemService, SyncService syncService) {
        this.workItemService = workItemService;
        this.syncService = syncService;
    }

    private Long getDefaultSyncConfigId() {
        return syncService.getOrCreateDefaultConfig().id();
    }

    @GetMapping
    public List<WorkItem> search(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(required = false) String iterationPath,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "changed") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false, defaultValue = "100") Integer limit,
            @RequestParam(required = false, defaultValue = "0") Integer offset
    ) {
        WorkItemFilter filter = new WorkItemFilter(
                getDefaultSyncConfigId(), type, state, assignedTo, q, iterationPath,
                sortBy, sortDir, limit, offset
        );
        return workItemService.search(filter);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkItem> getById(@PathVariable Integer id) {
        WorkItem item = workItemService.getById(id, getDefaultSyncConfigId());
        return item != null ? ResponseEntity.ok(item) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/children")
    public List<WorkItem> getChildren(@PathVariable Integer id) {
        return workItemService.getChildren(id, getDefaultSyncConfigId());
    }

    @GetMapping("/{id}/comments")
    public List<WorkItemComment> getComments(@PathVariable Integer id) {
        return workItemService.getComments(id, getDefaultSyncConfigId());
    }

    @GetMapping("/metadata")
    public Map<String, Object> getMetadata() {
        return workItemService.getMetadata(getDefaultSyncConfigId());
    }

    @GetMapping("/counts")
    public Map<String, Integer> getStateCounts() {
        return workItemService.getStateCounts(getDefaultSyncConfigId());
    }
}
