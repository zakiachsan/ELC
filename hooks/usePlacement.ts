import { useState, useEffect, useCallback } from 'react';
import { placementService } from '../services/placement.service';
import type { Database } from '../lib/database.types';

type PlacementSubmission = Database['public']['Tables']['placement_submissions']['Row'];
type PlacementSubmissionInsert = Database['public']['Tables']['placement_submissions']['Insert'];
type PlacementQuestion = Database['public']['Tables']['placement_questions']['Row'];
type PlacementQuestionInsert = Database['public']['Tables']['placement_questions']['Insert'];
type OralTestSlot = Database['public']['Tables']['oral_test_slots']['Row'];
type OralTestSlotInsert = Database['public']['Tables']['oral_test_slots']['Insert'];

export const usePlacementSubmissions = (oralStatus?: 'none' | 'booked' | 'completed') => {
  const [submissions, setSubmissions] = useState<PlacementSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = oralStatus
        ? await placementService.getSubmissionsByOralStatus(oralStatus)
        : await placementService.getSubmissions();
      setSubmissions(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [oralStatus]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const createSubmission = async (submission: PlacementSubmissionInsert) => {
    const newSubmission = await placementService.createSubmission(submission);
    setSubmissions(prev => [newSubmission, ...prev]);
    return newSubmission;
  };

  const bookOralTest = async (id: string, date: string, time: string, slotId?: string) => {
    const updated = await placementService.bookOralTest(id, date, time, slotId);
    setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  };

  const completeOralTest = async (id: string, score: string) => {
    const updated = await placementService.completeOralTest(id, score);
    setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  };

  const deleteSubmission = async (id: string) => {
    await placementService.deleteSubmission(id);
    setSubmissions(prev => prev.filter(s => s.id !== id));
  };

  return {
    submissions,
    loading,
    error,
    refetch: fetchSubmissions,
    createSubmission,
    bookOralTest,
    completeOralTest,
    deleteSubmission,
  };
};

export const usePlacementQuestions = (activeOnly = false) => {
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = activeOnly
        ? await placementService.getActiveQuestions()
        : await placementService.getQuestions();
      setQuestions(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const createQuestion = async (question: PlacementQuestionInsert) => {
    const newQuestion = await placementService.createQuestion(question);
    setQuestions(prev => [...prev, newQuestion]);
    return newQuestion;
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const updated = await placementService.toggleQuestionActive(id, isActive);
    setQuestions(prev => prev.map(q => q.id === id ? updated : q));
    return updated;
  };

  const deleteQuestion = async (id: string) => {
    await placementService.deleteQuestion(id);
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  return { questions, loading, error, refetch: fetchQuestions, createQuestion, toggleActive, deleteQuestion };
};

export const useOralTestSlots = (availableOnly = false) => {
  const [slots, setSlots] = useState<OralTestSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const data = availableOnly
        ? await placementService.getAvailableSlots()
        : await placementService.getOralTestSlots();
      setSlots(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [availableOnly]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const createSlot = async (slot: OralTestSlotInsert) => {
    const newSlot = await placementService.createSlot(slot);
    setSlots(prev => [...prev, newSlot]);
    return newSlot;
  };

  const createSlots = async (slots: OralTestSlotInsert[]) => {
    const newSlots = await placementService.createSlots(slots);
    setSlots(prev => [...prev, ...newSlots]);
    return newSlots;
  };

  const bookSlot = async (id: string, submissionId: string) => {
    const updated = await placementService.bookSlot(id, submissionId);
    setSlots(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  };

  const releaseSlot = async (id: string) => {
    const updated = await placementService.releaseSlot(id);
    setSlots(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  };

  const deleteSlot = async (id: string) => {
    await placementService.deleteSlot(id);
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  return { slots, loading, error, refetch: fetchSlots, createSlot, createSlots, bookSlot, releaseSlot, deleteSlot };
};

export default usePlacementSubmissions;
