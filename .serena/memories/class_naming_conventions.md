# Class Naming Conventions & Data Structure

## IMPORTANT: Format Differences

### 1. `classes` Table Format (Source of Truth)
The `classes` table stores class names **WITHOUT** type suffix:
- `"1 BILINGUAL"` (not "1 BILINGUAL (Bilingual)")
- `"2A"` (not "2A (Regular)")
- `"TK A"`, `"TK B"`
- `"KELAS 7A"`, `"kelas 7 A"` (inconsistent casing exists)

### 2. Teacher `assigned_classes` Format
Teachers' assigned_classes should match `classes` table exactly:
- **CORRECT**: `["1 BILINGUAL", "2 BILINGUAL", "2A", "2B"]`
- **WRONG**: `["1 BILINGUAL (Bilingual)", "2A (Regular)"]`

### 3. Student `school_origin` Format
Students have class embedded in school_origin:
- Format: `"SCHOOL_NAME - CLASS_NAME"`
- Example: `"SD ABDI SISWA ARIES - 2A"`

## Class Types

### Bilingual Classes
- Format: `"X BILINGUAL"` where X is grade number
- Examples: `"1 BILINGUAL"`, `"2 BILINGUAL"`
- `class_type` in DB: `"Bilingual"`

### Regular Classes
- Format varies by school:
  - SD: `"1A"`, `"2B"`, `"3C"` (grade + letter)
  - SMP: `"7A"`, `"8B"`, `"9C"` or `"KELAS 7A"`
  - SMA: `"X1"`, `"XI 2"`, `"XII 3"` or `"KELAS 10-1"`
  - TK: `"TK A"`, `"TK B"`
- `class_type` in DB: `"Regular"`

## Master Data Location
- CSV file: `Daftar Student/ELC TEACHERS - FIX teacher's schedule.csv`
- Contains: NAMA GURU, SEKOLAH, JENIS KELAS, KELAS, SUBJECT
- Note: "kelas 7" in CSV means ALL grade 7 classes (7A, 7B, 7C, etc.)

## Database Tables

### `classes` table
```
id: uuid
location_id: uuid (FK to locations)
name: string (class name WITHOUT suffix)
class_type: "Regular" | "Bilingual"
```

### `profiles` table (for teachers)
```
assigned_classes: string[] (should match classes.name exactly)
assigned_locations: uuid[] (location IDs)
```

## Code Reference
- `getAvailableClasses()` in `SessionManager.tsx` filters teacher's assigned_classes against classes table
- If formats don't match, classes won't show in dropdown

## Common Issues & Fixes

### Issue: Teacher can't see their classes
**Cause**: Format mismatch between `assigned_classes` and `classes` table
**Fix**: Update teacher's `assigned_classes` to match `classes.name` exactly

### Issue: "kelas X" interpretation
**Rule**: "kelas 7" in master CSV = ALL classes in grade 7 (7A, 7B, 7C, 7D, etc.)
NOT just 7A and 7B

## SQL Examples

### Check teacher's classes format
```sql
SELECT name, assigned_classes 
FROM profiles 
WHERE role = 'TEACHER';
```

### Check classes for a location
```sql
SELECT c.name, c.class_type, l.name as school
FROM classes c
JOIN locations l ON c.location_id = l.id
WHERE l.name = 'SD ABDI SISWA ARIES';
```

### Fix teacher class format (remove suffix)
```sql
UPDATE profiles 
SET assigned_classes = '["1 BILINGUAL", "2 BILINGUAL", "2A", "2B"]'::jsonb
WHERE name = 'Ms. Isabella' AND role = 'TEACHER';
```
