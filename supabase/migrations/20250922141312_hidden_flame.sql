/*
  # Create app settings table

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique) - The setting identifier
      - `setting_value` (jsonb) - The setting value in JSON format
      - `description` (text) - Description of the setting
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for service role to manage settings
    - Add policy for authenticated users to read settings

  3. Default Data
    - Insert default free episodes setting (3 episodes)
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage app settings"
  ON app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read app settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- Insert default free episodes setting
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES (
  'free_episodes_count',
  '{"count": 3}',
  'Number of free episodes per series (episodes with position <= this value will be free)'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);