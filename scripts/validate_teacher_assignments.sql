-- =====================================================
-- Validate Teacher Assignments vs CSV Data
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. First, let's see all teachers and their current assignments
SELECT
    p.name AS teacher_name,
    p.email,
    p.assigned_location_ids,
    array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL) AS school_names,
    p.assigned_classes,
    p.assigned_subjects,
    p.class_types
FROM profiles p
LEFT JOIN locations l ON l.id = ANY(p.assigned_location_ids)
WHERE p.role = 'TEACHER'
AND p.status = 'ACTIVE'
GROUP BY p.id, p.name, p.email, p.assigned_location_ids, p.assigned_classes, p.assigned_subjects, p.class_types
ORDER BY p.name;

-- 2. Check the classes table for each school
SELECT
    l.name AS school_name,
    c.name AS class_name,
    c.class_type
FROM classes c
JOIN locations l ON c.location_id = l.id
ORDER BY l.name, c.class_type, c.name;

-- 3. Get list of all schools (locations)
SELECT id, name, level FROM locations ORDER BY name;

-- 4. Detailed teacher view - each teacher with their school-class combinations
WITH teacher_schools AS (
    SELECT
        p.id,
        p.name AS teacher_name,
        p.assigned_classes,
        p.assigned_subjects,
        p.class_types,
        unnest(p.assigned_location_ids) AS location_id
    FROM profiles p
    WHERE p.role = 'TEACHER' AND p.status = 'ACTIVE'
)
SELECT
    ts.teacher_name,
    l.name AS school_name,
    ts.assigned_classes,
    ts.assigned_subjects,
    ts.class_types
FROM teacher_schools ts
JOIN locations l ON ts.location_id = l.id
ORDER BY ts.teacher_name, l.name;
