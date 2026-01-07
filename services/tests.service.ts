import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export type TestType = 'QUIZ' | 'MID_SEMESTER' | 'FINAL_SEMESTER';
export type QuestionType = 'MULTIPLE_CHOICE' | 'ESSAY';

// Database types
type TestQuestionRow = Database['public']['Tables']['test_questions']['Row'];
type TestQuestionInsert = Database['public']['Tables']['test_questions']['Insert'];
type TestQuestionUpdate = Database['public']['Tables']['test_questions']['Update'];
type TestSubmissionRow = Database['public']['Tables']['test_submissions']['Row'];
type TestSubmissionInsert = Database['public']['Tables']['test_submissions']['Insert'];
type TestSubmissionUpdate = Database['public']['Tables']['test_submissions']['Update'];
type TestAnswerRow = Database['public']['Tables']['test_answers']['Row'];
type TestAnswerInsert = Database['public']['Tables']['test_answers']['Insert'];
type TestAnswerUpdate = Database['public']['Tables']['test_answers']['Update'];

export interface TestSchedule {
  id: string;
  teacher_id: string | null;
  test_type: TestType;
  title: string;
  description: string | null;
  date_time: string;
  duration_minutes: number;
  location: string;
  class_name: string;
  academic_year: string;
  semester: string;
  materials: string[];
  class_type?: string;
  has_online_test?: boolean;
  is_published?: boolean;
  quiz_number?: number | null;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  questions?: TestQuestionRow[];
}

export interface TestScheduleInsert {
  teacher_id?: string | null;
  test_type: TestType;
  title: string;
  description?: string | null;
  date_time: string;
  duration_minutes?: number;
  location: string;
  class_name: string;
  academic_year: string;
  semester: string;
  materials?: string[];
  class_type?: string;
  has_online_test?: boolean;
  is_published?: boolean;
  quiz_number?: number | null;
}

export interface TestScheduleUpdate {
  test_type?: TestType;
  title?: string;
  description?: string | null;
  date_time?: string;
  duration_minutes?: number;
  location?: string;
  class_name?: string;
  academic_year?: string;
  semester?: string;
  materials?: string[];
  class_type?: string;
  has_online_test?: boolean;
  is_published?: boolean;
  quiz_number?: number | null;
}

// Parsed question from import
export interface ParsedQuestion {
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswerIndex?: number;
  answerKey?: string;
  points?: number;
}

