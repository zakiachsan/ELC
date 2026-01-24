# Claude Code Design Workflow

## Design Philosophy
- Prioritaskan desain yang modern, clean, dan professional
- Hindari generic ShadCN purple UI patterns
- Selalu gunakan visual validation melalui screenshots
- Iterasi hingga hasil sesuai spesifikasi

## Serena MCP

WAJIB di awal setiap conversation:
1. Activate Serena project: `mcp__serena__activate_project` dengan project "ELC"
2. Check onboarding jika belum pernah
3. Gunakan Serena tools untuk semua operasi code (find_symbol, search_for_pattern, dll)


## Teacher Assigned Classes Format

IMPORTANT: Field `assigned_classes` pada teacher profile menggunakan format `location_id|class_name`.

**Contoh:**
- OLD format: `["5A", "5B", "6A"]` (hanya class name)
- NEW format: `["abc123|5A", "abc123|5B", "xyz789|6A"]` (location_id|class_name)

**WAJIB gunakan utility functions dari `utils/teacherClasses.ts`:**
```typescript
import {
  parseAssignedClass,           // Parse single entry
  getClassNamesForLocation,     // Get classes for specific location
  filterAssignedClassesByLocation,  // Filter & validate classes
  createAssignedClassKey        // Create key for saving
} from '../../utils/teacherClasses';
```

**JANGAN manual parse dengan `.split('|')` atau `.includes('|')`!**

Ini memastikan semua komponen handle format dengan konsisten dan jika format berubah, cukup update di 1 file utility.


## Sub-agents & Slash Commands
(Akan ditambahkan sesuai kebutuhan project)