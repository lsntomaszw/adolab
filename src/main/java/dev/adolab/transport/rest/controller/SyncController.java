package dev.adolab.transport.rest.controller;

import dev.adolab.domain.sync.SyncResult;
import dev.adolab.domain.sync.SyncService;
import dev.adolab.domain.workitem.dao.SyncConfigDao;
import dev.adolab.domain.workitem.entity.SyncConfig;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final SyncService syncService;
    private final SyncConfigDao syncConfigDao;

    public SyncController(SyncService syncService, SyncConfigDao syncConfigDao) {
        this.syncService = syncService;
        this.syncConfigDao = syncConfigDao;
    }

    @GetMapping
    public List<SyncConfig> list() {
        return syncConfigDao.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SyncConfig> getById(@PathVariable Long id) {
        SyncConfig config = syncConfigDao.findById(id);
        return config != null ? ResponseEntity.ok(config) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody CreateSyncRequest request) {
        syncConfigDao.insert(request.name(), request.epicId(), request.orgName(), request.project());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("status", "created"));
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<SyncResult> execute(@PathVariable Long id) {
        SyncResult result = syncService.sync(id);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        syncConfigDao.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateSyncRequest(
            String name,
            Integer epicId,
            String orgName,
            String project
    ) {}
}
