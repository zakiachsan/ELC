-- Script to update session years to 2026 while keeping the same month/day/time
-- For: SD SANG TIMUR CAKUNG - 1 BILINGUAL

-- First, let's see what we're updating (DRY RUN)
SELECT
  id,
  topic,
  date_time as current_date_time,
  make_timestamp(
    2026,
    EXTRACT(MONTH FROM date_time::timestamp)::int,
    EXTRACT(DAY FROM date_time::timestamp)::int,
    EXTRACT(HOUR FROM date_time::timestamp)::int,
    EXTRACT(MINUTE FROM date_time::timestamp)::int,
    EXTRACT(SECOND FROM date_time::timestamp)
  ) as new_date_time,
  location
FROM class_sessions
WHERE location = 'SD SANG TIMUR CAKUNG - 1 BILINGUAL'
ORDER BY date_time;

-- Uncomment below to execute the update:
/*
UPDATE class_sessions
SET date_time = make_timestamp(
  2026,
  EXTRACT(MONTH FROM date_time::timestamp)::int,
  EXTRACT(DAY FROM date_time::timestamp)::int,
  EXTRACT(HOUR FROM date_time::timestamp)::int,
  EXTRACT(MINUTE FROM date_time::timestamp)::int,
  EXTRACT(SECOND FROM date_time::timestamp)
)::timestamptz
WHERE location = 'SD SANG TIMUR CAKUNG - 1 BILINGUAL';
*/
