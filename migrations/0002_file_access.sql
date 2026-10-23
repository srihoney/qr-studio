-- Apply ONCE to the existing Phase 3 D1 database before deploying this release.
-- Existing uploads remain downloadable, while new uploads support a chosen access mode.
ALTER TABLE uploads ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'download' CHECK(access_mode IN ('view','download'));
ALTER TABLE uploads ADD COLUMN delete_token_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_uploads_delete_token ON uploads(delete_token_hash);
