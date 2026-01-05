import { useState, useEffect, useCallback } from 'react';
import { testsService, TestSchedule, TestScheduleInsert, TestScheduleUpdate } from '../services/tests.service';

interface UseTestsOptions {
  teacherId?: string;
  location?: string;
  className?: string;
  academicYear?: string;
  semester?: string;
  upcoming?: boolean;
  past?: boolean;
}

export const useTests = (options: UseTestsOptions = {}) => {
  const [tests, setTests] = useState<TestSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: TestSchedule[];

      if (options.teacherId) {
        data = await testsService.getByTeacher(options.teacherId);
      } else if (options.location && options.className) {
        data = await testsService.getByLocationAndClass(options.location, options.className);
      } else if (options.location) {
        data = await testsService.getByLocation(options.location);
      } else if (options.academicYear && options.semester) {
        data = await testsService.getByAcademicPeriod(options.academicYear, options.semester, options.location);
      } else if (options.upcoming) {
        data = await testsService.getUpcoming();
      } else if (options.past) {
        data = await testsService.getPast();
      } else {
        data = await testsService.getAll();
      }

      setTests(data || []);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.teacherId, options.location, options.className, options.academicYear, options.semester, options.upcoming, options.past]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const createTest = async (test: TestScheduleInsert) => {
    const newTest = await testsService.create(test);
    setTests(prev => [newTest, ...prev]);
    return newTest;
  };

  const updateTest = async (id: string, updates: TestScheduleUpdate) => {
    const updated = await testsService.update(id, updates);
    setTests(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTest = async (id: string) => {
    await testsService.delete(id);
    setTests(prev => prev.filter(t => t.id !== id));
  };

  return {
    tests,
    loading,
    error,
    refetch: fetchTests,
    createTest,
    updateTest,
    deleteTest,
  };
};

export const useUpcomingTests = (limit?: number) => {
  const [tests, setTests] = useState<TestSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await testsService.getUpcoming(limit);
        setTests(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [limit]);

  return { tests, loading, error };
};

export default useTests;
