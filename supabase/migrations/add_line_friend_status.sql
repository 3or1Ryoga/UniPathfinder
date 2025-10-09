-- Add LINE friend status tracking to profiles table
-- This tracks whether the user has added the LINE official account as a friend

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS line_friend_added BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS line_friend_added_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of friend status
CREATE INDEX IF NOT EXISTS idx_profiles_line_friend_added ON profiles(line_friend_added);

-- Add comment for documentation
COMMENT ON COLUMN profiles.line_friend_added IS 'Whether the user has added the LINE official account as a friend';
COMMENT ON COLUMN profiles.line_friend_added_at IS 'Timestamp when the user added the LINE official account as a friend';
