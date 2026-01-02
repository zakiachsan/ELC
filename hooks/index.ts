// Export all hooks
export { useProfiles, useStudents, useTeachers, useParents, useLocations } from './useProfiles';
export { useSessions, useUpcomingSessions, useTodaySessions } from './useSessions';
export { useReports, useStudentStats } from './useReports';
export { useHomeworks, usePendingHomeworks } from './useHomeworks';
export { useModules, useStudentProgress } from './useModules';
export { useOlympiads, useOlympiadRegistrations, useKahootQuizzes } from './useOlympiads';
export { useTransactions, useInvoices, useInvoiceStats } from './useBilling';
export { useNews, useStudentsOfMonth, useFeaturedTeachers, useTeacherApplications } from './useContent';
export { usePlacementSubmissions, usePlacementQuestions, useOralTestSlots } from './usePlacement';
export { useSiteSettings, useLevelHistory, useQuizAttempts } from './useSettings';

// Re-export auth hook from context
export { useAuth } from '../contexts/AuthContext';
