// Database Types for ELC Management System
// Generated based on supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
          status: 'ACTIVE' | 'INACTIVE'
          photo_url: string | null
          branch: string | null
          teacher_notes: string | null
          needs_attention: boolean
          school_origin: string | null
          linked_student_id: string | null
          assigned_location_id: string | null
          assigned_location_ids: string[] | null
          assigned_subjects: string[]
          assigned_classes: string[]
          skill_levels: Json
          learning_hub_subscription: Json
          class_types: string[]
          class_type: string | null
          school: string | null
          class_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
          status?: 'ACTIVE' | 'INACTIVE'
          photo_url?: string | null
          branch?: string | null
          teacher_notes?: string | null
          needs_attention?: boolean
          school_origin?: string | null
          linked_student_id?: string | null
          assigned_location_id?: string | null
          assigned_location_ids?: string[] | null
          assigned_subjects?: string[]
          assigned_classes?: string[]
          skill_levels?: Json
          learning_hub_subscription?: Json
          class_types?: string[]
          class_type?: string | null
          school?: string | null
          class_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          role?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
          status?: 'ACTIVE' | 'INACTIVE'
          photo_url?: string | null
          branch?: string | null
          teacher_notes?: string | null
          needs_attention?: boolean
          school_origin?: string | null
          linked_student_id?: string | null
          assigned_location_id?: string | null
          assigned_location_ids?: string[] | null
          assigned_subjects?: string[]
          assigned_classes?: string[]
          skill_levels?: Json
          learning_hub_subscription?: Json
          class_types?: string[]
          class_type?: string | null
          school?: string | null
          class_name?: string | null
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string
          capacity: number
          level: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          capacity?: number
          level?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          capacity?: number
          level?: string | null
          updated_at?: string
        }
      }
      class_sessions: {
        Row: {
          id: string
          teacher_id: string
          topic: string
          date_time: string
          location: string
          location_id: string | null
          video_url: string | null
          description: string | null
          materials: string[]
          skill_category: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary'
          difficulty_level: 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced'
          has_exam: boolean
          exam_materials: string[]
          class_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          topic: string
          date_time: string
          location: string
          location_id?: string | null
          video_url?: string | null
          description?: string | null
          materials?: string[]
          skill_category: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary'
          difficulty_level: 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced'
          has_exam?: boolean
          exam_materials?: string[]
          class_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          topic?: string
          date_time?: string
          location?: string
          location_id?: string | null
          video_url?: string | null
          description?: string | null
          materials?: string[]
          skill_category?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary'
          difficulty_level?: 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced'
          has_exam?: boolean
          exam_materials?: string[]
          class_type?: string | null
          updated_at?: string
        }
      }
      session_reports: {
        Row: {
          id: string
          session_id: string
          student_id: string
          attendance_status: 'PRESENT' | 'ABSENT' | 'LATE' | null
          exam_score: number | null
          placement_result: string | null
          is_verified: boolean
          written_score: number | null
          oral_score: number | null
          cefr_level: string | null
          teacher_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          attendance_status?: 'PRESENT' | 'ABSENT' | 'LATE' | null
          exam_score?: number | null
          placement_result?: string | null
          is_verified?: boolean
          written_score?: number | null
          oral_score?: number | null
          cefr_level?: string | null
          teacher_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          attendance_status?: 'PRESENT' | 'ABSENT' | 'LATE' | null
          exam_score?: number | null
          placement_result?: string | null
          is_verified?: boolean
          written_score?: number | null
          oral_score?: number | null
          cefr_level?: string | null
          teacher_notes?: string | null
          updated_at?: string
        }
      }
      homeworks: {
        Row: {
          id: string
          session_id: string
          student_id: string
          title: string
          description: string | null
          due_date: string
          assigned_date: string
          status: 'PENDING' | 'SUBMITTED' | 'GRADED'
          submission_url: string | null
          score: number | null
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          title: string
          description?: string | null
          due_date: string
          assigned_date?: string
          status?: 'PENDING' | 'SUBMITTED' | 'GRADED'
          submission_url?: string | null
          score?: number | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          title?: string
          description?: string | null
          due_date?: string
          assigned_date?: string
          status?: 'PENDING' | 'SUBMITTED' | 'GRADED'
          submission_url?: string | null
          score?: number | null
          feedback?: string | null
          updated_at?: string
        }
      }
      teacher_attendance: {
        Row: {
          id: string
          teacher_id: string
          location_id: string | null
          check_in_time: string
          check_out_time: string | null
          latitude: number | null
          longitude: number | null
          location_name: string | null
          notes: string | null
          status: 'PRESENT' | 'LATE' | 'EARLY_LEAVE'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          location_id?: string | null
          check_in_time?: string
          check_out_time?: string | null
          latitude?: number | null
          longitude?: number | null
          location_name?: string | null
          notes?: string | null
          status?: 'PRESENT' | 'LATE' | 'EARLY_LEAVE'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          location_id?: string | null
          check_in_time?: string
          check_out_time?: string | null
          latitude?: number | null
          longitude?: number | null
          location_name?: string | null
          notes?: string | null
          status?: 'PRESENT' | 'LATE' | 'EARLY_LEAVE'
          updated_at?: string
        }
      }
      online_modules: {
        Row: {
          id: string
          title: string
          description: string | null
          video_url: string
          materials: string[]
          posted_date: string
          status: 'DRAFT' | 'PUBLISHED'
          skill_category: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary'
          difficulty_level: 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced'
          exams: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          video_url: string
          materials?: string[]
          posted_date?: string
          status?: 'DRAFT' | 'PUBLISHED'
          skill_category: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary'
          difficulty_level: 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced'
          exams?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          video_url?: string
          materials?: string[]
          posted_date?: string
          status?: 'DRAFT' | 'PUBLISHED'
          skill_category?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary'
          difficulty_level?: 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced'
          exams?: Json
          created_by?: string | null
          updated_at?: string
        }
      }
      student_module_progress: {
        Row: {
          id: string
          student_id: string
          module_id: string
          status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
          completed_date: string | null
          quiz_score: number | null
          placement_result: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          module_id: string
          status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
          completed_date?: string | null
          quiz_score?: number | null
          placement_result?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          module_id?: string
          status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
          completed_date?: string | null
          quiz_score?: number | null
          placement_result?: string | null
          updated_at?: string
        }
      }
      level_history: {
        Row: {
          id: string
          student_id: string
          date: string
          skill_category: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary'
          from_level: string | null
          to_level: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          date?: string
          skill_category: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary'
          from_level?: string | null
          to_level: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          date?: string
          skill_category?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary'
          from_level?: string | null
          to_level?: string
          reason?: string | null
        }
      }
      olympiads: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'UPCOMING' | 'OPEN' | 'CLOSED'
          start_date: string
          end_date: string
          event_date: string | null
          event_time: string | null
          event_location: string | null
          questions: Json
          reward: string | null
          participant_count: number
          price: number
          terms: string | null
          benefits: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'UPCOMING' | 'OPEN' | 'CLOSED'
          start_date: string
          end_date: string
          event_date?: string | null
          event_time?: string | null
          event_location?: string | null
          questions?: Json
          reward?: string | null
          participant_count?: number
          price?: number
          terms?: string | null
          benefits?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'UPCOMING' | 'OPEN' | 'CLOSED'
          start_date?: string
          end_date?: string
          event_date?: string | null
          event_time?: string | null
          event_location?: string | null
          questions?: Json
          reward?: string | null
          participant_count?: number
          price?: number
          terms?: string | null
          benefits?: Json
          is_active?: boolean
          updated_at?: string
        }
      }
      olympiad_registrations: {
        Row: {
          id: string
          olympiad_id: string
          name: string
          email: string
          wa: string
          personal_wa: string | null
          school: string
          grade: string
          school_origin: string | null
          dob: string | null
          address: string | null
          parent_name: string | null
          parent_wa: string | null
          status: 'PENDING' | 'SUCCESS'
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          olympiad_id: string
          name: string
          email: string
          wa: string
          personal_wa?: string | null
          school: string
          grade: string
          school_origin?: string | null
          dob?: string | null
          address?: string | null
          parent_name?: string | null
          parent_wa?: string | null
          status?: 'PENDING' | 'SUCCESS'
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          olympiad_id?: string
          name?: string
          email?: string
          wa?: string
          personal_wa?: string | null
          school?: string
          grade?: string
          school_origin?: string | null
          dob?: string | null
          address?: string | null
          parent_name?: string | null
          parent_wa?: string | null
          status?: 'PENDING' | 'SUCCESS'
          timestamp?: string
        }
      }
      olympiad_attempts: {
        Row: {
          id: string
          olympiad_id: string
          student_id: string
          answers: Json
          score: number | null
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          olympiad_id: string
          student_id: string
          answers?: Json
          score?: number | null
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          olympiad_id?: string
          student_id?: string
          answers?: Json
          score?: number | null
          completed_at?: string
        }
      }
      placement_submissions: {
        Row: {
          id: string
          name: string
          email: string
          grade: string
          wa: string
          personal_wa: string | null
          score: number
          cefr_result: string
          timestamp: string
          dob: string | null
          parent_name: string | null
          parent_wa: string | null
          address: string | null
          school_origin: string | null
          oral_test_status: 'none' | 'booked' | 'completed'
          oral_test_date: string | null
          oral_test_time: string | null
          oral_test_score: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          grade: string
          wa: string
          personal_wa?: string | null
          score: number
          cefr_result: string
          timestamp?: string
          dob?: string | null
          parent_name?: string | null
          parent_wa?: string | null
          address?: string | null
          school_origin?: string | null
          oral_test_status?: 'none' | 'booked' | 'completed'
          oral_test_date?: string | null
          oral_test_time?: string | null
          oral_test_score?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          grade?: string
          wa?: string
          personal_wa?: string | null
          score?: number
          cefr_result?: string
          timestamp?: string
          dob?: string | null
          parent_name?: string | null
          parent_wa?: string | null
          address?: string | null
          school_origin?: string | null
          oral_test_status?: 'none' | 'booked' | 'completed'
          oral_test_date?: string | null
          oral_test_time?: string | null
          oral_test_score?: string | null
          updated_at?: string
        }
      }
      placement_questions: {
        Row: {
          id: string
          text: string
          options: string[]
          correct_answer_index: number
          weight: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          text: string
          options: string[]
          correct_answer_index: number
          weight?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          text?: string
          options?: string[]
          correct_answer_index?: number
          weight?: number
          is_active?: boolean
        }
      }
      oral_test_slots: {
        Row: {
          id: string
          date: string
          time: string
          is_booked: boolean
          booked_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          time: string
          is_booked?: boolean
          booked_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          time?: string
          is_booked?: boolean
          booked_by?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          student_id: string | null
          student_name: string
          type: 'LEARNING_HUB' | 'OLYMPIAD'
          item_id: string
          item_name: string
          amount: number
          status: 'SUCCESS' | 'PENDING' | 'FAILED'
          timestamp: string
          payment_method: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id?: string | null
          student_name: string
          type: 'LEARNING_HUB' | 'OLYMPIAD'
          item_id: string
          item_name: string
          amount: number
          status?: 'SUCCESS' | 'PENDING' | 'FAILED'
          timestamp?: string
          payment_method?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          student_name?: string
          type?: 'LEARNING_HUB' | 'OLYMPIAD'
          item_id?: string
          item_name?: string
          amount?: number
          status?: 'SUCCESS' | 'PENDING' | 'FAILED'
          timestamp?: string
          payment_method?: string | null
        }
      }
      tuition_invoices: {
        Row: {
          id: string
          student_id: string
          student_name: string
          month: string
          amount: number
          status: 'PAID' | 'UNPAID'
          due_date: string
          reminded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          student_name: string
          month: string
          amount: number
          status?: 'PAID' | 'UNPAID'
          due_date: string
          reminded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          student_name?: string
          month?: string
          amount?: number
          status?: 'PAID' | 'UNPAID'
          due_date?: string
          reminded_at?: string | null
          updated_at?: string
        }
      }
      news: {
        Row: {
          id: string
          title: string
          featured_image: string
          video_url: string | null
          display_media: 'image' | 'video'
          content: string
          published_date: string
          summary: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          featured_image: string
          video_url?: string | null
          display_media?: 'image' | 'video'
          content: string
          published_date?: string
          summary?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          featured_image?: string
          video_url?: string | null
          display_media?: 'image' | 'video'
          content?: string
          published_date?: string
          summary?: string | null
          is_published?: boolean
          updated_at?: string
        }
      }
      student_of_the_month: {
        Row: {
          id: string
          name: string
          image: string
          achievement: string
          month_year: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          image: string
          achievement: string
          month_year: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          image?: string
          achievement?: string
          month_year?: string
        }
      }
      featured_teachers: {
        Row: {
          id: string
          name: string
          country: string
          country_flag: string | null
          type: 'native' | 'local' | null
          photo_url: string
          certifications: string[]
          experience: number | null
          specialty: string | null
          quote: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          country: string
          country_flag?: string | null
          type?: 'native' | 'local' | null
          photo_url: string
          certifications?: string[]
          experience?: number | null
          specialty?: string | null
          quote?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string
          country_flag?: string | null
          type?: 'native' | 'local' | null
          photo_url?: string
          certifications?: string[]
          experience?: number | null
          specialty?: string | null
          quote?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      teacher_applications: {
        Row: {
          id: string
          name: string
          dob: string
          experience: number
          has_degree: boolean
          country: string
          motivation: string | null
          salary: number | null
          type: 'local' | 'native' | null
          status: 'PENDING' | 'REVIEWED' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED'
          photo_url: string | null
          police_check_url: string | null
          applied_date: string
          is_converted: boolean
          days_per_week: number | null
          hours_per_week: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          dob: string
          experience: number
          has_degree?: boolean
          country: string
          motivation?: string | null
          salary?: number | null
          type?: 'local' | 'native' | null
          status?: 'PENDING' | 'REVIEWED' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED'
          photo_url?: string | null
          police_check_url?: string | null
          applied_date?: string
          is_converted?: boolean
          days_per_week?: number | null
          hours_per_week?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          dob?: string
          experience?: number
          has_degree?: boolean
          country?: string
          motivation?: string | null
          salary?: number | null
          type?: 'local' | 'native' | null
          status?: 'PENDING' | 'REVIEWED' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED'
          photo_url?: string | null
          police_check_url?: string | null
          applied_date?: string
          is_converted?: boolean
          days_per_week?: number | null
          hours_per_week?: number | null
          updated_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          primary_color: string
          accent_color: string
          video_url: string | null
          video_title: string
          video_description: string
          video_orientation: 'landscape' | 'portrait'
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          primary_color?: string
          accent_color?: string
          video_url?: string | null
          video_title?: string
          video_description?: string
          video_orientation?: 'landscape' | 'portrait'
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          primary_color?: string
          accent_color?: string
          video_url?: string | null
          video_title?: string
          video_description?: string
          video_orientation?: 'landscape' | 'portrait'
          updated_at?: string
          updated_by?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          user_role: string
          message: string
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_role: string
          message: string
          rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_role?: string
          message?: string
          rating?: number | null
        }
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string | null
          text: string
          type: 'MULTIPLE_CHOICE' | 'ESSAY'
          options: string[]
          correct_answer: string | null
          correct_answer_index: number | null
          time_limit: number
          skill_category: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary' | null
          difficulty_level: 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced' | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id?: string | null
          text: string
          type: 'MULTIPLE_CHOICE' | 'ESSAY'
          options?: string[]
          correct_answer?: string | null
          correct_answer_index?: number | null
          time_limit?: number
          skill_category?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary' | null
          difficulty_level?: 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced' | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string | null
          text?: string
          type?: 'MULTIPLE_CHOICE' | 'ESSAY'
          options?: string[]
          correct_answer?: string | null
          correct_answer_index?: number | null
          time_limit?: number
          skill_category?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Grammar' | 'Vocabulary' | null
          difficulty_level?: 'Starter' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced' | null
        }
      }
      kahoot_quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          is_active: boolean
          questions: Json
          play_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          is_active?: boolean
          questions?: Json
          play_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          is_active?: boolean
          questions?: Json
          play_count?: number
          created_by?: string | null
          updated_at?: string
        }
      }
      kahoot_participants: {
        Row: {
          id: string
          quiz_id: string
          name: string
          email: string | null
          score: number
          correct_answers: number
          total_questions: number
          time_spent: number
          completed_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          name: string
          email?: string | null
          score: number
          correct_answers: number
          total_questions: number
          time_spent: number
          completed_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          name?: string
          email?: string | null
          score?: number
          correct_answers?: number
          total_questions?: number
          time_spent?: number
          completed_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          student_id: string
          quiz_id: string | null
          skill_category: string
          attempted_difficulty: string
          final_placement: string
          score: number
          passed: boolean
          timestamp: string
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          quiz_id?: string | null
          skill_category: string
          attempted_difficulty: string
          final_placement: string
          score: number
          passed?: boolean
          timestamp?: string
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          quiz_id?: string | null
          skill_category?: string
          attempted_difficulty?: string
          final_placement?: string
          score?: number
          passed?: boolean
          timestamp?: string
          feedback?: string | null
        }
      }
      test_schedules: {
        Row: {
          id: string
          teacher_id: string | null
          test_type: 'QUIZ' | 'MID_SEMESTER' | 'FINAL_SEMESTER'
          title: string
          description: string | null
          date_time: string
          duration_minutes: number
          location: string
          class_name: string
          academic_year: string
          semester: string
          materials: string[]
          class_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id?: string | null
          test_type: 'QUIZ' | 'MID_SEMESTER' | 'FINAL_SEMESTER'
          title: string
          description?: string | null
          date_time: string
          duration_minutes?: number
          location: string
          class_name: string
          academic_year: string
          semester: string
          materials?: string[]
          class_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string | null
          test_type?: 'QUIZ' | 'MID_SEMESTER' | 'FINAL_SEMESTER'
          title?: string
          description?: string | null
          date_time?: string
          duration_minutes?: number
          location?: string
          class_name?: string
          academic_year?: string
          semester?: string
          materials?: string[]
          class_type?: string | null
          updated_at?: string
        }
      }
      student_grades: {
        Row: {
          id: string
          student_id: string
          academic_year: string
          semester: string
          school_name: string
          class_name: string
          quiz1: number | null
          quiz2: number | null
          quiz3: number | null
          participation: number | null
          mid: number | null
          final: number | null
          class_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          academic_year: string
          semester: string
          school_name: string
          class_name: string
          quiz1?: number | null
          quiz2?: number | null
          quiz3?: number | null
          participation?: number | null
          mid?: number | null
          final?: number | null
          class_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          academic_year?: string
          semester?: string
          school_name?: string
          class_name?: string
          quiz1?: number | null
          quiz2?: number | null
          quiz3?: number | null
          participation?: number | null
          mid?: number | null
          final?: number | null
          class_type?: string | null
          updated_at?: string
        }
      }
      teacher_reviews: {
        Row: {
          id: string
          teacher_id: string
          reviewer_id: string
          reviewer_role: 'STUDENT' | 'PARENT'
          review_month: string
          technology_rating: number
          punctuality_rating: number
          material_quality_rating: number
          english_encouragement_rating: number
          teaching_topics_rating: number
          pedagogic_rating: number
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          reviewer_id: string
          reviewer_role: 'STUDENT' | 'PARENT'
          review_month: string
          technology_rating: number
          punctuality_rating: number
          material_quality_rating: number
          english_encouragement_rating: number
          teaching_topics_rating: number
          pedagogic_rating: number
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          reviewer_id?: string
          reviewer_role?: 'STUDENT' | 'PARENT'
          review_month?: string
          technology_rating?: number
          punctuality_rating?: number
          material_quality_rating?: number
          english_encouragement_rating?: number
          teaching_topics_rating?: number
          pedagogic_rating?: number
          comments?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper type exports for convenience
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type ClassSession = Database['public']['Tables']['class_sessions']['Row']
export type SessionReport = Database['public']['Tables']['session_reports']['Row']
export type Homework = Database['public']['Tables']['homeworks']['Row']
export type OnlineModule = Database['public']['Tables']['online_modules']['Row']
export type StudentModuleProgress = Database['public']['Tables']['student_module_progress']['Row']
export type LevelHistory = Database['public']['Tables']['level_history']['Row']
export type Olympiad = Database['public']['Tables']['olympiads']['Row']
export type OlympiadRegistration = Database['public']['Tables']['olympiad_registrations']['Row']
export type OlympiadAttempt = Database['public']['Tables']['olympiad_attempts']['Row']
export type PlacementSubmission = Database['public']['Tables']['placement_submissions']['Row']
export type PlacementQuestion = Database['public']['Tables']['placement_questions']['Row']
export type OralTestSlot = Database['public']['Tables']['oral_test_slots']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TuitionInvoice = Database['public']['Tables']['tuition_invoices']['Row']
export type News = Database['public']['Tables']['news']['Row']
export type StudentOfTheMonth = Database['public']['Tables']['student_of_the_month']['Row']
export type FeaturedTeacher = Database['public']['Tables']['featured_teachers']['Row']
export type TeacherApplication = Database['public']['Tables']['teacher_applications']['Row']
export type SiteSettings = Database['public']['Tables']['site_settings']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row']
export type KahootQuiz = Database['public']['Tables']['kahoot_quizzes']['Row']
export type KahootParticipant = Database['public']['Tables']['kahoot_participants']['Row']
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row']
