-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('success', 'error', 'warning', 'info')) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow service role or system functions to insert notifications for users
-- (Initially allowing users to insert for self or others if logical, typically inserts might be from triggers or backend functions, 
-- but for client-side app logic where one user notifies another, we need INSERT policy)
CREATE POLICY "Users can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (true); -- Allow anyone to insert, or restricted to authenticated users. Ideally stricter, but for this app structure 'true' allows user-to-user notifications.

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
