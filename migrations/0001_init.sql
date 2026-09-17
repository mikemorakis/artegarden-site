CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  event_type TEXT NOT NULL,
  event_date TEXT,
  guests INTEGER,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER NOT NULL REFERENCES inquiries(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  event_date TEXT NOT NULL,
  price_per_person REAL NOT NULL,
  venue_fee REAL NOT NULL,
  guests INTEGER,
  includes TEXT NOT NULL,
  notes TEXT,
  total REAL,
  sent_at TEXT,
  sent_to TEXT
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
