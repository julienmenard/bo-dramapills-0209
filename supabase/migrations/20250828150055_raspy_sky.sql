/*
  # Add category_position field to event_categories table

  1. Changes
    - Add `category_position` column to `event_categories` table
    - Set default value to 0
    - Add index for better performance when ordering by position

  2. Notes
    - This field will be used to control the display order of categories
    - Existing records will get default position of 0
*/

-- Add category_position column to event_categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_categories' AND column_name = 'category_position'
  ) THEN
    ALTER TABLE event_categories ADD COLUMN category_position integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add index for better performance when ordering by position
CREATE INDEX IF NOT EXISTS idx_event_categories_position ON event_categories(category_position);