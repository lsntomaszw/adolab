ALTER TABLE work_item_embedding
    ADD COLUMN detected_language VARCHAR(10),
    ADD COLUMN translation_en TEXT;
