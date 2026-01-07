import { useState, useEffect, useCallback } from 'react';
import { reportsService } from '../services/reports.service';
import type { Database } from '../lib/database.types';

type SessionReport = Database['public']['Tables']['session_reports']['Row'];
type SessionReportInsert = Database['public']['Tables']['session_reports']['Insert'];
type SessionReportUpdate = Database['public']['Tables']['session_reports']['Update'];

interface UseReportsOptions {
  sessionId?: string;
  studentId?: string;
  enabled?: boolean;
}

export const useReports = (options: UseReportsOptions = {}) => {
  const { enabled = true } = options;
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      let data;
      if (options.sessionId) {
        data = await reportsService.getBySession(options.sessionId);
      } else if (options.studentId) {
        data = await reportsService.getByStudent(options.studentId);
      } else {
        data = await reportsService.getAll();
      }

      setReports(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.sessionId, options.studentId, enabled]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = async (report: SessionReportInsert) => {
    const newReport = await reportsService.create(report);
    setReports(prev => [...prev, newReport]);
    return newReport;
  };

  const updateReport = async (id: string, updates: SessionReportUpdate) => {
    const updated = await reportsService.update(id, updates);
    setReports(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  };

  const upsertReport = async (report: SessionReportInsert) => {
    const result = await reportsService.upsert(report);
    await fetchReports(); // Refetch to ensure consistency
    return result;
  };

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    createReport,
    updateReport,
    upsertReport,
  };
};

export const useStudentStats = (studentId: string) => {
  const [stats, setStats] = useState<{
    attendance: { total: number; present: number; late: number; absent: number; attendanceRate: number };
    scores: { averageWritten: number; averageOral: number; totalGraded: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [attendance, scores] = await Promise.all([
          reportsService.getAttendanceStats(studentId),
          reportsService.getAverageScores(studentId),
        ]);
        setStats({ attendance, scores });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStats();
    }
  }, [studentId]);

  return { stats, loading, error };
};

export default useReports;
