
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, ClassSession, SkillCategory, DifficultyLevel, ClassType, OlympiadStatus, CompetitionType, COMPETITION_TYPE_LABELS, COMPETITION_TYPE_COLORS } from '../../types';
import { LEVEL_COLORS } from '../../constants';
import { TrendingUp, Calendar, CheckCircle, Clock, MapPin, AlertTriangle, BookOpen, Brain, List, Activity, History, Award, FileText, PenLine, Mic, ClipboardCheck, Play, X, Loader2, Phone, Edit2, Check, ChevronRight, Download, User as UserIcon, Lock, Globe, UserCheck, Trophy, ExternalLink } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useSessions } from '../../hooks/useSessions';
import { useReports, useStudentStats } from '../../hooks/useReports';
import { useHomeworks } from '../../hooks/useHomeworks';
import { useAuth } from '../../contexts/AuthContext';
import { useTests } from '../../hooks/useTests';
import { useOlympiads } from '../../hooks/useOlympiads';
import { supabase } from '../../lib/supabase';
import { TestSchedule, TestType } from '../../services/tests.service';
import { Link, useNavigate } from 'react-router-dom';
import { EngagementReminder } from './EngagementReminder';
import parentEngagementService from '../../services/parentEngagement.service';

// --- SHARED DATA HOOK (using real Supabase data) ---
const useParentData = (student: User) => {
  // Fetch all sessions
  const { sessions: allSessions, loading: sessionsLoading } = useSessions();
  // Fetch reports for this student
  const { reports: studentReports, loading: reportsLoading } = useReports({ studentId: student.id });
  // Fetch homeworks for this student
  const { homeworks: studentHomeworks, loading: homeworksLoading } = useHomeworks({ studentId: student.id });
  // Fetch student stats
  const { stats, loading: statsLoading } = useStudentStats(student.id);

  const loading = sessionsLoading || reportsLoading || homeworksLoading || statsLoading;

  // Create a map of reports by session_id for quick lookup
  const reportsBySession = useMemo(() => {
    const map: Record<string, typeof studentReports[0]> = {};
    studentReports.forEach(r => {
      map[r.session_id] = r;
    });
    return map;
  }, [studentReports]);

  // 1. Attendance Logic (from stats)
  const attendanceRate = stats?.attendance.attendanceRate ?? 0;
  const presentCount = stats?.attendance.present ?? 0;
  const lateCount = stats?.attendance.late ?? 0;
  const absentCount = stats?.attendance.absent ?? 0;

  // 2. Get all session reports for this student with scores
  const sessionGrades = useMemo(() => {
    return allSessions
      .filter(s => new Date(s.date_time) <= new Date())
      .map(s => {
        const report = reportsBySession[s.id];
        if (!report) return null;
        return {
          sessionId: s.id,
          date: s.date_time,
          topic: s.topic,
          skillCategory: s.skill_category,
          writtenScore: report.written_score,
          oralScore: report.oral_score,
          cefrLevel: report.cefr_level,
          teacherNotes: report.teacher_notes
        };
      })
      .filter(Boolean);
  }, [allSessions, reportsBySession]);

  // 3. CEFR progression chart data
  const cefrChartData = useMemo(() => {
    return sessionGrades
      .filter(g => g?.cefrLevel)
      .map(g => {
        const cefrOrder: Record<string, number> = {
          'A1 - Beginner': 1,
          'A2 - Elementary': 2,
          'B1 - Intermediate': 3,
          'B2 - Upper Intermediate': 4,
          'C1 - Advanced': 5,
          'C2 - Proficient': 6
        };
        return {
          name: new Date(g!.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          level: cefrOrder[g!.cefrLevel!] || 0,
          label: g!.cefrLevel?.split(' - ')[0]
        };
      });
  }, [sessionGrades]);

  // 4. Homework for this student
  const pendingHomeworks = useMemo(() =>
    studentHomeworks.filter(h => h.status === 'PENDING'), [studentHomeworks]);
  const completedHomeworks = useMemo(() =>
    studentHomeworks.filter(h => h.status !== 'PENDING'), [studentHomeworks]);

  // 5. Schedule Logic
  const upcomingClasses = useMemo(() =>
    allSessions
      .filter(s => new Date(s.date_time) > new Date())
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()),
    [allSessions]);

  const pastClasses = useMemo(() =>
    allSessions
      .filter(s => new Date(s.date_time) <= new Date())
      .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()),
    [allSessions]);

  // 6. Latest CEFR level
  const latestCefr = sessionGrades.filter(g => g?.cefrLevel).pop()?.cefrLevel;

  // 7. Average scores (from stats)
  const avgWritten = stats?.scores.averageWritten ?? null;
  const avgOral = stats?.scores.averageOral ?? null;

  return {
    loading,
    attendanceRate, presentCount, lateCount, absentCount,
    sessionGrades, cefrChartData, studentHomeworks, pendingHomeworks, completedHomeworks,
    upcomingClasses, pastClasses, latestCefr, avgWritten, avgOral
  };
};

