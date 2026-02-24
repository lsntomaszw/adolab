package dev.adolab.transport.rest.controller;

import dev.adolab.domain.sync.SyncResult;
import dev.adolab.domain.sync.SyncService;
import dev.adolab.domain.workitem.entity.SyncConfig;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final SyncService syncService;

    public SyncController(SyncService syncService) {
        this.syncService = syncService;
    }

    @GetMapping("/config")
    public SyncConfig getConfig() {
        return syncService.getOrCreateDefaultConfig();
    }

    @PostMapping("/execute")
    public ResponseEntity<SyncResult> execute() {
        SyncConfig config = syncService.getOrCreateDefaultConfig();
        SyncResult result = syncService.sync(config.id());
        return ResponseEntity.ok(result);
    }
}
