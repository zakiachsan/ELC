import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { UserRole, User } from '../types';
import { MOCK_USERS } from '../constants';

// Components
import { NotFound } from '../components/NotFound';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Homepage } from '../components/Homepage';
import { AdminLogin } from '../components/AdminLogin';

// Wrapper component for news article route to pass articleSlug prop
const NewsArticleWrapper: React.FC<{ onLoginSuccess: (role: UserRole, email?: string) => void }> = ({ onLoginSuccess }) => {
  const { articleSlug } = useParams<{ articleSlug: string }>();
  return <Homepage onLoginSuccess={onLoginSuccess} articleSlug={articleSlug} />;
};

// Wrapper component for CEFR placement test routes
const PlacementTestWrapper: React.FC<{
  onLoginSuccess: (role: UserRole, email?: string) => void;
  step: 'form' | 'quiz' | 'result' | 'schedule' | 'scheduled';
}> = ({ onLoginSuccess, step }) => {
  return <Homepage onLoginSuccess={onLoginSuccess} initialSection="test" placementStep={step} />;
};

// Admin Components
import { AccountManager } from '../components/admin/FamilyCreator';
import { ScheduleManager } from '../components/admin/ScheduleManager';
import { StudentList } from '../components/admin/StudentList';
import { StudentDetail } from '../components/admin/StudentDetail';
import { LocationManager } from '../components/admin/LocationManager';
import { SiteSettings } from '../components/admin/SiteSettings';
import { OlympiadManager } from '../components/admin/OlympiadManager';
import { TransactionManager } from '../components/admin/TransactionManager';
import { PlacementTestManager } from '../components/admin/PlacementTestManager';
import { NewsManager } from '../components/admin/NewsManager';
import { StudentOfMonthManager } from '../components/admin/StudentOfMonthManager';
import { TeacherApplicationManager } from '../components/admin/TeacherApplicationManager';
import { BillingManager } from '../components/admin/BillingManager';
import { KahootManager } from '../components/admin/KahootManager';
import { TeacherManager } from '../components/admin/TeacherManager';
import { ReviewManager } from '../components/admin/ReviewManager';
import { TestScheduleManager } from '../components/admin/TestScheduleManager';

// Teacher Components
import { TeacherView } from '../components/teacher/TeacherView';
import { SessionManager } from '../components/teacher/SessionManager';
import { StudentGrades } from '../components/teacher/StudentGrades';
import { OnlineMaterialsManager } from '../components/teacher/OnlineMaterialsManager';
import { TeacherAttendance } from '../components/teacher/TeacherAttendance';
import { TestManager } from '../components/teacher/TestManager';
import { TestCreator } from '../components/teacher/TestCreator';
import { TestDetail } from '../components/teacher/TestDetail';
import { StudentManager as TeacherStudentManager } from '../components/teacher/StudentManager';

// Student Components
import { StudentView } from '../components/student/StudentView';
import { StudentSchedule } from '../components/student/StudentSchedule';
import { StudentProgress } from '../components/student/StudentProgress';
import { StudentOnlineLearning } from '../components/student/StudentOnlineLearning';
import { StudentGradesView } from '../components/student/StudentGradesView';
import { TeacherReview as StudentTeacherReview } from '../components/student/TeacherReview';
import { OnlineTest } from '../components/student/OnlineTest';

// Parent Components
import { ParentOverview, ParentSchedule, ParentActivityLog } from '../components/parent/ParentDashboard';
import { ParentTeacherReview } from '../components/parent/TeacherReview';

// Shared Components
import { FeedbackForm } from '../components/shared/FeedbackForm';

interface AppRoutesProps {
  isAuthenticated: boolean;
  currentUser: User;
  onLogin: (role: UserRole, email?: string) => void;
  onLogout: () => void;
}

// Wrapper component for dashboard routes
const DashboardWrapper: React.FC<{
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
}> = ({ children, currentUser, onLogout }) => (
  <DashboardLayout
    currentUser={currentUser}
    onLogout={onLogout}
  >
    {children}
  </DashboardLayout>
);

// Teacher Dashboard with navigation handler
const TeacherDashboardWrapper: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  return <TeacherView onNavigate={onNavigate} />;
};

