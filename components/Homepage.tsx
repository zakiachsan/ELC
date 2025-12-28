
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './Button';
import {
  CheckCircle, Zap, Users, Trophy, Star, Globe,
  Calendar, Award, ShieldCheck, Lock, Smartphone, Mail, X, ChevronRight, Brain, AlertCircle, Clock, Sparkles, XCircle, ArrowLeft, Newspaper, Medal, MonitorPlay, Video, Briefcase, Flag, UserPlus, FileText, Send, DollarSign, TrendingUp, Play, Target, Timer, Crown, Gamepad2, MapPin, GraduationCap, BadgeCheck, Quote
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { LoginModal } from './LoginModal';
import { Card } from './Card';
import { UserRole, Olympiad, OlympiadStatus, CEFRLevel, News } from '../types';
import { MOCK_OLYMPIADS, MOCK_PLACEMENT_QUESTIONS, MOCK_NEWS, MOCK_STUDENTS_OF_THE_MONTH, MOCK_FEATURED_TEACHERS } from '../constants';

// Kahoot Types
interface KahootQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number; // seconds
}

interface KahootQuiz {
  id: string;
  title: string;
  description: string;
  questions: KahootQuestion[];
  createdBy: string;
}

interface KahootPlayer {
  name: string;
  score: number;
  timestamp: number;
  correctAnswers: number;
  totalTime: number;
}

interface KahootRanking {
  daily: KahootPlayer[];
  allTime: KahootPlayer[];
}

// Mock Kahoot Data
const MOCK_KAHOOT_QUIZZES: KahootQuiz[] = [
  {
    id: 'quiz-grammar-101',
    title: 'English Grammar Challenge',
    description: 'Test your grammar skills with 5 quick questions!',
    createdBy: 'ELC Team',
    questions: [
      {
        id: 'q1',
        question: 'Choose the correct sentence:',
        options: ['She don\'t like coffee', 'She doesn\'t likes coffee', 'She doesn\'t like coffee', 'She not like coffee'],
        correctIndex: 2,
        timeLimit: 15
      },
      {
        id: 'q2',
        question: 'Fill in the blank: "I have been living here ___ 2015."',
        options: ['for', 'since', 'from', 'at'],
        correctIndex: 1,
        timeLimit: 12
      },
      {
        id: 'q3',
        question: 'Which word is a noun?',
        options: ['Quickly', 'Beautiful', 'Happiness', 'Run'],
        correctIndex: 2,
        timeLimit: 10
      },
      {
        id: 'q4',
        question: 'Choose the correct past tense: "Yesterday, I ___ to the market."',
        options: ['go', 'went', 'gone', 'going'],
        correctIndex: 1,
        timeLimit: 10
      },
      {
        id: 'q5',
        question: 'Identify the correct question form:',
        options: ['Where you are going?', 'Where are you going?', 'Where going you are?', 'You are going where?'],
        correctIndex: 1,
        timeLimit: 12
      }
    ]
  }
];

