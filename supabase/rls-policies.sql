-- =====================================================
-- ELC Management System - Row Level Security Policies
-- Run this AFTER schema.sql
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get user role from profiles
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get linked student ID for parent
CREATE OR REPLACE FUNCTION get_linked_student_id(parent_id UUID)
RETURNS UUID AS $$
  SELECT linked_student_id FROM profiles WHERE id = parent_id AND role = 'PARENT';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role(auth.uid()) = 'ADMIN';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
  SELECT get_user_role(auth.uid()) = 'TEACHER';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
  SELECT get_user_role(auth.uid()) = 'STUDENT';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is parent
CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
  SELECT get_user_role(auth.uid()) = 'PARENT';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE olympiads ENABLE ROW LEVEL SECURITY;
ALTER TABLE olympiad_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE olympiad_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_of_the_month ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kahoot_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oral_test_slots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_profiles" ON profiles
  FOR ALL USING (is_admin());

-- Teacher: View students, parents, and self
CREATE POLICY "teacher_view_profiles" ON profiles
  FOR SELECT USING (
    is_teacher() AND (
      id = auth.uid() OR
      role IN ('STUDENT', 'PARENT')
    )
  );

-- Teacher: Update own profile
CREATE POLICY "teacher_update_self" ON profiles
  FOR UPDATE USING (
    is_teacher() AND id = auth.uid()
  );

-- Student: View and update self
CREATE POLICY "student_view_self" ON profiles
  FOR SELECT USING (
    is_student() AND id = auth.uid()
  );

CREATE POLICY "student_update_self" ON profiles
  FOR UPDATE USING (
    is_student() AND id = auth.uid()
  );

-- Parent: View self and linked student
CREATE POLICY "parent_view_profiles" ON profiles
  FOR SELECT USING (
    is_parent() AND (
      id = auth.uid() OR
      id = get_linked_student_id(auth.uid())
    )
  );

CREATE POLICY "parent_update_self" ON profiles
  FOR UPDATE USING (
    is_parent() AND id = auth.uid()
  );

-- =====================================================
-- LOCATIONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_locations" ON locations
  FOR ALL USING (is_admin());

-- All authenticated users: Read
CREATE POLICY "authenticated_read_locations" ON locations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- CLASS SESSIONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_sessions" ON class_sessions
  FOR ALL USING (is_admin());

-- Teacher: CRUD own sessions
CREATE POLICY "teacher_manage_own_sessions" ON class_sessions
  FOR ALL USING (
    is_teacher() AND teacher_id = auth.uid()
  );

-- Teacher: View all sessions (for reference)
CREATE POLICY "teacher_view_all_sessions" ON class_sessions
  FOR SELECT USING (is_teacher());

-- Student: View all sessions
CREATE POLICY "student_view_sessions" ON class_sessions
  FOR SELECT USING (is_student());

-- Parent: View all sessions
CREATE POLICY "parent_view_sessions" ON class_sessions
  FOR SELECT USING (is_parent());

-- =====================================================
-- SESSION REPORTS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_reports" ON session_reports
  FOR ALL USING (is_admin());

-- Teacher: Manage reports for own sessions
CREATE POLICY "teacher_manage_session_reports" ON session_reports
  FOR ALL USING (
    is_teacher() AND
    session_id IN (SELECT id FROM class_sessions WHERE teacher_id = auth.uid())
  );

-- Student: View own reports
CREATE POLICY "student_view_own_reports" ON session_reports
  FOR SELECT USING (
    is_student() AND student_id = auth.uid()
  );

-- Parent: View linked student's reports
CREATE POLICY "parent_view_linked_reports" ON session_reports
  FOR SELECT USING (
    is_parent() AND
    student_id = get_linked_student_id(auth.uid())
  );

-- =====================================================
-- HOMEWORKS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_homeworks" ON homeworks
  FOR ALL USING (is_admin());

-- Teacher: Manage homeworks for own sessions
CREATE POLICY "teacher_manage_homeworks" ON homeworks
  FOR ALL USING (
    is_teacher() AND
    session_id IN (SELECT id FROM class_sessions WHERE teacher_id = auth.uid())
  );

-- Student: View own homeworks
CREATE POLICY "student_view_own_homeworks" ON homeworks
  FOR SELECT USING (
    is_student() AND student_id = auth.uid()
  );

