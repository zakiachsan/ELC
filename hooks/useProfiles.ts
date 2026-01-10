import { useState, useEffect, useCallback } from 'react';
import { profilesService } from '../services/profiles.service';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type Location = Database['public']['Tables']['locations']['Row'];
type LocationInsert = Database['public']['Tables']['locations']['Insert'];
type LocationUpdate = Database['public']['Tables']['locations']['Update'];

export const useProfiles = (role?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT', enabled: boolean = true) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = role
        ? await profilesService.getByRole(role)
        : await profilesService.getAll();
      setProfiles(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [role, enabled]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const createProfile = async (profile: ProfileInsert) => {
    const newProfile = await profilesService.create(profile);
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  };

  const updateProfile = async (id: string, updates: ProfileUpdate) => {
    const updated = await profilesService.update(id, updates);
    setProfiles(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deleteProfile = async (id: string) => {
    await profilesService.delete(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
  };
};

export const useStudents = (enabled: boolean = true) => {
  return useProfiles('STUDENT', enabled);
};

export const useStudentsPaginated = (options: {
  page: number;
  pageSize: number;
  search?: string;
  locationId?: string;
}) => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await profilesService.getStudentsPaginated(options);
      setStudents(result.data);
      setTotalCount(result.count);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.page, options.pageSize, options.search, options.locationId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const totalPages = Math.ceil(totalCount / options.pageSize);

  return {
    students,
    totalCount,
    totalPages,
    loading,
    error,
    refetch: fetchStudents,
  };
};

export const useTeachers = () => {
  return useProfiles('TEACHER');
};

export const useParents = () => {
  return useProfiles('PARENT');
};

// Hook to fetch a single profile by ID
export const useProfileById = (id: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await profilesService.getById(id);
      setProfile(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};

// Hook to fetch linked student for a parent
export const useLinkedStudent = (linkedStudentId: string | undefined) => {
  const { profile, loading, error, refetch } = useProfileById(linkedStudentId);
  return { student: profile, loading, error, refetch };
};


// Hook for students needing attention (optimized - only fetches flagged students)
export const useStudentsNeedingAttention = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profilesService.getStudentsNeedingAttention();
      setStudents(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
  };
};

// Hook for students by school and class (optimized for class detail view)
export const useStudentsBySchoolAndClass = (locationId?: string, className?: string) => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!locationId || !className) {
      setLoading(false);
      setStudents([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await profilesService.getStudentsByLocationAndClass(locationId, className);
      setStudents(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [locationId, className]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
  };
};

// Helper function to get school level priority for sorting
const getSchoolLevelPriority = (location: Location): number => {
  const name = location.name.toUpperCase();
  const level = location.level?.toUpperCase() || '';

  // Check by level field first
  if (level === 'KINDERGARTEN') return 1;
  if (level === 'ELEMENTARY' || level === 'PRIMARY') return 2;
  if (level === 'JUNIOR') return 3;
  if (level === 'SENIOR') return 4;

  // Fallback: check by name prefix
  if (name.startsWith('TK ') || name.startsWith('TK-')) return 1;
  if (name.startsWith('SD ') || name.startsWith('SDK ')) return 2;
  if (name.startsWith('SMP ')) return 3;
  if (name.startsWith('SMA ') || name.startsWith('SMK ')) return 4;

  return 5; // Other schools at the end
};

// Sort locations by level (TK → SD → SMP → SMA/SMK) then by name
const sortLocationsByLevel = (locations: Location[]): Location[] => {
  return [...locations].sort((a, b) => {
    const priorityA = getSchoolLevelPriority(a);
    const priorityB = getSchoolLevelPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Same level, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profilesService.getLocations();
      setLocations(sortLocationsByLevel(data));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const createLocation = async (location: LocationInsert) => {
    const newLocation = await profilesService.createLocation(location);
    setLocations(prev => sortLocationsByLevel([...prev, newLocation]));
    return newLocation;
  };

  const updateLocation = async (id: string, updates: LocationUpdate) => {
    const updated = await profilesService.updateLocation(id, updates);
    setLocations(prev => sortLocationsByLevel(prev.map(l => l.id === id ? updated : l)));
    return updated;
  };

  const deleteLocation = async (id: string) => {
    await profilesService.deleteLocation(id);
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  };
};

// Hook to get classes by location
export type ClassItem = {
  id: string;
  location_id: string;
  name: string;
  class_type: string | null;
  created_at: string;
};

export const useClasses = (locationId?: string) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!locationId) {
      setClasses([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await profilesService.getClassesByLocation(locationId);
      setClasses(data as ClassItem[]);
    } catch (err) {
      setError(err as Error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const createClass = async (name: string, classType?: string) => {
    if (!locationId) throw new Error('Location ID is required');
    const newClass = await profilesService.createClass({
      location_id: locationId,
      name,
      class_type: classType || 'Regular',
    });
    setClasses(prev => [...prev, newClass as ClassItem]);
    return newClass;
  };

  return {
    classes,
    loading,
    error,
    refetch: fetchClasses,
    createClass,
  };
};

export default useProfiles;
