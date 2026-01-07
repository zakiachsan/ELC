
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { LEVEL_COLORS } from '../../constants';
import { useModules, useModuleProgress } from '../../hooks/useModules';
import { User, OnlineModule, SkillCategory, QuestionType, EssayGradeResult, DifficultyLevel, ModuleExam } from '../../types';
import { gradeEssay } from '../../services/geminiService';
import {
  BookOpen, PlayCircle, FileText, Lock,
  CheckCircle, AlertCircle, Filter, Trophy, Clock,
  RotateCcw, Brain, Check, X, Eye, Search, Info, ArrowRight,
  ChevronRight, XCircle, Crown, Star, Sparkles, AlignLeft
} from 'lucide-react';
import { SKILL_ICONS } from './StudentView';

// Learning Hub subscription price
const LEARNING_HUB_PRICE = 99000;

// --- MOCK DATA FOR SPECIFIC MODULE QUIZZES ---
const MOCK_MODULE_QUIZZES: Record<string, Array<{id: string, text: string, type: QuestionType, options?: string[], correct?: string}>> = {
  'om1': [ // Professional Email Etiquette
    { 
      id: 'q1', text: 'Which of the following is the most appropriate professional greeting for someone you dont know?', type: QuestionType.MULTIPLE_CHOICE, 
      options: ['Hey there!', 'Dear Hiring Manager,', 'Yo,', 'Whats up?'], correct: 'Dear Hiring Manager,' 
    },
    { 
      id: 'q2', text: 'In a professional email, what does CC stand for?', type: QuestionType.MULTIPLE_CHOICE, 
      options: ['Carbon Copy', 'Cancel Call', 'Carefully Chosen', 'Clear Communication'], correct: 'Carbon Copy' 
    },
    { 
      id: 'q3', text: 'Write a short formal closing for an email where you are requesting a meeting next week.', type: QuestionType.ESSAY 
    }
  ],
  'om2': [ // Mastering the Present Perfect
    { 
      id: 'q1', text: 'I _____ to Paris three times in my life.', type: QuestionType.MULTIPLE_CHOICE, 
      options: ['went', 'have been', 'was', 'am going'], correct: 'have been' 
    },
    { 
      id: 'q2', text: 'She _____ her homework yet.', type: QuestionType.MULTIPLE_CHOICE, 
      options: ['hasnt finished', 'didnt finish', 'wasnt finishing', 'dont finish'], correct: 'hasnt finished' 
    },
    { 
      id: 'q3', text: 'Explain when to use the Present Perfect tense instead of the Past Simple.', type: QuestionType.ESSAY 
    }
  ],
  'om3': [ // Public Speaking: Body Language
    { 
      id: 'q1', text: 'What is a "power pose" intended to do before a presentation?', type: QuestionType.MULTIPLE_CHOICE, 
      options: ['Make you feel more confident', 'Make people laugh', 'Scare the audience', 'Exercise your muscles'], correct: 'Make you feel more confident' 
    },
    { 
      id: 'q2', text: 'Describe how eye contact affects audience engagement during a speech.', type: QuestionType.ESSAY 
    }
  ]
};

// Mock History Data illustrating Adaptive Logic
const MOCK_ATTEMPT_HISTORY = [
  { date: '2024-02-10', score: 45, status: 'FAILED', level: DifficultyLevel.UPPER_INTERMEDIATE },
  { date: '2024-02-12', score: 92, status: 'PASSED', level: DifficultyLevel.INTERMEDIATE },
];

