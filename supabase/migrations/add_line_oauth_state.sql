-- Add LINE OAuth state column to profiles table
-- This migration adds a column to store LINE OAuth state for CSRF protection
-- State is stored in DB instead of cookies to handle cross-browser scenarios

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS line_oauth_state TEXT,
ADD COLUMN IF NOT EXISTS line_oauth_state_expires_at TIMESTAMPTZ;

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.line_oauth_state IS 'Temporary state for LINE OAuth CSRF protection. Cleared after use.';
COMMENT ON COLUMN profiles.line_oauth_state_expires_at IS 'Expiration time for the OAuth state (10 minutes from creation)';
