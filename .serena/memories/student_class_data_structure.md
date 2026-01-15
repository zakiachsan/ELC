# Student Class Data Structure

## How to Get Student's Class Name

The class information for students is stored in multiple places with different priorities:

### Priority Order:
1. **`assigned_classes`** (array) - Check this first if populated
2. **`class_name`** (string) - Direct class name field
3. **`school_origin`** (string) - Parse from format "SCHOOL_NAME - CLASS_NAME"

### Code Example:
```typescript
const getClassName = (student: Profile): string => {
  // First check assigned_classes array
  if (student.assigned_classes && student.assigned_classes.length > 0) {
    return student.assigned_classes.join(', ');
  }
  // Then check class_name field
  if (student.class_name) {
    return student.class_name;
  }
  // Finally, try to parse from school_origin (format: "SCHOOL - CLASS")
  if (student.school_origin && student.school_origin.includes(' - ')) {
    const parts = student.school_origin.split(' - ');
    if (parts.length > 1) {
      return parts.slice(1).join(' - '); // Get everything after first " - "
    }
  }
  return '';
};
```

### Getting School Name:
```typescript
const getSchoolName = (student: Profile): string => {
  if (student.assigned_location_id) {
    const location = locations.find(loc => loc.id === student.assigned_location_id);
    if (location) return location.name;
  }
  // school_origin format: "SCHOOL_NAME - CLASS_NAME", extract school part
  if (student.school_origin) {
    const parts = student.school_origin.split(' - ');
    return parts[0] || student.school_origin;
  }
  return '';
};
```

### Important Notes:
- Class names are inconsistent (e.g., "1 A", "1.1", "1 Bilingual")
- The `school_origin` field often contains both school AND class in format: "SD ABDI SISWA BINTARO - 1A"
- When filtering students by class, use pattern matching on `school_origin` field
- See `profiles.service.ts` function `getStudentsByLocationAndClass()` for reference

### Related Documentation
- **See `class_naming_conventions` memory** for:
  - Teacher class assignment format
  - Classes table structure
  - Common issues and fixes
  - Master CSV data location