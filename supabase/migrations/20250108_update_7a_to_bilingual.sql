-- Migration: Update SMP SANG TIMUR KARANG TENGAH class 7A to 7A Bilingual
-- Date: 2025-01-08
-- Description:
--   1. Update class name from "7A" to "7A Bilingual"
--   2. Update class type from "Regular" to "Bilingual"

-- Update profiles table for students in SMP SANG TIMUR KARANG TENGAH - 7A
UPDATE profiles
SET
  school_origin = REPLACE(school_origin, 'SMP SANG TIMUR KARANG TENGAH - 7A', 'SMP SANG TIMUR KARANG TENGAH - 7A Bilingual'),
  class_type = 'Bilingual',
  updated_at = NOW()
WHERE
  role = 'STUDENT'
  AND school_origin LIKE '%SMP SANG TIMUR KARANG TENGAH - 7A%'
  AND school_origin NOT LIKE '%7A Bilingual%'; -- Avoid double update

-- Also update class_sessions if there are any sessions for this class
UPDATE class_sessions
SET
  location = REPLACE(location, 'SMP SANG TIMUR KARANG TENGAH - 7A', 'SMP SANG TIMUR KARANG TENGAH - 7A Bilingual'),
  class_type = 'Bilingual',
  updated_at = NOW()
WHERE
  location LIKE '%SMP SANG TIMUR KARANG TENGAH - 7A%'
  AND location NOT LIKE '%7A Bilingual%';

-- Update test_schedules if there are any tests for this class
UPDATE test_schedules
SET
  location = REPLACE(location, 'SMP SANG TIMUR KARANG TENGAH', 'SMP SANG TIMUR KARANG TENGAH'),
  class_name = CASE
    WHEN class_name = '7A' AND location LIKE '%SMP SANG TIMUR KARANG TENGAH%' THEN '7A Bilingual'
    ELSE class_name
  END,
  class_type = 'Bilingual',
  updated_at = NOW()
WHERE
  location LIKE '%SMP SANG TIMUR KARANG TENGAH%'
  AND class_name = '7A';

-- Update student_grades if there are any grades for this class
UPDATE student_grades
SET
  class_name = '7A Bilingual',
  class_type = 'Bilingual',
  updated_at = NOW()
WHERE
  school_name LIKE '%SMP SANG TIMUR KARANG TENGAH%'
  AND class_name = '7A';
