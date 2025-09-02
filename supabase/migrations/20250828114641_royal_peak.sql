/*
  # Create admin users table for backoffice authentication

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text, encrypted password)
      - `full_name` (text, optional)
      - `role` (text, default 'admin')
      - `is_active` (boolean, default true)
      - `last_login` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `admin_users` table
    - Add policies for authenticated admin users
    - Create secure password hashing function
    - Add login verification function

  3. Initial Data
    - Insert admin user: jmenard@digitalvirgo.com with password "popopo"
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  role text DEFAULT 'admin' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  last_login timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Service role can manage admin users"
  ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_admin_password(email_input text, password_input text)
RETURNS TABLE(user_id uuid, user_email text, user_name text, user_role text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record admin_users%ROWTYPE;
BEGIN
  -- Get user record
  SELECT * INTO user_record
  FROM admin_users
  WHERE email = email_input AND is_active = true;
  
  -- Check if user exists and password matches
  IF user_record.id IS NOT NULL AND user_record.password_hash = crypt(password_input, user_record.password_hash) THEN
    -- Update last login
    UPDATE admin_users 
    SET last_login = now(), updated_at = now()
    WHERE id = user_record.id;
    
    -- Return user info
    RETURN QUERY SELECT 
      user_record.id,
      user_record.email,
      user_record.full_name,
      user_record.role;
  END IF;
  
  -- Return empty if authentication failed
  RETURN;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Insert the admin user
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
  'jmenard@digitalvirgo.com',
  hash_password('popopo'),
  'J. Menard',
  'admin'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);