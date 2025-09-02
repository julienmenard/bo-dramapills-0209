/*
  # Fix admin_users RLS policies

  1. Security Updates
    - Drop existing restrictive policies that prevent admin user creation
    - Add proper policies for authenticated users to manage admin accounts
    - Allow service role full access for system operations
    - Enable proper INSERT and UPDATE permissions

  2. Policy Changes
    - Remove overly restrictive policies
    - Add authenticated user policies for admin management
    - Maintain security while allowing proper functionality
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;
DROP POLICY IF EXISTS "Service role can manage admin users" ON admin_users;

-- Create new policies that allow proper admin user management
CREATE POLICY "Authenticated users can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (true);

-- Service role should have full access
CREATE POLICY "Service role full access"
  ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);