export const StudentOnlineLearning: React.FC<{ student: User }> = ({ student }) => {
  const [selectedModule, setSelectedModule] = useState<OnlineModule | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'history'>('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Fetch modules and progress from Supabase
  const { modules: modulesData, loading: modulesLoading } = useModules({ publishedOnly: true });
  const { progress: progressData, loading: progressLoading } = useModuleProgress(student.id);

  // Map database modules to OnlineModule type
  const MOCK_ONLINE_MODULES: OnlineModule[] = modulesData.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    videoUrl: m.video_url,
    thumbnailUrl: m.thumbnail_url || '',
    skillCategory: m.skill_category as SkillCategory,
    difficultyLevel: m.difficulty_level as DifficultyLevel,
    status: m.status as 'DRAFT' | 'PUBLISHED',
    createdBy: m.created_by,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    exam: m.exam_questions as ModuleExam | undefined,
    passingScore: m.passing_score,
    materials: m.materials || [],
  }));

  // Map progress data
  const MOCK_MODULE_PROGRESS = progressData.map(p => ({
    studentId: p.student_id,
    moduleId: p.module_id,
    status: p.status,
    quizScore: p.quiz_score,
    completedAt: p.completed_at,
  }));

  // Check subscription status
  const hasActiveSubscription = student.learningHubSubscription?.isActive &&
    student.learningHubSubscription?.expiresAt &&
    new Date(student.learningHubSubscription.expiresAt) > new Date();

  // First module is free for trial
  const FREE_TRIAL_MODULE_ID = MOCK_ONLINE_MODULES[0]?.id;

  const completedModuleIds = MOCK_MODULE_PROGRESS.filter(p => p.studentId === student.id && p.status === 'COMPLETED').map(p => p.moduleId);

  // Check if a module is accessible
  const isModuleAccessible = (moduleId: string) => {
    return hasActiveSubscription || moduleId === FREE_TRIAL_MODULE_ID;
  };

  const handleModuleClick = (module: OnlineModule) => {
    if (isModuleAccessible(module.id)) {
      setSelectedModule(module);
    } else {
      setShowPaywall(true);
    }
  };

  const handleSubscribe = () => {
    // Simulate payment process
    setShowPaywall(false);
    setShowPaymentSuccess(true);
    // In real app, this would open payment gateway
  };

  const handleStartQuiz = () => {
    setQuizMode(true);
  };

  const handleCompleteQuiz = (score: number, passed: boolean) => {
    setQuizMode(false);
    if (passed && selectedModule) {
        const currentSkillLevels = { ...student.skillLevels };
        currentSkillLevels[selectedModule.skillCategory] = selectedModule.difficultyLevel;
        student.skillLevels = currentSkillLevels;
        alert(`Success! Your ${selectedModule.skillCategory} skill has been updated to ${selectedModule.difficultyLevel}.`);
    } else {
        alert("Assessment Complete! Keep practicing to improve your level.");
    }
  };

  const filteredModules = MOCK_ONLINE_MODULES.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.skillCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (quizMode && selectedModule) {
    return <ModuleQuiz
              module={selectedModule}
              onExit={() => setQuizMode(false)}
              onComplete={handleCompleteQuiz}
            />;
  }

  if (selectedModule) {
    const isCompleted = completedModuleIds.includes(selectedModule.id);
    const Icon = SKILL_ICONS[selectedModule.skillCategory] || AlignLeft;

    return (
      <div className="space-y-4 animate-in slide-in-from-right-4">
        {/* Module Header */}
        <div className="flex items-center gap-3">
           <Button variant="outline" onClick={() => setSelectedModule(null)} className="text-xs py-1.5 px-3">Back</Button>
           <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                 <span className="flex items-center gap-1 bg-gray-800 text-white px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">
                    <Icon className="w-2.5 h-2.5" /> {selectedModule.skillCategory}
                 </span>
                 <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${LEVEL_COLORS[selectedModule.difficultyLevel]}`}>
                    {selectedModule.difficultyLevel}
                 </span>
                 {isCompleted && (
                   <span className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border border-green-200">
                      <CheckCircle className="w-2.5 h-2.5" /> Completed
                   </span>
                 )}
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedModule.title}</h2>
           </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200">
           <button onClick={() => setActiveTab('content')} className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'content' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Learning Content</button>
           <button onClick={() => setActiveTab('history')} className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Placement History</button>
        </div>

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
             <div className="lg:col-span-2 space-y-4">
                {selectedModule.videoUrl ? (
                   <Card className="!p-0 overflow-hidden bg-black aspect-video rounded-xl shadow-lg">
                      <iframe className="w-full h-full" src={selectedModule.videoUrl} title={selectedModule.title} allowFullScreen></iframe>
                   </Card>
                ) : (
                   <Card className="!p-0 bg-gray-100 flex items-center justify-center h-40 border-dashed border-2 border-gray-300"><p className="text-gray-400 font-medium text-xs">No video content.</p></Card>
                )}
                <Card className="!p-4">
                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Module Overview</h3>
                   <p className="text-gray-600 leading-relaxed text-xs">{selectedModule.description}</p>
                   <div className="mt-4">
                      <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1"><FileText className="w-3 h-3 text-blue-500" /> Study Materials</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {selectedModule.materials.map((mat, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg hover:border-blue-200 cursor-pointer bg-gray-50/50 hover:bg-white transition-all group">
                               <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-red-500 shadow-sm"><FileText className="w-3.5 h-3.5" /></div>
                               <div className="min-w-0"><span className="text-[10px] font-bold text-gray-700 block truncate">{mat}</span><span className="text-[8px] text-gray-400 font-medium uppercase">PDF Document</span></div>
                            </div>
                         ))}
                      </div>
                   </div>
                </Card>
             </div>
             <div className="lg:col-span-1 space-y-4">
                <Card className="!p-4">
                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Assessment</h3>
                   <div className="text-center py-4 space-y-3">
                      <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-blue-600 shadow-inner"><Trophy className="w-6 h-6" /></div>
                      <div><h3 className="text-sm font-bold text-gray-900 leading-tight">Ready to verify?</h3><p className="text-[10px] text-gray-500 mt-1">Selesaikan kuis untuk memperbarui level bahasa Inggrismu.</p></div>
                      <Button onClick={handleStartQuiz} className="w-full h-9 shadow-md font-black uppercase tracking-widest text-[10px]">{isCompleted ? 'Retake Assessment' : 'Start Practice'}</Button>
                   </div>
                </Card>
             </div>
          </div>
        )}

        {activeTab === 'history' && (
           <Card className="!p-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Smart Progression Log</h3>
              <div className="space-y-4">
                 <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex gap-2"><Brain className="w-4 h-4 text-blue-500 shrink-0" /><p className="text-[10px] text-blue-800 font-medium">Log ini menunjukkan bagaimana sistem adaptif menyesuaikan tingkat kesulitan materi berdasarkan hasil ujian terakhir Anda.</p></div>
                 <div className="relative border-l-2 border-gray-100 ml-3 space-y-4 py-1">
                    {MOCK_ATTEMPT_HISTORY.map((attempt, idx) => (
                       <div key={idx} className="relative pl-6">
                          <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${attempt.status === 'PASSED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
                             <div className="space-y-0.5"><div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{attempt.date}</div><div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">Attempt {idx + 1} <span className="text-gray-300">•</span><span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${LEVEL_COLORS[attempt.level]}`}>{attempt.level}</span></div></div>
                             <div className="text-right"><div className={`text-[10px] font-black ${attempt.status === 'PASSED' ? 'text-green-600' : 'text-red-500'}`}>{attempt.status}</div><div className="text-[9px] text-gray-400 font-bold">Score: {attempt.score}%</div></div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subscription Status Banner */}
      {!hasActiveSubscription && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Upgrade ke Premium</h3>
                <p className="text-[10px] text-white/80">Akses semua video dan materi pembelajaran tanpa batas</p>
              </div>
            </div>
            <button
              onClick={() => setShowPaywall(true)}
              className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 text-xs py-2 px-4 font-bold rounded-lg shadow-md"
            >
              Rp {LEARNING_HUB_PRICE.toLocaleString('id-ID')}/bulan
            </button>
          </div>
        </div>
      )}

      {hasActiveSubscription && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-green-800">Premium Member</p>
            <p className="text-[10px] text-green-600">Berlaku hingga {new Date(student.learningHubSubscription?.expiresAt || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div><h2 className="text-lg font-bold text-gray-900">Learning Hub</h2><p className="text-xs text-gray-500">Akses materi belajar mandiri untuk meningkatkan kemampuan bahasa Inggrismu.</p></div>
        <div className="relative w-full md:w-64"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /><input type="text" placeholder="Cari materi..." className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs w-full outline-none shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
         {filteredModules.map((module, index) => {
           const isCompleted = completedModuleIds.includes(module.id);
           const Icon = SKILL_ICONS[module.skillCategory] || AlignLeft;
           const isAccessible = isModuleAccessible(module.id);
           const isFreeTrialModule = module.id === FREE_TRIAL_MODULE_ID;

           return (
             <Card
               key={module.id}
               className={`!p-0 transition-all cursor-pointer group flex flex-col relative ${isAccessible ? 'hover:border-blue-400' : 'hover:border-purple-400 opacity-90'}`}
             >
               <div onClick={() => handleModuleClick(module)} className="flex-1 flex flex-col p-3">
                 <div className="flex justify-between items-start mb-3">
                   <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${
                     !isAccessible ? 'bg-gray-100 text-gray-400' :
                     isCompleted ? 'bg-green-50 text-green-600' :
                     'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                   }`}>
                     {isAccessible ? <Icon className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                   </div>
                   <div className="flex items-center gap-1">
                     {isFreeTrialModule && !hasActiveSubscription && (
                       <span className="bg-yellow-100 text-yellow-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5 border border-yellow-200">
                         <Star className="w-2.5 h-2.5" /> Free
                       </span>
                     )}
                     {!isAccessible && (
                       <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5 border border-purple-200">
                         <Crown className="w-2.5 h-2.5" /> Premium
                       </span>
                     )}
                     {isCompleted && (
                       <span className="bg-green-100 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5 border border-green-200">
                         <CheckCircle className="w-2.5 h-2.5" /> Done
                       </span>
                     )}
                   </div>
                 </div>
                 <h3 className={`text-sm font-bold mb-1.5 leading-tight ${isAccessible ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-500'}`}>{module.title}</h3>
                 <div className="flex flex-wrap gap-1.5 mb-2">
                   <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${LEVEL_COLORS[module.difficultyLevel]}`}>{module.difficultyLevel}</span>
                 </div>
                 <p className="text-[10px] text-gray-500 line-clamp-2 mb-3 flex-1">{module.description}</p>
                 <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                   <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Video + Materi</span>
                   <span className={`text-[9px] font-black uppercase flex items-center gap-0.5 group-hover:translate-x-1 transition-transform ${isAccessible ? 'text-blue-600' : 'text-purple-600'}`}>
                     {isAccessible ? 'Mulai' : 'Upgrade'} <ChevronRight className="w-2.5 h-2.5" />
                   </span>
                 </div>
               </div>
             </Card>
           );
         })}
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-md !p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">Upgrade ke Premium</h2>
              <p className="text-sm text-white/80">Akses semua materi pembelajaran tanpa batas</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-700">Akses semua video pembelajaran</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-700">Download materi PDF</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-700">Quiz dan sertifikat</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-700">Update materi terbaru</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Harga Berlangganan</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-gray-900">Rp {LEARNING_HUB_PRICE.toLocaleString('id-ID')}</span>
                  <span className="text-sm text-gray-500">/bulan</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPaywall(false)}
                  className="flex-1 text-xs py-2"
                >
                  Nanti
                </Button>
                <Button
                  onClick={handleSubscribe}
                  className="flex-1 text-xs py-2 bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Bayar Sekarang
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Success Modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-sm !p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
            <p className="text-xs text-gray-500 mb-4">Selamat! Kamu sekarang sudah menjadi member Premium Learning Hub.</p>
            <Button
              onClick={() => {
                setShowPaymentSuccess(false);
                // In real app, would refresh user data
                window.location.reload();
              }}
              className="w-full text-xs py-2"
            >
              Mulai Belajar
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- QUIZ COMPONENT ---
const ModuleQuiz: React.FC<{ module: OnlineModule, onExit: () => void, onComplete: (score: number, passed: boolean) => void }> = ({ module, onExit, onComplete }) => {
   const [currentQIndex, setCurrentQIndex] = useState(0);
   const [answers, setAnswers] = useState<Record<string, string>>({});
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [result, setResult] = useState<{score: number, passed: boolean} | null>(null);

   const questions = MOCK_MODULE_QUIZZES[module.id] || [];

   if (questions.length === 0) {
      return (
         <Card className="!p-6"><div className="text-center py-6"><div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-3"><XCircle className="w-6 h-6" /></div><p className="text-gray-900 font-bold text-sm mb-3">Quiz Belum Siap</p><Button onClick={onExit} variant="outline" className="text-xs">Kembali</Button></div></Card>
      );
   }

   const handleNext = () => {
      if (currentQIndex < questions.length - 1) { setCurrentQIndex(prev => prev + 1); }
      else { handleSubmit(); }
   };

   const handleSubmit = async () => {
      setIsSubmitting(true);
      let score = 0;
      for (const q of questions) {
         if (q.type === QuestionType.MULTIPLE_CHOICE) {
            if (answers[q.id] === q.correct) score += (100 / questions.length);
         } else {
             try { const grade = await gradeEssay(q.text, answers[q.id] || ''); score += (grade.score * (1 / questions.length)); }
             catch (e) { score += (60 * (1 / questions.length)); }
         }
      }
      score = Math.round(score);
      setResult({ score, passed: score >= 70 });
      setIsSubmitting(false);
   };

   if (result) {
      return (
         <div className="max-w-md mx-auto space-y-4 animate-in zoom-in-95 duration-500">
            <Card className="!p-6 text-center shadow-xl border-2 rounded-2xl">
               <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{result.passed ? <Trophy className="w-8 h-8" /> : <X className="w-8 h-8" />}</div>
               <h2 className="text-3xl font-black text-gray-900 mb-1">{result.score}%</h2>
               <p className={`text-sm font-black mb-4 uppercase tracking-widest ${result.passed ? 'text-green-600' : 'text-red-500'}`}>{result.passed ? 'PASSED' : 'FAILED'}</p>
               <Button onClick={() => onComplete(result.score, result.passed)} className="w-full py-2 rounded-xl font-black uppercase tracking-widest shadow-lg h-10 text-xs">Selesai & Keluar</Button>
            </Card>
         </div>
      );
   }

   const q = questions[currentQIndex];

   return (
      <div className="max-w-xl mx-auto space-y-4 animate-in slide-in-from-right-10 duration-500">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><div className="flex items-center justify-between mb-3"><div><span className="text-[9px] font-black text-blue-500 uppercase block mb-0.5">Materi: {module.skillCategory}</span><h4 className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{module.title}</h4></div><div className="text-right"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Question {currentQIndex + 1} of {questions.length}</span></div></div><div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-50"><div className="theme-bg-primary h-full transition-all duration-700 ease-out" style={{width: `${((currentQIndex + 1) / questions.length) * 100}%`}}></div></div></div>
         <Card className="!p-5 shadow-xl border-t-4 border-t-blue-500 rounded-2xl">
            <div className="space-y-4">
               <h3 className="text-base font-bold text-gray-900 leading-tight">{q.text}</h3>
               {q.type === QuestionType.MULTIPLE_CHOICE ? (
                  <div className="grid grid-cols-1 gap-2">
                     {q.options?.map((opt, idx) => (
                        <button key={idx} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all text-left ${answers[q.id] === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}><div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border-2 shrink-0 ${answers[q.id] === opt ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>{String.fromCharCode(65 + idx)}</div><span className={`ml-3 text-xs font-bold ${answers[q.id] === opt ? 'text-blue-900' : 'text-gray-600'}`}>{opt}</span></button>
                     ))}
                  </div>
               ) : (
                  <div className="space-y-3"><textarea rows={4} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none bg-gray-50/30 text-xs" placeholder="Ketik jawaban lengkap..." value={answers[q.id] || ''} onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} /><div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100"><div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white shrink-0"><Brain className="w-3.5 h-3.5" /></div><p className="text-[9px] text-blue-800 font-bold uppercase tracking-widest">AI Grading Active</p></div></div>
               )}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center"><button onClick={onExit} disabled={isSubmitting} className="text-gray-400 font-bold uppercase tracking-widest text-[9px] hover:text-red-500">Batal</button><Button onClick={handleNext} isLoading={isSubmitting} disabled={!answers[q.id]} className="h-9 px-5 rounded-xl font-black uppercase text-[10px] shadow-lg">{currentQIndex < questions.length - 1 ? 'Next' : 'Finish'}</Button></div>
         </Card>
      </div>
   );
};
