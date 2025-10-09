-- Add LINE-related columns to profiles table
-- This migration adds columns to store LINE user information for account linking

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS line_user_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS line_display_name TEXT,
ADD COLUMN IF NOT EXISTS line_avatar_url TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.line_user_id IS 'LINE User ID obtained from LINE Login. Must be unique.';
COMMENT ON COLUMN profiles.line_display_name IS 'Display name from LINE profile';
COMMENT ON COLUMN profiles.line_avatar_url IS 'Profile image URL from LINE';

-- Create index on line_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON profiles(line_user_id);
