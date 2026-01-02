import { useState, useEffect, useCallback } from 'react';
import { homeworksService } from '../services/homeworks.service';
import type { Database } from '../lib/database.types';

type Homework = Database['public']['Tables']['homeworks']['Row'];
type HomeworkInsert = Database['public']['Tables']['homeworks']['Insert'];
type HomeworkUpdate = Database['public']['Tables']['homeworks']['Update'];

interface UseHomeworksOptions {
  sessionId?: string;
  studentId?: string;
  pending?: boolean;
}

export const useHomeworks = (options: UseHomeworksOptions = {}) => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHomeworks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (options.sessionId) {
        data = await homeworksService.getBySession(options.sessionId);
      } else if (options.studentId && options.pending) {
        data = await homeworksService.getPendingByStudent(options.studentId);
      } else if (options.studentId) {
        data = await homeworksService.getByStudent(options.studentId);
      } else {
        data = await homeworksService.getAll();
      }

      setHomeworks(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.sessionId, options.studentId, options.pending]);

  useEffect(() => {
    fetchHomeworks();
  }, [fetchHomeworks]);

  const createHomework = async (homework: HomeworkInsert) => {
    const newHomework = await homeworksService.create(homework);
    setHomeworks(prev => [...prev, newHomework]);
    return newHomework;
  };

  const updateHomework = async (id: string, updates: HomeworkUpdate) => {
    const updated = await homeworksService.update(id, updates);
    setHomeworks(prev => prev.map(h => h.id === id ? updated : h));
    return updated;
  };

  const submitHomework = async (id: string, submissionUrl: string) => {
    const updated = await homeworksService.submit(id, submissionUrl);
    setHomeworks(prev => prev.map(h => h.id === id ? updated : h));
    return updated;
  };

  const gradeHomework = async (id: string, score: number, feedback?: string) => {
    const updated = await homeworksService.grade(id, score, feedback);
    setHomeworks(prev => prev.map(h => h.id === id ? updated : h));
    return updated;
  };

  const deleteHomework = async (id: string) => {
    await homeworksService.delete(id);
    setHomeworks(prev => prev.filter(h => h.id !== id));
  };

  return {
    homeworks,
    loading,
    error,
    refetch: fetchHomeworks,
    createHomework,
    updateHomework,
    submitHomework,
    gradeHomework,
    deleteHomework,
  };
};

export const usePendingHomeworks = (studentId: string) => {
  return useHomeworks({ studentId, pending: true });
};

export default useHomeworks;
