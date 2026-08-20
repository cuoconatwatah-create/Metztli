-- ─────────────────────────────────────────────────────────
-- Metztli 2.0 — Supabase PostgreSQL Schema
-- ─────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Directorio comunitario de emergencias
CREATE TABLE IF NOT EXISTS directory_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  municipality TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Foro anónimo
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_uuid TEXT UNIQUE NOT NULL, -- To prevent duplicate syncs
  alias TEXT NOT NULL,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) -- Optional: if using anonymous auth
);

-- Setup Row Level Security (RLS)
ALTER TABLE directory_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read the directory
CREATE POLICY "Public Directory Read" ON directory_contacts FOR SELECT USING (true);

-- Everyone can read forum posts
CREATE POLICY "Public Forum Read" ON forum_posts FOR SELECT USING (true);

-- Authenticated (even anonymous) users can insert forum posts
CREATE POLICY "Insert Forum Posts" ON forum_posts FOR INSERT WITH CHECK (true);

-- Registro de ciclo de la usuaria (Brújula Lunar)
CREATE TABLE IF NOT EXISTS user_cycle_logs (
  log_id SERIAL PRIMARY KEY,
  local_uuid TEXT UNIQUE NOT NULL, -- Para sincronización offline-first
  date_logged DATE NOT NULL,
  flow_intensity TEXT CHECK (flow_intensity IN ('light', 'medium', 'heavy')),
  cramps_level INTEGER CHECK (cramps_level >= 0 AND cramps_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 5),
  mood_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) -- Optional: if using auth
);

-- RLS for user_cycle_logs
ALTER TABLE user_cycle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own cycle logs" ON user_cycle_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cycle logs" ON user_cycle_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cycle logs" ON user_cycle_logs FOR UPDATE USING (auth.uid() = user_id);