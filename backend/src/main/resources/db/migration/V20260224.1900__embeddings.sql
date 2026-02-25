CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE work_item_embedding (
    work_item_id   INTEGER NOT NULL,
    sync_config_id BIGINT NOT NULL,
    summary_en     TEXT NOT NULL,
    keywords       TEXT[],
    embedding      vector(1536),
    model_version  VARCHAR(50) DEFAULT 'text-embedding-3-small',
    generated_at   TIMESTAMP DEFAULT now(),
    PRIMARY KEY (work_item_id, sync_config_id),
    FOREIGN KEY (work_item_id, sync_config_id)
        REFERENCES work_item(id, sync_config_id) ON DELETE CASCADE
);
