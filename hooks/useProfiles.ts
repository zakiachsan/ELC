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

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profilesService.getLocations();
      setLocations(data);
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
    setLocations(prev => [...prev, newLocation]);
    return newLocation;
  };

  const updateLocation = async (id: string, updates: LocationUpdate) => {
    const updated = await profilesService.updateLocation(id, updates);
    setLocations(prev => prev.map(l => l.id === id ? updated : l));
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
