-- Graduation Invitation System - Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unique_id TEXT UNIQUE NOT NULL,
  companion_limit INTEGER NOT NULL DEFAULT 0,
  confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companions table
CREATE TABLE IF NOT EXISTS companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guests_unique_id ON guests(unique_id);
CREATE INDEX IF NOT EXISTS idx_companions_guest_id ON companions(guest_id);

-- Enable Row Level Security (RLS)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guests table
-- Allow public read access to guests
CREATE POLICY "Allow public read access to guests"
  ON guests
  FOR SELECT
  TO public
  USING (true);

-- Allow public to update their own confirmation status
CREATE POLICY "Allow public to update confirmation"
  ON guests
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for companions table
-- Allow public read access to companions
CREATE POLICY "Allow public read access to companions"
  ON companions
  FOR SELECT
  TO public
  USING (true);

-- Allow public to insert companions
CREATE POLICY "Allow public to insert companions"
  ON companions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to delete companions (for updating companion list)
CREATE POLICY "Allow public to delete companions"
  ON companions
  FOR DELETE
  TO public
  USING (true);
