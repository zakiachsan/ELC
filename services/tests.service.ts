import { supabase, supabaseAdmin } from '../lib/supabase';

export type TestType = 'QUIZ' | 'MID_SEMESTER' | 'FINAL_SEMESTER';

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
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
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
};

export default testsService;
