-- Fix SD ST VINCENTIUS schedule class names from "X.Y" format to "KELAS X Y" format
-- Run this in Supabase SQL Editor

-- Step 0: First, check the actual class names defined for SD ST VINCENTIUS
SELECT c.name as class_name, l.name as location_name
FROM classes c
JOIN locations l ON c.location_id = l.id
WHERE l.name = 'SD ST VINCENTIUS'
ORDER BY c.name;

-- Step 1: Preview what sessions need to be fixed
SELECT id, location, date_time, topic
FROM class_sessions
WHERE location LIKE 'SD ST VINCENTIUS - %.%'
ORDER BY date_time DESC
LIMIT 20;

-- Mapping: X.1 -> KELAS X A, X.2 -> KELAS X B, X.3 -> KELAS X C

-- Update 1.1 -> KELAS 1 A
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 1 A'
WHERE location = 'SD ST VINCENTIUS - 1.1';

-- Update 1.2 -> KELAS 1 B
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 1 B'
WHERE location = 'SD ST VINCENTIUS - 1.2';

-- Update 1.3 -> KELAS 1 C
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 1 C'
WHERE location = 'SD ST VINCENTIUS - 1.3';

-- Update 2.1 -> KELAS 2A
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 2A'
WHERE location = 'SD ST VINCENTIUS - 2.1';

-- Update 2.2 -> KELAS 2B
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 2B'
WHERE location = 'SD ST VINCENTIUS - 2.2';

-- Update 2.3 -> KELAS 2C
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 2C'
WHERE location = 'SD ST VINCENTIUS - 2.3';

-- Update 3.1 -> KELAS 3A
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 3A'
WHERE location = 'SD ST VINCENTIUS - 3.1';

-- Update 3.2 -> KELAS 3B
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 3B'
WHERE location = 'SD ST VINCENTIUS - 3.2';

-- Update 3.3 -> KELAS 3C
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 3C'
WHERE location = 'SD ST VINCENTIUS - 3.3';

-- Update 4.1 -> KELAS 4A
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 4A'
WHERE location = 'SD ST VINCENTIUS - 4.1';

-- Update 4.2 -> KELAS 4B
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 4B'
WHERE location = 'SD ST VINCENTIUS - 4.2';

-- Update 4.3 -> KELAS 4C
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 4C'
WHERE location = 'SD ST VINCENTIUS - 4.3';

-- Update 5.1 -> KELAS 5A
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 5A'
WHERE location = 'SD ST VINCENTIUS - 5.1';

-- Update 5.2 -> KELAS 5B
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 5B'
WHERE location = 'SD ST VINCENTIUS - 5.2';

-- Update 5.3 -> KELAS 5C
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 5C'
WHERE location = 'SD ST VINCENTIUS - 5.3';

-- Update 6.1 -> KELAS 6A
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 6A'
WHERE location = 'SD ST VINCENTIUS - 6.1';

-- Update 6.2 -> KELAS 6B
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 6B'
WHERE location = 'SD ST VINCENTIUS - 6.2';

-- Update 6.3 -> KELAS 6C
UPDATE class_sessions
SET location = 'SD ST VINCENTIUS - KELAS 6C'
WHERE location = 'SD ST VINCENTIUS - 6.3';

-- Verify the changes
SELECT id, location, date_time, topic
FROM class_sessions
WHERE location LIKE 'SD ST VINCENTIUS%'
  AND date_time >= '2026-01-19T00:00:00'
  AND date_time < '2026-01-20T00:00:00'
ORDER BY date_time;
