package dev.adolab.domain.sync;

import dev.adolab.domain.workitem.entity.SyncConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class StartupSyncRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupSyncRunner.class);

    private final SyncService syncService;

    public StartupSyncRunner(SyncService syncService) {
        this.syncService = syncService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        Thread.ofVirtual().name("startup-sync").start(() -> {
            try {
                log.info("Starting automatic sync on application startup...");
                SyncConfig config = syncService.getOrCreateDefaultConfig();
                SyncResult result = syncService.sync(config.id());
                log.info("Startup sync completed: {} items synced ({} added, {} updated, {} deleted), {} comments, duration: {}",
                        result.itemsSynced(), result.itemsAdded(), result.itemsUpdated(),
                        result.itemsDeleted(), result.commentsSynced(), result.duration());
            } catch (Exception e) {
                log.error("Startup sync failed: {}", e.getMessage(), e);
            }
        });
    }
}