export const testsService = {
  // Get all tests
  async getAll() {
    const { data, error } = await supabase
      .from('test_schedules')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email)
      `)
      .order('date_time', { ascending: false });

    if (error) throw error;
    return data as TestSchedule[];
  },

  // Get test by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('test_schedules')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as TestSchedule;
  },

  // Get tests by teacher
  async getByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('test_schedules')
      .select(`*`)
      .eq('teacher_id', teacherId)
      .order('date_time', { ascending: false });

    if (error) throw error;
    return data as TestSchedule[];
  },

  // Get tests by location (school)
  async getByLocation(location: string) {
    const { data, error } = await supabase
      .from('test_schedules')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email)
      `)
      .eq('location', location)
      .order('date_time', { ascending: false });

    if (error) throw error;
    return data as TestSchedule[];
  },

  // Get tests by location and class
  async getByLocationAndClass(location: string, className: string) {
    const { data, error } = await supabase
      .from('test_schedules')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email)
      `)
      .eq('location', location)
      .eq('class_name', className)
      .order('date_time', { ascending: false });

    if (error) throw error;
    return data as TestSchedule[];
  },

  // Get upcoming tests
  async getUpcoming(limit?: number) {
    let query = supabase
      .from('test_schedules')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email)
      `)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as TestSchedule[];
  },

  // Get past tests
  async getPast(limit?: number) {
    let query = supabase
      .from('test_schedules')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email)
      `)
      .lt('date_time', new Date().toISOString())
      .order('date_time', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as TestSchedule[];
  },

  // Get tests by academic year and semester
  async getByAcademicPeriod(academicYear: string, semester: string, location?: string) {
    let query = supabase
      .from('test_schedules')
      .select(`
        *,
        teacher:profiles!teacher_id(id, name, email)
      `)
      .eq('academic_year', academicYear)
      .eq('semester', semester);

    if (location) {
      query = query.eq('location', location);
    }

    const { data, error } = await query.order('date_time', { ascending: true });
    if (error) throw error;
    return data as TestSchedule[];
  },

  // Create test (uses admin client to bypass RLS)
  async create(test: TestScheduleInsert) {
    const { data, error } = await supabaseAdmin
      .from('test_schedules')
      .insert(test as any)
      .select()
      .single();

    if (error) throw error;
    return data as TestSchedule;
  },

  // Update test (uses admin client to bypass RLS)
  async update(id: string, updates: TestScheduleUpdate) {
    const { data, error } = await supabaseAdmin
      .from('test_schedules')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TestSchedule;
  },

  // Delete test (uses admin client to bypass RLS)
  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('test_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ============================================
  // QUESTION METHODS
  // ============================================

  // Get questions for a test
  async getQuestions(testScheduleId: string) {
    const { data, error } = await supabase
      .from('test_questions')
      .select('*')
      .eq('test_schedule_id', testScheduleId)
      .order('question_order', { ascending: true });

    if (error) throw error;
    return data as TestQuestionRow[];
  },

  // Get single question
  async getQuestion(questionId: string) {
    const { data, error } = await supabase
      .from('test_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) throw error;
    return data as TestQuestionRow;
  },

  // Create question
  async createQuestion(question: TestQuestionInsert) {
    const { data, error } = await supabaseAdmin
      .from('test_questions')
      .insert(question as any)
      .select()
      .single();

    if (error) throw error;

    // Update test to mark it has online test
    await supabaseAdmin
      .from('test_schedules')
      .update({ has_online_test: true })
      .eq('id', question.test_schedule_id);

    return data as TestQuestionRow;
  },

  // Create multiple questions
  async createQuestions(questions: TestQuestionInsert[]) {
    if (questions.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from('test_questions')
      .insert(questions as any[])
      .select();

    if (error) throw error;

    // Update test to mark it has online test
    if (questions.length > 0) {
      await supabaseAdmin
        .from('test_schedules')
        .update({ has_online_test: true })
        .eq('id', questions[0].test_schedule_id);
    }

    return data as TestQuestionRow[];
  },

  // Update question
  async updateQuestion(questionId: string, updates: TestQuestionUpdate) {
    const { data, error } = await supabaseAdmin
      .from('test_questions')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;
    return data as TestQuestionRow;
  },

  // Delete question
  async deleteQuestion(questionId: string) {
    const { error } = await supabaseAdmin
      .from('test_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;
  },

  // Reorder questions
  async reorderQuestions(testScheduleId: string, questionIds: string[]) {
    const updates = questionIds.map((id, index) => ({
      id,
      question_order: index + 1,
    }));

    for (const update of updates) {
      await supabaseAdmin
        .from('test_questions')
        .update({ question_order: update.question_order })
        .eq('id', update.id);
    }
  },

  // ============================================
  // SUBMISSION METHODS
  // ============================================

  // Get submissions for a test
  async getSubmissions(testScheduleId: string) {
    const { data, error } = await supabase
      .from('test_submissions')
      .select(`
        *,
        student:profiles!student_id(id, name, email)
      `)
      .eq('test_schedule_id', testScheduleId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get submission by student
  async getSubmissionByStudent(testScheduleId: string, studentId: string) {
    const { data, error } = await supabase
      .from('test_submissions')
      .select('*')
      .eq('test_schedule_id', testScheduleId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw error;
    return data as TestSubmissionRow | null;
  },

  // Get submission with answers
  async getSubmissionWithAnswers(submissionId: string) {
    const { data: submission, error: subError } = await supabase
      .from('test_submissions')
      .select(`
        *,
        student:profiles!student_id(id, name, email)
      `)
      .eq('id', submissionId)
      .single();

    if (subError) throw subError;

    const { data: answers, error: ansError } = await supabase
      .from('test_answers')
      .select(`
        *,
        question:test_questions!question_id(*)
      `)
      .eq('submission_id', submissionId);

    if (ansError) throw ansError;

    return { ...submission, answers };
  },

  // Start test (create submission)
  async startTest(testScheduleId: string, studentId: string) {
    // Check if submission already exists
    const existing = await this.getSubmissionByStudent(testScheduleId, studentId);
    if (existing) return existing;

    const { data, error } = await supabaseAdmin
      .from('test_submissions')
      .insert({
        test_schedule_id: testScheduleId,
        student_id: studentId,
        status: 'IN_PROGRESS',
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as TestSubmissionRow;
  },

  // Submit test
  async submitTest(submissionId: string) {
    const { data, error } = await supabaseAdmin
      .from('test_submissions')
      .update({
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data as TestSubmissionRow;
  },

  // Grade submission (for essay questions)
  async gradeSubmission(submissionId: string, graderId: string) {
    const { data, error } = await supabaseAdmin
      .from('test_submissions')
      .update({
        status: 'GRADED',
        graded_at: new Date().toISOString(),
        graded_by: graderId,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data as TestSubmissionRow;
  },

  // ============================================
  // ANSWER METHODS
  // ============================================

  // Get answers for a submission
  async getAnswers(submissionId: string) {
    const { data, error } = await supabase
      .from('test_answers')
      .select(`
        *,
        question:test_questions!question_id(*)
      `)
      .eq('submission_id', submissionId);

    if (error) throw error;
    return data;
  },

  // Save answer (upsert)
  async saveAnswer(answer: TestAnswerInsert) {
    const { data, error } = await supabaseAdmin
      .from('test_answers')
      .upsert(answer as any, {
        onConflict: 'submission_id,question_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data as TestAnswerRow;
  },

  // Save multiple answers
  async saveAnswers(answers: TestAnswerInsert[]) {
    if (answers.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from('test_answers')
      .upsert(answers as any[], {
        onConflict: 'submission_id,question_id',
      })
      .select();

    if (error) throw error;
    return data as TestAnswerRow[];
  },

  // Grade essay answer
  async gradeEssayAnswer(answerId: string, score: number, feedback?: string) {
    const { data, error } = await supabaseAdmin
      .from('test_answers')
      .update({
        score,
        teacher_feedback: feedback,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', answerId)
      .select()
      .single();

    if (error) throw error;
    return data as TestAnswerRow;
  },

  // ============================================
  // IMPORT FROM DOCS
  // ============================================

  /**
   * Parse text content into questions
   * Format supported:
   *
   * [PG] or [MC] - Multiple Choice
   * What is the capital of France?
   * A. London
   * B. Paris *
   * C. Berlin
   * D. Madrid
   *
   * [ESSAY] - Essay question
   * Explain the importance of English learning.
   *
   * The * marks the correct answer for MC questions
   */
  parseQuestionsFromText(text: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let currentQuestion: Partial<ParsedQuestion> | null = null;
    let options: string[] = [];
    let correctIndex: number | undefined;

    const saveCurrentQuestion = () => {
      if (currentQuestion && currentQuestion.text) {
        if (currentQuestion.type === 'MULTIPLE_CHOICE' && options.length > 0) {
          questions.push({
            type: 'MULTIPLE_CHOICE',
            text: currentQuestion.text,
            options: options,
            correctAnswerIndex: correctIndex,
            points: currentQuestion.points || 1,
          });
        } else if (currentQuestion.type === 'ESSAY') {
          questions.push({
            type: 'ESSAY',
            text: currentQuestion.text,
            answerKey: currentQuestion.answerKey,
            points: currentQuestion.points || 5,
          });
        }
      }
      currentQuestion = null;
      options = [];
      correctIndex = undefined;
    };

    for (const line of lines) {
      // Check for question type markers
      const mcMatch = line.match(/^\[(PG|MC|PILGAN)\]/i);
      const essayMatch = line.match(/^\[(ESSAY|ESAI)\]/i);

      if (mcMatch) {
        saveCurrentQuestion();
        const questionText = line.replace(/^\[(PG|MC|PILGAN)\]\s*/i, '').trim();
        currentQuestion = { type: 'MULTIPLE_CHOICE', text: questionText };
        continue;
      }

      if (essayMatch) {
        saveCurrentQuestion();
        const questionText = line.replace(/^\[(ESSAY|ESAI)\]\s*/i, '').trim();
        currentQuestion = { type: 'ESSAY', text: questionText };
        continue;
      }

      // Check for options (A. B. C. D. or A) B) C) D))
      const optionMatch = line.match(/^([A-D])[.)]\s*(.+)/i);
      if (optionMatch && currentQuestion?.type === 'MULTIPLE_CHOICE') {
        const optionLetter = optionMatch[1].toUpperCase();
        let optionText = optionMatch[2].trim();
        const isCorrect = optionText.endsWith('*');
        if (isCorrect) {
          optionText = optionText.slice(0, -1).trim();
          correctIndex = 'ABCD'.indexOf(optionLetter);
        }
        options.push(optionText);
        continue;
      }

      // If we have a current question and this line isn't an option, append to question text
      if (currentQuestion && !optionMatch) {
        // Check if this might be answer key for essay
        const answerKeyMatch = line.match(/^(KUNCI|KEY|JAWABAN):\s*(.+)/i);
        if (answerKeyMatch && currentQuestion.type === 'ESSAY') {
          currentQuestion.answerKey = answerKeyMatch[2].trim();
        } else if (currentQuestion.text) {
          // Continue question text
          currentQuestion.text += ' ' + line;
        } else {
          currentQuestion.text = line;
        }
      }
    }

    // Don't forget the last question
    saveCurrentQuestion();

    return questions;
  },

  // Import questions from parsed text to a test
  async importQuestions(testScheduleId: string, parsedQuestions: ParsedQuestion[]) {
    const questions: TestQuestionInsert[] = parsedQuestions.map((q, index) => ({
      test_schedule_id: testScheduleId,
      question_order: index + 1,
      question_type: q.type,
      question_text: q.text,
      options: q.options || [],
      correct_answer_index: q.correctAnswerIndex ?? null,
      answer_key: q.answerKey || null,
      points: q.points || (q.type === 'ESSAY' ? 5 : 1),
    }));

    return this.createQuestions(questions);
  },

  // Get test with questions (for taking test)
  async getTestWithQuestions(testScheduleId: string) {
    const test = await this.getById(testScheduleId);
    const questions = await this.getQuestions(testScheduleId);
    return { ...test, questions };
  },

  // Publish/unpublish test
  async publishTest(testScheduleId: string, publish: boolean) {
    const { data, error } = await supabaseAdmin
      .from('test_schedules')
      .update({ is_published: publish, updated_at: new Date().toISOString() } as any)
      .eq('id', testScheduleId)
      .select()
      .single();

    if (error) throw error;
    return data as TestSchedule;
  },

  // Get student's test results
  async getStudentResults(studentId: string) {
    const { data, error } = await supabase
      .from('test_submissions')
      .select(`
        *,
        test:test_schedules!test_schedule_id(id, title, test_type, location, class_name, date_time)
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get test statistics
  async getTestStatistics(testScheduleId: string) {
    const submissions = await this.getSubmissions(testScheduleId);
    const questions = await this.getQuestions(testScheduleId);

    const totalStudents = submissions.length;
    const completedSubmissions = submissions.filter(s => s.status !== 'IN_PROGRESS');
    const gradedSubmissions = submissions.filter(s => s.status === 'GRADED');

    const scores = gradedSubmissions
      .filter(s => s.total_score !== null && s.max_score !== null)
      .map(s => (s.total_score! / s.max_score!) * 100);

    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      totalQuestions: questions.length,
      totalStudents,
      submittedCount: completedSubmissions.length,
      gradedCount: gradedSubmissions.length,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore: Math.round(highestScore * 100) / 100,
      lowestScore: Math.round(lowestScore * 100) / 100,
    };
  },
};

export default testsService;
