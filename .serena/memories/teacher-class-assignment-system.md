# Teacher Class Assignment System

## Overview
Teachers are assigned to specific classes at specific schools. The assignment must use **exact class names** from the `classes` table in the database.

## Database Schema

### Key Tables
- `profiles` - Teacher data with `assigned_classes` (text[]), `assigned_location_ids` (uuid[])
- `classes` - Class definitions with `name`, `location_id`, `class_type`
- `locations` - Schools with `id`, `name`, `level`

### Important Fields
- `profiles.assigned_classes` - Array of class names (must match `classes.name` EXACTLY)
- `classes.class_type` - Either 'Regular' or contains 'Bilingual'/'BILINGUAL'

## Class Naming Conventions by School

### SD ABDI SISWA BINTARO
- Regular: `1 A`, `1 B`, `1C`, `2 B`, `2 C`, `2A`, `3A`, `3B`, `3C`, `4A`, `4B`, `4C`, `5A`-`5D`, `6A`-`6D`
- Bilingual: `1D`, `2D`, `3D`, `4D` (class_type contains 'BILINGUAL')

### SD ABDI SISWA ARIES
- Regular: `1A`, `1B`, `2A`, `2B`, `3A`, `3B`, `4A`, `4B`, `5A`, `5B`, `6A`, `6B`, `6C`
- Bilingual: `1 BILINGUAL`, `1 BILINGUAL (Bilingual)`, `2 BILINGUAL`, `2 BILINGUAL (Bilingual)`

### SMP ABDI SISWA ARIES
- Regular: `kelas 7 A`, `KELAS 7B`, `KELAS 8A`, `KELAS 8B`, `KELAS 9A`

### SMP ABDI SISWA BINTARO
- Regular: `7A`, `7B`, `7C`, `7D`, `8A`-`8D`, `9A`-`9C`

### SMA ABDI SISWA BINTARO
- Regular: `X1`, `X2`, `X3`, `XI 1`, `XI 3`, `XI2`, `XII 1`, `XII 2`, `XII 3`

### SD TARAKANITA (includes grades 7-9)
- Regular: `KELAS 1 A`, `KELAS 1B`, `KELAS 1 C`, `KELAS 1 D`, `KELAS 2A`-`KELAS 9D`

### TK ABDI SISWA BINTARO
- Bilingual: `TK BILINGUAL`

### SD CHARITAS JKT
- Regular: `1A`-`6C`
- Bilingual: `KELAS 2 C BILINGUAL`, `KELAS 3C BILINGUAL`, `KELAS 4C BILINGUAL`, `KELAS 5C BILINGUAL`

### SMP SANG TIMUR KARANG TENGAH
- Regular: `7B`, `7C`, `8A`, `8B`, `8C`, `9A`-`9D`
- Bilingual: `7A Bilingual`

### SD BHAKTI
- Regular: `KELAS 1 A` - `KELAS 6D` (various spacing formats)

### SD/SMP ST VINCENTIUS
- TK: `TK A-1`, `TK A-2`, `TK B-1`, `TK B-2`
- SD: `KELAS 1 A` - `KELAS 6C`
- SMP: `KELAS 7-1` - `KELAS 9-3`

### SMP/SMA BHK
- SMP: `KELAS 7A` - `KELAS 9D`
- SMA: `KELAS 10-1` - `KELAS 12-4`

### SMK SANTA MARIA (Vocational)
- `X CULINARY 1`, `X CULINARY 2`, `X DKV 1`, `X DKV 2`, `X FASHION`
- `XI CULINARY 1`, `XI CULINARY 2`, `XI DKV 1`, `XI DKV 2`, `XI FASHION`

## Common Issues

### 1. Class Name Mismatch
**Problem**: Teacher sees ALL classes instead of filtered ones
**Cause**: `assigned_classes` doesn't match `classes.name` exactly
**Solution**: Query `classes` table to get exact names, update `profiles.assigned_classes`

### 2. Missing Sections
**Problem**: Teacher only sees some sections (e.g., 2A, 2B but not 2C, 2D)
**Solution**: Include ALL sections for each grade the teacher teaches

### 3. Bilingual vs Regular Confusion
**Problem**: Teacher assigned to bilingual but sees regular classes
**Cause**: Bilingual class names vary:
  - Some have "(BILINGUAL)" in name (SD Abdi Siswa Aries)
  - Some are just section letter (e.g., `1D` at SD Abdi Siswa Bintaro)
  - Some have "Bilingual" suffix (e.g., `7A Bilingual`)
**Solution**: Check `class_type` column AND class name patterns

## Application Logic (SessionManager.tsx)

```typescript
const getAvailableClasses = (): AvailableClass[] => {
  const locationClassNames = locationClasses.map(c => c.name);
  
  if (currentTeacher?.assignedClasses?.length > 0) {
    const filteredClasses = currentTeacher.assignedClasses.filter(teacherClass =>
      locationClassNames.includes(teacherClass)  // EXACT match required!
    );
    
    if (filteredClasses.length > 0) {
      return filteredClasses.map(className => {
        const classData = locationClasses.find(c => c.name === className);
        return { name: className, classType: classData?.class_type || null };
      });
    }
    
    // FALLBACK: If no match, show ALL location classes!
    return locationClasses.map(c => ({ name: c.name, classType: c.class_type }));
  }
  
  return locationClasses.map(c => ({ name: c.name, classType: c.class_type }));
};
```

## CSV Source File
Master data: `Daftar Student/ELC TEACHERS - FIX teacher's schedule.csv`
Columns: NAMA GURU, SEKOLAH, JENIS KELAS (bilingual/Regular), KELAS, SUBJECT

## SQL Fix Template
```sql
UPDATE profiles
SET assigned_classes = ARRAY[
    'exact_class_name_1',
    'exact_class_name_2'
],
    updated_at = NOW()
WHERE id = 'teacher_uuid';
```

## Verification Query
```sql
SELECT name, array_length(assigned_classes, 1) as class_count, assigned_classes
FROM profiles
WHERE id = 'teacher_uuid';
```
