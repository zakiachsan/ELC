
import React, { useState } from 'react';
import { Button } from './Button';
import { 
  CheckCircle, Zap, Users, Trophy, Star, Globe, 
  Calendar, Award, ShieldCheck, Lock, Smartphone, Mail, X, ChevronRight, Brain, AlertCircle, Clock, Sparkles, XCircle, ArrowLeft, Newspaper, Medal, MonitorPlay, Video, Briefcase, Flag, UserPlus, FileText, Send, DollarSign, TrendingUp
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { LoginModal } from './LoginModal';
import { Card } from './Card';
import { UserRole, Olympiad, OlympiadStatus, CEFRLevel, News } from '../types';
import { MOCK_OLYMPIADS, MOCK_PLACEMENT_QUESTIONS, MOCK_NEWS, MOCK_STUDENTS_OF_THE_MONTH } from '../constants';

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
    experience: '',
    motivation: '',
    salary: ''
  });

  // Placement Test States
  const [placementFlow, setPlacementFlow] = useState<'none' | 'form' | 'quiz' | 'result'>('none');
  const [sessionID, setSessionID] = useState<string>('');
  const [currentPQIndex, setCurrentPQIndex] = useState(0);
  const [placementAnswers, setPlacementAnswers] = useState<Record<string, number>>({});
  const [placementResult, setPlacementResult] = useState<{score: number, cefr: CEFRLevel} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '', 
    dob: '', 
    grade: '', 
    parentWa: '', 
    personalWa: '', 
    address: '', 
    email: '', 
    schoolOrigin: ''
  });

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

  const renderRegistrationFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 text-left block">Nama Lengkap</label>
        <input type="text" className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-gray-50/30" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Sesuai KTP" />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 text-left block">Tanggal Lahir</label>
        <input type="date" className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-gray-50/30" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 text-left block">Email Address</label>
        <input type="email" className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-gray-50/30" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@contoh.com" />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 text-left block">Kelas / Grade</label>
        <select className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-gray-50/30" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
          <option value="">Pilih Grade</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
          <option value="Kuliah/Umum">Kuliah/Umum</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 text-left block">WA Pribadi</label>
        <input type="tel" className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-gray-50/30" value={formData.personalWa} onChange={e => setFormData({...formData, personalWa: e.target.value})} placeholder="08..." />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 text-left block">Asal Sekolah</label>
        <input type="text" className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-gray-50/30" value={formData.schoolOrigin} onChange={e => setFormData({...formData, schoolOrigin: e.target.value})} placeholder="Nama Sekolah..." />
      </div>
    </div>
  );

  // --- SUB-VIEWS RENDERING (PLACEMENT & NEWS) ---
  if (placementFlow === 'quiz' || placementFlow === 'result') {
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
            ) : (
               <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Award className="w-12 h-12" /></div>
                  <h2 className="text-5xl font-black text-gray-900">Your CEFR Level: {placementResult?.cefr.split(' - ')[0]}</h2>
                  <p className="text-lg text-gray-500 max-w-lg mx-auto">Selamat! Anda berada di level <b>{placementResult?.cefr.split(' - ')[1]}</b>. Tim kami akan menghubungi Anda segera.</p>
                  <Button onClick={() => setPlacementFlow('none')} className="h-14 px-10 text-lg">Kembali ke Beranda</Button>
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
  return (
    <div className="min-h-screen bg-white font-sans relative">
      <LoginModal isOpen={isLoginOpen} onClose={closeLogin} onLogin={onLoginSuccess} />

      {/* Navbar - Original Style */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-gray-100">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 theme-bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">E</div>
           <span className="text-2xl font-bold text-gray-800 tracking-tight">ELC<span className="theme-text-accent">{t.app_name}</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-gray-600 font-medium">
          <a href="#featured-event" className="hover:theme-text-primary transition-colors">Olimpiade</a>
          <a href="#cefr-test" className="hover:theme-text-primary transition-colors">Free Test</a>
          <a href="#hall-of-fame" className="hover:theme-text-primary transition-colors">Hall of Fame</a>
          <a href="#news" className="hover:theme-text-primary transition-colors">News</a>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setLanguage(language === 'en' ? 'id' : 'en')} className="flex items-center gap-2 text-xs font-bold bg-white border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors text-gray-800 shadow-sm"><Globe className="w-4 h-4 text-blue-500" /> <span>{language === 'en' ? 'English' : 'Indonesia'}</span></button>
          <Button variant="outline" onClick={openLogin}>{t.hp_login}</Button>
        </div>
      </nav>

      {/* Hero Section - Original Scale */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
           <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
              <div className="inline-flex items-center gap-2 theme-bg-primary-light border theme-border-primary px-4 py-2 rounded-full theme-text-primary font-bold text-xs uppercase tracking-widest">
                <Star className="w-4 h-4 theme-text-accent fill-current" /> Adaptive English Learning
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-tight">
                {t.hp_hero_title_1} <span className="theme-gradient-text">{t.hp_hero_title_2}</span> {t.hp_hero_title_3}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {t.hp_hero_desc}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button onClick={openLogin} variant="primary" className="h-16 px-10 text-xl rounded-2xl shadow-xl hover:scale-105 transition-transform">Mulai Belajar</Button>
                <button onClick={() => setPlacementFlow('form')} className="h-16 px-10 text-xl flex items-center justify-center gap-3 text-gray-700 font-bold hover:theme-text-primary transition-colors border-2 border-gray-100 rounded-2xl bg-white shadow-sm">Free CEFR Test <Sparkles className="w-6 h-6 text-yellow-500" /></button>
              </div>
           </div>
        </div>
      </section>

      {/* Olympiad Section - REDESIGNED FOR TYPO CONSISTENCY */}
      <section id="featured-event" className="py-24 bg-gray-50 border-y border-gray-100 scroll-mt-20 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           {featuredOlympiad ? (
              <div className="space-y-12">
                 <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-4">
                       <div className="bg-indigo-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 shadow-lg">
                          <Trophy className="w-3.5 h-3.5 text-yellow-400" /> National Event
                       </div>
                       <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight uppercase">{featuredOlympiad.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] border-b border-gray-200 pb-2">
                       <Users className="w-4 h-4" /> {featuredOlympiad.participantCount} Students Joined
                    </div>
                 </div>

                 <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col lg:flex-row group">
                    <div className="flex-1 p-10 md:p-16 space-y-12">
                       <div className="space-y-6 text-center lg:text-left">
                          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">About the Competition</h3>
                          <p className="text-lg text-slate-600 font-medium leading-relaxed">
                             {featuredOlympiad.description}
                          </p>
                          
                          {/* UPDATED: 5 SAMPLE BENEFITS (MATCHED TO CEFR STYLE) */}
                          <div className="pt-6">
                             <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                {[
                                   "Sertifikat Nasional Berlisensi",
                                   "Analisis Skor Detail (CEFR Report)",
                                   "Beasiswa Belajar ELC (Up to 50%)",
                                   "Akses Komunitas Exclusive",
                                   "Merchandise Eksklusif (Medali/Trophy)"
                                ].map((benefit, i) => (
                                   <li key={i} className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                                      <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" /> {benefit}
                                   </li>
                                ))}
                             </ul>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-gray-50">
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Schedule</h4>
                             <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                   <Calendar className="w-6 h-6 text-blue-600" />
                                   <div>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opens</p>
                                      <p className="text-sm font-bold text-gray-900">{new Date(featuredOlympiad.startDate).toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4 bg-red-50 p-4 rounded-2xl border border-red-100">
                                   <Clock className="w-6 h-6 text-red-600" />
                                   <div>
                                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Closes</p>
                                      <p className="text-sm font-bold text-gray-900">{new Date(featuredOlympiad.endDate).toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex flex-col justify-center bg-blue-50 p-6 rounded-3xl border border-blue-100">
                             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Standardized Result</p>
                             <div className="flex items-center gap-3">
                                <ShieldCheck className="w-8 h-8 text-blue-600" />
                                <p className="text-xs text-blue-800 font-bold leading-tight">Sertifikat valid untuk melengkapi portofolio akademik Anda.</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="w-full lg:w-[380px] bg-gradient-to-br from-indigo-900 to-blue-950 p-10 md:p-16 text-white flex flex-col justify-center space-y-12 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                       <div className="relative z-10 space-y-2 text-center lg:text-left">
                          <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em]">Entry Fee</p>
                          <div className="flex items-baseline justify-center lg:justify-start gap-2">
                             <span className="text-4xl font-black">Rp {featuredOlympiad.price?.toLocaleString()}</span>
                             <span className="text-sm font-medium text-blue-300">/ student</span>
                          </div>
                       </div>
                       <div className="relative z-10 space-y-6">
                          <button onClick={() => startRegistration(featuredOlympiad)} className="w-full h-16 bg-white hover:bg-yellow-400 text-indigo-900 rounded-[20px] font-black text-lg shadow-2xl transition-all transform hover:scale-105 active:scale-95">Register Now</button>
                          <p className="text-center text-[10px] text-blue-300 uppercase font-black tracking-widest opacity-60">Limited Spots Available</p>
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

      {/* CEFR Test Promo - MATCHED COMPOSITION */}
      <section id="cefr-test" className="py-24 bg-white relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[48px] p-10 lg:p-20 flex flex-col lg:flex-row items-center gap-16 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div className="flex-1 space-y-8 text-center lg:text-left z-10">
                  <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">Know your English potential based on CEFR</h2>
                  <p className="text-lg text-blue-100 font-medium opacity-80 max-w-xl mx-auto lg:mx-0">Ikuti tes penempatan gratis kami untuk mengetahui level kemampuan bahasa Inggris Anda dalam skala standar internasional (A1-C2).</p>
                  <ul className="space-y-4 inline-block text-left">
                     {["Hasil instan dan akurat", "Standar kurikulum internasional", "100% Gratis & Tanpa Komitmen"].map((t, i) => (
                        <li key={i} className="flex items-center gap-4 text-blue-100 font-bold"><CheckCircle className="w-6 h-6 text-teal-400" /> {t}</li>
                     ))}
                  </ul>
                  <div className="pt-6">
                     <Button onClick={() => setPlacementFlow('form')} className="h-16 px-10 text-lg rounded-[20px] shadow-xl bg-teal-400 hover:bg-teal-500 text-indigo-900 font-black">Take My Free Test Now</Button>
                  </div>
               </div>
               <div className="w-full lg:w-[450px] shrink-0 z-10">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-10 shadow-2xl text-white space-y-8">
                     <div className="flex justify-between items-center"><span className="text-2xl font-black">CEFR Scale</span><div className="bg-teal-400 text-indigo-900 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Global</div></div>
                     <div className="space-y-6">
                        {['C2', 'C1', 'B2', 'B1', 'A2', 'A1'].map((lvl, idx) => (
                           <div key={lvl} className="flex items-center gap-5">
                              <div className={`w-12 h-10 rounded-xl flex items-center justify-center font-black text-sm ${idx < 2 ? 'bg-teal-400 text-indigo-900' : 'bg-white/10'}`}>{lvl}</div>
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                 <div className="bg-teal-400 h-full" style={{width: `${100 - (idx * 15)}%`, opacity: 1 - (idx * 0.12)}}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Hall of Fame - Original Style */}
      <section id="hall-of-fame" className="py-24 bg-blue-50/50 border-y border-blue-100 scroll-mt-20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
            <div className="text-center space-y-4">
               <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm"><Award className="w-4 h-4" /> Hall of Fame</div>
               <h2 className="text-5xl font-black text-gray-900 tracking-tight leading-none uppercase">ELC's Students of the Month</h2>
               <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Merayakan semangat belajar dan pencapaian luar biasa dari siswa-siswi terbaik kami.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               {MOCK_STUDENTS_OF_THE_MONTH.map((student) => (
                  <div key={student.id} className="relative group flex flex-col h-full">
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[48px] transform transition-all group-hover:rotate-3 group-hover:scale-105 duration-500 shadow-xl opacity-0 group-hover:opacity-100"></div>
                     <Card className="relative h-full bg-white border border-gray-100 rounded-[48px] p-10 space-y-8 flex flex-col items-center text-center transform transition-transform group-hover:-translate-y-4 duration-500">
                        <div className="relative"><div className="w-40 h-40 rounded-full overflow-hidden border-[8px] border-white shadow-2xl"><img src={student.image} className="w-full h-full object-cover" alt="" /></div><div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-3 rounded-2xl shadow-xl z-10"><Medal className="w-8 h-8" /></div></div>
                        <div className="space-y-3 flex-1"><p className="text-blue-600 font-black text-[10px] uppercase tracking-widest">{student.monthYear}</p><h3 className="text-3xl font-black text-gray-900 leading-tight">{student.name}</h3><div className="h-0.5 w-12 bg-gray-100 mx-auto my-6"></div><p className="text-gray-500 text-base font-medium leading-relaxed italic">"{student.achievement}"</p></div>
                        <div className="w-full pt-8"><div className="bg-gray-50 rounded-2xl py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">Outstanding Academic Performance</div></div>
                     </Card>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* News Section - Original Style */}
      <section id="news" className="py-24 bg-white border-b border-gray-100 scroll-mt-20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
               <div className="space-y-4 text-center md:text-left">
                  <h2 className="text-5xl font-black text-gray-900 uppercase">ELC News & Feed</h2>
                  <p className="text-lg text-gray-500 font-medium max-w-xl">Ikuti kabar terbaru seputar sistem, prestasi siswa, dan agenda kegiatan ELC.</p>
               </div>
               <Button onClick={openNewsArchive} variant="outline" className="h-14 px-8 rounded-2xl border-gray-200 font-black uppercase text-[10px] tracking-widest hover:border-blue-600 hover:text-blue-600 shadow-sm">Lihat Semua Berita</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {MOCK_NEWS.slice(0, 3).map((news) => (
                  <Card key={news.id} className="p-0 overflow-hidden flex flex-col group border-none shadow-sm hover:shadow-2xl transition-all rounded-[40px] h-full cursor-pointer" onClick={() => openNewsDetail(news)}>
                     <div className="aspect-[4/3] relative overflow-hidden">
                        {news.displayMedia === 'video' ? (
                           <div className="w-full h-full bg-black flex items-center justify-center"><MonitorPlay className="w-16 h-16 text-white/30 group-hover:scale-125 transition-transform" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div></div>
                        ) : (
                           <img src={news.featuredImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                        )}
                        {news.displayMedia === 'video' && <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-purple-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"><Video className="w-3.5 h-3.5" /> Video Article</div>}
                     </div>
                     <div className="p-10 flex-1 flex flex-col space-y-4">
                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">{news.title}</h3>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-3 flex-1">{news.summary}</p>
                        <div className="pt-6 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest group-hover:gap-4 transition-all">Baca Selengkapnya <ChevronRight className="w-4 h-4" /></div>
                     </div>
                  </Card>
               ))}
            </div>
         </div>
      </section>

      {/* Footer - Original Style */}
      <footer className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
           <div className="flex items-center justify-center gap-3">
               <div className="w-14 h-14 theme-bg-primary rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-xl">E</div>
               <span className="text-4xl font-black text-gray-900 tracking-tighter">ELC<span className="theme-text-accent">System</span></span>
           </div>
           <div className="flex justify-center gap-12 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Help Center</a>
           </div>
           <p className="text-gray-400 text-xs font-medium">© 2024 English Learning Center. All Rights Reserved.</p>
        </div>
      </footer>

      {/* FORM MODAL (Placement/Olympiad) */}
      {(placementFlow === 'form' || selectedOlympiad) && placementFlow !== 'quiz' && placementFlow !== 'result' && (
         <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden relative">
               <button onClick={() => { setPlacementFlow('none'); setSelectedOlympiad(null); }} className="absolute top-6 right-6 p-1.5 bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
               <div className="p-10 space-y-8">
                  <div className="text-center space-y-2"><h3 className="text-2xl font-black text-gray-900 tracking-tight">{placementFlow === 'form' ? 'Free Assessment' : 'Daftar Olimpiade'}</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lengkapi data untuk melanjutkan</p></div>
                  <div className="max-h-[60vh] overflow-y-auto px-1 space-y-6">
                     {selectedOlympiad && regStep === 'info' ? (
                        <div className="space-y-6"><div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-xs text-blue-900 leading-relaxed font-medium"><p className="font-bold mb-4 uppercase tracking-widest">Terms & Regulations:</p>{selectedOlympiad.terms}</div><Button onClick={() => setRegStep('form')} className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">Setuju & Daftar</Button></div>
                     ) : selectedOlympiad && regStep === 'form' ? (
                        <div className="space-y-6">{renderRegistrationFields()}<div className="flex gap-4"><button onClick={() => setRegStep('info')} className="text-xs font-bold text-gray-400 uppercase tracking-widest">Back</button><Button onClick={() => setRegStep('payment')} className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">Go to Payment</Button></div></div>
                     ) : selectedOlympiad && regStep === 'payment' ? (
                        <div className="text-center space-y-8 py-6"><div className="space-y-1"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bayar</p><h4 className="text-5xl font-black text-gray-900">Rp {selectedOlympiad.price?.toLocaleString()}</h4></div><div className="bg-teal-50 border border-teal-100 p-6 rounded-2xl flex items-center gap-4 text-left"><Lock className="w-6 h-6 text-teal-600 shrink-0" /><p className="text-[11px] text-teal-800 font-bold uppercase leading-relaxed">Akses ujian akan dibuka otomatis setelah pembayaran lunas.</p></div><Button onClick={handlePay} isLoading={isProcessing} className="w-full h-16 rounded-[20px] font-black text-sm uppercase tracking-widest shadow-2xl">Lakukan Pembayaran</Button></div>
                     ) : selectedOlympiad && regStep === 'success' ? (
                        <div className="text-center space-y-6 py-6 animate-in zoom-in-95"><div className="w-20 h-20 bg-green-100 text-green-600 rounded-[24px] flex items-center justify-center mx-auto"><CheckCircle className="w-10 h-10" /></div><h3 className="text-2xl font-black text-gray-900">Pendaftaran Berhasil!</h3><div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-2xl space-y-4"><div className="space-y-1"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Generated Student ID</p><p className="text-2xl font-mono font-bold text-blue-600">{generatedCreds?.user}</p></div><div className="space-y-1"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Temporary Password</p><p className="text-2xl font-mono font-bold text-gray-800">{generatedCreds?.pass}</p></div></div><p className="text-xs text-gray-400 font-medium">Gunakan ID ini untuk masuk ke dashboard olimpiade.</p><Button onClick={() => window.location.reload()} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Ke Dashboard Sekarang</Button></div>
                     ) : (
                        <div className="space-y-6">{renderRegistrationFields()}<Button onClick={handleStartPlacementSession} disabled={!formData.name || !formData.email || !formData.personalWa} className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">Mulai Ujian Gratis</Button></div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
