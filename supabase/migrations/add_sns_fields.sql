-- Add SNS and additional profile fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT; -- JSON array of skills
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT; -- JSON array of interests

-- Add index for github_username for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON profiles(github_username);

-- Add comments to describe the fields
COMMENT ON COLUMN profiles.github_username IS 'GitHub username (without @ symbol)';
COMMENT ON COLUMN profiles.twitter_username IS 'Twitter/X username (without @ symbol)';
COMMENT ON COLUMN profiles.linkedin_url IS 'Full LinkedIn profile URL';
COMMENT ON COLUMN profiles.instagram_username IS 'Instagram username (without @ symbol)';
COMMENT ON COLUMN profiles.discord_username IS 'Discord username';
COMMENT ON COLUMN profiles.youtube_url IS 'YouTube channel URL';
COMMENT ON COLUMN profiles.facebook_url IS 'Facebook profile URL';
COMMENT ON COLUMN profiles.portfolio_url IS 'Personal portfolio/website URL';
COMMENT ON COLUMN profiles.bio IS 'User biography/description';
COMMENT ON COLUMN profiles.location IS 'User location (city, country)';
COMMENT ON COLUMN profiles.skills IS 'JSON array of user skills/technologies';
COMMENT ON COLUMN profiles.interests IS 'JSON array of user interests/hobbies';