import { useState, useEffect, useCallback } from 'react';
import { olympiadService } from '../services/olympiad.service';
import type { Database } from '../lib/database.types';

type Olympiad = Database['public']['Tables']['olympiads']['Row'];
type OlympiadInsert = Database['public']['Tables']['olympiads']['Insert'];
type OlympiadUpdate = Database['public']['Tables']['olympiads']['Update'];
type OlympiadRegistration = Database['public']['Tables']['olympiad_registrations']['Row'];
type OlympiadRegistrationInsert = Database['public']['Tables']['olympiad_registrations']['Insert'];
type KahootQuiz = Database['public']['Tables']['kahoot_quizzes']['Row'];
type KahootQuizInsert = Database['public']['Tables']['kahoot_quizzes']['Insert'];
type KahootQuizUpdate = Database['public']['Tables']['kahoot_quizzes']['Update'];

export const useOlympiads = (activeOnly = false) => {
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOlympiads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = activeOnly
        ? await olympiadService.getActive()
        : await olympiadService.getAll();
      setOlympiads(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchOlympiads();
  }, [fetchOlympiads]);

  const createOlympiad = async (olympiad: OlympiadInsert) => {
    const newOlympiad = await olympiadService.create(olympiad);
    setOlympiads(prev => [newOlympiad, ...prev]);
    return newOlympiad;
  };

  const updateOlympiad = async (id: string, updates: OlympiadUpdate) => {
    const updated = await olympiadService.update(id, updates);
    setOlympiads(prev => prev.map(o => o.id === id ? updated : o));
    return updated;
  };

  const deleteOlympiad = async (id: string) => {
    await olympiadService.delete(id);
    setOlympiads(prev => prev.filter(o => o.id !== id));
  };

  return {
    olympiads,
    loading,
    error,
    refetch: fetchOlympiads,
    createOlympiad,
    updateOlympiad,
    deleteOlympiad,
  };
};

export const useOlympiadRegistrations = (olympiadId?: string) => {
  const [registrations, setRegistrations] = useState<OlympiadRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = olympiadId
        ? await olympiadService.getRegistrations(olympiadId)
        : await olympiadService.getAllRegistrations();
      setRegistrations(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [olympiadId]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const register = async (registration: OlympiadRegistrationInsert) => {
    const newRegistration = await olympiadService.register(registration);
    setRegistrations(prev => [newRegistration, ...prev]);
    return newRegistration;
  };

  const updateStatus = async (id: string, status: 'PENDING' | 'SUCCESS') => {
    const updated = await olympiadService.updateRegistrationStatus(id, status);
    setRegistrations(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  };

  return {
    registrations,
    loading,
    error,
    refetch: fetchRegistrations,
    register,
    updateStatus,
  };
};

export const useKahootQuizzes = () => {
  const [quizzes, setQuizzes] = useState<KahootQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await olympiadService.getKahootQuizzes();
      setQuizzes(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const createQuiz = async (quiz: KahootQuizInsert) => {
    const newQuiz = await olympiadService.createKahootQuiz(quiz);
    setQuizzes(prev => [newQuiz, ...prev]);
    return newQuiz;
  };

  const updateQuiz = async (id: string, updates: KahootQuizUpdate) => {
    const updated = await olympiadService.updateKahootQuiz(id, updates);
    if (updated) {
      setQuizzes(prev => prev.map(q => q.id === id ? updated : q));
    } else {
      // If update didn't return data, refetch all quizzes
      await fetchQuizzes();
    }
    return updated;
  };

  const setActive = async (id: string) => {
    await olympiadService.setActiveKahootQuiz(id);
    await fetchQuizzes();
  };

  const deleteQuiz = async (id: string) => {
    await olympiadService.deleteKahootQuiz(id);
    setQuizzes(prev => prev.filter(q => q.id !== id));
  };

  return {
    quizzes,
    loading,
    error,
    refetch: fetchQuizzes,
    createQuiz,
    updateQuiz,
    setActive,
    deleteQuiz,
  };
};

export default useOlympiads;
