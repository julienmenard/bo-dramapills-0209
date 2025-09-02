/*
  # Product Management Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `category` (text)
      - `status` (text, active/inactive/draft)
      - `price` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, foreign key to auth.users)

    - `product_features`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `feature_name` (text, required)
      - `feature_value` (text)
      - `feature_type` (text, text/number/boolean/date)
      - `is_required` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading product data

  3. Indexes
    - Add indexes for better query performance on frequently accessed columns
*/

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'general',
  status text DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
  price numeric(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Product features table
CREATE TABLE IF NOT EXISTS product_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  feature_value text DEFAULT '',
  feature_type text DEFAULT 'text' CHECK (feature_type IN ('text', 'number', 'boolean', 'date')),
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can read all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Product features policies
CREATE POLICY "Users can read all product features"
  ON product_features
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage features for own products"
  ON product_features
  FOR ALL
  TO authenticated
  USING (
    product_id IN (
      SELECT id FROM products WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM products WHERE created_by = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_product_features_product_id ON product_features(product_id);
CREATE INDEX IF NOT EXISTS idx_product_features_display_order ON product_features(product_id, display_order);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_features_updated_at
  BEFORE UPDATE ON product_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();