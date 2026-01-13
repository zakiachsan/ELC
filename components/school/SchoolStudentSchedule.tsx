import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Card } from '../Card';
import { useAuth } from '../../contexts/AuthContext';
import { useSessions } from '../../hooks/useSessions';
import { useTeachers, useLocations } from '../../hooks/useProfiles';
import { useReports } from '../../hooks/useReports';
import { SkillCategory, DifficultyLevel } from '../../types';
import { LEVEL_COLORS } from '../../constants';
import { SKILL_ICONS } from '../student/StudentView';
import {
  Calendar,
  Clock,
  User as UserIcon,
  BookOpen,
  MapPin,
  Eye,
  School,
  Loader2,
  AlignLeft,
  Download,
} from 'lucide-react';

// Extended session type for PDF generation
interface ExtendedSession {
  id: string;
  teacherId: string;
  topic: string;
  description: string;
  dateTime: string;
  location: string;
  skillCategories: SkillCategory[];
  difficultyLevel: DifficultyLevel;
  materials: string[];
  cefrLevel?: string | null;
  materialsNeeded?: string | null;
  learningObjectives?: string | null;
  vocabularyVerb?: string | null;
  vocabularyNoun?: string | null;
  vocabularyAdjective?: string | null;
}

// Logo URLs from Supabase Storage
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://prmjdngeuczatlspinql.supabase.co';
const ELC_LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/materials/Logo/elc_logo.jpeg`;
const CAMBRIDGE_LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/materials/Logo/cambridge_logo.jpeg`;

// Helper to load image as base64 with good quality
const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url + '?t=' + Date.now()); // Cache bust
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
};

