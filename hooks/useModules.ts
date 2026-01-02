import { useState, useEffect, useCallback } from 'react';
import { modulesService } from '../services/modules.service';
import type { Database } from '../lib/database.types';

type OnlineModule = Database['public']['Tables']['online_modules']['Row'];
type OnlineModuleInsert = Database['public']['Tables']['online_modules']['Insert'];
type OnlineModuleUpdate = Database['public']['Tables']['online_modules']['Update'];
type StudentModuleProgress = Database['public']['Tables']['student_module_progress']['Row'];

interface UseModulesOptions {
  publishedOnly?: boolean;
  skillCategory?: string;
  difficultyLevel?: string;
}

export const useModules = (options: UseModulesOptions = {}) => {
  const [modules, setModules] = useState<OnlineModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (options.publishedOnly) {
        data = await modulesService.getPublished();
      } else if (options.skillCategory) {
        data = await modulesService.getBySkillCategory(options.skillCategory);
      } else if (options.difficultyLevel) {
        data = await modulesService.getByDifficultyLevel(options.difficultyLevel);
      } else {
        data = await modulesService.getAll();
      }

      setModules(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.publishedOnly, options.skillCategory, options.difficultyLevel]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const createModule = async (module: OnlineModuleInsert) => {
    const newModule = await modulesService.create(module);
    setModules(prev => [newModule, ...prev]);
    return newModule;
  };

  const updateModule = async (id: string, updates: OnlineModuleUpdate) => {
    const updated = await modulesService.update(id, updates);
    setModules(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const publishModule = async (id: string) => {
    const updated = await modulesService.publish(id);
    setModules(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const unpublishModule = async (id: string) => {
    const updated = await modulesService.unpublish(id);
    setModules(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  };

  const deleteModule = async (id: string) => {
    await modulesService.delete(id);
    setModules(prev => prev.filter(m => m.id !== id));
  };

  return {
    modules,
    loading,
    error,
    refetch: fetchModules,
    createModule,
    updateModule,
    publishModule,
    unpublishModule,
    deleteModule,
  };
};

export const useStudentProgress = (studentId: string) => {
  const [progress, setProgress] = useState<StudentModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await modulesService.getStudentProgress(studentId);
      setProgress(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchProgress();
    }
  }, [studentId, fetchProgress]);

  const startModule = async (moduleId: string) => {
    const result = await modulesService.startModule(studentId, moduleId);
    await fetchProgress();
    return result;
  };

  const completeModule = async (moduleId: string, quizScore?: number) => {
    const result = await modulesService.completeModule(studentId, moduleId, quizScore);
    await fetchProgress();
    return result;
  };

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
    startModule,
    completeModule,
  };
};

// Alias for backward compatibility
export const useModuleProgress = useStudentProgress;

export default useModules;