// --- COMPONENT 1: OVERVIEW ---
export const ParentOverview: React.FC<{ student: User }> = ({ student }) => {
  const { loading, attendanceRate, cefrChartData, pendingHomeworks, latestCefr, avgWritten, avgOral, upcomingClasses } = useParentData(student);
  const { settings } = useSettings();
  const { user, updateProfile } = useAuth();
  const { olympiads: competitionsData } = useOlympiads();
  const navigate = useNavigate();

  // Get active/open competitions
  const activeCompetitions = competitionsData.filter(c => c.is_active || c.status === 'OPEN');
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Track page view
  useEffect(() => {
    if (user?.id) {
      parentEngagementService.trackPageView(user.id, 'dashboard', '/parent/dashboard');
    }
  }, [user?.id]);

  // WhatsApp editing state (for parent's own phone)
  const [isEditingWhatsApp, setIsEditingWhatsApp] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState(user?.phone || '');
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);

  const handleSaveWhatsApp = async () => {
    setIsSavingWhatsApp(true);
    try {
      const { error } = await updateProfile({ phone: whatsAppNumber || null });
      if (error) {
        alert('Failed to save WhatsApp number. Please try again.');
      } else {
        setIsEditingWhatsApp(false);
      }
    } catch (err) {
      console.error('Error saving WhatsApp:', err);
      alert('Failed to save WhatsApp number. Please try again.');
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  const handleCancelWhatsApp = () => {
    setWhatsAppNumber(user?.phone || '');
    setIsEditingWhatsApp(false);
  };

  const isPortrait = settings.videoOrientation === 'portrait';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Promotional Video Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 rounded-xl p-4 text-white">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Play className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{settings.videoTitle}</span>
            </div>
            <h3 className="text-sm font-bold mb-1">Lihat video terbaru dari ELC!</h3>
            <p className="text-[10px] text-white/80 line-clamp-2">{settings.videoDescription}</p>
          </div>
          <button
            onClick={() => setShowVideoModal(true)}
            className="flex items-center gap-2 bg-white text-teal-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-teal-50 transition-colors shadow-md"
          >
            <Play className="w-4 h-4" /> Tonton Video
          </button>
        </div>
      </div>

      {/* ELC's Competition Banner */}
      {activeCompetitions.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-xl p-4 text-white">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">ELC's Competition</span>
              </div>
              <h3 className="text-sm font-bold mb-1">{activeCompetitions[0].title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/80">
                <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                  {COMPETITION_TYPE_LABELS[(activeCompetitions[0] as any).competition_type as CompetitionType] || 'Olympiad'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Deadline: {new Date(activeCompetitions[0].end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <Link
              to="/competition"
              className="flex items-center gap-2 bg-white text-orange-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors shadow-md"
            >
              <ExternalLink className="w-4 h-4" /> Daftar Sekarang
            </Link>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={`bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative ${isPortrait ? 'w-full max-w-sm' : 'w-full max-w-2xl'}`}>
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3 right-3 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4">
              <div className="flex items-center gap-2 text-white/90 mb-3">
                <Play className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold">{settings.videoTitle}</span>
              </div>
              <div className={`relative rounded-xl overflow-hidden bg-black ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`}>
                <iframe className="w-full h-full" src={settings.videoUrl} title="Promo Video" allowFullScreen></iframe>
              </div>
              <p className="text-gray-400 text-[10px] mt-3 italic">{settings.videoDescription}</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Parent Dashboard</h2>
          <p className="text-xs text-gray-500">Monitoring: <span className="font-bold text-blue-600">{student.name}</span></p>
        </div>
        <div className="flex gap-3">
          <div className="text-right px-3 border-r border-gray-200">
            <p className="text-[9px] text-gray-500 font-bold uppercase">Attendance</p>
            <p className={`text-lg font-bold ${attendanceRate >= 80 ? 'text-green-600' : 'text-yellow-500'}`}>
              {attendanceRate}%
            </p>
          </div>
          <div className="text-right px-3 border-r border-gray-200">
            <p className="text-[9px] text-gray-500 font-bold uppercase">CEFR Level</p>
            <p className="text-lg font-bold text-teal-600">{latestCefr?.split(' - ')[0] || 'N/A'}</p>
          </div>
          <div className="text-right px-2">
            <p className="text-[9px] text-gray-500 font-bold uppercase">Homework</p>
            <p className={`text-lg font-bold ${pendingHomeworks.length > 0 ? 'text-orange-500' : 'text-green-600'}`}>
              {pendingHomeworks.length} pending
            </p>
          </div>
        </div>
      </div>

      {/* ENGAGEMENT REMINDER */}
      {user?.id && (
        <EngagementReminder
          parentId={user.id}
          onNavigateToReview={() => navigate('/parent/review')}
          onNavigateToFeedback={() => navigate('/parent/feedback')}
        />
      )}

      {/* WHATSAPP NUMBER SECTION */}
      <Card className="!p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp Number</p>
              {isEditingWhatsApp ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="tel"
                    value={whatsAppNumber}
                    onChange={(e) => setWhatsAppNumber(e.target.value)}
                    placeholder="e.g. 08123456789"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveWhatsApp}
                    disabled={isSavingWhatsApp}
                    className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                  >
                    {isSavingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCancelWhatsApp}
                    disabled={isSavingWhatsApp}
                    className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {user?.phone || <span className="text-gray-400 italic">Not set</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
          {!isEditingWhatsApp && (
            <button
              onClick={() => setIsEditingWhatsApp(true)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Edit WhatsApp Number"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-2 ml-11">
          Optional - Used for important notifications about your child's progress
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Stats Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Score Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="!p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PenLine className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-blue-600 uppercase">Avg Written</p>
                  <p className="text-lg font-bold text-blue-900">{avgWritten ?? '—'}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mic className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-purple-600 uppercase">Avg Oral</p>
                  <p className="text-lg font-bold text-purple-900">{avgOral ?? '—'}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-teal-600 uppercase">CEFR</p>
                  <p className="text-lg font-bold text-teal-900">{latestCefr?.split(' - ')[0] || '—'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* CEFR Progression Chart */}
          <Card className="!p-4">
            <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" /> CEFR Level Progression
            </h3>
            <div className="h-48">
              {cefrChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cefrChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tickFormatter={(v) => ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'][v]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value, name, props) => [props.payload.label, 'CEFR Level']} />
                    <Line type="monotone" dataKey="level" stroke="#0d9488" strokeWidth={3} dot={{ r: 5, fill: '#0d9488' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
                  No CEFR data recorded yet.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT: Pending Homework */}
        <div className="space-y-4">
          <Card className="!p-3">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-orange-500" /> Pending Homework
            </h4>
            {pendingHomeworks.length > 0 ? (
              <div className="space-y-2">
                {pendingHomeworks.map(hw => (
                  <div key={hw.id} className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-xs font-bold text-gray-900">{hw.title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2">{hw.description}</p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-orange-600 font-bold">
                      <Clock className="w-3 h-3" />
                      Due: {new Date(hw.due_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-[10px] text-gray-500">All homework completed!</p>
              </div>
            )}
          </Card>

          <Card className="!p-3">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" /> Next Class
            </h4>
            {upcomingClasses.length > 0 ? (
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-gray-900">{upcomingClasses[0].topic}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-blue-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(upcomingClasses[0].date_time).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(upcomingClasses[0].date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">No upcoming classes.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT 2: ACTIVITY LOG (Grades History) ---
export const ParentActivityLog: React.FC<{ student: User }> = ({ student }) => {
  const { loading, sessionGrades, completedHomeworks } = useParentData(student);
  const [activeTab, setActiveTab] = useState<'grades' | 'homework'>('grades');
  const { user } = useAuth();

  // Track page view
  useEffect(() => {
    if (user?.id) {
      parentEngagementService.trackPageView(user.id, 'activity', '/parent/activity');
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Grades & Homework</h2>
        <p className="text-xs text-gray-500">Track {student.name}'s academic progress and assignments.</p>
      </div>

      <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('grades')}
          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${activeTab === 'grades' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <ClipboardCheck className="w-3 h-3" /> Grades
        </button>
        <button
          onClick={() => setActiveTab('homework')}
          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${activeTab === 'homework' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <BookOpen className="w-3 h-3" /> Homework
        </button>
      </div>

      {activeTab === 'grades' ? (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Topic</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-center">Written</th>
                <th className="px-4 py-2 text-center">Oral</th>
                <th className="px-4 py-2 text-center">CEFR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessionGrades.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs italic">No grades recorded yet.</td></tr>
              )}
              {sessionGrades.map((grade, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-900 font-medium">
                    {new Date(grade!.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-xs font-bold text-gray-900">{grade!.topic}</div>
                    {grade!.teacherNotes && (
                      <div className="text-[10px] text-gray-500 italic">"{grade!.teacherNotes}"</div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[9px] font-bold text-gray-600 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                      {grade!.skillCategory}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {grade!.writtenScore !== undefined ? (
                      <span className={`font-bold ${grade!.writtenScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {grade!.writtenScore}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {grade!.oralScore !== undefined ? (
                      <span className={`font-bold ${grade!.oralScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {grade!.oralScore}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {grade!.cefrLevel ? (
                      <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-teal-100">
                        {grade!.cefrLevel.split(' - ')[0]}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Due Date</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {completedHomeworks.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-xs italic">No completed homework yet.</td></tr>
              )}
              {completedHomeworks.map(hw => (
                <tr key={hw.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs font-bold text-gray-900">{hw.title}</td>
                  <td className="px-4 py-2">
                    <div className="text-xs text-gray-600 line-clamp-2">{hw.description}</div>
                    {hw.feedback && (
                      <div className="text-[10px] text-blue-600 italic mt-1">Feedback: {hw.feedback}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[10px] text-gray-500">
                    {new Date(hw.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      hw.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                      hw.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {hw.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {hw.score !== undefined ? (
                      <span className={`font-bold ${hw.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {hw.score}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// --- COMPONENT 3: SCHEDULE ---
const TEST_TYPE_LABELS: Record<TestType, string> = {
  'QUIZ': 'Quiz',
  'MID_SEMESTER': 'UTS',
  'FINAL_SEMESTER': 'UAS',
};

const TEST_TYPE_COLORS: Record<TestType, string> = {
  'QUIZ': 'bg-blue-100 text-blue-700 border-blue-200',
  'MID_SEMESTER': 'bg-orange-100 text-orange-700 border-orange-200',
  'FINAL_SEMESTER': 'bg-purple-100 text-purple-700 border-purple-200',
};

// Helper functions for hierarchical schedule view
const getAcademicYear = (date: Date): string => {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 6) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

const getSemester = (date: Date): number => {
  const month = date.getMonth();
  return month >= 6 ? 1 : 2;
};

const getWeekInSemester = (date: Date): number => {
  const semester = getSemester(date);
  let semesterStart: Date;
  if (semester === 1) {
    semesterStart = new Date(date.getFullYear(), 6, 1);
  } else {
    semesterStart = new Date(date.getFullYear(), 0, 1);
  }
  const diffTime = date.getTime() - semesterStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
};

const getWeekDateRange = (year: string, semester: number, week: number): { start: Date; end: Date } => {
  const [startYear] = year.split('/').map(Number);
  let semesterStart: Date;
  if (semester === 1) {
    semesterStart = new Date(startYear, 6, 1);
  } else {
    semesterStart = new Date(startYear + 1, 0, 1);
  }
  const weekStart = new Date(semesterStart);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return { start: weekStart, end: weekEnd };
};

type CategoryType = 'materi' | 'lesson-plan' | 'task';

interface ScheduleItem {
  id: string;
  type: 'session' | 'test';
  dateTime: string;
  title: string;
  location: string;
  description?: string;
  session?: ClassSession;
  test?: TestSchedule;
}

export const ParentSchedule: React.FC<{ student: User }> = ({ student }) => {
  const { loading: parentDataLoading, upcomingClasses, pastClasses } = useParentData(student);
  const [view, setView] = useState<'upcoming' | 'history'>('upcoming');
  const { user } = useAuth();

  // Track page view
  useEffect(() => {
    if (user?.id) {
      parentEngagementService.trackPageView(user.id, 'schedule', '/parent/schedule');
    }
  }, [user?.id]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestSchedule | null>(null);
  
  // Hierarchical view state
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const currentAcademicYear = getAcademicYear(new Date());
  
  const [studentProfile, setStudentProfile] = useState<{ school: string; class_name: string; class_type: ClassType | null } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch student profile to get school, class, and class type
  useEffect(() => {
    const fetchProfile = async () => {
      if (!student?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('school, class_name, class_type, school_origin')
          .eq('id', student.id)
          .single();

        if (data && !error) {
          const profileData = data as { school: string; class_name: string; class_type: string | null; school_origin: string | null };
          
          let school = profileData.school;
          let className = profileData.class_name;
          
          if (!className && profileData.school_origin && profileData.school_origin.includes(' - ')) {
            const parts = profileData.school_origin.split(' - ');
            if (parts.length > 1) {
              school = parts[0];
              className = parts.slice(1).join(' - ');
            }
          }
          
          setStudentProfile({
            school: school,
            class_name: className,
            class_type: profileData.class_type as ClassType | null
          });
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [student?.id]);

  // Fetch tests for student's school and class
  const { tests: testsData, loading: testsLoading } = useTests(
    studentProfile ? {
      location: studentProfile.school,
      className: studentProfile.class_name
    } : {}
  );

  const loading = parentDataLoading || testsLoading || profileLoading;
  const now = new Date();

  // Map sessions to ClassSession format
  const sessions: ClassSession[] = [...upcomingClasses, ...pastClasses].map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategory: s.skill_category as SkillCategory,
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
    classType: (s as any).class_type as ClassType | undefined,
  }));

  // Group sessions by semester for hierarchical view
  const sessionsBySemester = {
    1: sessions.filter(s => getSemester(new Date(s.dateTime)) === 1),
    2: sessions.filter(s => getSemester(new Date(s.dateTime)) === 2),
  };

  // Get data for selected category
  const getCategoryData = () => {
    if (selectedSemester === null) return [];
    const semesterSessions = sessionsBySemester[selectedSemester as 1 | 2] || [];

    if (selectedCategory === 'materi') {
      return semesterSessions.filter(s => s.materials && s.materials.length > 0);
    } else if (selectedCategory === 'lesson-plan') {
      return semesterSessions;
    }
    return semesterSessions;
  };

  // Get weeks data for current category
  const getWeeksData = () => {
    if (!selectedCategory || selectedSemester === null) return [];

    const categoryData = getCategoryData();
    const weekMap: Record<number, { week: number; count: number; dateRange: { start: Date; end: Date } }> = {};

    categoryData.forEach(s => {
      const week = getWeekInSemester(new Date(s.dateTime));
      if (!weekMap[week]) {
        weekMap[week] = {
          week,
          count: 0,
          dateRange: getWeekDateRange(currentAcademicYear, selectedSemester!, week),
        };
      }
      weekMap[week].count++;
    });

    return Object.values(weekMap).sort((a, b) => a.week - b.week);
  };

  // Get sessions for selected week
  const getWeekSessions = () => {
    if (selectedWeek === null || !selectedCategory) return [];

    const categoryData = getCategoryData();
    return categoryData
      .filter(s => getWeekInSemester(new Date(s.dateTime)) === selectedWeek)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  };

  const weeksData = getWeeksData();
  const weekSessions = getWeekSessions();

  // Format date range helper
  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', options)}`;
  };

  // Navigation back in hierarchy
  const navigateBack = () => {
    if (selectedWeek !== null) {
      setSelectedWeek(null);
    } else if (selectedCategory !== null) {
      setSelectedCategory(null);
    } else if (selectedSemester !== null) {
      setSelectedSemester(null);
    }
  };

  // Filter tests by student's class type
  const filteredTests = testsData.filter(t => {
    if (!studentProfile?.class_type) return true;
    if (!(t as any).class_type) return true;
    return (t as any).class_type === studentProfile.class_type;
  });

  // Create combined schedule items
  const scheduleItems: ScheduleItem[] = [
    ...sessions.map(s => ({
      id: s.id,
      type: 'session' as const,
      dateTime: s.dateTime,
      title: s.topic,
      location: s.location,
      description: s.description,
      session: s,
    })),
    ...filteredTests.map(t => ({
      id: t.id,
      type: 'test' as const,
      dateTime: t.date_time,
      title: `${TEST_TYPE_LABELS[t.test_type]} - ${t.title}`,
      location: t.location,
      description: t.description || undefined,
      test: t,
    })),
  ];

  // Filter Logic
  const getItemEndTime = (item: ScheduleItem): Date => {
    const startTime = new Date(item.dateTime);
    if (item.type === 'test' && item.test) {
      return new Date(startTime.getTime() + (item.test.duration_minutes * 60 * 1000));
    } else {
      return new Date(startTime.getTime() + (90 * 60 * 1000));
    }
  };

  const upcomingItems = scheduleItems
    .filter(item => getItemEndTime(item) > now)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const pastItems = scheduleItems
    .filter(item => getItemEndTime(item) <= now)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    );
  }

  // --- SESSION DETAIL VIEW ---
  if (selectedSession) {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedSession(null)} className="text-xs py-1.5 px-3">
            Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Class Details</h2>
            <p className="text-xs text-gray-500">{selectedSession.topic}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="!p-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Session Info</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Date:</span> {new Date(selectedSession.dateTime).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Time:</span> {new Date(selectedSession.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Location:</span> {selectedSession.location}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <UserIcon className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Student:</span> {student.name}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</h4>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {selectedSession.description || "No description available."}
                </p>
              </div>

              {selectedSession.materials && selectedSession.materials.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-500" /> Materials
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.materials.map((mat, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2 py-1.5 rounded text-[10px] border border-blue-100 cursor-pointer hover:bg-blue-100">
                        <Download className="w-3 h-3" /> {mat}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- TEST DETAIL VIEW ---
  if (selectedTest) {
    const testDateTime = new Date(selectedTest.date_time);
    const testEndTime = new Date(testDateTime.getTime() + (selectedTest.duration_minutes * 60 * 1000));
    const isTestStarted = now >= testDateTime;
    const isTestEnded = now > testEndTime;
    
    const getTimeUntilTest = () => {
      const diff = testDateTime.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days} hari ${hours} jam lagi`;
      if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
      return `${minutes} menit lagi`;
    };

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedTest(null)} className="text-xs py-1.5 px-3">
            Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Test Details</h2>
            <p className="text-xs text-gray-500">{selectedTest.title}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="!p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TEST_TYPE_COLORS[selectedTest.test_type]}`}>
                {TEST_TYPE_LABELS[selectedTest.test_type]}
              </span>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Test Info</h3>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Date:</span> {new Date(selectedTest.date_time).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Time:</span> {new Date(selectedTest.date_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <span className="font-medium">Duration:</span> {selectedTest.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  <span className="font-medium">Location:</span> {selectedTest.location}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</h4>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {selectedTest.description || "No description available."}
                </p>
              </div>

              {selectedTest.materials && selectedTest.materials.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-500" /> Study Materials
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTest.materials.map((mat: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2 py-1.5 rounded text-[10px] border border-blue-100 cursor-pointer hover:bg-blue-100">
                        <Download className="w-3 h-3" /> {mat}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Test Status Card */}
          <Card className="!p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Test Status</h3>
            </div>
            
            {isTestEnded ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Test telah berakhir</p>
                <p className="text-xs text-gray-400 mt-1">
                  Berakhir pada {testEndTime.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            ) : isTestStarted ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-green-800">Test sedang berlangsung!</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Berakhir pada {testEndTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                    {student.name} dapat mengerjakan test ini
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-orange-800 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Test belum dimulai
                    </p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      Dimulai dalam {getTimeUntilTest()}
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold">
                    Pastikan {student.name} siap saat waktu test
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // --- HIERARCHICAL VIEW ---

  // Breadcrumb navigation
  const renderBreadcrumb = () => {
    const items: { label: string; onClick: () => void }[] = [
      { label: 'Schedule', onClick: () => { setSelectedSemester(null); setSelectedCategory(null); setSelectedWeek(null); } }
    ];

    if (selectedSemester !== null) {
      items.push({
        label: `Semester ${selectedSemester}`,
        onClick: () => { setSelectedCategory(null); setSelectedWeek(null); }
      });
    }

    if (selectedCategory !== null) {
      const categoryLabels: Record<CategoryType, string> = {
        'materi': 'Materi',
        'lesson-plan': 'Lesson Plan',
        'task': 'Task'
      };
      items.push({
        label: categoryLabels[selectedCategory],
        onClick: () => setSelectedWeek(null)
      });
    }

    if (selectedWeek !== null) {
      items.push({ label: `Week ${selectedWeek}`, onClick: () => {} });
    }

    return (
      <div className="flex items-center gap-2 text-sm">
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <button
              onClick={item.onClick}
              className={`font-medium ${idx === items.length - 1 ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            {student.name}'s Schedule
            {studentProfile?.class_type && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                studentProfile.class_type === ClassType.BILINGUAL
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-teal-100 text-teal-700 border border-teal-200'
              }`}>
                {studentProfile.class_type === ClassType.BILINGUAL ? (
                  <><Globe className="w-2.5 h-2.5" /> Bilingual</>
                ) : (
                  <><UserCheck className="w-2.5 h-2.5" /> Regular</>
                )}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{currentAcademicYear} • {studentProfile?.school} {studentProfile?.class_name ? `- ${studentProfile.class_name}` : ''}</p>
        </div>
        {(selectedSemester !== null || selectedCategory !== null || selectedWeek !== null) && (
          <Button
            variant="outline"
            onClick={navigateBack}
            className="flex items-center gap-2 text-xs"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </Button>
        )}
      </div>

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Level 1: Semester Selection */}
      {selectedSemester === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(semester => {
            const count = sessionsBySemester[semester as 1 | 2]?.length || 0;
            return (
              <Card
                key={semester}
                className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-teal-300 group"
                onClick={() => setSelectedSemester(semester)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">{semester}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Semester {semester}</h3>
                      <p className="text-sm text-gray-500">
                        {semester === 1 ? 'Juli - Desember' : 'Januari - Juni'}
                      </p>
                      <p className="text-xs text-teal-600 font-medium mt-1">{count} schedule</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-teal-600 transition-colors" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Level 2: Category Selection */}
      {selectedSemester !== null && selectedCategory === null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'materi' as CategoryType, label: 'Materi', icon: BookOpen, color: 'from-blue-500 to-blue-600', desc: 'Learning materials' },
            { key: 'lesson-plan' as CategoryType, label: 'Lesson Plan', icon: FileText, color: 'from-green-500 to-green-600', desc: 'Lesson schedules' },
            { key: 'task' as CategoryType, label: 'Task', icon: ClipboardCheck, color: 'from-orange-500 to-orange-600', desc: 'Assignments & tasks' },
          ].map(cat => {
            const semesterSessions = sessionsBySemester[selectedSemester as 1 | 2] || [];
            const count = cat.key === 'materi'
              ? semesterSessions.filter(s => s.materials && s.materials.length > 0).length
              : semesterSessions.length;
            return (
              <Card
                key={cat.key}
                className="p-5 cursor-pointer hover:shadow-lg transition-all hover:border-teal-300 group"
                onClick={() => setSelectedCategory(cat.key)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg mb-3`}>
                    <cat.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{cat.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
                  <p className="text-xs text-teal-600 font-medium mt-2">{count} items</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Level 3: Week Selection */}
      {selectedSemester !== null && selectedCategory !== null && selectedWeek === null && (
        <div>
          {weeksData.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No schedule data for this category.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {weeksData.map(w => (
                <Card
                  key={w.week}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all hover:border-teal-300 group text-center"
                  onClick={() => setSelectedWeek(w.week)}
                >
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-teal-600 transition-colors">
                    <span className="text-sm font-bold text-teal-700 group-hover:text-white transition-colors">{w.week}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900">Week {w.week}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{formatDateRange(w.dateRange.start, w.dateRange.end)}</p>
                  <p className="text-[10px] text-teal-600 font-medium mt-1">{w.count} items</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Level 4: Session List */}
      {selectedSemester !== null && selectedCategory !== null && selectedWeek !== null && (
        <div className="space-y-3">
          {weekSessions.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No schedule for this week.</p>
            </Card>
          ) : (
            weekSessions.map(session => (
              <Card
                key={session.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-teal-500"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex gap-4">
                  {/* Date/Time Box */}
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100 shrink-0 min-w-[70px]">
                    <span className="text-[10px] font-bold text-teal-600 uppercase block">
                      {new Date(session.dateTime).toLocaleDateString('id-ID', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-extrabold text-gray-900 block">
                      {new Date(session.dateTime).getDate()}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(session.dateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {session.skillCategory && (
                        <span className="text-[9px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase">
                          {session.skillCategory}
                        </span>
                      )}
                      {session.difficultyLevel && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${LEVEL_COLORS[session.difficultyLevel]}`}>
                          {session.difficultyLevel}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 truncate">{session.topic}</h4>
                    <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {session.location}
                      </span>
                    </div>
                    {session.materials && session.materials.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-teal-600">
                        <FileText className="w-3 h-3" />
                        <span>{session.materials.length} attachment(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
