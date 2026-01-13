import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ChevronRight, CheckCircle2, X, Bell } from 'lucide-react';
import { isReviewPeriod, getDaysUntilReviewEnd } from '../../services/teacherReviews.service';
import parentEngagementService from '../../services/parentEngagement.service';

interface EngagementReminderProps {
  parentId: string;
  onNavigateToReview: () => void;
  onNavigateToFeedback: () => void;
}

export const EngagementReminder: React.FC<EngagementReminderProps> = ({
  parentId,
  onNavigateToReview,
  onNavigateToFeedback
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [stats, setStats] = useState<{
    thisMonth: { teacherReviews: number; feedbackCount: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await parentEngagementService.getParentStats(parentId);
        setStats({ thisMonth: data.thisMonth });
      } catch (error) {
        console.error('Error loading parent stats:', error);
      }
      setLoading(false);
    };
    loadStats();
  }, [parentId]);

  // Check if dismissed this session
  useEffect(() => {
    const sessionKey = `engagement_reminder_dismissed_${new Date().toISOString().slice(0, 7)}`;
    if (sessionStorage.getItem(sessionKey)) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const sessionKey = `engagement_reminder_dismissed_${new Date().toISOString().slice(0, 7)}`;
    sessionStorage.setItem(sessionKey, 'true');
    setDismissed(true);
  };

  // Don't show if loading or dismissed
  if (loading || dismissed) return null;

  const inReviewPeriod = isReviewPeriod();
  const daysLeft = getDaysUntilReviewEnd();
  const hasReviewedThisMonth = (stats?.thisMonth.teacherReviews || 0) > 0;
  const hasFeedbackThisMonth = (stats?.thisMonth.feedbackCount || 0) > 0;

  // Don't show if both activities are done
  if (hasReviewedThisMonth && hasFeedbackThisMonth) return null;

  // Get current month name
  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long' });

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 mb-4 relative">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Tutup reminder"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Reminder Bulanan - {currentMonthName}
          </h3>
          
          <p className="text-xs text-gray-600 mb-3">
            Partisipasi Anda membantu kami meningkatkan kualitas pembelajaran.
          </p>

          <div className="space-y-2">
            {/* Teacher Review Task */}
            <TaskItem
              icon={<Star className="w-4 h-4" />}
              label="Review Guru"
              completed={hasReviewedThisMonth}
              onClick={onNavigateToReview}
              hint={inReviewPeriod ? `${daysLeft} hari tersisa` : 'Tersedia tanggal 25-31'}
              available={inReviewPeriod}
              color="yellow"
            />
            
            {/* Feedback Task */}
            <TaskItem
              icon={<MessageSquare className="w-4 h-4" />}
              label="Berikan Feedback"
              completed={hasFeedbackThisMonth}
              onClick={onNavigateToFeedback}
              hint="Sampaikan saran atau kritik"
              available={true}
              color="purple"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Item Component
const TaskItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  completed: boolean;
  onClick: () => void;
  hint: string;
  available: boolean;
  color: 'yellow' | 'purple';
}> = ({ icon, label, completed, onClick, hint, available, color }) => {
  if (completed) {
    return (
      <div className="flex items-center gap-3 py-2 px-3 bg-green-50 rounded-lg border border-green-100">
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        <span className="text-sm text-green-700 font-medium flex-1">{label}</span>
        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Selesai</span>
      </div>
    );
  }

  const colorStyles = {
    yellow: {
      icon: 'text-yellow-600',
      hover: 'hover:border-yellow-300 hover:bg-yellow-50'
    },
    purple: {
      icon: 'text-purple-600',
      hover: 'hover:border-purple-300 hover:bg-purple-50'
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={!available}
      className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all border ${
        available 
          ? `bg-white border-gray-200 ${colorStyles[color].hover}` 
          : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
      }`}
    >
      <span className={available ? colorStyles[color].icon : 'text-gray-400'}>
        {icon}
      </span>
      <div className="text-left flex-1 min-w-0">
        <div className={`text-sm font-medium ${available ? 'text-gray-900' : 'text-gray-500'}`}>
          {label}
        </div>
        <div className="text-xs text-gray-500 truncate">{hint}</div>
      </div>
      {available && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
    </button>
  );
};

export default EngagementReminder;
