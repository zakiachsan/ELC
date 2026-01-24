# Teacher Assigned Classes Format

## Overview
Field `assigned_classes` pada teacher profile (`profiles` table) menyimpan daftar kelas yang di-assign ke teacher. Format field ini telah berubah untuk mendukung per-location assignments.

## Format

### Old Format (deprecated)
```
["5A", "5B", "6A"]
```
Hanya menyimpan nama kelas saja. Tidak bisa membedakan assignment per-school jika teacher mengajar di multiple schools.

### New Format (current)
```
["location_id|class_name", ...]
```
Contoh:
```
[
  "5b2dceff-b17c-42e4-89da-c62431dfe162|5A",
  "5b2dceff-b17c-42e4-89da-c62431dfe162|5B",
  "07173e72-3df0-427d-8f2e-407e779a67bc|KELAS 2A"
]
```

## Utility Functions

**File: `utils/teacherClasses.ts`**

### `parseAssignedClass(assignedClass: string): ParsedAssignedClass`
Parse single assigned class entry. Returns `{ locationId, className, raw }`.

### `getClassNamesForLocation(assignedClasses: string[], locationId: string): string[]`
Get class names for a specific location. Returns array of class names (tanpa location_id prefix).

### `filterAssignedClassesByLocation(assignedClasses: string[], locationId: string, locationClassNames: string[]): string[]`
Filter assigned classes to only those that exist in the location's class list. **Ini fungsi utama yang paling sering digunakan.**

### `createAssignedClassKey(locationId: string, className: string): string`
Create assigned class key for storage. Returns `"location_id|class_name"`.

## Usage Example

```typescript
import { filterAssignedClassesByLocation } from '../../utils/teacherClasses';

// In component:
const locationClassNames = locationClasses.map(c => c.name);

if (currentTeacher?.assignedClasses?.length > 0) {
  const filteredClasses = filterAssignedClassesByLocation(
    currentTeacher.assignedClasses,
    selectedLocationId || '',
    locationClassNames
  );
  // Use filteredClasses...
}
```

## Components Using This

- `components/teacher/SessionManager.tsx` - Schedule page
- `components/admin/FamilyCreator.tsx` - Student count per teacher
- `components/teacher/TestManager.tsx` - Test management
- `components/teacher/StudentGrades.tsx` - Student grades
- `components/teacher/TestCreator.tsx` - Test creator
- `components/admin/CompletionTracker.tsx` - Completion tracking

## Important Notes

1. **JANGAN** manual parse dengan `.split('|')` atau `.includes('|')`
2. **SELALU** gunakan utility functions dari `utils/teacherClasses.ts`
3. Utility functions handle backward compatibility dengan old format
4. Jika format berubah lagi di masa depan, cukup update di 1 file utility