// Generate mock rankings
const generateMockRankings = (): KahootRanking => {
  const names = ['Ahmad Fauzi', 'Siti Nurhaliza', 'Budi Santoso', 'Maria Putri', 'Andi Pratama', 'Dewi Lestari', 'Rizki Ramadhan', 'Ayu Ningrum'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyPlayers: KahootPlayer[] = names.slice(0, 5).map((name, i) => ({
    name,
    score: 5000 - (i * 400) - Math.floor(Math.random() * 200),
    timestamp: today.getTime() + Math.floor(Math.random() * 86400000),
    correctAnswers: 5 - Math.floor(i / 2),
    totalTime: 45 + (i * 5) + Math.floor(Math.random() * 10)
  }));

  const allTimePlayers: KahootPlayer[] = names.map((name, i) => ({
    name,
    score: 5000 - (i * 350) - Math.floor(Math.random() * 150),
    timestamp: Date.now() - Math.floor(Math.random() * 7 * 86400000),
    correctAnswers: 5 - Math.floor(i / 3),
    totalTime: 40 + (i * 4) + Math.floor(Math.random() * 15)
  }));

  return {
    daily: dailyPlayers.sort((a, b) => b.score - a.score),
    allTime: allTimePlayers.sort((a, b) => b.score - a.score)
  };
};

interface HomepageProps {
  onLoginSuccess: (role: UserRole, email?: string) => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onLoginSuccess }) => {
  const { t, language, setLanguage } = useLanguage();
  const { settings } = useSettings();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // General navigation state
  const [currentHomeView, setCurrentHomeView] = useState<'main' | 'news-archive' | 'news-detail'>('main');
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  // Olympiad Registration Flow States
  const [selectedOlympiad, setSelectedOlympiad] = useState<Olympiad | null>(null);
  const [regStep, setRegStep] = useState<'info' | 'form' | 'payment' | 'success'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{user: string, pass: string} | null>(null);

  // Teacher Application States
  const [teacherFlow, setTeacherFlow] = useState<'none' | 'type' | 'form' | 'success'>('none');
  const [teacherType, setTeacherType] = useState<'local' | 'native' | null>(null);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    dob: '',
    country: '',
    experience: '',
    hasDegree: false,
    motivation: '',
    salary: '',
    email: '',
    phone: '',
    photoFile: null as File | null,
    policeCheckFile: null as File | null,
    degreeFile: null as File | null,
    daysPerWeek: '' as '' | '5' | '6',
    hoursPerWeek: '' as '' | '15' | '20' | '25'
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Placement Test States
  const [placementFlow, setPlacementFlow] = useState<'none' | 'form' | 'quiz' | 'result' | 'schedule' | 'scheduled'>('none');
  const [sessionID, setSessionID] = useState<string>('');
  const [currentPQIndex, setCurrentPQIndex] = useState(0);
  const [placementAnswers, setPlacementAnswers] = useState<Record<string, number>>({});
  const [placementResult, setPlacementResult] = useState<{score: number, cefr: CEFRLevel} | null>(null);
  const [selectedOralDate, setSelectedOralDate] = useState<string>('');
  const [selectedOralTime, setSelectedOralTime] = useState<string>('');

  // Mock available oral test slots (dari admin)
  const ORAL_TEST_SLOTS = [
    { date: '2025-01-06', day: 'Senin', slots: ['09:00', '10:00', '14:00', '15:00'] },
    { date: '2025-01-07', day: 'Selasa', slots: ['09:00', '10:00', '11:00', '14:00'] },
    { date: '2025-01-08', day: 'Rabu', slots: ['10:00', '11:00', '15:00', '16:00'] },
    { date: '2025-01-09', day: 'Kamis', slots: ['09:00', '14:00', '15:00'] },
    { date: '2025-01-10', day: 'Jumat', slots: ['09:00', '10:00', '11:00'] },
  ];

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    grade: '',
    parentName: '',
    parentWa: '',
    personalWa: '',
    address: '',
    email: '',
    schoolOrigin: ''
  });
  const [isOtherSchool, setIsOtherSchool] = useState(false);

  // Kahoot Quiz States
  const [kahootFlow, setKahootFlow] = useState<'none' | 'intro' | 'playing' | 'result'>('none');
  const [kahootPlayerName, setKahootPlayerName] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState<KahootQuiz | null>(null);
  const [kahootQuestionIndex, setKahootQuestionIndex] = useState(0);
  const [kahootTimeLeft, setKahootTimeLeft] = useState(0);
  const [kahootAnswers, setKahootAnswers] = useState<{questionId: string; answer: number; timeSpent: number; isCorrect: boolean}[]>([]);
  const [kahootScore, setKahootScore] = useState(0);
  const [kahootRankings, setKahootRankings] = useState<KahootRanking>(generateMockRankings());
  const [kahootAnswered, setKahootAnswered] = useState(false);
  const [showRankingTab, setShowRankingTab] = useState<'daily' | 'allTime'>('daily');

  // Video Popup State - shows on first visit
  const [showVideoPopup, setShowVideoPopup] = useState(true);

  // School list for dropdown
  const SCHOOL_LIST = [
    'SDN 1 Surabaya',
    'SDN 2 Surabaya',
    'SMPN 1 Surabaya',
    'SMPN 2 Surabaya',
    'SMAN 1 Surabaya',
    'SMAN 2 Surabaya',
    'SD Al-Hikmah Surabaya',
    'SMP Al-Hikmah Surabaya',
    'SMA Al-Hikmah Surabaya',
    'SD Petra Surabaya',
    'SMP Petra Surabaya',
    'SMA Petra Surabaya',
  ];

  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);

  const featuredOlympiad = MOCK_OLYMPIADS.find(o => o.status === OlympiadStatus.OPEN);

  const startRegistration = (ol: Olympiad) => {
    setSelectedOlympiad(ol);
    setRegStep('info');
  };

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const username = formData.name.toLowerCase().replace(/\s/g, '') + Math.floor(100 + Math.random() * 900);
      setGeneratedCreds({ user: username, pass: 'ELC2024!' });
      setRegStep('success');
    }, 2000);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setTeacherFlow('success');
    }, 2000);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTeacherForm({...teacherForm, photoFile: file});
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetTeacherForm = () => {
    setTeacherFlow('none');
    setTeacherType(null);
    setTeacherForm({
      name: '', dob: '', country: '', experience: '', hasDegree: false,
      motivation: '', salary: '', email: '', phone: '',
      photoFile: null, policeCheckFile: null, degreeFile: null
    });
    setPhotoPreview(null);
  };

  const calculateCEFR = (score: number) => {
    if (score >= 90) return CEFRLevel.C2;
    if (score >= 80) return CEFRLevel.C1;
    if (score >= 65) return CEFRLevel.B2;
    if (score >= 50) return CEFRLevel.B1;
    if (score >= 30) return CEFRLevel.A2;
    return CEFRLevel.A1;
  };

  const handleStartPlacementSession = () => {
    const uniqueID = `FT-${formData.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    setSessionID(uniqueID);
    setPlacementFlow('quiz');
    window.scrollTo(0, 0);
  };

  const handleFinishPlacement = () => {
    let totalScore = 0;
    let maxScore = 0;
    MOCK_PLACEMENT_QUESTIONS.forEach(q => {
      if (placementAnswers[q.id] === q.correctAnswerIndex) totalScore += q.weight;
      maxScore += q.weight;
    });
    const finalScore = Math.round((totalScore / maxScore) * 100);
    setPlacementResult({ score: finalScore, cefr: calculateCEFR(finalScore) });
    setPlacementFlow('result');
    window.scrollTo(0, 0);
  };

  const openNewsDetail = (news: News) => {
    setSelectedNews(news);
    setCurrentHomeView('news-detail');
    window.scrollTo(0, 0);
  };

  const openNewsArchive = () => {
    setCurrentHomeView('news-archive');
    window.scrollTo(0, 0);
  };

  const handleSchoolChange = (value: string) => {
    if (value === 'other') {
      setIsOtherSchool(true);
      setFormData({...formData, schoolOrigin: ''});
    } else {
      setIsOtherSchool(false);
      setFormData({...formData, schoolOrigin: value});
    }
  };

  // Kahoot Quiz Handlers
  const startKahootQuiz = (quiz: KahootQuiz) => {
    setCurrentQuiz(quiz);
    setKahootFlow('intro');
    setKahootQuestionIndex(0);
    setKahootAnswers([]);
    setKahootScore(0);
    setKahootAnswered(false);
  };

  const beginKahootGame = () => {
    if (!currentQuiz || !kahootPlayerName.trim()) return;
    setKahootFlow('playing');
    setKahootTimeLeft(currentQuiz.questions[0].timeLimit);
    setKahootAnswered(false);
  };

  const handleKahootAnswer = (answerIndex: number) => {
    if (!currentQuiz || kahootAnswered) return;

    const currentQ = currentQuiz.questions[kahootQuestionIndex];
    const timeSpent = currentQ.timeLimit - kahootTimeLeft;
    const isCorrect = answerIndex === currentQ.correctIndex;

    // Calculate score: base points + time bonus
    let points = 0;
    if (isCorrect) {
      const basePoints = 1000;
      const timeBonus = Math.floor((kahootTimeLeft / currentQ.timeLimit) * 500);
      points = basePoints + timeBonus;
    }

    setKahootAnswers(prev => [...prev, {
      questionId: currentQ.id,
      answer: answerIndex,
      timeSpent,
      isCorrect
    }]);
    setKahootScore(prev => prev + points);
    setKahootAnswered(true);

    // Auto-advance after 1.5s
    setTimeout(() => {
      if (kahootQuestionIndex < currentQuiz.questions.length - 1) {
        setKahootQuestionIndex(prev => prev + 1);
        setKahootTimeLeft(currentQuiz.questions[kahootQuestionIndex + 1].timeLimit);
        setKahootAnswered(false);
      } else {
        // Quiz finished
        finishKahootQuiz(kahootScore + points);
      }
    }, 1500);
  };

  const finishKahootQuiz = (finalScore: number) => {
    // Add player to rankings
    const correctCount = kahootAnswers.filter(a => a.isCorrect).length + (kahootAnswers.length < (currentQuiz?.questions.length || 0) ? 1 : 0);
    const totalTime = kahootAnswers.reduce((sum, a) => sum + a.timeSpent, 0);

    const newPlayer: KahootPlayer = {
      name: kahootPlayerName,
      score: finalScore,
      timestamp: Date.now(),
      correctAnswers: correctCount,
      totalTime
    };

    setKahootRankings(prev => ({
      daily: [...prev.daily, newPlayer].sort((a, b) => b.score - a.score).slice(0, 10),
      allTime: [...prev.allTime, newPlayer].sort((a, b) => b.score - a.score).slice(0, 10)
    }));

    setKahootFlow('result');
  };

  const resetKahoot = () => {
    setKahootFlow('none');
    setCurrentQuiz(null);
    setKahootPlayerName('');
    setKahootQuestionIndex(0);
    setKahootAnswers([]);
    setKahootScore(0);
    setKahootAnswered(false);
  };

  // Kahoot Timer Effect
  useEffect(() => {
    if (kahootFlow !== 'playing' || kahootAnswered || kahootTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setKahootTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit wrong answer
          handleKahootAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [kahootFlow, kahootAnswered, kahootTimeLeft, kahootQuestionIndex]);

  // Grade options with detailed class levels
  const GRADE_OPTIONS = [
    { group: 'SD', options: ['1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD'] },
    { group: 'SMP', options: ['7 SMP', '8 SMP', '9 SMP'] },
    { group: 'SMA', options: ['10 SMA', '11 SMA', '12 SMA'] },
    { group: 'Lainnya', options: ['Kuliah', 'Umum'] },
  ];

  const renderRegistrationFields = () => (
    <div className="space-y-5">
      {/* Data Siswa Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span className="text-xs font-semibold text-gray-700">Data Siswa</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block">Nama Lengkap</label>
            <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama lengkap siswa" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block">Email</label>
            <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@contoh.com" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block">Nomor WhatsApp</label>
            <input type="tel" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" value={formData.personalWa} onChange={e => setFormData({...formData, personalWa: e.target.value})} placeholder="08xxxxxxxxxx" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block">Kelas</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all bg-white" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
              <option value="">Pilih Kelas</option>
              {GRADE_OPTIONS.map(group => (
                <optgroup key={group.group} label={group.group}>
                  {group.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block">Asal Sekolah</label>
            {isOtherSchool ? (
              <div className="flex gap-2">
                <input type="text" className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" value={formData.schoolOrigin} onChange={e => setFormData({...formData, schoolOrigin: e.target.value})} placeholder="Ketik nama sekolah..." />
                <button type="button" onClick={() => setIsOtherSchool(false)} className="px-3 text-xs text-gray-400 hover:text-blue-600">
                  Pilih
                </button>
              </div>
            ) : (
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all bg-white" value={formData.schoolOrigin} onChange={e => handleSchoolChange(e.target.value)}>
                <option value="">Pilih Sekolah</option>
                {SCHOOL_LIST.map(school => (
                  <option key={school} value={school}>{school}</option>
                ))}
                <option value="other">Lainnya (Input Manual)</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Data Orang Tua Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-xs font-semibold text-gray-700">Data Orang Tua / Wali</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block">Nama Orang Tua</label>
            <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} placeholder="Nama orang tua/wali" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block">Nomor WhatsApp Orang Tua</label>
            <input type="tel" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" value={formData.parentWa} onChange={e => setFormData({...formData, parentWa: e.target.value})} placeholder="08xxxxxxxxxx" />
          </div>
        </div>
      </div>
    </div>
  );

  // --- TEACHER APPLICATION FULL PAGE VIEW ---
  if (teacherFlow !== 'none') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-sans">
        {/* Header */}
        <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 sticky top-0 z-40 shadow-sm">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 theme-bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg">E</div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none">Karir ELC</h2>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Gabung Tim Pengajar</p>
              </div>
            </div>
            <button onClick={resetTeacherForm} className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
          {/* Type Selection */}
          {teacherFlow === 'type' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Briefcase className="w-7 h-7" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bergabung dengan Tim ELC</h1>
                <p className="text-gray-500 max-w-md mx-auto">Pilih kategori pengajar yang sesuai dengan profil Anda</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                <button
                  onClick={() => { setTeacherType('local'); setTeacherFlow('form'); }}
                  className="p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Flag className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">Local Instructor</p>
                      <p className="text-sm text-gray-500 mt-1">Pengajar lokal Indonesia dengan pengalaman mengajar bahasa Inggris</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => { setTeacherType('native'); setTeacherFlow('form'); }}
                  className="p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Globe className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">Native Speaker</p>
                      <p className="text-sm text-gray-500 mt-1">Penutur asli bahasa Inggris dari negara anglofon</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Application Form */}
          {teacherFlow === 'form' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Form Lamaran</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${teacherType === 'native' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {teacherType === 'native' ? 'Native Speaker' : 'Local Instructor'}
                    </span>
                    <button type="button" onClick={() => setTeacherFlow('type')} className="text-xs text-gray-400 hover:text-gray-600">Ubah</button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTeacherSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Foto Profil
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                          <UserPlus className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                          <FileText className="w-4 h-4" />
                          {photoPreview ? 'Ganti Foto' : 'Upload Foto'}
                        </div>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      </label>
                      <p className="text-[10px] text-gray-400 mt-1">Format: JPG, PNG (Max 2MB)</p>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Data Pribadi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Lengkap *</label>
                      <input
                        type="text"
                        required
                        value={teacherForm.name}
                        onChange={e => setTeacherForm({...teacherForm, name: e.target.value})}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Tanggal Lahir *</label>
                      <input
                        type="date"
                        required
                        value={teacherForm.dob}
                        onChange={e => setTeacherForm({...teacherForm, dob: e.target.value})}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Negara Asal *</label>
                      <input
                        type="text"
                        required
                        value={teacherForm.country}
                        onChange={e => setTeacherForm({...teacherForm, country: e.target.value})}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder={teacherType === 'native' ? 'USA, UK, Australia...' : 'Indonesia'}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    Kontak
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Email *</label>
                      <input
                        type="email"
                        required
                        value={teacherForm.email}
                        onChange={e => setTeacherForm({...teacherForm, email: e.target.value})}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="email@domain.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">No. Telepon / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={teacherForm.phone}
                        onChange={e => setTeacherForm({...teacherForm, phone: e.target.value})}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="+62 812 xxxx xxxx"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    Pengalaman & Kualifikasi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Pengalaman Mengajar (Tahun) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={teacherForm.experience}
                        onChange={e => setTeacherForm({...teacherForm, experience: e.target.value})}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="3"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Ekspektasi Gaji ($/bulan)</label>
                      <input
                        type="number"
                        value={teacherForm.salary}
                        onChange={e => setTeacherForm({...teacherForm, salary: e.target.value})}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="1000"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="hasDegree"
                      checked={teacherForm.hasDegree}
                      onChange={e => setTeacherForm({...teacherForm, hasDegree: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="hasDegree" className="text-sm text-gray-700">Saya memiliki gelar sarjana (Bachelor's Degree atau lebih tinggi)</label>
                  </div>
                </div>

                {/* Teaching Availability */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                    Ketersediaan Mengajar
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Hari per Minggu *</label>
                      <select
                        required
                        value={teacherForm.daysPerWeek}
                        onChange={e => setTeacherForm({...teacherForm, daysPerWeek: e.target.value as '' | '5' | '6'})}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                      >
                        <option value="">Pilih...</option>
                        <option value="5">5 hari per minggu</option>
                        <option value="6">6 hari per minggu</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Jam per Minggu *</label>
                      <select
                        required
                        value={teacherForm.hoursPerWeek}
                        onChange={e => setTeacherForm({...teacherForm, hoursPerWeek: e.target.value as '' | '15' | '20' | '25'})}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                      >
                        <option value="">Pilih...</option>
                        <option value="15">15 jam per minggu</option>
                        <option value="20">20 jam per minggu</option>
                        <option value="25">25 jam per minggu</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Motivation */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                    Motivasi & Background
                  </h3>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Ceritakan tentang diri Anda *</label>
                    <textarea
                      required
                      rows={4}
                      value={teacherForm.motivation}
                      onChange={e => setTeacherForm({...teacherForm, motivation: e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="Ceritakan pengalaman mengajar, latar belakang pendidikan, dan motivasi Anda untuk bergabung dengan ELC..."
                    />
                  </div>
                </div>

                {/* Document Upload */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    Dokumen Pendukung
                    <span className="text-[9px] font-normal text-gray-400 ml-1">(Opsional)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">SKCK / Police Check</label>
                      <label className="cursor-pointer block">
                        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${teacherForm.policeCheckFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          {teacherForm.policeCheckFile ? (
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium truncate">{teacherForm.policeCheckFile.name}</span>
                            </div>
                          ) : (
                            <div className="text-gray-400">
                              <FileText className="w-6 h-6 mx-auto mb-1" />
                              <p className="text-xs">Upload PDF</p>
                            </div>
                          )}
                        </div>
                        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && setTeacherForm({...teacherForm, policeCheckFile: e.target.files[0]})} className="hidden" />
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Ijazah / Degree Certificate</label>
                      <label className="cursor-pointer block">
                        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${teacherForm.degreeFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          {teacherForm.degreeFile ? (
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium truncate">{teacherForm.degreeFile.name}</span>
                            </div>
                          ) : (
                            <div className="text-gray-400">
                              <FileText className="w-6 h-6 mx-auto mb-1" />
                              <p className="text-xs">Upload PDF</p>
                            </div>
                          )}
                        </div>
                        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && setTeacherForm({...teacherForm, degreeFile: e.target.files[0]})} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Dokumen dapat dikirim kemudian jika belum tersedia.</p>
                </div>

                {/* Submit */}
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full h-12 rounded-xl font-semibold bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Lamaran</span>
                      </>
                    )}
                  </button>
                  <button type="button" onClick={resetTeacherForm} className="text-sm text-gray-400 hover:text-gray-600">
                    Batalkan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Success */}
          {teacherFlow === 'success' && (
            <div className="text-center space-y-6 py-10 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Lamaran Terkirim!</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Terima kasih, <span className="font-semibold">{teacherForm.name}</span>! Lamaran Anda telah kami terima. Tim rekrutmen akan menghubungi Anda melalui email dalam 3-5 hari kerja.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 max-w-sm mx-auto">
                <p className="text-sm text-blue-700">
                  Pastikan untuk memeriksa folder spam jika tidak menerima email dari kami.
                </p>
              </div>
              <Button onClick={resetTeacherForm} className="h-11 px-8 rounded-xl font-semibold">
                Kembali ke Beranda
              </Button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- SUB-VIEWS RENDERING (PLACEMENT & NEWS) ---
  if (placementFlow === 'quiz' || placementFlow === 'result' || placementFlow === 'schedule' || placementFlow === 'scheduled') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans animate-in fade-in duration-500">
         <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-40 shadow-sm">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 theme-bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg">E</div>
                  <div>
                    <h2 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-tight leading-none">Placement Test</h2>
                    <p className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-1">ID: <span className="text-blue-600">{sessionID}</span></p>
                  </div>
               </div>
               <button onClick={() => setPlacementFlow('none')} className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                  <XCircle className="w-6 h-6" />
               </button>
            </div>
         </nav>
         <main className="max-w-4xl mx-auto px-4 py-12">
            {placementFlow === 'quiz' ? (
               <div className="space-y-8">
                  <div className="bg-white rounded-[40px] shadow-xl p-10 border border-gray-200">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Question {currentPQIndex + 1} of {MOCK_PLACEMENT_QUESTIONS.length}</p>
                     <h3 className="text-3xl font-bold text-gray-900 mb-8">{MOCK_PLACEMENT_QUESTIONS[currentPQIndex].text}</h3>
                     <div className="grid grid-cols-1 gap-4">
                        {MOCK_PLACEMENT_QUESTIONS[currentPQIndex].options.map((opt, i) => (
                           <button key={i} onClick={() => setPlacementAnswers({...placementAnswers, [MOCK_PLACEMENT_QUESTIONS[currentPQIndex].id]: i})} className={`w-full p-6 text-left rounded-2xl border-2 transition-all flex items-center gap-4 ${placementAnswers[MOCK_PLACEMENT_QUESTIONS[currentPQIndex].id] === i ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${placementAnswers[MOCK_PLACEMENT_QUESTIONS[currentPQIndex].id] === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{String.fromCharCode(65+i)}</div>
                              <span className="text-lg font-bold text-gray-700">{opt}</span>
                           </button>
                        ))}
                     </div>
                     <div className="mt-10 flex justify-between">
                        <button onClick={() => setCurrentPQIndex(prev => Math.max(0, prev - 1))} className="text-sm font-bold text-gray-400">Previous</button>
                        {currentPQIndex < MOCK_PLACEMENT_QUESTIONS.length - 1 ? (
                           <Button onClick={() => setCurrentPQIndex(prev => prev + 1)} disabled={placementAnswers[MOCK_PLACEMENT_QUESTIONS[currentPQIndex].id] === undefined}>Next Question</Button>
                        ) : (
                           <Button onClick={handleFinishPlacement} className="bg-green-600 hover:bg-green-700">Finish Test</Button>
                        )}
                     </div>
                  </div>
               </div>
            ) : placementFlow === 'result' ? (
               <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Award className="w-10 h-10" /></div>
                  <h2 className="text-4xl md:text-5xl font-black text-gray-900">Your CEFR Level: {placementResult?.cefr.split(' - ')[0]}</h2>
                  <p className="text-base md:text-lg text-gray-500 max-w-lg mx-auto">Selamat! Anda berada di level <b>{placementResult?.cefr.split(' - ')[1]}</b>.</p>

                  {/* Next Step - Oral Test */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-xl mx-auto border border-gray-100 text-left space-y-4">
                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                           <Smartphone className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900">Langkah Selanjutnya: Oral Test</h3>
                           <p className="text-sm text-gray-500 mt-1">
                              Untuk melengkapi assessment Anda, jadwalkan sesi oral test dengan tim kami. Kami akan menghubungi Anda via WhatsApp.
                           </p>
                        </div>
                     </div>
                     <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-blue-800 text-sm">
                           <CheckCircle className="w-4 h-4 text-blue-600" />
                           <span>Durasi: 10-15 menit</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-800 text-sm">
                           <CheckCircle className="w-4 h-4 text-blue-600" />
                           <span>Via Video Call (Zoom/Google Meet)</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-800 text-sm">
                           <CheckCircle className="w-4 h-4 text-blue-600" />
                           <span>Gratis, tanpa biaya</span>
                        </div>
                     </div>
                     <Button onClick={() => setPlacementFlow('schedule')} className="w-full h-12 rounded-xl font-semibold">
                        Jadwalkan Oral Test
                     </Button>
                  </div>

                  <button onClick={() => setPlacementFlow('none')} className="text-sm text-gray-400 hover:text-gray-600 font-medium">
                     Lewati untuk saat ini
                  </button>
               </div>
            ) : placementFlow === 'schedule' ? (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center space-y-2">
                     <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Pilih Jadwal Oral Test</h2>
                     <p className="text-gray-500">Pilih tanggal dan waktu yang sesuai untuk sesi oral test Anda.</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto border border-gray-100 space-y-6">
                     {/* Date Selection */}
                     <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 block">Pilih Tanggal</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                           {ORAL_TEST_SLOTS.map((slot) => (
                              <button
                                 key={slot.date}
                                 onClick={() => { setSelectedOralDate(slot.date); setSelectedOralTime(''); }}
                                 className={`p-3 rounded-xl border-2 transition-all text-center ${
                                    selectedOralDate === slot.date
                                       ? 'border-blue-600 bg-blue-50'
                                       : 'border-gray-200 hover:border-gray-300'
                                 }`}
                              >
                                 <p className="text-xs text-gray-500 font-medium">{slot.day}</p>
                                 <p className="text-sm font-bold text-gray-900">
                                    {new Date(slot.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                 </p>
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Time Selection */}
                     {selectedOralDate && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                           <label className="text-sm font-semibold text-gray-700 block">Pilih Waktu</label>
                           <div className="flex flex-wrap gap-2">
                              {ORAL_TEST_SLOTS.find(s => s.date === selectedOralDate)?.slots.map((time) => (
                                 <button
                                    key={time}
                                    onClick={() => setSelectedOralTime(time)}
                                    className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                                       selectedOralTime === time
                                          ? 'border-blue-600 bg-blue-600 text-white'
                                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                    }`}
                                 >
                                    {time} WIB
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Confirmation */}
                     {selectedOralDate && selectedOralTime && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in fade-in duration-300">
                           <p className="text-sm text-green-800">
                              <span className="font-semibold">Jadwal dipilih:</span>{' '}
                              {ORAL_TEST_SLOTS.find(s => s.date === selectedOralDate)?.day},{' '}
                              {new Date(selectedOralDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}{' '}
                              pukul {selectedOralTime} WIB
                           </p>
                        </div>
                     )}

                     <div className="flex gap-3">
                        <button onClick={() => setPlacementFlow('result')} className="px-6 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700">
                           Kembali
                        </button>
                        <Button
                           onClick={() => setPlacementFlow('scheduled')}
                           disabled={!selectedOralDate || !selectedOralTime}
                           className="flex-1 h-12 rounded-xl font-semibold"
                        >
                           Konfirmasi Jadwal
                        </Button>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                     <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Jadwal Oral Test Dikonfirmasi!</h2>

                  <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto border border-gray-100 space-y-4">
                     <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Jadwal Anda</p>
                        <p className="text-lg font-bold text-gray-900">
                           {ORAL_TEST_SLOTS.find(s => s.date === selectedOralDate)?.day},{' '}
                           {new Date(selectedOralDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-gray-600">Pukul {selectedOralTime} WIB</p>
                     </div>

                     <div className="flex items-start gap-3 text-left bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <Smartphone className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                           <p className="text-sm font-semibold text-yellow-800">Tim kami akan menghubungi Anda</p>
                           <p className="text-xs text-yellow-700 mt-1">
                              Kami akan mengirimkan link meeting dan reminder via WhatsApp ke nomor <span className="font-semibold">{formData.personalWa || formData.parentWa || 'yang terdaftar'}</span>.
                           </p>
                        </div>
                     </div>

                     <div className="text-left space-y-2 pt-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail Test ID</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                           <p className="text-sm text-gray-600">Session ID: <span className="font-mono font-bold text-blue-600">{sessionID}</span></p>
                           <p className="text-sm text-gray-600">CEFR Level: <span className="font-bold">{placementResult?.cefr.split(' - ')[0]}</span></p>
                        </div>
                     </div>
                  </div>

                  <Button onClick={() => setPlacementFlow('none')} className="h-12 px-8 rounded-xl font-semibold">
                     Kembali ke Beranda
                  </Button>
               </div>
            )}
         </main>
      </div>
    );
  }

  if (currentHomeView === 'news-archive') {
     return (
        <div className="min-h-screen bg-gray-50 font-sans">
           <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
              <button onClick={() => setCurrentHomeView('main')} className="flex items-center gap-2 text-gray-500 font-bold hover:text-blue-600"><ArrowLeft className="w-5 h-5" /> Kembali</button>
              <div className="flex items-center gap-2"><div className="w-8 h-8 theme-bg-primary rounded-lg flex items-center justify-center text-white font-bold">E</div><span className="font-black text-gray-900 tracking-tight uppercase">ELC Hub</span></div>
              <div className="w-20"></div>
           </nav>
           <main className="max-w-7xl mx-auto px-4 py-16 space-y-12">
              <div className="text-center space-y-4">
                 <h1 className="text-5xl font-black text-gray-900 tracking-tight">Media Center</h1>
                 <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">Temukan kabar terbaru seputar prestasi dan kegiatan ELC.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {MOCK_NEWS.map(news => (
                    <Card key={news.id} className="overflow-hidden hover:shadow-2xl transition-all border-none group cursor-pointer" onClick={() => openNewsDetail(news)}>
                       <div className="aspect-video relative"><img src={news.featuredImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" /></div>
                       <div className="p-8 space-y-4">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{news.title}</h3>
                          <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">{news.summary}</p>
                          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">Baca Artikel <ChevronRight className="w-4 h-4" /></div>
                       </div>
                    </Card>
                 ))}
              </div>
           </main>
        </div>
     );
  }

  if (currentHomeView === 'news-detail' && selectedNews) {
     return (
        <div className="min-h-screen bg-white font-sans animate-in fade-in duration-500">
           <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 sticky top-0 z-40 flex justify-between items-center">
              <button onClick={() => setCurrentHomeView('news-archive')} className="text-xs font-black uppercase text-gray-400 hover:text-blue-600 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Tutup Berita</button>
              <div className="font-black text-gray-900 text-xs uppercase tracking-widest">ELC Article</div>
              <div className="w-20"></div>
           </nav>
           <article className="max-w-2xl mx-auto px-4 py-16 space-y-10">
              <div className="space-y-4 text-center">
                 <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border border-blue-100">Official News</div>
                 <h1 className="text-4xl font-black text-gray-900 leading-tight">{selectedNews.title}</h1>
                 <p className="text-lg text-gray-500 font-medium leading-relaxed italic">{selectedNews.summary}</p>
              </div>
              <div className="rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 aspect-video">
                 {selectedNews.displayMedia === 'video' ? (
                    <iframe className="w-full h-full" src={selectedNews.videoUrl} title={selectedNews.title} allowFullScreen></iframe>
                 ) : (
                    <img src={selectedNews.featuredImage} className="w-full h-full object-cover" alt="" />
                 )}
              </div>
              <div className="prose prose-slate max-w-none prose-headings:font-black prose-p:text-gray-600 prose-p:leading-loose text-lg" dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
              <div className="pt-10 border-t border-gray-100 flex justify-center"><Button onClick={() => setCurrentHomeView('main')} variant="outline" className="h-14 px-10 rounded-2xl font-bold">Kembali ke Beranda</Button></div>
           </article>
        </div>
     );
  }

  // --- MAIN HOMEPAGE CONTENT ---
  const isPortrait = settings.videoOrientation === 'portrait';

  return (
    <div className="min-h-screen bg-white font-sans relative">
      <LoginModal isOpen={isLoginOpen} onClose={closeLogin} onLogin={onLoginSuccess} />

      {/* Welcome Video Popup */}
      {showVideoPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className={`bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative ${isPortrait ? 'w-full max-w-sm' : 'w-full max-w-2xl'}`}>
            <button
              onClick={() => setShowVideoPopup(false)}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-5">
              <div className="flex items-center gap-2 text-white/90 mb-3">
                <div className="w-8 h-8 theme-bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">E</div>
                <div>
                  <span className="text-sm font-bold">ELC<span className="theme-text-accent">{t.app_name}</span></span>
                  <p className="text-[9px] text-white/60 uppercase tracking-widest font-bold">Selamat Datang!</p>
                </div>
              </div>
              <div className={`relative rounded-2xl overflow-hidden bg-black border border-white/10 ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`}>
                <iframe className="w-full h-full" src={settings.videoUrl} title="Welcome Video" allowFullScreen></iframe>
              </div>
              <button
                onClick={() => setShowVideoPopup(false)}
                className="w-full mt-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg"
              >
                Lanjutkan ke Website
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-gray-100">
        {/* Logo */}
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 md:w-10 md:h-10 theme-bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">E</div>
           <span className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">ELC<span className="theme-text-accent">{t.app_name}</span></span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-gray-600 font-medium text-sm">
          <a href="#why-elc" className="hover:theme-text-primary transition-colors">Keunggulan</a>
          <a href="#featured-event" className="hover:theme-text-primary transition-colors">Olimpiade</a>
          <a href="#cefr-test" className="hover:theme-text-primary transition-colors">Free Test</a>
          <a href="#hall-of-fame" className="hover:theme-text-primary transition-colors">Hall of Fame</a>
          <a href="#news" className="hover:theme-text-primary transition-colors">News</a>
        </div>

        {/* Right Actions */}
        <div className="flex gap-2 md:gap-3 items-center">
          {/* Karir CTA */}
          <button
            onClick={() => setTeacherFlow('type')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 px-3 py-1.5 rounded-full hover:bg-teal-50 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            <span>Karir</span>
          </button>
          {/* Language - icon only on mobile */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 px-2.5 py-1.5 md:px-3 md:py-2 rounded-full hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'ID'}</span>
          </button>
          {/* Login Button */}
          <Button variant="outline" onClick={openLogin} className="text-sm px-3 py-1.5 md:px-4 md:py-2">{t.hp_login}</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-10 pb-14 md:pt-12 md:pb-16 lg:pt-16 lg:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
           <div className="space-y-5 md:space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 theme-bg-primary-light border theme-border-primary px-4 py-2 md:px-5 md:py-2.5 rounded-full theme-text-primary font-semibold text-sm">
                <Star className="w-4 h-4 md:w-5 md:h-5 theme-text-accent fill-current" />
                <span>Adaptive English Learning</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                <span className="block">Master English</span>
                <span className="block">with <span className="theme-gradient-text">Smart Adaptive</span> Logic.</span>
              </h1>

              {/* Description */}
              <p className="text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto px-2">
                {t.hp_hero_desc}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 md:pt-3 px-4 sm:px-0">
                <Button onClick={openLogin} variant="primary" className="h-12 md:h-14 px-8 md:px-10 text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Mulai Belajar
                </Button>
                <button onClick={() => setPlacementFlow('form')} className="h-12 md:h-14 px-8 md:px-10 text-base md:text-lg flex items-center justify-center gap-2 text-gray-700 font-semibold hover:theme-text-primary transition-colors border border-gray-200 rounded-xl bg-white shadow-sm">
                  Free CEFR Test
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </button>
              </div>
           </div>
        </div>
      </section>

      {/* Keunggulan ELC Section */}
      <section id="why-elc" className="py-8 lg:py-12 bg-gradient-to-b from-white to-teal-50/30 scroll-mt-20">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
               <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                  Belajar dengan Guru <span className="theme-gradient-text">Terbaik & Bersertifikat</span>
               </h2>
               <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto">
                  ELC menghadirkan pengajar native speaker dari berbagai negara dan guru lokal bersertifikat internasional untuk memastikan kualitas pembelajaran terbaik.
               </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
               {[
                  { value: '15+', label: 'Native Teachers', icon: Globe },
                  { value: '100%', label: 'Bersertifikat', icon: BadgeCheck },
                  { value: '10+', label: 'Negara Asal', icon: Flag },
                  { value: '8+', label: 'Tahun Pengalaman', icon: GraduationCap }
               ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                     <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <stat.icon className="w-5 h-5 text-teal-600" />
                     </div>
                     <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                     <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
               ))}
            </div>

            {/* Featured Teachers */}
            <div className="space-y-4">
               <h3 className="text-center text-xs font-black text-gray-400 uppercase tracking-widest">
                  Meet Our Star Teachers
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MOCK_FEATURED_TEACHERS.map((teacher) => (
                     <div key={teacher.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                        {/* Photo */}
                        <div className="relative h-48 overflow-hidden">
                           <img
                              src={teacher.photoUrl}
                              alt={teacher.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                           {/* Country Flag */}
                           <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <span className="text-base">{teacher.countryFlag}</span>
                              <span className="text-gray-700">{teacher.country}</span>
                           </div>
                           {/* Type Badge */}
                           <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              teacher.type === 'native'
                                 ? 'bg-yellow-400 text-yellow-900'
                                 : 'bg-teal-500 text-white'
                           }`}>
                              {teacher.type === 'native' ? 'Native Speaker' : 'Local Expert'}
                           </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 space-y-3">
                           <div>
                              <h4 className="font-bold text-gray-900">{teacher.name}</h4>
                              <p className="text-xs text-gray-500">{teacher.specialty}</p>
                           </div>

                           {/* Certifications */}
                           <div className="flex flex-wrap gap-1">
                              {teacher.certifications.map((cert, i) => (
                                 <span key={i} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                    {cert}
                                 </span>
                              ))}
                           </div>

                           {/* Experience */}
                           <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{teacher.experience} tahun pengalaman</span>
                           </div>

                           {/* Quote */}
                           <div className="pt-2 border-t border-gray-100">
                              <p className="text-[11px] text-gray-500 italic leading-relaxed line-clamp-2">
                                 "{teacher.quote}"
                              </p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* Olympiad Section */}
      <section id="featured-event" className="py-12 lg:py-16 bg-gray-50 border-y border-gray-100 scroll-mt-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
           {featuredOlympiad ? (
              <div className="space-y-6">
                 {/* Header */}
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-4">
                       <div className="inline-flex items-center gap-2 bg-indigo-900 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-md">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span>National Event</span>
                       </div>
                       <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">{featuredOlympiad.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                       <Users className="w-4 h-4" />
                       <span>{featuredOlympiad.participantCount} students joined</span>
                    </div>
                 </div>

                 {/* Main Card */}
                 <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col lg:flex-row">
                    {/* Left Content */}
                    <div className="flex-1 p-6 md:p-7 lg:p-8 space-y-5">
                       {/* About Section */}
                       <div className="space-y-2">
                          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">About the Competition</h3>
                          <p className="text-base text-gray-600 leading-relaxed">
                             {featuredOlympiad.description}
                          </p>
                       </div>

                       {/* Benefits */}
                       <div className="space-y-3">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">What You'll Get</h3>
                          <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                             {[
                                "Sertifikat Nasional Berlisensi",
                                "Analisis Skor Detail (CEFR)",
                                "Beasiswa ELC (Up to 50%)",
                                "Akses Komunitas Exclusive",
                                "Merchandise Eksklusif"
                             ].map((benefit, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                                   <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                   <span>{benefit}</span>
                                </li>
                             ))}
                          </ul>
                       </div>

                       {/* Waktu Pendaftaran & Detail Pelaksanaan - Combined Row */}
                       <div className="pt-4 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Waktu Pendaftaran */}
                          <div>
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Waktu Pendaftaran</h4>
                             <div className="flex gap-3">
                                <div className="flex-1 flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                   <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                                   <div>
                                      <p className="text-xs text-gray-400 font-medium">Buka</p>
                                      <p className="text-sm font-semibold text-gray-900">{new Date(featuredOlympiad.startDate).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p>
                                   </div>
                                </div>
                                <div className="flex-1 flex items-center gap-3 bg-red-50 p-3 rounded-xl">
                                   <Clock className="w-5 h-5 text-red-500 shrink-0" />
                                   <div>
                                      <p className="text-xs text-red-400 font-medium">Tutup</p>
                                      <p className="text-sm font-semibold text-gray-900">{new Date(featuredOlympiad.endDate).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Detail Pelaksanaan */}
                          <div>
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detail Pelaksanaan</h4>
                             <div className="flex gap-3">
                                <div className="flex-1 flex items-center gap-3 bg-indigo-50 p-3 rounded-xl">
                                   <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
                                   <div>
                                      <p className="text-xs text-indigo-400 font-medium">Tanggal</p>
                                      <p className="text-sm font-semibold text-gray-900">15 Feb 2025</p>
                                   </div>
                                </div>
                                <div className="flex-1 flex items-center gap-3 bg-indigo-50 p-3 rounded-xl">
                                   <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
                                   <div>
                                      <p className="text-xs text-indigo-400 font-medium">Waktu</p>
                                      <p className="text-sm font-semibold text-gray-900">09:00-12:00</p>
                                   </div>
                                </div>
                                <div className="flex-1 flex items-center gap-3 bg-indigo-50 p-3 rounded-xl">
                                   <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
                                   <div>
                                      <p className="text-xs text-indigo-400 font-medium">Tempat</p>
                                      <p className="text-sm font-semibold text-gray-900">Online</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Right Panel - Price & CTA */}
                    <div className="w-full lg:w-[280px] bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 p-6 text-white flex flex-col justify-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                       <div className="relative z-10 space-y-4">
                          <div className="space-y-1">
                             <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Biaya Pendaftaran</p>
                             <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">Rp {featuredOlympiad.price?.toLocaleString()}</span>
                                <span className="text-xs text-blue-300">/ siswa</span>
                             </div>
                          </div>
                          <div className="space-y-2">
                             <button onClick={() => startRegistration(featuredOlympiad)} className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-indigo-900 rounded-xl font-bold text-sm shadow-lg transition-all hover:shadow-xl active:scale-[0.98]">
                                Daftar Sekarang
                             </button>
                             <p className="text-center text-xs text-blue-300/70">Kuota terbatas</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="text-center py-20 bg-white rounded-[60px] border-4 border-dashed border-gray-100 max-w-4xl mx-auto">
                 <AlertCircle className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                 <h3 className="text-3xl font-black text-gray-900 tracking-tight">Stay Tuned for Next Events</h3>
                 <p className="text-gray-400 mt-2 font-medium">New competitions are announced every quarter.</p>
              </div>
           )}
        </div>
      </section>

      {/* CEFR Test Promo */}
      <section id="cefr-test" className="py-10 lg:py-14 bg-white">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10 shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

               {/* Left Content */}
               <div className="flex-1 space-y-4 text-center lg:text-left z-10">
                  <div className="space-y-2">
                     <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                        Know your English potential based on CEFR
                     </h2>
                     <p className="text-sm md:text-base text-blue-300">
                        Common European Framework of Reference for Languages
                     </p>
                  </div>
                  <p className="text-sm md:text-base text-blue-200 max-w-xl mx-auto lg:mx-0">
                     Ikuti tes penempatan gratis kami untuk mengetahui level kemampuan bahasa Inggris Anda dalam skala standar internasional (A1-C2).
                  </p>
                  <ul className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2">
                     {["Hasil instan dan akurat", "Standar internasional", "100% Gratis"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-blue-100 text-sm">
                           <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                           <span>{item}</span>
                        </li>
                     ))}
                  </ul>
                  <div className="pt-2">
                     <Button onClick={() => setPlacementFlow('form')} className="h-12 px-6 text-sm rounded-xl shadow-lg bg-teal-400 hover:bg-teal-300 text-indigo-900 font-bold transition-all">
                        Take My Free Test Now
                     </Button>
                  </div>
               </div>

               {/* Right Panel - CEFR Scale (Hidden on mobile) */}
               <div className="hidden lg:block w-[320px] shrink-0 z-10">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-lg text-white space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-base font-bold">CEFR Scale</span>
                        <div className="bg-teal-400 text-indigo-900 px-3 py-1 rounded-full text-xs font-semibold">
                           Global Standard
                        </div>
                     </div>
                     <div className="space-y-2">
                        {['C2', 'C1', 'B2', 'B1', 'A2', 'A1'].map((lvl, idx) => (
                           <div key={lvl} className="flex items-center gap-3">
                              <div className={`w-10 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx < 2 ? 'bg-teal-400 text-indigo-900' : 'bg-white/10'}`}>
                                 {lvl}
                              </div>
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                 <div className="bg-teal-400 h-full rounded-full" style={{width: `${100 - (idx * 15)}%`, opacity: 1 - (idx * 0.1)}}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Hall of Fame */}
      <section id="hall-of-fame" className="py-10 lg:py-14 bg-gradient-to-b from-blue-50 to-white border-y border-blue-100/50 scroll-mt-20">
         <div className="max-w-6xl mx-auto sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 px-4 sm:px-0">
               <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                  <Award className="w-4 h-4" />
                  <span>Hall of Fame</span>
               </div>
               <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                  ELC's Students of the Month
               </h2>
               <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto">
                  Merayakan semangat belajar dan pencapaian luar biasa dari siswa-siswi terbaik kami.
               </p>
            </div>

            {/* Student Cards - Carousel on mobile, grid on desktop */}
            <div className="md:hidden">
               {/* Mobile Carousel */}
               <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pl-4 pr-8 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {MOCK_STUDENTS_OF_THE_MONTH.map((student, idx) => (
                     <div key={student.id} className="snap-start shrink-0 w-[75%]">
                        <Card className="h-full bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                           {/* Avatar */}
                           <div className="relative mb-4">
                              <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white shadow-md">
                                 <img src={student.image} className="w-full h-full object-cover" alt={student.name} />
                              </div>
                              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1.5 rounded-lg shadow-md">
                                 <Medal className="w-4 h-4" />
                              </div>
                           </div>

                           {/* Info */}
                           <div className="space-y-2">
                              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{student.monthYear}</p>
                              <h3 className="text-base font-bold text-gray-900">{student.name}</h3>
                              <p className="text-gray-500 text-sm leading-relaxed italic line-clamp-2">"{student.achievement}"</p>
                           </div>
                        </Card>
                     </div>
                  ))}
               </div>
               {/* Swipe hint */}
               <p className="text-center text-[10px] text-gray-400 mt-2 px-4">Geser untuk melihat lebih banyak →</p>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-5 px-4 sm:px-0">
               {MOCK_STUDENTS_OF_THE_MONTH.map((student) => (
                  <div key={student.id} className="group">
                     <Card className="h-full bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
                        {/* Avatar */}
                        <div className="relative mb-4">
                           <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white shadow-md">
                              <img src={student.image} className="w-full h-full object-cover" alt={student.name} />
                           </div>
                           <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1.5 rounded-lg shadow-md">
                              <Medal className="w-4 h-4" />
                           </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-2">
                           <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{student.monthYear}</p>
                           <h3 className="text-base font-bold text-gray-900">{student.name}</h3>
                           <p className="text-gray-500 text-sm leading-relaxed italic line-clamp-2">"{student.achievement}"</p>
                        </div>
                     </Card>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Kahoot Quiz Section */}
      <section id="kahoot-quiz" className="py-10 lg:py-14 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 scroll-mt-20 relative overflow-hidden">
         {/* Background decorations */}
         <div className="absolute top-0 left-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
         <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center">
               {/* Left - Quiz Info */}
               <div className="flex-1 space-y-4 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-white text-sm font-semibold">
                     <Gamepad2 className="w-4 h-4 text-yellow-400" />
                     <span>Live Quiz Challenge</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                     Test Your English Skills!
                  </h2>

                  <p className="text-sm md:text-base text-blue-200 max-w-lg mx-auto lg:mx-0">
                     Mainkan kuis interaktif dan tantang dirimu! Lihat skormu langsung dan bandingkan dengan pemain lainnya.
                  </p>

                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                     {[
                        { icon: Timer, label: 'Timed' },
                        { icon: Target, label: 'Instant Score' },
                        { icon: Crown, label: 'Leaderboard' }
                     ].map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-white/80 text-sm">
                           <item.icon className="w-4 h-4 text-yellow-400" />
                           <span>{item.label}</span>
                        </div>
                     ))}
                  </div>

                  {/* Available Quizzes */}
                  <div className="space-y-3 pt-2">
                     {MOCK_KAHOOT_QUIZZES.map((quiz) => (
                        <div key={quiz.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:bg-white/20 transition-all">
                           <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                              <Brain className="w-6 h-6 text-white" />
                           </div>
                           <div className="flex-1 text-center sm:text-left">
                              <h4 className="text-white font-bold text-base">{quiz.title}</h4>
                              <p className="text-blue-300 text-sm">{quiz.questions.length} questions • By {quiz.createdBy}</p>
                           </div>
                           <button
                              onClick={() => startKahootQuiz(quiz)}
                              className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-sm rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-2"
                           >
                              <Play className="w-4 h-4" />
                              Play Now
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Right - Mini Leaderboard Preview */}
               <div className="w-full lg:w-[340px] shrink-0">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-lg">
                     {/* Tabs */}
                     <div className="flex gap-2 mb-4">
                        <button
                           onClick={() => setShowRankingTab('daily')}
                           className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${showRankingTab === 'daily' ? 'bg-white text-purple-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                           Today's Rank
                        </button>
                        <button
                           onClick={() => setShowRankingTab('allTime')}
                           className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${showRankingTab === 'allTime' ? 'bg-white text-purple-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                           All Time
                        </button>
                     </div>

                     {/* Rankings List - 3 items */}
                     <div className="space-y-2">
                        {(showRankingTab === 'daily' ? kahootRankings.daily : kahootRankings.allTime).slice(0, 3).map((player, idx) => (
                           <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-white/5'}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                 idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                 idx === 1 ? 'bg-gray-300 text-gray-700' :
                                 idx === 2 ? 'bg-orange-400 text-orange-900' :
                                 'bg-white/10 text-white'
                              }`}>
                                 {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-white font-semibold text-sm truncate">{player.name}</p>
                                 <p className="text-blue-300 text-xs">{player.correctAnswers}/5 correct</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-white font-bold text-sm">{player.score.toLocaleString()}</p>
                                 <p className="text-blue-300 text-xs">pts</p>
                              </div>
                           </div>
                        ))}
                     </div>

                     {(showRankingTab === 'daily' ? kahootRankings.daily : kahootRankings.allTime).length === 0 && (
                        <div className="text-center py-6 text-white/50 text-sm">
                           No players yet. Be the first!
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* News Section */}
      <section id="news" className="py-6 lg:py-8 bg-white border-b border-gray-100 scroll-mt-20">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            {/* Header */}
            <div className="text-center md:text-left">
               <h2 className="text-xl md:text-2xl font-bold text-gray-900">ELC News & Feed</h2>
               <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                  Ikuti kabar terbaru seputar sistem, prestasi siswa, dan agenda kegiatan ELC.
               </p>
            </div>

            {/* News Grid - All in one unified container */}
            <div className="bg-gray-50 rounded-xl p-3 md:p-4 space-y-3">
               {/* Featured Article */}
               {MOCK_NEWS.slice(0, 1).map((news) => (
                  <div
                     key={news.id}
                     className="bg-white rounded-lg overflow-hidden group border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row"
                     onClick={() => openNewsDetail(news)}
                  >
                     {/* Image */}
                     <div className="md:w-1/3 aspect-[16/10] md:aspect-auto relative overflow-hidden">
                        {news.displayMedia === 'video' ? (
                           <div className="w-full h-full bg-gray-900 flex items-center justify-center min-h-[120px]">
                              <MonitorPlay className="w-10 h-10 text-white/40 group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                           </div>
                        ) : (
                           <img src={news.featuredImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[120px]" alt={news.title} />
                        )}
                        {news.displayMedia === 'video' && (
                           <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-purple-600 text-white px-2 py-1 rounded-full text-[10px] font-semibold">
                              <Video className="w-3 h-3" />
                              <span>Video</span>
                           </div>
                        )}
                     </div>
                     {/* Content */}
                     <div className="md:w-2/3 p-3 md:p-4 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 mb-1">
                           <Newspaper className="w-3 h-3" />
                           <span>Featured</span>
                        </div>
                        <h3 className="text-sm lg:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-1">
                           {news.title}
                        </h3>
                        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-2">
                           {news.summary}
                        </p>
                        <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:gap-1.5 transition-all">
                           <span>Baca Selengkapnya</span>
                           <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                     </div>
                  </div>
               ))}

               {/* Other Articles - 2 columns */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MOCK_NEWS.slice(1, 3).map((news) => (
                     <div
                        key={news.id}
                        className="bg-white rounded-lg overflow-hidden group border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-row"
                        onClick={() => openNewsDetail(news)}
                     >
                        {/* Image */}
                        <div className="w-24 h-20 relative overflow-hidden shrink-0">
                           {news.displayMedia === 'video' ? (
                              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                 <MonitorPlay className="w-6 h-6 text-white/40 group-hover:scale-110 transition-transform" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                              </div>
                           ) : (
                              <img src={news.featuredImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={news.title} />
                           )}
                           {news.displayMedia === 'video' && (
                              <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-[8px] font-semibold">
                                 <Video className="w-2.5 h-2.5" />
                                 <span>Video</span>
                              </div>
                           )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 p-2.5 flex flex-col justify-center">
                           <h3 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-1 line-clamp-2">
                              {news.title}
                           </h3>
                           <div className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 group-hover:gap-1 transition-all">
                              <span>Baca</span>
                              <ChevronRight className="w-3 h-3" />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Button */}
            <div className="text-center">
               <Button onClick={openNewsArchive} variant="outline" className="h-9 px-5 rounded-lg border-gray-200 text-xs font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors">
                  Lihat Semua Berita
               </Button>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-10 lg:py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
           {/* Logo */}
           <div className="flex items-center justify-center gap-2">
               <div className="w-10 h-10 theme-bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">E</div>
               <span className="text-xl font-bold text-gray-900">ELC<span className="theme-text-accent">System</span></span>
           </div>

           {/* Links */}
           <div className="flex justify-center gap-8 text-sm text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Help Center</a>
           </div>

           {/* Copyright */}
           <p className="text-gray-400 text-sm">© 2024 English Learning Center. All Rights Reserved.</p>
        </div>
      </footer>

      {/* FORM MODAL (Placement/Olympiad) */}
      {(placementFlow === 'form' || selectedOlympiad) && placementFlow !== 'quiz' && placementFlow !== 'result' && (
         <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
               <button onClick={() => { setPlacementFlow('none'); setSelectedOlympiad(null); setIsOtherSchool(false); }} className="absolute top-4 right-4 p-1.5 bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors z-10">
                  <X className="w-5 h-5" />
               </button>
               <div className="p-6 space-y-5">
                  {/* Header */}
                  <div className="text-center">
                     <h3 className="text-xl font-bold text-gray-900">
                        {placementFlow === 'form' ? 'Free Assessment' : 'Daftar Olimpiade'}
                     </h3>
                     <p className="text-sm text-gray-500 mt-1">Lengkapi data untuk melanjutkan</p>
                  </div>

                  {/* Content */}
                  <div className="max-h-[60vh] overflow-y-auto space-y-5">
                     {selectedOlympiad && regStep === 'info' ? (
                        <div className="space-y-4">
                           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                              <p className="font-semibold mb-2">Terms & Regulations:</p>
                              {selectedOlympiad.terms}
                           </div>
                           <Button onClick={() => setRegStep('form')} className="w-full h-11 rounded-xl font-semibold text-sm">
                              Setuju & Daftar
                           </Button>
                        </div>
                     ) : selectedOlympiad && regStep === 'form' ? (
                        <div className="space-y-4">
                           {renderRegistrationFields()}
                           <div className="flex gap-3 items-center">
                              <button onClick={() => setRegStep('info')} className="text-sm text-gray-400 hover:text-gray-600">
                                 Kembali
                              </button>
                              <Button onClick={() => setRegStep('payment')} className="flex-1 h-11 rounded-xl font-semibold text-sm">
                                 Lanjut ke Pembayaran
                              </Button>
                           </div>
                        </div>
                     ) : selectedOlympiad && regStep === 'payment' ? (
                        <div className="text-center space-y-5 py-4">
                           <div className="space-y-1">
                              <p className="text-xs text-gray-500">Total Bayar</p>
                              <h4 className="text-4xl font-bold text-gray-900">Rp {selectedOlympiad.price?.toLocaleString()}</h4>
                           </div>
                           <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-center gap-3 text-left">
                              <Lock className="w-5 h-5 text-teal-600 shrink-0" />
                              <p className="text-xs text-teal-800">Akses ujian akan dibuka otomatis setelah pembayaran lunas.</p>
                           </div>
                           <Button onClick={handlePay} isLoading={isProcessing} className="w-full h-12 rounded-xl font-semibold text-sm">
                              Lakukan Pembayaran
                           </Button>
                        </div>
                     ) : selectedOlympiad && regStep === 'success' ? (
                        <div className="text-center space-y-4 py-4">
                           <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto">
                              <CheckCircle className="w-8 h-8" />
                           </div>
                           <h3 className="text-xl font-bold text-gray-900">Pendaftaran Berhasil!</h3>
                           <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3 text-left">
                              <div>
                                 <p className="text-xs text-gray-400">Student ID</p>
                                 <p className="text-lg font-mono font-bold text-blue-600">{generatedCreds?.user}</p>
                              </div>
                              <div>
                                 <p className="text-xs text-gray-400">Temporary Password</p>
                                 <p className="text-lg font-mono font-bold text-gray-800">{generatedCreds?.pass}</p>
                              </div>
                           </div>
                           <p className="text-xs text-gray-400">Gunakan ID ini untuk masuk ke dashboard olimpiade.</p>
                           <Button onClick={() => window.location.reload()} className="w-full h-11 rounded-xl font-semibold text-sm">
                              Ke Dashboard Sekarang
                           </Button>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {renderRegistrationFields()}
                           <Button onClick={handleStartPlacementSession} disabled={!formData.name || !formData.email || !formData.personalWa} className="w-full h-11 rounded-xl font-semibold text-sm">
                              Mulai Ujian
                           </Button>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Kahoot Quiz Modal */}
      {kahootFlow !== 'none' && currentQuiz && (
         <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-auto">
            {/* Close button - only show on intro and result screens */}
            {kahootFlow !== 'playing' && (
               <button onClick={resetKahoot} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all z-50">
                  <X className="w-6 h-6" />
               </button>
            )}

            {/* Intro Screen */}
            {kahootFlow === 'intro' && (
               <div className="min-h-screen flex items-center justify-center p-4">
                  <div className="max-w-md w-full space-y-8 text-center animate-in zoom-in-95 duration-300">
                     {/* Quiz Icon */}
                     <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                        <Gamepad2 className="w-12 h-12 text-white" />
                     </div>

                     {/* Quiz Info */}
                     <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-bold text-white">{currentQuiz.title}</h1>
                        <p className="text-blue-200">{currentQuiz.description}</p>
                        <div className="flex justify-center gap-4 text-white/70 text-sm">
                           <span>{currentQuiz.questions.length} Questions</span>
                           <span>•</span>
                           <span>By {currentQuiz.createdBy}</span>
                        </div>
                     </div>

                     {/* Player Name Input */}
                     <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 space-y-4">
                        <label className="block text-left text-white/80 text-sm font-medium">Enter your name to start</label>
                        <input
                           type="text"
                           value={kahootPlayerName}
                           onChange={(e) => setKahootPlayerName(e.target.value)}
                           placeholder="Your name..."
                           className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 text-lg"
                        />
                        <button
                           onClick={beginKahootGame}
                           disabled={!kahootPlayerName.trim()}
                           className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                           <Play className="w-5 h-5" />
                           Start Quiz
                        </button>
                     </div>

                     {/* Tips */}
                     <p className="text-white/50 text-sm">Answer quickly for bonus points!</p>
                  </div>
               </div>
            )}

            {/* Playing Screen */}
            {kahootFlow === 'playing' && (
               <div className="min-h-screen flex flex-col">
                  {/* Top Bar */}
                  <div className="bg-black/20 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <button onClick={resetKahoot} className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all">
                           <X className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                           <Brain className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-semibold text-sm">Q {kahootQuestionIndex + 1}/{currentQuiz.questions.length}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="text-white font-bold hidden sm:block">Score: {kahootScore.toLocaleString()}</div>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold ${kahootTimeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white'}`}>
                           <Timer className="w-4 h-4" />
                           <span>{kahootTimeLeft}s</span>
                        </div>
                     </div>
                  </div>

                  {/* Question */}
                  <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
                     {/* Timer Bar */}
                     <div className="w-full max-w-2xl h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                           className={`h-full transition-all duration-1000 ease-linear ${kahootTimeLeft <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}
                           style={{ width: `${(kahootTimeLeft / currentQuiz.questions[kahootQuestionIndex].timeLimit) * 100}%` }}
                        />
                     </div>

                     {/* Question Text */}
                     <div className="bg-white rounded-3xl px-8 py-10 max-w-2xl w-full shadow-2xl text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed">
                           {currentQuiz.questions[kahootQuestionIndex].question}
                        </h2>
                     </div>

                     {/* Answer Options */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                        {currentQuiz.questions[kahootQuestionIndex].options.map((option, idx) => {
                           const colors = [
                              'from-red-500 to-red-600',
                              'from-blue-500 to-blue-600',
                              'from-yellow-500 to-yellow-600',
                              'from-green-500 to-green-600'
                           ];
                           const shapes = ['▲', '◆', '●', '■'];
                           const lastAnswer = kahootAnswers[kahootAnswers.length - 1];
                           const isAnswered = kahootAnswered && lastAnswer?.questionId === currentQuiz.questions[kahootQuestionIndex].id;
                           const isSelected = isAnswered && lastAnswer?.answer === idx;
                           const isCorrect = idx === currentQuiz.questions[kahootQuestionIndex].correctIndex;

                           return (
                              <button
                                 key={idx}
                                 onClick={() => handleKahootAnswer(idx)}
                                 disabled={kahootAnswered}
                                 className={`
                                    p-5 rounded-2xl font-bold text-white text-left flex items-center gap-4 transition-all
                                    ${kahootAnswered
                                       ? isCorrect
                                          ? 'bg-green-500 ring-4 ring-green-300'
                                          : isSelected
                                             ? 'bg-red-500 ring-4 ring-red-300 opacity-70'
                                             : 'opacity-40'
                                       : `bg-gradient-to-br ${colors[idx]} hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl`
                                    }
                                 `}
                              >
                                 <span className="text-2xl">{shapes[idx]}</span>
                                 <span className="text-lg">{option}</span>
                                 {isAnswered && isCorrect && (
                                    <CheckCircle className="w-6 h-6 ml-auto" />
                                 )}
                                 {isAnswered && isSelected && !isCorrect && (
                                    <XCircle className="w-6 h-6 ml-auto" />
                                 )}
                              </button>
                           );
                        })}
                     </div>
                  </div>
               </div>
            )}

            {/* Result Screen */}
            {kahootFlow === 'result' && (
               <div className="min-h-screen flex items-center justify-center p-4">
                  <div className="max-w-2xl w-full space-y-8 animate-in zoom-in-95 duration-500">
                     {/* Score Card */}
                     <div className="bg-white rounded-3xl p-8 md:p-12 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                           <Trophy className="w-10 h-10 text-white" />
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
                        <p className="text-gray-500 mb-6">Great job, {kahootPlayerName}!</p>

                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 mb-6">
                           <p className="text-sm text-purple-600 font-semibold uppercase tracking-wider mb-2">Your Score</p>
                           <p className="text-5xl md:text-6xl font-black text-purple-900">{kahootScore.toLocaleString()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="bg-gray-50 rounded-xl p-4">
                              <p className="text-gray-400 text-sm">Correct Answers</p>
                              <p className="text-2xl font-bold text-gray-900">
                                 {kahootAnswers.filter(a => a.isCorrect).length}/{currentQuiz.questions.length}
                              </p>
                           </div>
                           <div className="bg-gray-50 rounded-xl p-4">
                              <p className="text-gray-400 text-sm">Total Time</p>
                              <p className="text-2xl font-bold text-gray-900">
                                 {kahootAnswers.reduce((sum, a) => sum + a.timeSpent, 0)}s
                              </p>
                           </div>
                        </div>

                        <Button onClick={resetKahoot} variant="primary" className="h-12 px-8 text-base rounded-xl">
                           Back to Homepage
                        </Button>
                     </div>

                     {/* Leaderboard */}
                     <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                        <div className="flex gap-2 mb-5">
                           <button
                              onClick={() => setShowRankingTab('daily')}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${showRankingTab === 'daily' ? 'bg-white text-purple-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                           >
                              Today's Rank
                           </button>
                           <button
                              onClick={() => setShowRankingTab('allTime')}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${showRankingTab === 'allTime' ? 'bg-white text-purple-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                           >
                              All Time
                           </button>
                        </div>

                        <div className="space-y-2">
                           {(showRankingTab === 'daily' ? kahootRankings.daily : kahootRankings.allTime).slice(0, 10).map((player, idx) => {
                              const isCurrentPlayer = player.name === kahootPlayerName && player.score === kahootScore;
                              return (
                                 <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${
                                    isCurrentPlayer ? 'bg-yellow-400/20 border border-yellow-400/50' :
                                    idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
                                    'bg-white/5'
                                 }`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                       idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                       idx === 1 ? 'bg-gray-300 text-gray-700' :
                                       idx === 2 ? 'bg-orange-400 text-orange-900' :
                                       'bg-white/10 text-white'
                                    }`}>
                                       {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className={`font-semibold text-sm truncate ${isCurrentPlayer ? 'text-yellow-400' : 'text-white'}`}>
                                          {player.name} {isCurrentPlayer && '(You)'}
                                       </p>
                                       <p className="text-blue-300 text-xs">{player.correctAnswers}/5 correct</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-white font-bold">{player.score.toLocaleString()}</p>
                                       <p className="text-blue-300 text-xs">pts</p>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      )}

    </div>
  );
};
