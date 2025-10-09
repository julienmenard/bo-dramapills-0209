/*
  # Add translation status and batch translation support

  1. Changes
    - Add `translation_status` column to track auto vs manual translations
    - Add `batch_id` column to group translations created together
    - Add indexes for better performance
    - Add default values for existing records

  2. Translation Status Types
    - 'auto' - Automatically translated
    - 'manual' - Manually created or edited
    - 'pending' - Waiting for translation

  3. Indexes
    - Add index for translation_status for filtering
    - Add index for batch_id for batch operations
*/

-- Add new columns to gamification_event_translations table
ALTER TABLE gamification_event_translations 
ADD COLUMN translation_status text DEFAULT 'manual' CHECK (translation_status IN ('auto', 'manual', 'pending')),
ADD COLUMN batch_id uuid DEFAULT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_translation_status ON gamification_event_translations(translation_status);
CREATE INDEX IF NOT EXISTS idx_batch_id ON gamification_event_translations(batch_id);
CREATE INDEX IF NOT EXISTS idx_event_language ON gamification_event_translations(event_id, language_code);

-- Update existing translations to manual status
UPDATE gamification_event_translations 
SET translation_status = 'manual' 
WHERE translation_status IS NULL;