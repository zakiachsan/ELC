
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { MOCK_ONLINE_MODULES, MOCK_MODULE_PROGRESS, LEVEL_COLORS, MOCK_USERS } from '../../constants';
import { User, OnlineModule, SkillCategory, QuestionType, EssayGradeResult, DifficultyLevel } from '../../types';
import { gradeEssay } from '../../services/geminiService';
import { 
  BookOpen, PlayCircle, FileText, Lock, 
  CheckCircle, AlertCircle, Filter, Trophy, Clock, 
  RotateCcw, Brain, Check, X, Eye, Search, Info, ArrowRight,
  ChevronRight, XCircle 
} from 'lucide-react';
import { SKILL_ICONS } from './StudentView';

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

  const completedModuleIds = MOCK_MODULE_PROGRESS.filter(p => p.studentId === student.id && p.status === 'COMPLETED').map(p => p.moduleId);

  const handleStartQuiz = () => {
    setQuizMode(true);
  };

  const handleCompleteQuiz = (score: number, passed: boolean) => {
    setQuizMode(false);
    if (passed && selectedModule) {
        // Logic: Permanently update user's skill level on successful completion
        // This closes the loop between kuis mandiri and profile level
        const currentSkillLevels = { ...student.skillLevels };
        currentSkillLevels[selectedModule.skillCategory] = selectedModule.difficultyLevel;
        student.skillLevels = currentSkillLevels; // In a real app, this would be a PATCH call
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
    const Icon = SKILL_ICONS[selectedModule.skillCategory];

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4">
        {/* Module Header */}
        <div className="flex items-start gap-4">
           <Button variant="outline" onClick={() => setSelectedModule(null)}>Back</Button>
           <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                 <span className="flex items-center gap-1 bg-gray-800 text-white px-2 py-1 rounded text-[10px] uppercase font-bold">
                    <Icon className="w-3 h-3" /> {selectedModule.skillCategory}
                 </span>
                 <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${LEVEL_COLORS[selectedModule.difficultyLevel]}`}>
                    {selectedModule.difficultyLevel}
                 </span>
                 {isCompleted && (
                   <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] uppercase font-bold border border-green-200">
                      <CheckCircle className="w-3 h-3" /> Completed
                   </span>
                 )}
              </div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{selectedModule.title}</h2>
           </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200">
           <button onClick={() => setActiveTab('content')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'content' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Learning Content</button>
           <button onClick={() => setActiveTab('history')} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Placement History</button>
        </div>

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
                {selectedModule.videoUrl ? (
                   <Card className="p-0 overflow-hidden bg-black aspect-video rounded-2xl shadow-xl">
                      <iframe className="w-full h-full" src={selectedModule.videoUrl} title={selectedModule.title} allowFullScreen></iframe>
                   </Card>
                ) : (
                   <Card className="bg-gray-100 flex items-center justify-center h-48 border-dashed border-2 border-gray-300"><p className="text-gray-400 font-medium">No video content.</p></Card>
                )}
                <Card title="Module Overview">
                   <p className="text-gray-600 leading-relaxed text-sm md:text-base">{selectedModule.description}</p>
                   <div className="mt-8">
                      <h4 className="font-black text-gray-900 text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Study Materials</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {selectedModule.materials.map((mat, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:border-blue-200 cursor-pointer bg-gray-50/50 hover:bg-white transition-all group">
                               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform"><FileText className="w-5 h-5" /></div>
                               <div className="min-w-0"><span className="text-sm font-bold text-gray-700 block truncate">{mat}</span><span className="text-[10px] text-gray-400 font-medium uppercase">PDF Document</span></div>
                            </div>
                         ))}
                      </div>
                   </div>
                </Card>
             </div>
             <div className="lg:col-span-1 space-y-6">
                <Card title="Assessment">
                   <div className="text-center py-6 space-y-4">
                      <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-inner"><Trophy className="w-8 h-8" /></div>
                      <div><h3 className="text-lg font-black text-gray-900 leading-tight">Ready to verify?</h3><p className="text-xs text-gray-500 mt-1">Selesaikan kuis untuk memperbarui level kemampuan bahasa Inggrismu secara otomatis.</p></div>
                      <Button onClick={handleStartQuiz} className="w-full h-12 shadow-lg font-black uppercase tracking-widest text-xs">{isCompleted ? 'Retake Assessment' : 'Start Practice'}</Button>
                   </div>
                </Card>
             </div>
          </div>
        )}

        {activeTab === 'history' && (
           <Card title="Smart Progression Log">
              <div className="space-y-6">
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4"><Brain className="w-6 h-6 text-blue-500 shrink-0" /><p className="text-xs text-blue-800 font-medium">Log ini menunjukkan bagaimana sistem adaptif menyesuaikan tingkat kesulitan materi berdasarkan hasil ujian terakhir Anda.</p></div>
                 <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 py-2">
                    {MOCK_ATTEMPT_HISTORY.map((attempt, idx) => (
                       <div key={idx} className="relative pl-8">
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${attempt.status === 'PASSED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
                             <div className="space-y-1"><div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{attempt.date}</div><div className="font-bold text-gray-900 flex items-center gap-2">Practice Attempt {idx + 1} <span className="text-gray-300">•</span><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${LEVEL_COLORS[attempt.level]}`}>{attempt.level}</span></div></div>
                             <div className="text-right"><div className={`text-sm font-black ${attempt.status === 'PASSED' ? 'text-green-600' : 'text-red-500'}`}>{attempt.status}</div><div className="text-xs text-gray-400 font-bold">Score: {attempt.score}%</div></div>
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Learning Hub</h2><p className="text-gray-500 text-sm">Akses materi belajar mandiri untuk meningkatkan kemampuan bahasa Inggrismu.</p></div>
        <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Cari materi..." className="pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm w-full outline-none shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredModules.map((module) => {
           const isCompleted = completedModuleIds.includes(module.id);
           const Icon = SKILL_ICONS[module.skillCategory];
           return (
             <Card key={module.id} className="hover:border-blue-400 transition-all cursor-pointer group flex flex-col p-1"><div onClick={() => setSelectedModule(module)} className="flex-1 flex flex-col p-5"><div className="flex justify-between items-start mb-5"><div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}><Icon className="w-6 h-6" /></div>{isCompleted && <div className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded-full uppercase flex items-center gap-1 border border-green-200"><CheckCircle className="w-3 h-3" /> Done</div>}</div><h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-tight">{module.title}</h3><div className="flex flex-wrap gap-2 mb-4"><span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${LEVEL_COLORS[module.difficultyLevel]}`}>{module.difficultyLevel}</span></div><p className="text-xs text-gray-500 line-clamp-3 mb-6 flex-1">{module.description}</p><div className="pt-4 border-t border-gray-100 flex items-center justify-between"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Video + Materi</span><span className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Mulai <ChevronRight className="w-3 h-3" /></span></div></div></Card>
           );
         })}
      </div>
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
         <Card><div className="text-center py-12 px-6"><div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4"><XCircle className="w-8 h-8" /></div><p className="text-gray-900 font-bold text-lg mb-2">Quiz Belum Siap</p><Button onClick={onExit} variant="outline">Kembali</Button></div></Card>
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
         <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-500">
            <Card className="text-center py-12 px-8 shadow-2xl border-2 rounded-[32px]">
               <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg ${result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{result.passed ? <Trophy className="w-12 h-12" /> : <X className="w-12 h-12" />}</div>
               <h2 className="text-5xl font-black text-gray-900 mb-2">{result.score}%</h2>
               <p className={`text-xl font-black mb-6 uppercase tracking-widest ${result.passed ? 'text-green-600' : 'text-red-500'}`}>{result.passed ? 'PASSED' : 'FAILED'}</p>
               <Button onClick={() => onComplete(result.score, result.passed)} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl h-14">Selesai & Keluar</Button>
            </Card>
         </div>
      );
   }

   const q = questions[currentQIndex];

   return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-10 duration-500">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center justify-between mb-4"><div><span className="text-[10px] font-black text-blue-500 uppercase block mb-1">Materi: {module.skillCategory}</span><h4 className="text-sm font-bold text-gray-900 truncate max-w-xs">{module.title}</h4></div><div className="text-right"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question {currentQIndex + 1} of {questions.length}</span></div></div><div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-50"><div className="theme-bg-primary h-full transition-all duration-700 ease-out" style={{width: `${((currentQIndex + 1) / questions.length) * 100}%`}}></div></div></div>
         <Card className="p-8 md:p-10 shadow-xl border-t-4 border-t-blue-500 rounded-3xl">
            <div className="space-y-8">
               <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{q.text}</h3>
               {q.type === QuestionType.MULTIPLE_CHOICE ? (
                  <div className="grid grid-cols-1 gap-4">
                     {q.options?.map((opt, idx) => (
                        <button key={idx} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all text-left ${answers[q.id] === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 shrink-0 ${answers[q.id] === opt ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>{String.fromCharCode(65 + idx)}</div><span className={`ml-4 font-bold ${answers[q.id] === opt ? 'text-blue-900' : 'text-gray-600'}`}>{opt}</span></button>
                     ))}
                  </div>
               ) : (
                  <div className="space-y-4"><textarea rows={6} className="w-full border-2 border-gray-100 rounded-2xl p-5 outline-none bg-gray-50/30 font-medium" placeholder="Ketik jawaban lengkap..." value={answers[q.id] || ''} onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} /><div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0"><Brain className="w-5 h-5" /></div><p className="text-[10px] text-blue-800 font-bold uppercase tracking-widest">AI Grading Active: Jawaban esai Anda akan dianalisis otomatis.</p></div></div>
               )}
            </div>
            <div className="pt-10 mt-10 border-t border-gray-100 flex justify-between items-center"><button onClick={onExit} disabled={isSubmitting} className="text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-red-500">Batal</button><Button onClick={handleNext} isLoading={isSubmitting} disabled={!answers[q.id]} className="h-14 px-8 rounded-2xl font-black uppercase text-xs shadow-xl">{currentQIndex < questions.length - 1 ? 'Next' : 'Finish'}</Button></div>
         </Card>
      </div>
   );
};
