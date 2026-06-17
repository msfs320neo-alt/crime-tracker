-- Run this once in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'crime',
  date        TEXT NOT NULL,
  time        TEXT,
  title       TEXT,
  description TEXT,
  severity    TEXT NOT NULL DEFAULT 'medium',
  lat         FLOAT,
  lng         FLOAT,
  photos      TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_date    ON reports(date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type    ON reports(type);

CREATE TABLE IF NOT EXISTS landmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  lat         FLOAT NOT NULL,
  lng         FLOAT NOT NULL,
  icon        TEXT DEFAULT '📌',
  color       TEXT DEFAULT '#22c55e',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  category   TEXT NOT NULL DEFAULT 'crime',
  color      TEXT DEFAULT '#22c55e',
  icon       TEXT DEFAULT '⚠️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
