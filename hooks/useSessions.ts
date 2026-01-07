import { useState, useEffect, useCallback } from 'react';
import { sessionsService } from '../services/sessions.service';
import type { Database } from '../lib/database.types';

type ClassSession = Database['public']['Tables']['class_sessions']['Row'];
type ClassSessionInsert = Database['public']['Tables']['class_sessions']['Insert'];
type ClassSessionUpdate = Database['public']['Tables']['class_sessions']['Update'];

interface UseSessionsOptions {
  teacherId?: string;
  location?: string;
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
      if (options.teacherId) {
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
  }, [options.teacherId, options.location, options.upcoming, options.past, options.today, enabled]);

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

export default useSessions;
