package dev.adolab.domain.sync;

public record SyncResult(
        Long syncConfigId,
        String status,
        int itemsSynced,
        int itemsAdded,
        int itemsUpdated,
        int itemsDeleted,
        int commentsSynced,
        String duration
) {}
