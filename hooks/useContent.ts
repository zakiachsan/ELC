import { useState, useEffect, useCallback } from 'react';
import { contentService } from '../services/content.service';
import type { Database } from '../lib/database.types';

type News = Database['public']['Tables']['news']['Row'];
type NewsInsert = Database['public']['Tables']['news']['Insert'];
type NewsUpdate = Database['public']['Tables']['news']['Update'];
type StudentOfTheMonth = Database['public']['Tables']['student_of_the_month']['Row'];
type StudentOfTheMonthInsert = Database['public']['Tables']['student_of_the_month']['Insert'];
type FeaturedTeacher = Database['public']['Tables']['featured_teachers']['Row'];
type FeaturedTeacherInsert = Database['public']['Tables']['featured_teachers']['Insert'];
type FeaturedTeacherUpdate = Database['public']['Tables']['featured_teachers']['Update'];
type TeacherApplication = Database['public']['Tables']['teacher_applications']['Row'];
type TeacherApplicationInsert = Database['public']['Tables']['teacher_applications']['Insert'];

export const useNews = (publishedOnly = false) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = publishedOnly
        ? await contentService.getPublishedNews()
        : await contentService.getNews();
      setNews(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [publishedOnly]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const createNews = async (article: NewsInsert) => {
    const newArticle = await contentService.createNews(article);
    setNews(prev => [newArticle, ...prev]);
    return newArticle;
  };

  const updateNews = async (id: string, updates: NewsUpdate) => {
    const updated = await contentService.updateNews(id, updates);
    setNews(prev => prev.map(n => n.id === id ? updated : n));
    return updated;
  };

  const togglePublish = async (id: string, isPublished: boolean) => {
    const updated = await contentService.toggleNewsPublish(id, isPublished);
    setNews(prev => prev.map(n => n.id === id ? updated : n));
    return updated;
  };

  const deleteNews = async (id: string) => {
    await contentService.deleteNews(id);
    setNews(prev => prev.filter(n => n.id !== id));
  };

  return { news, loading, error, refetch: fetchNews, createNews, updateNews, togglePublish, deleteNews };
};

export const useStudentsOfMonth = () => {
  const [students, setStudents] = useState<StudentOfTheMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contentService.getStudentsOfMonth();
      setStudents(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const createStudent = async (student: StudentOfTheMonthInsert) => {
    const newStudent = await contentService.createStudentOfMonth(student);
    setStudents(prev => [newStudent, ...prev]);
    return newStudent;
  };

  const deleteStudent = async (id: string) => {
    await contentService.deleteStudentOfMonth(id);
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  return { students, loading, error, refetch: fetchStudents, createStudent, deleteStudent };
};

export const useFeaturedTeachers = (activeOnly = false) => {
  const [teachers, setTeachers] = useState<FeaturedTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const data = activeOnly
        ? await contentService.getActiveFeaturedTeachers()
        : await contentService.getFeaturedTeachers();
      setTeachers(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const createTeacher = async (teacher: FeaturedTeacherInsert) => {
    const newTeacher = await contentService.createFeaturedTeacher(teacher);
    setTeachers(prev => [newTeacher, ...prev]);
    return newTeacher;
  };

  const updateTeacher = async (id: string, updates: FeaturedTeacherUpdate) => {
    const updated = await contentService.updateFeaturedTeacher(id, updates);
    setTeachers(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const updated = await contentService.toggleFeaturedTeacherActive(id, isActive);
    setTeachers(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTeacher = async (id: string) => {
    await contentService.deleteFeaturedTeacher(id);
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  return { teachers, loading, error, refetch: fetchTeachers, createTeacher, updateTeacher, toggleActive, deleteTeacher };
};

export const useTeacherApplications = (status?: 'PENDING' | 'REVIEWED' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED') => {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const data = status
        ? await contentService.getApplicationsByStatus(status)
        : await contentService.getTeacherApplications();
      setApplications(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const createApplication = async (application: TeacherApplicationInsert) => {
    const newApplication = await contentService.createApplication(application);
    setApplications(prev => [newApplication, ...prev]);
    return newApplication;
  };

  const updateStatus = async (id: string, newStatus: 'PENDING' | 'REVIEWED' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED') => {
    const updated = await contentService.updateApplicationStatus(id, newStatus);
    setApplications(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  };

  const markAsConverted = async (id: string) => {
    const updated = await contentService.markAsConverted(id);
    setApplications(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  };

  const deleteApplication = async (id: string) => {
    await contentService.deleteApplication(id);
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  return { applications, loading, error, refetch: fetchApplications, createApplication, updateStatus, markAsConverted, deleteApplication };
};

export default useNews;
