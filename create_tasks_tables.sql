
-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
    priority TEXT DEFAULT 'normal',
    is_public BOOLEAN DEFAULT false,
    creator_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS public.task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for Tasks
-- Visible if Public OR Created by User OR User is Assigned
CREATE POLICY "Tasks are visible to creator, assignee, or if public" ON public.tasks
    FOR SELECT
    USING (
        is_public = true
        OR creator_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.task_assignments
            WHERE task_id = tasks.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Tasks can be inserted by authenticated users" ON public.tasks
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tasks can be updated by creator or assignee" ON public.tasks
    FOR UPDATE
    USING (
        creator_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.task_assignments
            WHERE task_id = tasks.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Tasks can be deleted by creator" ON public.tasks
    FOR DELETE
    USING (creator_id = auth.uid());


-- Policies for Assignments
-- Visible if linked task is visible (simplify to authenticated for now or link logic)
CREATE POLICY "Assignments visible to authenticated users" ON public.task_assignments
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Assignments manaegable by task creator or self" ON public.task_assignments
    FOR ALL
    USING (
        auth.role() = 'authenticated' -- Simplify for MVP: Any auth user can assign for now, or restrict later
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON public.tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON public.task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON public.task_assignments(task_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignments;
