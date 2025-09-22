/*
  # Add free episode configuration to trouple management

  1. New Columns
    - `free_episodes_count` (integer) - Number of free episodes (0-100)
    - `free_episode_price_coins` (integer) - Price in coins for free episodes
  
  2. Changes
    - Add columns to campaign_countries_languages table
    - Set default values for existing records
    - Add check constraints for valid ranges
*/

-- Add new columns to campaign_countries_languages table
ALTER TABLE campaign_countries_languages 
ADD COLUMN free_episodes_count integer DEFAULT 3 NOT NULL,
ADD COLUMN free_episode_price_coins integer DEFAULT 0 NOT NULL;

-- Add check constraints to ensure valid ranges
ALTER TABLE campaign_countries_languages 
ADD CONSTRAINT free_episodes_count_range CHECK (free_episodes_count >= 0 AND free_episodes_count <= 100),
ADD CONSTRAINT free_episode_price_coins_range CHECK (free_episode_price_coins >= 0);

-- Add indexes for better performance
CREATE INDEX idx_campaign_countries_languages_free_episodes ON campaign_countries_languages(free_episodes_count);
CREATE INDEX idx_campaign_countries_languages_free_episode_price ON campaign_countries_languages(free_episode_price_coins);

-- Update existing records with default values
UPDATE campaign_countries_languages 
SET free_episodes_count = 3, free_episode_price_coins = 0 
WHERE free_episodes_count IS NULL OR free_episode_price_coins IS NULL;