import { useState, useEffect, useCallback } from 'react';
import { sessionsService } from '../services/sessions.service';
import type { Database } from '../lib/database.types';

type ClassSession = Database['public']['Tables']['class_sessions']['Row'];
type ClassSessionInsert = Database['public']['Tables']['class_sessions']['Insert'];
type ClassSessionUpdate = Database['public']['Tables']['class_sessions']['Update'];

interface UseSessionsOptions {
  teacherId?: string;
  location?: string;
  schoolName?: string;
  className?: string;
  upcoming?: boolean;
  past?: boolean;
  today?: boolean;
  enabled?: boolean;
}

export const useSessions = (options: UseSessionsOptions = {}) => {
  const { enabled = true } = options;
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      let data;
      if (options.schoolName && options.className) {
        // Most efficient: filter by school and class at database level
        data = await sessionsService.getBySchoolAndClass(options.schoolName, options.className);
      } else if (options.teacherId) {
        data = await sessionsService.getByTeacher(options.teacherId);
      } else if (options.location) {
        data = await sessionsService.getByLocation(options.location);
      } else if (options.today) {
        data = await sessionsService.getToday();
      } else if (options.upcoming) {
        data = await sessionsService.getUpcoming();
      } else if (options.past) {
        data = await sessionsService.getPast();
      } else {
        data = await sessionsService.getAll();
      }

      setSessions(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.teacherId, options.location, options.schoolName, options.className, options.upcoming, options.past, options.today, enabled]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (session: ClassSessionInsert) => {
    const newSession = await sessionsService.create(session);
    setSessions(prev => [newSession, ...prev]);
    return newSession;
  };

  const updateSession = async (id: string, updates: ClassSessionUpdate) => {
    const updated = await sessionsService.update(id, updates);
    setSessions(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  };

  const deleteSession = async (id: string) => {
    await sessionsService.delete(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
    updateSession,
    deleteSession,
  };
};

export const useUpcomingSessions = (limit?: number) => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const data = await sessionsService.getUpcoming(limit);
        setSessions(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [limit]);

  return { sessions, loading, error };
};

export const useTodaySessions = () => {
  return useSessions({ today: true });
};


// Hook for pending tasks count (optimized - only fetches count)
export const usePendingTasksCount = (teacherId?: string) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setLoading(true);
        const data = await sessionsService.getPendingTasksCount(teacherId);
        setCount(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, [teacherId]);

  return { count, loading, error };
};

export default useSessions;
