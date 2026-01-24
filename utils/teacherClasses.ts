/**
 * Teacher Assigned Classes Utilities
 *
 * FORMAT: assigned_classes dapat berupa:
 * - OLD: ["5A", "5B", "6A"] (class name only)
 * - NEW: ["location_id|5A", "location_id|5B"] (location_id|class_name)
 *
 * IMPORTANT: Selalu gunakan utility functions ini untuk handle assigned_classes!
 * JANGAN manual parse dengan .split('|') atau .includes('|')!
 */

export interface ParsedAssignedClass {
  locationId: string | null;
  className: string;
  raw: string;
}

/**
 * Parse single assigned class entry
 * @example
 * parseAssignedClass("5A") // { locationId: null, className: "5A", raw: "5A" }
 * parseAssignedClass("abc123|5A") // { locationId: "abc123", className: "5A", raw: "abc123|5A" }
 */
export function parseAssignedClass(assignedClass: string): ParsedAssignedClass {
  if (assignedClass.includes('|')) {
    const [locationId, className] = assignedClass.split('|');
    return { locationId, className, raw: assignedClass };
  }
  return { locationId: null, className: assignedClass, raw: assignedClass };
}

/**
 * Get class names for a specific location from assigned_classes array
 * Handles both old format (class name only) and new format (location_id|class_name)
 *
 * @param assignedClasses - Array of assigned class strings
 * @param locationId - The location ID to filter by
 * @returns Array of class names (without location_id prefix)
 *
 * @example
 * getClassNamesForLocation(["abc|5A", "abc|5B", "xyz|6A"], "abc")
 * // Returns: ["5A", "5B"]
 */
export function getClassNamesForLocation(
  assignedClasses: string[],
  locationId: string
): string[] {
  const classNames: string[] = [];

  for (const assignedClass of assignedClasses) {
    const parsed = parseAssignedClass(assignedClass);

    if (parsed.locationId === locationId) {
      // New format - exact location match
      classNames.push(parsed.className);
    } else if (parsed.locationId === null) {
      // Old format - include class (will be filtered by caller if needed)
      classNames.push(parsed.className);
    }
  }

  return classNames;
}

/**
 * Filter assigned classes to only those that exist in the location's class list
 * This is the main function to use when displaying available classes for a teacher
 *
 * @param assignedClasses - Teacher's assigned_classes array
 * @param locationId - Current location ID
 * @param locationClassNames - Valid class names for this location (from classes table)
 * @returns Array of valid class names for this location
 *
 * @example
 * filterAssignedClassesByLocation(
 *   ["abc|5A", "abc|5B", "xyz|6A"],
 *   "abc",
 *   ["5A", "5B", "5C"]
 * )
 * // Returns: ["5A", "5B"]
 */
export function filterAssignedClassesByLocation(
  assignedClasses: string[],
  locationId: string,
  locationClassNames: string[]
): string[] {
  const classesForLocation = getClassNamesForLocation(assignedClasses, locationId);
  return classesForLocation.filter(className => locationClassNames.includes(className));
}

/**
 * Create assigned class key for storage (new format)
 * Use this when saving new class assignments
 *
 * @example
 * createAssignedClassKey("abc123", "5A") // "abc123|5A"
 */
export function createAssignedClassKey(locationId: string, className: string): string {
  return `${locationId}|${className}`;
}

/**
 * Get the storage key for looking up student counts
 * Handles both old and new formats
 *
 * @param assignedClass - Single assigned class string
 * @param fallbackLocationId - Location ID to use for old format classes
 * @returns The key to use for classStudentCounts lookup
 */
export function getStudentCountKey(assignedClass: string, fallbackLocationId?: string): string {
  const parsed = parseAssignedClass(assignedClass);

  if (parsed.locationId) {
    // New format - use as-is
    return parsed.raw;
  }

  // Old format - need to build key with fallback location
  if (fallbackLocationId) {
    return `${fallbackLocationId}|${parsed.className}`;
  }

  // No location available - return just class name (may not match)
  return parsed.className;
}
