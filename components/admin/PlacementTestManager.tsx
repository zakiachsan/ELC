
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { BookOpen, Users, Plus, Pencil, Trash2, CheckCircle, Search, Mail, Smartphone, Calendar, Eye, X, MapPin, School, GraduationCap, FileText } from 'lucide-react';
import { MOCK_PLACEMENT_QUESTIONS, MOCK_PLACEMENT_RESULTS } from '../../constants';
import { PlacementQuestion, PlacementSubmission } from '../../types';

export const PlacementTestManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'results'>('results');
  const [questions, setQuestions] = useState<PlacementQuestion[]>(MOCK_PLACEMENT_QUESTIONS);
  const [results] = useState<PlacementSubmission[]>(MOCK_PLACEMENT_RESULTS);
  const [isAddingQ, setIsAddingQ] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<PlacementSubmission | null>(null);

  const filteredResults = results.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600" /> Placement Test Center
          </h2>
          <p className="text-gray-500">Configure free assessment questions and monitor student leads.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
           <button 
             onClick={() => setActiveTab('results')}
             className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'results' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Student Leads
           </button>
           <button 
             onClick={() => setActiveTab('questions')}
             className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'questions' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Questions Setup
           </button>
        </div>
      </div>

      {activeTab === 'results' ? (
        <div className="space-y-4">
           <div className="flex gap-4">
              <div className="flex-1 relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                 <input 
                   type="text" 
                   placeholder="Search leads by name or email..." 
                   className="w-full pl-10 pr-4 py-2 border rounded-xl shadow-sm outline-none focus:ring-1 focus:ring-teal-500"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                 <Calendar className="w-4 h-4" /> Last 30 Days
              </Button>
           </div>

           <Card className="p-0 overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                       <th className="px-6 py-4">Participant</th>
                       <th className="px-6 py-4">Grade / School</th>
                       <th className="px-6 py-4 text-center">Score</th>
                       <th className="px-6 py-4">CEFR Result</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {filteredResults.map(res => (
                       <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="font-bold text-gray-900">{res.name}</div>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[10px] text-gray-400"><Mail className="w-3 h-3" /> {res.email}</span>
                                <span className="flex items-center gap-1 text-[10px] text-gray-400"><Smartphone className="w-3 h-3" /> {res.wa}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{res.grade}</td>
                          <td className="px-6 py-4 text-center">
                             <span className="font-black text-teal-600">{res.score}%</span>
                          </td>
                          <td className="px-6 py-4">
                             <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-black border border-blue-100">
                                {res.cefrResult}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                                onClick={() => setSelectedLead(res)}
                                className="flex items-center gap-2 ml-auto bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                             >
                                <Eye className="w-4 h-4" /> Detail
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </Card>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex justify-end">
              <Button onClick={() => setIsAddingQ(true)}>
                 <Plus className="w-4 h-4 mr-2" /> Add Question
              </Button>
           </div>

           {isAddingQ && (
              <Card title="New Placement Question" className="animate-in slide-in-from-top-4 duration-300">
                 <div className="space-y-4">
                    <textarea className="w-full border rounded-xl p-4 text-sm" rows={2} placeholder="Type the question text here..." />
                    <div className="grid grid-cols-2 gap-4">
                       {[0, 1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-2">
                             <input type="radio" name="correct" />
                             <input type="text" className="w-full border rounded-lg px-3 py-2 text-xs" placeholder={`Option ${String.fromCharCode(65+i)}`} />
                          </div>
                       ))}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                       <Button variant="outline" onClick={() => setIsAddingQ(false)}>Cancel</Button>
                       <Button onClick={() => setIsAddingQ(false)}>Save Question</Button>
                    </div>
                 </div>
              </Card>
           )}

           <div className="space-y-4">
              {questions.map((q, idx) => (
                 <Card key={q.id} className="relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                       <button className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-start gap-3">
                          <span className="bg-gray-100 text-gray-500 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0">{idx+1}</span>
                          <p className="font-bold text-gray-900">{q.text}</p>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-9">
                          {q.options.map((opt, oIdx) => (
                             <div key={oIdx} className={`px-3 py-2 rounded-lg text-xs font-medium border ${oIdx === q.correctAnswerIndex ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-100 text-gray-500'}`}>
                                {String.fromCharCode(65+oIdx)}. {opt}
                             </div>
                          ))}
                       </div>
                       <div className="pl-9 pt-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">CEFR Weight: {q.weight} points</span>
                       </div>
                    </div>
                 </Card>
              ))}
           </div>
        </div>
      )}

      {/* LEAD DETAIL MODAL - COMPACT SIZE */}
      {selectedLead && (
         <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/60 backdrop-blur-md flex flex-col items-center justify-start py-8 sm:py-12 px-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative border border-gray-100 flex flex-col">
               <div className="absolute top-5 right-5 z-10">
                  <button 
                     onClick={() => setSelectedLead(null)}
                     className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors shadow-sm"
                  >
                     <X className="w-4 h-4" />
                  </button>
               </div>

               <div className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 theme-bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl border-4 border-white shrink-0">
                        {selectedLead.name.charAt(0)}
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">{selectedLead.name}</h3>
                        <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mt-0.5">Placement Lead</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-center">
                        <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest">Score</p>
                        <p className="text-xl font-black text-teal-900">{selectedLead.score}%</p>
                     </div>
                     <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Level</p>
                        <p className="text-sm font-black text-blue-900">{selectedLead.cefrResult.split(' - ')[0]}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1">Contact Info</h4>
                     <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-3">
                           <Mail className="w-4 h-4 text-blue-500" />
                           <span className="text-xs font-bold text-gray-800 truncate">{selectedLead.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <Smartphone className="w-4 h-4 text-green-500" />
                           <span className="text-xs font-bold text-gray-800">{selectedLead.wa}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <School className="w-4 h-4 text-teal-500" />
                           <span className="text-xs font-bold text-gray-800">{selectedLead.schoolOrigin || '-'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                     <Button 
                        onClick={() => {
                           const msg = `Halo ${selectedLead.name}, kami dari ELC ingin mendiskusikan hasil Placement Test Anda.`;
                           window.open(`https://wa.me/${selectedLead.wa.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px]"
                     >
                        <Smartphone className="w-4 h-4" /> WhatsApp Candidate
                     </Button>
                     <Button 
                        variant="outline"
                        onClick={() => setSelectedLead(null)}
                        className="h-10 rounded-xl font-bold text-[10px] uppercase"
                     >
                        Close
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
