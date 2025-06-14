-- User Preferences Table
-- Stores user personalization settings for AI chat customization
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(50),
    occupation VARCHAR(100),
    traits TEXT[], -- Array of user interests/traits (max 20 items)
    additional_info TEXT, -- Additional context for AI personalization (max 3000 chars)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id to ensure one preference record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create index on updated_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON user_preferences(updated_at);

-- Add row level security (RLS) policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Add constraints for data validation
ALTER TABLE user_preferences
ADD CONSTRAINT check_display_name_length 
CHECK (display_name IS NULL OR char_length(display_name) <= 50);

ALTER TABLE user_preferences
ADD CONSTRAINT check_occupation_length 
CHECK (occupation IS NULL OR char_length(occupation) <= 100);

ALTER TABLE user_preferences
ADD CONSTRAINT check_additional_info_length 
CHECK (additional_info IS NULL OR char_length(additional_info) <= 3000);

ALTER TABLE user_preferences
ADD CONSTRAINT check_traits_array_length 
CHECK (traits IS NULL OR array_length(traits, 1) <= 20);

-- Add comments for documentation
COMMENT ON TABLE user_preferences IS 'Stores user personalization settings for AI chat customization';
COMMENT ON COLUMN user_preferences.user_id IS 'Foreign key to auth.users table';
COMMENT ON COLUMN user_preferences.display_name IS 'Preferred name for AI to use when addressing the user (max 50 chars)';
COMMENT ON COLUMN user_preferences.occupation IS 'User occupation/role for professional context (max 100 chars)';
COMMENT ON COLUMN user_preferences.traits IS 'Array of user interests, hobbies, or personality traits (max 20 items)';
COMMENT ON COLUMN user_preferences.additional_info IS 'Additional context for AI personalization (max 3000 chars)';
COMMENT ON COLUMN user_preferences.created_at IS 'Timestamp when the preference record was created';
COMMENT ON COLUMN user_preferences.updated_at IS 'Timestamp when the preference record was last updated';