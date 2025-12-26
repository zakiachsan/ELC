
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Trophy, Medal, Sparkles, Clock, Calendar, CheckCircle, Brain, History, User as UserIcon, Users, Award, XCircle, ArrowLeft, ShieldCheck, CreditCard, Lock, ChevronRight } from 'lucide-react';
import { MOCK_OLYMPIADS } from '../../constants';
import { User, Olympiad, OlympiadStatus, OlympiadAttempt } from '../../types';

export const StudentOlympiad: React.FC<{ student: User }> = ({ student }) => {
  const [view, setView] = useState<'list' | 'terms' | 'payment' | 'exam' | 'result'>('list');
  const [selectedOlympiad, setSelectedOlympiad] = useState<Olympiad | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<OlympiadAttempt | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const activeOlympiads = MOCK_OLYMPIADS.filter(o => o.status === OlympiadStatus.OPEN);
  const upcomingOlympiads = MOCK_OLYMPIADS.filter(o => o.status === OlympiadStatus.UPCOMING);

  const handleParticipateClick = (ol: Olympiad) => {
    setSelectedOlympiad(ol);
    setView('terms');
  };

  const handleAcceptTerms = () => {
    setView('payment');
  };

  const handlePaymentSuccess = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      startExam(selectedOlympiad!);
    }, 2000);
  };

  const startExam = (ol: Olympiad) => {
    setSelectedOlympiad(ol);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setView('exam');
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    let correct = 0;
    selectedOlympiad?.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswerIndex) correct++;
    });
    
    const score = Math.round((correct / (selectedOlympiad?.questions.length || 1)) * 100);
    
    setTimeout(() => {
      setLastAttempt({
        id: 'att' + Date.now(),
        olympiadId: selectedOlympiad!.id,
        studentId: student.id,
        answers,
        score,
        completedAt: new Date().toISOString()
      });
      setIsSubmitting(false);
      setView('result');
    }, 2000);
  };

  if (view === 'terms' && selectedOlympiad) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-10">
        <Card title="Syarat & Ketentuan">
           <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                 <ShieldCheck className="w-10 h-10 text-blue-600" />
                 <div>
                    <h3 className="font-bold text-blue-900">Peraturan Kompetisi</h3>
                    <p className="text-xs text-blue-700">Harap baca dengan teliti sebelum melanjutkan ke tahap pembayaran.</p>
                 </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 max-h-64 overflow-y-auto">
                 <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                    {selectedOlympiad.terms || "Belum ada syarat dan ketentuan yang ditambahkan."}
                 </pre>
              </div>
              <div className="flex items-start gap-3">
                 <input type="checkbox" id="agree" className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                 <label htmlFor="agree" className="text-sm text-gray-600 font-medium">
                    Saya telah membaca dan menyetujui seluruh syarat dan ketentuan yang berlaku untuk mengikuti <span className="font-bold text-gray-900">{selectedOlympiad.title}</span>.
                 </label>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                 <Button variant="outline" onClick={() => setView('list')}>Batal</Button>
                 <Button onClick={handleAcceptTerms}>Setujui & Lanjutkan</Button>
              </div>
           </div>
        </Card>
      </div>
    );
  }

  if (view === 'payment' && selectedOlympiad) {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-in zoom-in-95">
        <Card title="Pembayaran Pendaftaran">
           <div className="space-y-6">
              <div className="text-center space-y-2">
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Biaya Pendaftaran</p>
                 <div className="text-4xl font-black text-gray-900">Rp {selectedOlympiad.price?.toLocaleString()}</div>
                 <div className="text-sm text-gray-500 font-medium">{selectedOlympiad.title}</div>
              </div>
              <div className="space-y-4">
                 <div className="p-4 border rounded-xl bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <CreditCard className="w-5 h-5 text-gray-400" />
                       <span className="text-sm font-bold text-gray-700">Pilih Metode Pembayaran</span>
                    </div>
                 </div>
                 <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-center gap-3">
                    <Lock className="w-5 h-5 text-teal-600" />
                    <span className="text-xs text-teal-800 font-medium leading-tight">Transaksi aman dan terenkripsi. Link ujian akan terbuka otomatis setelah pembayaran berhasil.</span>
                 </div>
              </div>
              <Button onClick={handlePaymentSuccess} className="w-full py-4 rounded-2xl shadow-lg" variant="primary" isLoading={isPaying}>
                Bayar Sekarang
              </Button>
              <button onClick={() => setView('terms')} className="w-full text-xs text-gray-400 font-bold hover:text-gray-600">Kembali ke Syarat & Ketentuan</button>
           </div>
        </Card>
      </div>
    );
  }

  if (view === 'exam' && selectedOlympiad) {
    const q = selectedOlympiad.questions[currentQuestionIdx];
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-10">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex justify-between items-center">
          <div>
             <h2 className="text-xl font-bold text-gray-900">{selectedOlympiad.title}</h2>
             <p className="text-sm text-gray-500">Question {currentQuestionIdx + 1} of {selectedOlympiad.questions.length}</p>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-100 font-bold">
             <Clock className="w-5 h-5" /> 45:00
          </div>
        </div>
        <Card className="p-8">
           <div className="space-y-8">
              <div className="space-y-4">
                 <h3 className="text-2xl font-bold text-gray-800 leading-tight">{q.text}</h3>
                 {q.image && (
                   <div className="aspect-video rounded-xl bg-gray-50 border overflow-hidden">
                      <img src={q.image} alt="Question" className="w-full h-full object-contain" />
                   </div>
                 )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {q.options.map((opt, idx) => (
                    <button key={idx} onClick={() => setAnswers({...answers, [q.id]: idx})} className={`p-6 rounded-2xl border-2 text-left transition-all relative group ${answers[q.id] === idx ? 'border-orange-500 bg-orange-50 shadow-lg scale-[1.02]' : 'border-gray-100 hover:border-orange-200 hover:bg-gray-50'}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border-2 ${answers[q.id] === idx ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className={`font-bold ${answers[q.id] === idx ? 'text-orange-900' : 'text-gray-600'}`}>{opt}</span>
                       </div>
                    </button>
                 ))}
              </div>
           </div>
           <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
              <Button variant="outline" onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))} disabled={currentQuestionIdx === 0}>
                Sebelumnya
              </Button>
              {currentQuestionIdx === selectedOlympiad.questions.length - 1 ? (
                <Button onClick={handleSubmit} isLoading={isSubmitting}>
                   Kirim Jawaban
                </Button>
              ) : (
                <Button onClick={() => setCurrentQuestionIdx(prev => prev + 1)}>
                   Pertanyaan Berikutnya
                </Button>
              )}
           </div>
        </Card>
      </div>
    );
  }

  if (view === 'result' && lastAttempt) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95">
         <Card className="text-center py-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
            <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 animate-bounce"><Trophy className="w-12 h-12" /></div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Congratulations!</h2>
            <p className="text-gray-500 mb-8 px-8">You have completed the <span className="font-bold text-gray-800">{selectedOlympiad?.title}</span>. Your dedication to learning is inspiring!</p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Final Score</div>
                  <div className="text-3xl font-extrabold text-gray-900">{lastAttempt.score}%</div>
               </div>
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Questions</div>
                  <div className="text-3xl font-extrabold text-gray-900">{selectedOlympiad?.questions.length}</div>
               </div>
            </div>
            <Button onClick={() => setView('list')}>Back to Olympiad Hub</Button>
         </Card>
         <Card title="Detailed Report">
            <div className="space-y-6">
               {selectedOlympiad?.questions.map((q, i) => {
                 const userAns = lastAttempt.answers[q.id];
                 const isCorrect = userAns === q.correctAnswerIndex;
                 return (
                   <div key={q.id} className={`p-4 rounded-xl border-l-4 ${isCorrect ? 'border-l-green-500 bg-green-50/30' : 'border-l-red-500 bg-red-50/30'}`}>
                      <div className="flex justify-between items-start gap-4">
                         <div className="text-sm font-bold text-gray-800">{i+1}. {q.text}</div>
                         {isCorrect ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                      </div>
                      <div className="mt-3 flex gap-4 text-xs font-medium">
                         <div className="text-gray-500">Your Answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{String.fromCharCode(65 + userAns)}</span></div>
                         {!isCorrect && <div className="text-green-600">Correct: {String.fromCharCode(65 + q.correctAnswerIndex)}</div>}
                      </div>
                   </div>
                 )
               })}
            </div>
         </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-orange-900 p-8 lg:p-12 text-white shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="space-y-6 max-w-xl">
               <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-yellow-400" /> Featured Event
               </div>
               <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">National English Mastery Olympiad</h1>
               <p className="text-indigo-100 text-lg opacity-90 leading-relaxed">Showcase your English brilliance on a national stage. Win scholarships, medals, and prestigious recognition.</p>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium"><Users className="w-5 h-5 text-yellow-400" /> 2.5k+ Participants</div>
                  <div className="flex items-center gap-2 text-sm font-medium"><Award className="w-5 h-5 text-yellow-400" /> $5,000 Total Prizes</div>
               </div>
            </div>
            <div className="shrink-0 relative">
               <div className="w-48 h-48 lg:w-64 lg:h-64 bg-yellow-400 rounded-full flex items-center justify-center text-orange-900 shadow-2xl animate-pulse"><Trophy className="w-32 h-32 lg:w-44 lg:h-44" /></div>
               <div className="absolute -top-4 -right-4 bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xl shadow-xl transform rotate-12">JOIN NOW</div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Medal className="w-6 h-6 text-orange-500" /> Open Competitions</h3>
            <div className="grid grid-cols-1 gap-6">
               {activeOlympiads.length === 0 && <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center text-gray-400">No active competitions.</div>}
               {activeOlympiads.map(ol => (
                 <Card key={ol.id} className="group hover:border-orange-500 transition-all cursor-pointer relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-6 p-2">
                       <div className="w-full md:w-48 h-48 rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform duration-500"><Brain className="w-20 h-20" /></div>
                       <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                             <h4 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{ol.title}</h4>
                             <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Registration Open</span>
                          </div>
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{ol.description}</p>
                          <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400">
                             <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-orange-500" /> Ends: {new Date(ol.endDate).toLocaleDateString()}</div>
                             <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-orange-500" /> {ol.participantCount} Joined</div>
                             <div className="flex items-center gap-1.5"><Award className="w-4 h-4 text-orange-500" /> Prize: {ol.reward}</div>
                          </div>
                          <div className="pt-4 flex justify-between items-center">
                             <div className="text-sm font-bold text-orange-600">Rp {ol.price?.toLocaleString()} • {ol.questions.length} Questions</div>
                             <Button onClick={() => handleParticipateClick(ol)} variant="accent" className="rounded-full px-8 group-hover:shadow-lg transition-all">
                                Participate
                             </Button>
                          </div>
                       </div>
                    </div>
                 </Card>
               ))}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 pt-6"><History className="w-6 h-6 text-blue-500" /> Upcoming Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {upcomingOlympiads.map(ol => (
                 <div key={ol.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Calendar className="w-6 h-6" /></div>
                    <div>
                       <div className="text-sm font-bold text-gray-900">{ol.title}</div>
                       <div className="text-[10px] font-medium text-gray-400">Opens on {new Date(ol.startDate).toLocaleDateString()}</div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
         <div className="space-y-8">
            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
               <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4" /> My Competition Stats</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-xs text-indigo-700 font-medium">Rank in Center</span>
                     <span className="text-xl font-black text-indigo-900">#42</span>
                  </div>
                  <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden"><div className="bg-indigo-600 h-full w-[70%]"></div></div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                     <div className="bg-white p-3 rounded-xl border border-indigo-50 text-center">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Total Participation</div>
                        <div className="text-lg font-bold text-indigo-900">12</div>
                     </div>
                     <div className="bg-white p-3 rounded-xl border border-indigo-50 text-center">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Average Score</div>
                        <div className="text-lg font-bold text-indigo-900">88%</div>
                     </div>
                  </div>
               </div>
            </Card>
            <Card title="Top Leaderboard (Mock)">
               <div className="space-y-4">
                  {[
                    { name: 'Sarah Connor', score: '98%', rank: 1, avatar: 'SC' },
                    { name: 'John Wick', score: '95%', rank: 2, avatar: 'JW' },
                    { name: 'Bruce Wayne', score: '94%', rank: 3, avatar: 'BW' }
                  ].map(user => (
                    <div key={user.rank} className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${user.rank === 1 ? 'bg-yellow-400 text-yellow-900' : user.rank === 2 ? 'bg-gray-200 text-gray-600' : 'bg-orange-200 text-orange-900'}`}>{user.rank}</div>
                       <div className="flex-1">
                          <div className="text-sm font-bold text-gray-800">{user.name}</div>
                          <div className="text-[10px] text-gray-500">{user.score} points</div>
                       </div>
                       <Award className={`w-4 h-4 ${user.rank === 1 ? 'text-yellow-400' : 'text-gray-200'}`} />
                    </div>
                  ))}
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
};
