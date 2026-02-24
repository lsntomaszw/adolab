package dev.adolab.transport.rest.controller;

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

    public WorkItemController(WorkItemService workItemService) {
        this.workItemService = workItemService;
    }

    @GetMapping
    public List<WorkItem> search(
            @RequestParam Long syncConfigId,
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
                syncConfigId, type, state, assignedTo, q, iterationPath,
                sortBy, sortDir, limit, offset
        );
        return workItemService.search(filter);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkItem> getById(
            @PathVariable Integer id,
            @RequestParam Long syncConfigId
    ) {
        WorkItem item = workItemService.getById(id, syncConfigId);
        return item != null ? ResponseEntity.ok(item) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/children")
    public List<WorkItem> getChildren(
            @PathVariable Integer id,
            @RequestParam Long syncConfigId
    ) {
        return workItemService.getChildren(id, syncConfigId);
    }

    @GetMapping("/{id}/comments")
    public List<WorkItemComment> getComments(
            @PathVariable Integer id,
            @RequestParam Long syncConfigId
    ) {
        return workItemService.getComments(id, syncConfigId);
    }

    @GetMapping("/metadata")
    public Map<String, Object> getMetadata(@RequestParam Long syncConfigId) {
        return workItemService.getMetadata(syncConfigId);
    }

    @GetMapping("/counts")
    public Map<String, Integer> getStateCounts(@RequestParam Long syncConfigId) {
        return workItemService.getStateCounts(syncConfigId);
    }
}