-- Student: Update own homeworks (submit)
CREATE POLICY "student_submit_homework" ON homeworks
  FOR UPDATE USING (
    is_student() AND student_id = auth.uid()
  );

-- Parent: View linked student's homeworks
CREATE POLICY "parent_view_linked_homeworks" ON homeworks
  FOR SELECT USING (
    is_parent() AND
    student_id = get_linked_student_id(auth.uid())
  );

-- =====================================================
-- ONLINE MODULES POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_modules" ON online_modules
  FOR ALL USING (is_admin());

-- Teacher: Full access (can create/manage modules)
CREATE POLICY "teacher_manage_modules" ON online_modules
  FOR ALL USING (is_teacher());

-- Student: View published modules
CREATE POLICY "student_view_published_modules" ON online_modules
  FOR SELECT USING (
    is_student() AND status = 'PUBLISHED'
  );

-- Parent: View published modules
CREATE POLICY "parent_view_published_modules" ON online_modules
  FOR SELECT USING (
    is_parent() AND status = 'PUBLISHED'
  );

-- =====================================================
-- STUDENT MODULE PROGRESS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_progress" ON student_module_progress
  FOR ALL USING (is_admin());

-- Teacher: View all progress
CREATE POLICY "teacher_view_progress" ON student_module_progress
  FOR SELECT USING (is_teacher());

-- Student: Manage own progress
CREATE POLICY "student_manage_own_progress" ON student_module_progress
  FOR ALL USING (
    is_student() AND student_id = auth.uid()
  );

-- Parent: View linked student's progress
CREATE POLICY "parent_view_linked_progress" ON student_module_progress
  FOR SELECT USING (
    is_parent() AND
    student_id = get_linked_student_id(auth.uid())
  );

-- =====================================================
-- LEVEL HISTORY POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_level_history" ON level_history
  FOR ALL USING (is_admin());

-- Teacher: View and create level history
CREATE POLICY "teacher_manage_level_history" ON level_history
  FOR ALL USING (is_teacher());

-- Student: View own level history
CREATE POLICY "student_view_own_history" ON level_history
  FOR SELECT USING (
    is_student() AND student_id = auth.uid()
  );

-- Parent: View linked student's history
CREATE POLICY "parent_view_linked_history" ON level_history
  FOR SELECT USING (
    is_parent() AND
    student_id = get_linked_student_id(auth.uid())
  );

-- =====================================================
-- OLYMPIADS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_olympiads" ON olympiads
  FOR ALL USING (is_admin());

-- Public read for active olympiads (anonymous allowed)
CREATE POLICY "public_read_active_olympiads" ON olympiads
  FOR SELECT USING (is_active = TRUE);

-- =====================================================
-- OLYMPIAD REGISTRATIONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_registrations" ON olympiad_registrations
  FOR ALL USING (is_admin());

-- Public: Can insert (register)
CREATE POLICY "public_insert_registration" ON olympiad_registrations
  FOR INSERT WITH CHECK (TRUE);

-- Authenticated users: View own registrations by email
CREATE POLICY "user_view_own_registration" ON olympiad_registrations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- =====================================================
-- OLYMPIAD ATTEMPTS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_attempts" ON olympiad_attempts
  FOR ALL USING (is_admin());

-- Student: Manage own attempts
CREATE POLICY "student_manage_own_attempts" ON olympiad_attempts
  FOR ALL USING (
    is_student() AND student_id = auth.uid()
  );

-- =====================================================
-- PLACEMENT SUBMISSIONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_placement" ON placement_submissions
  FOR ALL USING (is_admin());

-- Public: Can insert (submit test)
CREATE POLICY "public_insert_placement" ON placement_submissions
  FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_transactions" ON transactions
  FOR ALL USING (is_admin());

-- Student: View own transactions
CREATE POLICY "student_view_own_transactions" ON transactions
  FOR SELECT USING (
    is_student() AND student_id = auth.uid()
  );

-- Parent: View linked student's transactions
CREATE POLICY "parent_view_linked_transactions" ON transactions
  FOR SELECT USING (
    is_parent() AND
    student_id = get_linked_student_id(auth.uid())
  );

