-- Migration number: 0001 	 2026-10-08T18:33:40.646Z
CREATE TABLE user_settings (
    user_id TEXT PRIMARY KEY,
    settings TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);