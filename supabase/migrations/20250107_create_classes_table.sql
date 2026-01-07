-- Create classes table to store dynamic class names per school
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    class_type VARCHAR(20) DEFAULT 'Regular',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one class name per location
    UNIQUE(location_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_classes_location_id ON classes(location_id);

-- Add RLS policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read classes
CREATE POLICY "Allow read access to classes" ON classes
    FOR SELECT TO authenticated
    USING (true);

-- Allow admins to manage classes
CREATE POLICY "Allow admin full access to classes" ON classes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Grant permissions
GRANT SELECT ON classes TO authenticated;
GRANT ALL ON classes TO service_role;
