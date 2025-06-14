-- ========== conversations ==========
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ========== messages ==========
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    model_used TEXT,
    token_usage INTEGER,
    response_time_ms INTEGER,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ========== message_images ==========
CREATE TABLE IF NOT EXISTS message_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ========== message_documents ==========
CREATE TABLE IF NOT EXISTS message_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    name TEXT,
    file_type TEXT,
    size INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ========== user_preferences ==========
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    display_name TEXT,
    occupation TEXT,
    traits TEXT[] DEFAULT '{}',
    additional_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ========== Indexes ==========
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_images_message_id ON message_images(message_id);
CREATE INDEX IF NOT EXISTS idx_message_documents_message_id ON message_documents(message_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ========== Auto-update updated_at ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON conversations;
CREATE TRIGGER trigger_update_conversation_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== RLS Enable ==========
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ========== RLS Policies ==========
-- conversations
CREATE POLICY select_own_conversations ON conversations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_conversations ON conversations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_conversations ON conversations
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_own_conversations ON conversations
FOR DELETE USING (auth.uid() = user_id);

-- messages
CREATE POLICY select_own_messages ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY insert_own_messages ON messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- message_images
CREATE POLICY access_own_message_images ON message_images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON messages.conversation_id = conversations.id
    WHERE messages.id = message_images.message_id
    AND conversations.user_id = auth.uid()
  )
);

-- message_documents
CREATE POLICY access_own_message_documents ON message_documents
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON messages.conversation_id = conversations.id
    WHERE messages.id = message_documents.message_id
    AND conversations.user_id = auth.uid()
  )
);

-- user_preferences
CREATE POLICY select_own_user_preferences ON user_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_user_preferences ON user_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_user_preferences ON user_preferences
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_own_user_preferences ON user_preferences
FOR DELETE USING (auth.uid() = user_id);

-- ========== Storage Buckets ==========
-- Create bucket for generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- ========== Storage Policies ==========
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'generated-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to images
CREATE POLICY "Public read access for generated images" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-images');

-- Allow users to delete their own images (for cleanup)
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'generated-images' 
  AND auth.role() = 'authenticated'
);

-- ========== Update message_images table ==========
-- Add comment to clarify that image_url now stores public URLs from Supabase Storage
COMMENT ON COLUMN message_images.image_url IS 'Public URL from Supabase Storage bucket (no longer base64 data)';