// PDF Generation for Lesson Plan
const generateLessonPlanPDF = async (session: ExtendedSession, teacherName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // Set default line width for boxes
  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);

  // Header with logos and title
  const headerHeight = 25;
  const logoWidth = 30;

  // Load logos
  const [elcLogo, cambridgeLogo] = await Promise.all([
    loadImageAsBase64(ELC_LOGO_URL),
    loadImageAsBase64(CAMBRIDGE_LOGO_URL)
  ]);

  // ELC Logo (left)
  if (elcLogo) {
    doc.addImage(elcLogo, 'JPEG', margin, y, logoWidth, headerHeight);
  }

  // Cambridge Logo (right)
  if (cambridgeLogo) {
    doc.addImage(cambridgeLogo, 'JPEG', pageWidth - margin - logoWidth, y, logoWidth, headerHeight);
  }

  // Center title - LESSON PLAN
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('LESSON PLAN', pageWidth / 2, y + 12, { align: 'center' });

  // CEFR subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('CEFR', pageWidth / 2, y + 20, { align: 'center' });

  y += headerHeight + 5;

  // CEFR full description
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('(Common European Framework of Reference for languages)', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Row 1: Grade, Date, CEFR Level (3 columns)
  const col3Width = contentWidth / 3;
  const row1Height = 22;

  // Grade box
  doc.rect(margin, y, col3Width - 2, row1Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Grade :', margin + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const gradeText = session.location || '';
  const gradeLines = doc.splitTextToSize(gradeText, col3Width - 8);
  doc.text(gradeLines, margin + 3, y + 13);

  // Date box
  doc.rect(margin + col3Width, y, col3Width - 2, row1Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Date:', margin + col3Width + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const dateStr = new Date(session.dateTime).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(dateStr, margin + col3Width + 3, y + 13);

  // CEFR Level box
  doc.rect(margin + col3Width * 2 + 2, y, col3Width - 2, row1Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('CEFR Level :', margin + col3Width * 2 + 5, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(session.cefrLevel || '', margin + col3Width * 2 + 5, y + 13);

  y += row1Height + 5;

  // Row 2: Lesson topic, Materials needed (2 columns)
  const col2LeftWidth = contentWidth * 0.55;
  const col2RightWidth = contentWidth * 0.45 - 2;
  const row2Height = 35;

  // Lesson topic box
  doc.rect(margin, y, col2LeftWidth, row2Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Lesson topic:', margin + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const topicLines = doc.splitTextToSize(session.topic || '', col2LeftWidth - 8);
  doc.text(topicLines, margin + 3, y + 13);

  // Materials needed box
  doc.rect(margin + col2LeftWidth + 2, y, col2RightWidth, row2Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Materials needed:', margin + col2LeftWidth + 5, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const materialsLines = doc.splitTextToSize(session.materialsNeeded || '', col2RightWidth - 8);
  doc.text(materialsLines, margin + col2LeftWidth + 5, y + 13);

  y += row2Height + 5;

  // Row 3: Learning objective/s (full width)
  const row3Height = 35;
  doc.rect(margin, y, contentWidth, row3Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Learning objective/s:', margin + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const objectivesLines = doc.splitTextToSize(session.learningObjectives || '', contentWidth - 8);
  doc.text(objectivesLines.slice(0, 4), margin + 3, y + 13);

  y += row3Height + 5;

  // Row 4: Vocabulary table
  const vocabHeaderHeight = 10;
  const vocabColHeaderHeight = 10;
  const vocabContentHeight = 30;
  const vocabTotalHeight = vocabHeaderHeight + vocabColHeaderHeight + vocabContentHeight;
  const vocabColWidth = contentWidth / 3;

  // Outer vocabulary box
  doc.rect(margin, y, contentWidth, vocabTotalHeight);

  // Vocabulary header
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('Vocabulary:', margin + contentWidth / 2, y + 7, { align: 'center' });

  // Column headers row
  const colHeaderY = y + vocabHeaderHeight;
  doc.line(margin, colHeaderY, margin + contentWidth, colHeaderY);

  // Column header dividers
  doc.line(margin + vocabColWidth, colHeaderY, margin + vocabColWidth, y + vocabTotalHeight);
  doc.line(margin + vocabColWidth * 2, colHeaderY, margin + vocabColWidth * 2, y + vocabTotalHeight);

  // Column header text
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Verb', margin + vocabColWidth / 2, colHeaderY + 7, { align: 'center' });
  doc.text('Noun', margin + vocabColWidth + vocabColWidth / 2, colHeaderY + 7, { align: 'center' });
  doc.text('Adjective', margin + vocabColWidth * 2 + vocabColWidth / 2, colHeaderY + 7, { align: 'center' });

  // Content row line
  const contentRowY = colHeaderY + vocabColHeaderHeight;
  doc.line(margin, contentRowY, margin + contentWidth, contentRowY);

  // Vocabulary content
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  const verbLines = doc.splitTextToSize(session.vocabularyVerb || '', vocabColWidth - 6);
  const nounLines = doc.splitTextToSize(session.vocabularyNoun || '', vocabColWidth - 6);
  const adjLines = doc.splitTextToSize(session.vocabularyAdjective || '', vocabColWidth - 6);

  doc.text(verbLines.slice(0, 4), margin + 3, contentRowY + 6);
  doc.text(nounLines.slice(0, 4), margin + vocabColWidth + 3, contentRowY + 6);
  doc.text(adjLines.slice(0, 4), margin + vocabColWidth * 2 + 3, contentRowY + 6);

  y += vocabTotalHeight + 5;

  // Row 5: Lesson activity (full width, larger box)
  const row5Height = 50;
  doc.rect(margin, y, contentWidth, row5Height);
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Lesson activity:', margin + 3, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const activityLines = doc.splitTextToSize(session.description || '', contentWidth - 8);
  doc.text(activityLines.slice(0, 7), margin + 3, y + 13);

  // Footer with teacher name
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Teacher: ${teacherName}`, margin, y);
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US')}`, pageWidth - margin, y, { align: 'right' });

  // Save PDF
  const fileName = `Lesson_Plan_${session.topic.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(session.dateTime).toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const SchoolStudentSchedule: React.FC = () => {
  const { user } = useAuth();
  const { sessions: sessionsData, loading: sessionsLoading, error: sessionsError } = useSessions();
  const { profiles: teachersData, loading: teachersLoading } = useTeachers();
  const { locations: locationsData, loading: locationsLoading } = useLocations();
  const { reports: reportsData } = useReports();

  const [schoolName, setSchoolName] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<ExtendedSession | null>(null);

  // Get school info from user's assigned location
  useEffect(() => {
    if (user?.assignedLocationId && locationsData.length > 0) {
      const school = locationsData.find((l) => l.id === user.assignedLocationId);
      if (school) {
        setSchoolName(school.name);
      }
    }
  }, [user, locationsData]);

  // Map database format to component format with extended fields
  const sessions: ExtendedSession[] = sessionsData.map(s => ({
    id: s.id,
    teacherId: s.teacher_id,
    topic: s.topic,
    description: s.description || '',
    dateTime: s.date_time,
    location: s.location,
    skillCategories: (Array.isArray(s.skill_category) ? s.skill_category : [s.skill_category]) as SkillCategory[],
    difficultyLevel: s.difficulty_level as DifficultyLevel,
    materials: s.materials || [],
    cefrLevel: s.cefr_level,
    materialsNeeded: s.materials_needed,
    learningObjectives: s.learning_objectives,
    vocabularyVerb: s.vocabulary_verb,
    vocabularyNoun: s.vocabulary_noun,
    vocabularyAdjective: s.vocabulary_adjective,
  }));

  const teachers = teachersData.map(t => ({
    id: t.id,
    name: t.name,
    role: t.role,
  }));

  // Build reports by session
  const sessionReportsMap: Record<string, any[]> = {};
  reportsData.forEach(r => {
    if (!sessionReportsMap[r.session_id]) {
      sessionReportsMap[r.session_id] = [];
    }
    sessionReportsMap[r.session_id].push({
      studentName: r.student_name || 'Unknown',
      writtenScore: r.written_score,
      oralScore: r.oral_score,
      cefrLevel: r.cefr_level,
      teacherNotes: r.notes,
    });
  });

  // Filter sessions for this school only
  let filteredSessions = sessions.filter(s =>
    schoolName && s.location.toLowerCase().includes(schoolName.toLowerCase())
  );

  if (selectedTeacher !== 'all') {
    filteredSessions = filteredSessions.filter(s => s.teacherId === selectedTeacher);
  }

  // Sort by date (newest first)
  filteredSessions = filteredSessions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // Get teachers who have sessions at this school
  const teachersAtSchool = teachers.filter(t =>
    sessions.some(s => s.teacherId === t.id && s.location.toLowerCase().includes(schoolName.toLowerCase()))
  );

  const getTeacherName = (id: string) => {
    return teachers.find(t => t.id === id)?.name || 'Unknown Teacher';
  };

  const getSessionStatus = (session: ExtendedSession) => {
    const now = new Date();
    const sessionDate = new Date(session.dateTime);
    const reports = sessionReportsMap[session.id] || [];

    if (sessionDate > now) {
      return { label: 'Upcoming', color: 'bg-blue-50 text-blue-700 border-blue-100' };
    }
    if (reports.length > 0) {
      return { label: 'Reported', color: 'bg-green-50 text-green-700 border-green-100' };
    }
    return { label: 'Needs Input', color: 'bg-orange-50 text-orange-700 border-orange-100' };
  };

  if (sessionsLoading || teachersLoading || locationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading schedule...</span>
      </div>
    );
  }

  if (!schoolName) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No school assigned to this account.</p>
        </div>
      </div>
    );
  }

  if (sessionsError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading schedule: {sessionsError.message}
      </div>
    );
  }

  // Detail view for a selected session
  if (selectedSession) {
    const primarySkill = selectedSession.skillCategories[0] || SkillCategory.GRAMMAR;
    const Icon = SKILL_ICONS[primarySkill] || AlignLeft;
    const status = getSessionStatus(selectedSession);

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSession(null)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
            >
              Back
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Session Detail</h2>
              <p className="text-xs text-gray-500">{schoolName}</p>
            </div>
          </div>
          {/* Download PDF Button */}
          <button
            onClick={() => generateLessonPlanPDF(selectedSession, getTeacherName(selectedSession.teacherId))}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold uppercase hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
            title="Download Lesson Plan"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Lesson Plan</span>
          </button>
        </div>

        {/* Session Info */}
        <Card className="!p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 bg-gray-800 text-white px-2 py-1 rounded text-[9px] uppercase font-bold">
                <Icon className="w-3 h-3" /> {selectedSession.skillCategories.join(', ')}
              </span>
              <span className={`px-2 py-1 rounded text-[9px] uppercase font-bold ${LEVEL_COLORS[selectedSession.difficultyLevel]}`}>
                {selectedSession.difficultyLevel}
              </span>
              <span className={`px-2 py-1 rounded text-[9px] uppercase font-bold border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">{selectedSession.topic}</h3>
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(selectedSession.dateTime).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedSession.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedSession.location}</span>
                <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {getTeacherName(selectedSession.teacherId)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Column 1: Description & Learning Objectives */}
          <div className="space-y-4">
            <Card className="!p-4">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedSession.description || 'No description provided.'}</p>
            </Card>

            {selectedSession.learningObjectives && (
              <Card className="!p-4">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Learning Objectives</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedSession.learningObjectives}</p>
              </Card>
            )}
          </div>

          {/* Column 2: Materials & Download */}
          <div className="space-y-4">
            <Card className="!p-4">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Materials</h4>
              {selectedSession.materials && selectedSession.materials.length > 0 ? (
                <div className="space-y-2">
                  {selectedSession.materials.map((file, idx) => {
                    const fileName = file.split('/').pop() || file;
                    const isUrl = file.startsWith('http://') || file.startsWith('https://');
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg text-xs hover:bg-blue-50 transition-colors">
                        <BookOpen className="w-4 h-4 text-red-500 shrink-0" />
                        {isUrl ? (
                          <a
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate flex-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                            title={fileName}
                          >
                            {fileName}
                          </a>
                        ) : (
                          <span className="truncate flex-1 text-gray-700">{file}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No materials attached.</p>
              )}
            </Card>

            {/* Download Lesson Plan Card */}
            <Card className="!p-4 bg-orange-50 border-orange-100">
              <h4 className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-3">Lesson Plan</h4>
              <button
                onClick={() => generateLessonPlanPDF(selectedSession, getTeacherName(selectedSession.teacherId))}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Lesson Plan
              </button>
              <p className="text-[10px] text-orange-600 text-center mt-2">Download PDF dengan format CEFR</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Class Schedule
          </h2>
          <p className="text-xs text-gray-500">{schoolName}</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
            <UserIcon className="w-3 h-3 text-gray-400" />
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="text-xs bg-transparent outline-none pr-4"
            >
              <option value="all">Semua Guru</option>
              {teachersAtSchool.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
        <Eye className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-blue-800 font-medium">Mode View-Only</p>
          <p className="text-[10px] text-blue-600">Jadwal kelas diinput dan dikelola oleh guru masing-masing.</p>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                 <th className="px-3 py-2">Date/Time</th>
                 <th className="px-3 py-2">Category</th>
                 <th className="px-3 py-2">Topic</th>
                 <th className="px-3 py-2">Teacher</th>
                 <th className="px-3 py-2">Class</th>
                 <th className="px-3 py-2">Status</th>
                 <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSessions.map(session => {
                const status = getSessionStatus(session);
                return (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="text-xs font-medium text-gray-900">{new Date(session.dateTime).toLocaleDateString()}</div>
                      <div className="text-[10px] text-gray-500">{new Date(session.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tight bg-gray-100 px-1.5 py-0.5 rounded">
                         {session.skillCategories.join(', ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700 font-medium">
                      {session.topic}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                         <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[9px] font-bold text-gray-600">
                            {getTeacherName(session.teacherId).charAt(0)}
                         </div>
                         <span className="text-xs text-gray-900">{getTeacherName(session.teacherId)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-[10px] text-gray-600 font-medium">
                        <MapPin className="w-3 h-3 text-orange-500" /> {session.location}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => generateLessonPlanPDF(session, getTeacherName(session.teacherId))}
                          className="p-1 bg-orange-50 text-orange-600 rounded hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                          title="Download PDF"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-xs italic">
                    No schedules found for {schoolName}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SchoolStudentSchedule;
