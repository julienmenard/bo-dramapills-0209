/*
  # Add password hashing function for admin users

  1. Security
    - Creates a secure password hashing function using pgcrypto extension
    - Uses bcrypt algorithm for password hashing
    - Function is security definer to allow proper execution

  2. Function
    - `hash_password(password text)` - Hashes a plain text password using bcrypt
    - Returns the hashed password string
    - Uses default bcrypt cost factor for security
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create password hashing function
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;