import { useState, useEffect, useCallback } from 'react';
import { profilesService } from '../services/profiles.service';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type Location = Database['public']['Tables']['locations']['Row'];
type LocationInsert = Database['public']['Tables']['locations']['Insert'];
type LocationUpdate = Database['public']['Tables']['locations']['Update'];

export const useProfiles = (role?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT') => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = useCallback(async () => {
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
  }, [role]);

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

export const useStudents = () => {
  return useProfiles('STUDENT');
};

export const useTeachers = () => {
  return useProfiles('TEACHER');
};

export const useParents = () => {
  return useProfiles('PARENT');
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

export default useProfiles;