-- =====================================================
-- TUITION INVOICES POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_invoices" ON tuition_invoices
  FOR ALL USING (is_admin());

-- Student: View own invoices
CREATE POLICY "student_view_own_invoices" ON tuition_invoices
  FOR SELECT USING (
    is_student() AND student_id = auth.uid()
  );

-- Parent: View linked student's invoices
CREATE POLICY "parent_view_linked_invoices" ON tuition_invoices
  FOR SELECT USING (
    is_parent() AND
    student_id = get_linked_student_id(auth.uid())
  );

-- =====================================================
-- NEWS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_news" ON news
  FOR ALL USING (is_admin());

-- Public: Read published news
CREATE POLICY "public_read_published_news" ON news
  FOR SELECT USING (is_published = TRUE);

-- =====================================================
-- STUDENT OF THE MONTH POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_sotm" ON student_of_the_month
  FOR ALL USING (is_admin());

-- Public: Read all
CREATE POLICY "public_read_sotm" ON student_of_the_month
  FOR SELECT USING (TRUE);

-- =====================================================
-- FEATURED TEACHERS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_featured_teachers" ON featured_teachers
  FOR ALL USING (is_admin());

-- Public: Read active teachers
CREATE POLICY "public_read_active_teachers" ON featured_teachers
  FOR SELECT USING (is_active = TRUE);

-- =====================================================
-- TEACHER APPLICATIONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_applications" ON teacher_applications
  FOR ALL USING (is_admin());

-- Public: Can insert (apply)
CREATE POLICY "public_insert_application" ON teacher_applications
  FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- SITE SETTINGS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_settings" ON site_settings
  FOR ALL USING (is_admin());

-- Authenticated: Read settings
CREATE POLICY "authenticated_read_settings" ON site_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Public: Read settings (for homepage)
CREATE POLICY "public_read_settings" ON site_settings
  FOR SELECT USING (TRUE);

-- =====================================================
-- FEEDBACK POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_feedback" ON feedback
  FOR ALL USING (is_admin());

-- Authenticated: Create own feedback
CREATE POLICY "user_create_feedback" ON feedback
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- User: View own feedback
CREATE POLICY "user_view_own_feedback" ON feedback
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- =====================================================
-- QUIZ QUESTIONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_quiz_questions" ON quiz_questions
  FOR ALL USING (is_admin());

-- Teacher: Full access
CREATE POLICY "teacher_manage_quiz_questions" ON quiz_questions
  FOR ALL USING (is_teacher());

-- Student: Read for quizzes
CREATE POLICY "student_read_quiz_questions" ON quiz_questions
  FOR SELECT USING (is_student());

-- =====================================================
-- KAHOOT QUIZZES POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_kahoot" ON kahoot_quizzes
  FOR ALL USING (is_admin());

-- Teacher: Read active quizzes
CREATE POLICY "teacher_view_kahoot" ON kahoot_quizzes
  FOR SELECT USING (is_teacher());

-- Public: Read active quizzes
CREATE POLICY "public_read_active_kahoot" ON kahoot_quizzes
  FOR SELECT USING (is_active = TRUE);

-- =====================================================
-- QUIZ ATTEMPTS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_quiz_attempts" ON quiz_attempts
  FOR ALL USING (is_admin());

-- Teacher: View all attempts
CREATE POLICY "teacher_view_quiz_attempts" ON quiz_attempts
  FOR SELECT USING (is_teacher());

-- Student: Manage own attempts
CREATE POLICY "student_manage_quiz_attempts" ON quiz_attempts
  FOR ALL USING (
    is_student() AND student_id = auth.uid()
  );

-- =====================================================
-- PLACEMENT QUESTIONS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_placement_questions" ON placement_questions
  FOR ALL USING (is_admin());

-- Public: Read active questions (for placement test)
CREATE POLICY "public_read_placement_questions" ON placement_questions
  FOR SELECT USING (is_active = TRUE);

-- =====================================================
-- ORAL TEST SLOTS POLICIES
-- =====================================================

-- Admin: Full access
CREATE POLICY "admin_full_access_oral_slots" ON oral_test_slots
  FOR ALL USING (is_admin());

-- Public: Read available slots
CREATE POLICY "public_read_oral_slots" ON oral_test_slots
  FOR SELECT USING (TRUE);
