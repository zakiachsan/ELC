-- Migration: Create parent engagement tracking tables
-- Date: 2025-01-13
-- Tables: parent_sessions, parent_page_views

-- ============================================
-- TABLE 1: parent_sessions
-- Tracks each browsing session (when parent starts using the app)
-- ============================================
CREATE TABLE IF NOT EXISTS parent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Month tracking (for monthly grouping/filtering)
  session_month DATE NOT NULL,

  -- Optional: user agent, device info (for future use)
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for parent_sessions
CREATE INDEX IF NOT EXISTS idx_parent_sessions_parent ON parent_sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_sessions_month ON parent_sessions(session_month);
CREATE INDEX IF NOT EXISTS idx_parent_sessions_parent_month ON parent_sessions(parent_id, session_month);

-- ============================================
-- TABLE 2: parent_page_views
-- Tracks each page visited within a session
-- ============================================
CREATE TABLE IF NOT EXISTS parent_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES parent_sessions(id) ON DELETE CASCADE,

  -- Page information
  page_name VARCHAR(50) NOT NULL,  -- 'dashboard', 'schedule', 'activity', 'exam-progress', 'teacher-review', 'feedback'
  page_path VARCHAR(255),          -- Full path like '/parent/schedule'

  -- Timestamp
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Month tracking (denormalized for easier queries)
  view_month DATE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for parent_page_views
CREATE INDEX IF NOT EXISTS idx_parent_page_views_parent ON parent_page_views(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_page_views_session ON parent_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_parent_page_views_month ON parent_page_views(view_month);
CREATE INDEX IF NOT EXISTS idx_parent_page_views_parent_month ON parent_page_views(parent_id, view_month);
CREATE INDEX IF NOT EXISTS idx_parent_page_views_page ON parent_page_views(page_name);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on both tables
ALTER TABLE parent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_page_views ENABLE ROW LEVEL SECURITY;

-- parent_sessions policies
CREATE POLICY "Parents can insert their own sessions" ON parent_sessions
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can view their own sessions" ON parent_sessions
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Admins can view all sessions" ON parent_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- parent_page_views policies
CREATE POLICY "Parents can insert their own page views" ON parent_page_views
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can view their own page views" ON parent_page_views
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Admins can view all page views" ON parent_page_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
