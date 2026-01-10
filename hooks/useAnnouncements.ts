import { useState, useEffect, useCallback } from 'react';
import { Announcement } from '../types';
import { fetchActiveAnnouncements } from '../services/announcements.service';

export function useAnnouncements(
  audience: 'all' | 'teachers' | 'students' | 'parents'
) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchActiveAnnouncements(audience);
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch announcements'));
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    announcements,
    loading,
    error,
    refetch: fetch,
  };
}
