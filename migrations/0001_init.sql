CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL CHECK(size>0 AND size<=5242880),
  creator_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uploads_expires ON uploads(expires_at);
CREATE INDEX IF NOT EXISTS idx_uploads_creator ON uploads(creator_hash,created_at);
CREATE TABLE IF NOT EXISTS contacts_rate (id TEXT PRIMARY KEY NOT NULL,sender_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_contacts_sender ON contacts_rate(sender_hash,created_at);
