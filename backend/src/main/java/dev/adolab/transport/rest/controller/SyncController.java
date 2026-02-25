package dev.adolab.transport.rest.controller;

import dev.adolab.config.AzureDevOpsProperties;
import dev.adolab.domain.sync.SyncResult;
import dev.adolab.domain.sync.SyncService;
import dev.adolab.domain.workitem.entity.SyncConfig;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final SyncService syncService;
    private final AzureDevOpsProperties azureProps;

    public SyncController(SyncService syncService, AzureDevOpsProperties azureProps) {
        this.syncService = syncService;
        this.azureProps = azureProps;
    }

    @GetMapping("/config")
    public SyncConfig getConfig() {
        return syncService.getOrCreateDefaultConfig();
    }

    @GetMapping("/azure-info")
    public Map<String, String> getAzureInfo() {
        return Map.of(
                "organization", azureProps.organization(),
                "project", azureProps.project(),
                "baseUrl", azureProps.baseUrl()
        );
    }

    @PostMapping("/execute")
    public ResponseEntity<SyncResult> execute() {
        SyncConfig config = syncService.getOrCreateDefaultConfig();
        SyncResult result = syncService.sync(config.id());
        return ResponseEntity.ok(result);
    }
}
