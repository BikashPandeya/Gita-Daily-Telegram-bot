ALTER TABLE subscribers
ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Kathmandu';

ALTER TABLE subscribers
ADD COLUMN morning_time TEXT NOT NULL DEFAULT '08:00';

ALTER TABLE subscribers
ADD COLUMN evening_time TEXT NOT NULL DEFAULT '19:00';

ALTER TABLE subscribers
ADD COLUMN pending_setting TEXT;

-- Preserve existing delivery history.
-- Existing daily deliveries are classified as morning deliveries.
DROP INDEX IF EXISTS idx_deliveries_date;

CREATE TABLE deliveries_new (
  chat_id TEXT NOT NULL,
  local_date TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('morning', 'evening')),
  verse_key TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chat_id, local_date, slot)
);

INSERT INTO deliveries_new (
  chat_id,
  local_date,
  slot,
  verse_key,
  status,
  error,
  updated_at
)
SELECT
  chat_id,
  local_date,
  'morning',
  verse_key,
  status,
  error,
  updated_at
FROM deliveries;

DROP TABLE deliveries;

ALTER TABLE deliveries_new RENAME TO deliveries;

CREATE INDEX IF NOT EXISTS idx_deliveries_date
ON deliveries(local_date);