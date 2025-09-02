/*
  # Create event_categories table

  1. New Tables
    - `event_categories`
      - `id` (uuid, primary key)
      - `name` (text, required, unique)
      - `description` (text, optional)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `event_categories` table
    - Add policy for public read access
    - Add policy for service role full access

  3. Triggers
    - Add trigger to automatically update `updated_at` field
*/

-- Create the event_categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read event categories"
  ON event_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage event categories"
  ON event_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_event_categories_updated_at
  BEFORE UPDATE ON event_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_event_categories_updated_at();

-- Insert some default categories
INSERT INTO event_categories (name, description) VALUES
  ('engagement', 'User engagement related events'),
  ('achievement', 'Achievement and milestone events'),
  ('social', 'Social interaction events'),
  ('content', 'Content consumption events'),
  ('daily', 'Daily activity events')
ON CONFLICT (name) DO NOTHING;