export const AppRoutes: React.FC<AppRoutesProps> = ({
  isAuthenticated,
  currentUser,
  onLogin,
  onLogout,
}) => {
  // Get linked student for parent view
  const linkedStudent = currentUser.role === UserRole.PARENT
    ? MOCK_USERS.find(u => u.id === currentUser.linkedStudentId)
    : null;

  // Handler for teacher navigation (converts view to route)
  const handleTeacherNavigate = (view: string) => {
    // This is handled by the router now, so we just need to navigate
    window.location.href = `/teacher/${view === 'default' ? 'dashboard' : view}`;
  };

  return (
    <Routes>
      {/* Public Routes - Homepage always accessible */}
      <Route
        path="/"
        element={<Homepage onLoginSuccess={onLogin} />}
      />

      {/* Admin Login - Separate entry point */}
      <Route
        path="/admin-login"
        element={<AdminLogin />}
      />

      {/* Public Section Routes */}
      <Route
        path="/live-quiz"
        element={<Homepage onLoginSuccess={onLogin} initialSection="quiz" />}
      />
      <Route
        path="/olympiad"
        element={<Homepage onLoginSuccess={onLogin} initialSection="olympiad" />}
      />
      <Route
        path="/cefr"
        element={<Homepage onLoginSuccess={onLogin} initialSection="test" />}
      />
      {/* CEFR Placement Test Sub-Routes */}
      <Route
        path="/cefr/form"
        element={<PlacementTestWrapper onLoginSuccess={onLogin} step="form" />}
      />
      <Route
        path="/cefr/quiz"
        element={<PlacementTestWrapper onLoginSuccess={onLogin} step="quiz" />}
      />
      <Route
        path="/cefr/result"
        element={<PlacementTestWrapper onLoginSuccess={onLogin} step="result" />}
      />
      <Route
        path="/cefr/schedule"
        element={<PlacementTestWrapper onLoginSuccess={onLogin} step="schedule" />}
      />
      <Route
        path="/cefr/scheduled"
        element={<PlacementTestWrapper onLoginSuccess={onLogin} step="scheduled" />}
      />
      <Route
        path="/hall-of-fame"
        element={<Homepage onLoginSuccess={onLogin} initialSection="hall-of-fame" />}
      />
      <Route
        path="/news"
        element={<Homepage onLoginSuccess={onLogin} initialSection="news" />}
      />
      <Route
        path="/news/:articleSlug"
        element={<NewsArticleWrapper onLoginSuccess={onLogin} />}
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            userRole={currentUser.role}
            allowedRoles={[UserRole.ADMIN]}
          >
            <Navigate to="/admin/accounts" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounts"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <AccountManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentList />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:studentId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentDetail />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TeacherManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedule"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <ScheduleManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/test-schedule"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TestScheduleManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/locations"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <LocationManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/placement"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <PlacementTestManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kahoot"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <KahootManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/olympiad"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <OlympiadManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/careers"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TeacherApplicationManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/billing"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <BillingManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TransactionManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <SiteSettings />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/news"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <NewsManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/student-of-month"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentOfMonthManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.ADMIN]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <ReviewManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <Navigate to="/teacher/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TeacherDashboardWrapper onNavigate={handleTeacherNavigate} />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/schedule"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <SessionManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/schedule/:schoolId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <SessionManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/schedule/:schoolId/:classId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <SessionManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/grades"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentGrades />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/grades/:schoolId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentGrades />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/grades/:schoolId/:classId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentGrades />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/tests"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TestManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/tests/create"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <TestCreator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/tests/edit/:testId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <TestCreator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/tests/detail/:testId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <TestDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/tests/:schoolId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TestManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/tests/:schoolId/:classId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TestManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/materials"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <OnlineMaterialsManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TeacherAttendance />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.TEACHER]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <TeacherStudentManager />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.STUDENT]}>
            <Navigate to="/student/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.STUDENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentView student={currentUser} />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/schedule"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.STUDENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentSchedule />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/progress"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.STUDENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentProgress student={currentUser} />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/learning"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.STUDENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentOnlineLearning student={currentUser} />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/grades"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.STUDENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentGradesView student={currentUser} />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/feedback"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.STUDENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <FeedbackForm user={currentUser} />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/review"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.STUDENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <StudentTeacherReview />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/test/:testId"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.STUDENT]}>
            <OnlineTest />
          </ProtectedRoute>
        }
      />

      {/* Parent Routes */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.PARENT]}>
            <Navigate to="/parent/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.PARENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              {linkedStudent ? <ParentOverview student={linkedStudent} /> : <div>No student linked</div>}
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/schedule"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.PARENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              {linkedStudent ? <ParentSchedule student={linkedStudent} /> : <div>No student linked</div>}
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/history"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.PARENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              {linkedStudent ? <ParentActivityLog student={linkedStudent} /> : <div>No student linked</div>}
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/feedback"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.PARENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <FeedbackForm user={currentUser} />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/review"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser.role} allowedRoles={[UserRole.PARENT]}>
            <DashboardWrapper currentUser={currentUser} onLogout={onLogout}>
              <ParentTeacherReview />
            </DashboardWrapper>
          </ProtectedRoute>
        }
      />

      {/* 404 - Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
