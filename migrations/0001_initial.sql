CREATE TABLE IF NOT EXISTS subscribers (
  chat_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  language TEXT NOT NULL DEFAULT 'en'
    CHECK (language IN ('en', 'hi')),
  active INTEGER NOT NULL DEFAULT 1
    CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscribers_active
  ON subscribers(active);

CREATE TABLE IF NOT EXISTS deliveries (
  chat_id TEXT NOT NULL,
  local_date TEXT NOT NULL,
  verse_key TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chat_id, local_date)
);

CREATE INDEX IF NOT EXISTS idx_deliveries_date
  ON deliveries(local_date);
