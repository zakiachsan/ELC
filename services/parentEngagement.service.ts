import { supabase } from '../lib/supabase';

// Page names that can be tracked
export type ParentPageName = 'dashboard' | 'schedule' | 'activity' | 'exam-progress' | 'teacher-review' | 'feedback';

export interface ParentEngagementStats {
  parentId: string;
  parentName: string;
  parentEmail: string;
  studentName: string;
  studentId: string;

  // Counts
  sessions: number;
  pageViews: number;
  teacherReviews: number;
  feedbackCount: number;

  // Total engagement score
  totalEngagement: number;
}

// Helper function to count occurrences by key
function countBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce((acc, item) => {
    const k = String(item[key]);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// Helper to get first day of current month
export const getCurrentMonth = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

// Helper to format month string to readable format
export const formatMonth = (monthStr: string): string => {
  const date = new Date(monthStr);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

// Session storage key for current session ID
const SESSION_STORAGE_KEY = 'parent_engagement_session_id';

export const parentEngagementService = {
  // Get or create a session for the current browsing session
  async getOrCreateSession(parentId: string): Promise<string> {
    // Check if we already have a session ID in sessionStorage
    const existingSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (existingSessionId) {
      return existingSessionId;
    }

    // Create a new session
    const now = new Date();
    const sessionMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('parent_sessions')
      .insert({
        parent_id: parentId,
        session_month: sessionMonth,
        user_agent: navigator.userAgent
      } as any)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating session:', error);
      // Return a temporary ID if creation fails
      const tempId = `temp_${Date.now()}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, tempId);
      return tempId;
    }

    // Store session ID in sessionStorage
    sessionStorage.setItem(SESSION_STORAGE_KEY, data.id);
    return data.id;
  },

  // Track a page view
  async trackPageView(parentId: string, pageName: ParentPageName, pagePath?: string): Promise<void> {
    try {
      // Get or create session
      const sessionId = await this.getOrCreateSession(parentId);

      // Skip if we got a temp session ID (indicates DB insert failed)
      if (sessionId.startsWith('temp_')) {
        console.warn('Skipping page view tracking - session creation failed');
        return;
      }

      const now = new Date();
      const viewMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];

      const { error } = await supabase
        .from('parent_page_views')
        .insert({
          parent_id: parentId,
          session_id: sessionId,
          page_name: pageName,
          page_path: pagePath || null,
          view_month: viewMonth,
          viewed_at: now.toISOString()
        } as any);

      if (error) console.error('Error tracking page view:', error);
    } catch (err) {
      console.error('Error in trackPageView:', err);
    }
  },

  // Get cumulative engagement stats for all parents (for ranking)
  async getCumulativeRanking(): Promise<ParentEngagementStats[]> {
    // Get all parents with linked students
    const { data: parents, error: parentsError } = await supabase
      .from('profiles')
      .select('id, name, email, linked_student_id')
      .eq('role', 'PARENT')
      .not('linked_student_id', 'is', null);

    if (parentsError) throw parentsError;
    if (!parents || parents.length === 0) return [];

    // Get student names for linked students
    const studentIds = (parents as any[]).map(p => p.linked_student_id).filter(Boolean) as string[];
    const { data: students } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', studentIds);

    const studentMap = new Map((students as any[] || []).map(s => [s.id, s.name]));

    // Get session counts per parent
    const { data: sessionsData } = await supabase
      .from('parent_sessions')
      .select('parent_id');

    // Get page view counts per parent
    const { data: pageViewsData } = await supabase
      .from('parent_page_views')
      .select('parent_id');

    // Get teacher review counts per parent
    const { data: reviewsData } = await supabase
      .from('teacher_reviews')
      .select('reviewer_id')
      .eq('reviewer_role', 'PARENT');

    // Get feedback counts per parent
    const { data: feedbackData } = await supabase
      .from('feedback')
      .select('user_id, user_role')
      .eq('user_role', 'PARENT');

    // Aggregate counts
    const sessionCounts = countBy(sessionsData as any[] || [], 'parent_id');
    const pageViewCounts = countBy(pageViewsData as any[] || [], 'parent_id');
    const reviewCounts = countBy(reviewsData as any[] || [], 'reviewer_id');
    const feedbackCounts = countBy(feedbackData as any[] || [], 'user_id');

    return (parents as any[]).map(parent => ({
      parentId: parent.id,
      parentName: parent.name,
      parentEmail: parent.email,
      studentName: studentMap.get(parent.linked_student_id) || 'Unknown',
      studentId: parent.linked_student_id || '',
      sessions: sessionCounts[parent.id] || 0,
      pageViews: pageViewCounts[parent.id] || 0,
      teacherReviews: reviewCounts[parent.id] || 0,
      feedbackCount: feedbackCounts[parent.id] || 0,
      totalEngagement:
        (sessionCounts[parent.id] || 0) +
        (pageViewCounts[parent.id] || 0) +
        (reviewCounts[parent.id] || 0) +
        (feedbackCounts[parent.id] || 0)
    })).sort((a, b) => b.totalEngagement - a.totalEngagement);
  },

  // Get monthly engagement stats
  async getMonthlyRanking(month: string): Promise<ParentEngagementStats[]> {
    // Get all parents with linked students
    const { data: parents, error: parentsError } = await supabase
      .from('profiles')
      .select('id, name, email, linked_student_id')
      .eq('role', 'PARENT')
      .not('linked_student_id', 'is', null);

    if (parentsError) throw parentsError;
    if (!parents || parents.length === 0) return [];

    // Get student names for linked students
    const studentIds = (parents as any[]).map(p => p.linked_student_id).filter(Boolean) as string[];
    const { data: students } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', studentIds);

    const studentMap = new Map((students as any[] || []).map(s => [s.id, s.name]));

    // Get session counts for specific month
    const { data: sessionsData } = await supabase
      .from('parent_sessions')
      .select('parent_id')
      .eq('session_month', month);

    // Get page view counts for specific month
    const { data: pageViewsData } = await supabase
      .from('parent_page_views')
      .select('parent_id')
      .eq('view_month', month);

    // Get teacher review counts for specific month
    const { data: reviewsData } = await supabase
      .from('teacher_reviews')
      .select('reviewer_id')
      .eq('reviewer_role', 'PARENT')
      .eq('review_month', month);

    // Get feedback counts for specific month
    const startOfMonth = new Date(month);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const { data: feedbackData } = await supabase
      .from('feedback')
      .select('user_id, user_role')
      .eq('user_role', 'PARENT')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    // Aggregate counts
    const sessionCounts = countBy(sessionsData as any[] || [], 'parent_id');
    const pageViewCounts = countBy(pageViewsData as any[] || [], 'parent_id');
    const reviewCounts = countBy(reviewsData as any[] || [], 'reviewer_id');
    const feedbackCounts = countBy(feedbackData as any[] || [], 'user_id');

    return (parents as any[]).map(parent => ({
      parentId: parent.id,
      parentName: parent.name,
      parentEmail: parent.email,
      studentName: studentMap.get(parent.linked_student_id) || 'Unknown',
      studentId: parent.linked_student_id || '',
      sessions: sessionCounts[parent.id] || 0,
      pageViews: pageViewCounts[parent.id] || 0,
      teacherReviews: reviewCounts[parent.id] || 0,
      feedbackCount: feedbackCounts[parent.id] || 0,
      totalEngagement:
        (sessionCounts[parent.id] || 0) +
        (pageViewCounts[parent.id] || 0) +
        (reviewCounts[parent.id] || 0) +
        (feedbackCounts[parent.id] || 0)
    })).sort((a, b) => b.totalEngagement - a.totalEngagement);
  },

  // Get available months for filter (from sessions and reviews)
  async getAvailableMonths(): Promise<string[]> {
    // Get months from sessions
    const { data: sessionMonths } = await supabase
      .from('parent_sessions')
      .select('session_month')
      .order('session_month', { ascending: false });

    // Get months from reviews
    const { data: reviewMonths } = await supabase
      .from('teacher_reviews')
      .select('review_month')
      .eq('reviewer_role', 'PARENT')
      .order('review_month', { ascending: false });

    // Combine and deduplicate
    const allMonths = new Set<string>();
    (sessionMonths as any[] || []).forEach(d => allMonths.add(d.session_month));
    (reviewMonths as any[] || []).forEach(d => allMonths.add(d.review_month));

    // Always include current month
    allMonths.add(getCurrentMonth());

    return Array.from(allMonths).sort((a, b) => b.localeCompare(a));
  },

  // Get engagement stats for a specific parent (for their own view/reminder)
  async getParentStats(parentId: string): Promise<{
    cumulative: { sessions: number; pageViews: number; teacherReviews: number; feedbackCount: number; totalEngagement: number };
    thisMonth: { sessions: number; pageViews: number; teacherReviews: number; feedbackCount: number; totalEngagement: number };
  }> {
    const currentMonth = getCurrentMonth();
    const startOfMonth = new Date(currentMonth);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Cumulative counts
    const { count: totalSessions } = await supabase
      .from('parent_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', parentId);

    const { count: totalPageViews } = await supabase
      .from('parent_page_views')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', parentId);

    const { count: totalReviews } = await supabase
      .from('teacher_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewer_id', parentId);

    const { count: totalFeedback } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', parentId);

    // This month counts
    const { count: monthSessions } = await supabase
      .from('parent_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', parentId)
      .eq('session_month', currentMonth);

    const { count: monthPageViews } = await supabase
      .from('parent_page_views')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', parentId)
      .eq('view_month', currentMonth);

    const { count: monthReviews } = await supabase
      .from('teacher_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewer_id', parentId)
      .eq('review_month', currentMonth);

    const { count: monthFeedback } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', parentId)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    return {
      cumulative: {
        sessions: totalSessions || 0,
        pageViews: totalPageViews || 0,
        teacherReviews: totalReviews || 0,
        feedbackCount: totalFeedback || 0,
        totalEngagement: (totalSessions || 0) + (totalPageViews || 0) + (totalReviews || 0) + (totalFeedback || 0)
      },
      thisMonth: {
        sessions: monthSessions || 0,
        pageViews: monthPageViews || 0,
        teacherReviews: monthReviews || 0,
        feedbackCount: monthFeedback || 0,
        totalEngagement: (monthSessions || 0) + (monthPageViews || 0) + (monthReviews || 0) + (monthFeedback || 0)
      }
    };
  },

  // Get page view breakdown by page name (for analytics)
  async getPageViewBreakdown(parentId?: string, month?: string): Promise<Record<string, number>> {
    let query = supabase
      .from('parent_page_views')
      .select('page_name');

    if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    if (month) {
      query = query.eq('view_month', month);
    }

    const { data } = await query;

    return countBy(data as any[] || [], 'page_name');
  }
};

export default parentEngagementService;
