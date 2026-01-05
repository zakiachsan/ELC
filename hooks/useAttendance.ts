import { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../services/attendance.service';
import type { Database } from '../lib/database.types';

type TeacherAttendance = Database['public']['Tables']['teacher_attendance']['Row'];
type TeacherAttendanceInsert = Database['public']['Tables']['teacher_attendance']['Insert'];

interface AttendanceWithRelations extends TeacherAttendance {
  teacher?: {
    id: string;
    name: string;
    email: string;
    photo_url: string | null;
  };
  location?: {
    id: string;
    name: string;
    address: string;
  } | null;
}

export const useAttendance = (teacherId?: string) => {
  const [attendance, setAttendance] = useState<AttendanceWithRelations[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      if (teacherId) {
        const data = await attendanceService.getByTeacher(teacherId);
        setAttendance(data as AttendanceWithRelations[]);

        // Also fetch today's attendance
        const today = await attendanceService.getTodayByTeacher(teacherId);
        setTodayAttendance(today as AttendanceWithRelations | null);
      } else {
        const data = await attendanceService.getAll();
        setAttendance(data as AttendanceWithRelations[]);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const checkIn = async (data: TeacherAttendanceInsert) => {
    const newAttendance = await attendanceService.checkIn(data);
    setAttendance(prev => [newAttendance as AttendanceWithRelations, ...prev]);
    setTodayAttendance(newAttendance as AttendanceWithRelations);
    return newAttendance;
  };

  const checkOut = async (id: string) => {
    const updated = await attendanceService.checkOut(id);
    setAttendance(prev => prev.map(a => a.id === id ? updated as AttendanceWithRelations : a));
    if (todayAttendance?.id === id) {
      setTodayAttendance(updated as AttendanceWithRelations);
    }
    return updated;
  };

  const refetch = () => {
    fetchAttendance();
  };

  return {
    attendance,
    todayAttendance,
    loading,
    error,
    checkIn,
    checkOut,
    refetch,
  };
};

export const useAttendanceStats = (teacherId: string, year: number, month: number) => {
  const [stats, setStats] = useState({
    totalDays: 0,
    present: 0,
    late: 0,
    earlyLeave: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await attendanceService.getMonthlyStats(teacherId, year, month);
        setStats(data);
      } catch (err) {
        console.error('Error fetching attendance stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchStats();
    }
  }, [teacherId, year, month]);

  return { stats, loading };
};
