import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface StudentGrade {
  id: string;
  student_id: string;
  academic_year: string;
  semester: string;
  school_name: string;
  class_name: string;
  quiz1: number | null;
  quiz2: number | null;
  quiz3: number | null;
  participation: number | null;
  mid: number | null;
  final: number | null;
  // Extended fields for Regular and Bilingual classes
  speaking: number | null;
  listening: number | null;
  // Bilingual-only fields
  reading: number | null;
  writing: number | null;
  maths: number | null;
  science: number | null;
  created_at: string;
  updated_at: string;
}

export interface StudentGradeInput {
  student_id: string;
  academic_year: string;
  semester: string;
  school_name: string;
  class_name: string;
  quiz1?: number | null;
  quiz2?: number | null;
  quiz3?: number | null;
  participation?: number | null;
  mid?: number | null;
  final?: number | null;
  // Extended fields for Regular and Bilingual classes
  speaking?: number | null;
  listening?: number | null;
  // Bilingual-only fields
  reading?: number | null;
  writing?: number | null;
  maths?: number | null;
  science?: number | null;
}

export function useStudentGrades(
  academicYear: string,
  semester: string,
  schoolName: string,
  className: string
) {
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGrades = useCallback(async () => {
    if (!academicYear || !semester || !schoolName || !className) {
      setGrades([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('student_grades')
        .select('*')
        .eq('academic_year', academicYear)
        .eq('semester', semester)
        .eq('school_name', schoolName)
        .eq('class_name', className);

      if (fetchError) throw fetchError;
      setGrades(data || []);
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch grades'));
    } finally {
      setLoading(false);
    }
  }, [academicYear, semester, schoolName, className]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const saveGrade = async (input: StudentGradeInput): Promise<StudentGrade | null> => {
    try {
      // Check if grade already exists
      const { data: existing } = await supabase
        .from('student_grades')
        .select('id')
        .eq('student_id', input.student_id)
        .eq('academic_year', input.academic_year)
        .eq('semester', input.semester)
        .eq('school_name', input.school_name)
        .eq('class_name', input.class_name)
        .single();

      if (existing) {
        // Update existing grade
        const { data, error: updateError } = await supabase
          .from('student_grades')
          .update({
            quiz1: input.quiz1,
            quiz2: input.quiz2,
            quiz3: input.quiz3,
            participation: input.participation,
            mid: input.mid,
            final: input.final,
            speaking: input.speaking,
            listening: input.listening,
            reading: input.reading,
            writing: input.writing,
            maths: input.maths,
            science: input.science,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update local state
        setGrades(prev => prev.map(g => g.id === existing.id ? data : g));
        return data;
      } else {
        // Insert new grade
        const { data, error: insertError } = await supabase
          .from('student_grades')
          .insert({
            student_id: input.student_id,
            academic_year: input.academic_year,
            semester: input.semester,
            school_name: input.school_name,
            class_name: input.class_name,
            quiz1: input.quiz1,
            quiz2: input.quiz2,
            quiz3: input.quiz3,
            participation: input.participation,
            mid: input.mid,
            final: input.final,
            speaking: input.speaking,
            listening: input.listening,
            reading: input.reading,
            writing: input.writing,
            maths: input.maths,
            science: input.science,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update local state
        setGrades(prev => [...prev, data]);
        return data;
      }
    } catch (err) {
      console.error('Error saving grade:', err);
      throw err;
    }
  };

  const saveAllGrades = async (inputs: StudentGradeInput[]): Promise<number> => {
    let savedCount = 0;
    for (const input of inputs) {
      try {
        await saveGrade(input);
        savedCount++;
      } catch (err) {
        console.error('Error saving grade for student:', input.student_id, err);
      }
    }
    return savedCount;
  };

  // Convert grades array to Record for easy lookup by student_id
  const gradesMap: Record<string, StudentGrade> = {};
  grades.forEach(g => {
    gradesMap[g.student_id] = g;
  });

  return {
    grades,
    gradesMap,
    loading,
    error,
    saveGrade,
    saveAllGrades,
    refetch: fetchGrades,
  };
}
