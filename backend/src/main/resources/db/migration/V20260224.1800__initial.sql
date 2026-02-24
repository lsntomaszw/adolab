CREATE TABLE sync_config (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    epic_id     INTEGER NOT NULL,
    org_name    VARCHAR(200) NOT NULL,
    project     VARCHAR(200) NOT NULL,
    last_synced TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE work_item (
    id              INTEGER NOT NULL,
    sync_config_id  BIGINT NOT NULL REFERENCES sync_config(id) ON DELETE CASCADE,
    rev             INTEGER NOT NULL,
    title           VARCHAR(500) NOT NULL,
    work_item_type  VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    assigned_to     VARCHAR(200),
    description     TEXT,
    priority        INTEGER,
    tags            VARCHAR(1000),
    area_path       VARCHAR(500),
    iteration_path  VARCHAR(500),
    parent_id       INTEGER,
    watermark       INTEGER,
    created_date    TIMESTAMP,
    changed_date    TIMESTAMP,
    created_by      VARCHAR(200),
    changed_by      VARCHAR(200),
    raw_fields      JSONB,
    synced_at       TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (id, sync_config_id)
);

CREATE INDEX idx_work_item_sync ON work_item(sync_config_id);
CREATE INDEX idx_work_item_type ON work_item(sync_config_id, work_item_type);
CREATE INDEX idx_work_item_state ON work_item(sync_config_id, state);
CREATE INDEX idx_work_item_parent ON work_item(sync_config_id, parent_id);
CREATE INDEX idx_work_item_assigned ON work_item(sync_config_id, assigned_to);

CREATE TABLE work_item_comment (
    id              INTEGER NOT NULL,
    work_item_id    INTEGER NOT NULL,
    sync_config_id  BIGINT NOT NULL REFERENCES sync_config(id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    created_by      VARCHAR(200),
    created_date    TIMESTAMP,
    modified_by     VARCHAR(200),
    modified_date   TIMESTAMP,
    version         INTEGER,
    synced_at       TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (id, sync_config_id)
);

CREATE INDEX idx_comment_work_item ON work_item_comment(work_item_id, sync_config_id);
