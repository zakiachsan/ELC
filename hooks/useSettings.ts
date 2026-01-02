import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/settings.service';
import type { Database } from '../lib/database.types';

type SiteSettings = Database['public']['Tables']['site_settings']['Row'];
type LevelHistory = Database['public']['Tables']['level_history']['Row'];
type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateColors = async (primaryColor: string, accentColor: string, userId?: string) => {
    const updated = await settingsService.updateColors(primaryColor, accentColor, userId);
    setSettings(updated);
    return updated;
  };

  const updateVideoSettings = async (
    videoUrl: string,
    videoTitle: string,
    videoDescription: string,
    videoOrientation: 'landscape' | 'portrait',
    userId?: string
  ) => {
    const updated = await settingsService.updateVideoSettings(
      videoUrl,
      videoTitle,
      videoDescription,
      videoOrientation,
      userId
    );
    setSettings(updated);
    return updated;
  };

  const resetToDefaults = async (userId?: string) => {
    const updated = await settingsService.resetToDefaults(userId);
    setSettings(updated);
    return updated;
  };

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateColors,
    updateVideoSettings,
    resetToDefaults,
  };
};

export const useLevelHistory = (studentId: string, skillCategory?: string) => {
  const [history, setHistory] = useState<LevelHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = skillCategory
        ? await settingsService.getLevelHistoryBySkill(studentId, skillCategory)
        : await settingsService.getLevelHistory(studentId);
      setHistory(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [studentId, skillCategory]);

  useEffect(() => {
    if (studentId) {
      fetchHistory();
    }
  }, [studentId, fetchHistory]);

  const recordLevelChange = async (
    skillCat: string,
    fromLevel: string | null,
    toLevel: string,
    reason?: string
  ) => {
    const newEntry = await settingsService.recordLevelChange(
      studentId,
      skillCat,
      fromLevel,
      toLevel,
      reason
    );
    setHistory(prev => [newEntry, ...prev]);
    return newEntry;
  };

  return { history, loading, error, refetch: fetchHistory, recordLevelChange };
};

export const useQuizAttempts = (studentId: string, skillCategory?: string) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAttempts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = skillCategory
        ? await settingsService.getQuizAttemptsBySkill(studentId, skillCategory)
        : await settingsService.getQuizAttempts(studentId);
      setAttempts(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [studentId, skillCategory]);

  useEffect(() => {
    if (studentId) {
      fetchAttempts();
    }
  }, [studentId, fetchAttempts]);

  const recordQuizResult = async (
    skillCat: string,
    attemptedDifficulty: string,
    score: number,
    passed: boolean,
    finalPlacement: string,
    feedback?: string
  ) => {
    const newAttempt = await settingsService.recordQuizResult(
      studentId,
      skillCat,
      attemptedDifficulty,
      score,
      passed,
      finalPlacement,
      feedback
    );
    setAttempts(prev => [newAttempt, ...prev]);
    return newAttempt;
  };

  return { attempts, loading, error, refetch: fetchAttempts, recordQuizResult };
};

export default useSiteSettings;
