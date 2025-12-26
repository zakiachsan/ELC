
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Trophy, Plus, Pencil, Trash2, Upload, Eye, Image as ImageIcon, CheckCircle, FileText, ChevronRight, DollarSign, ListChecks, Sparkles, Users, Mail, Smartphone, School, X } from 'lucide-react';
import { MOCK_OLYMPIADS, MOCK_OLYMPIAD_REGISTRATIONS } from '../../constants';
import { Olympiad, OlympiadStatus, OlympiadQuestion, OlympiadBenefit, OlympiadRegistration } from '../../types';

export const OlympiadManager: React.FC = () => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [olympiads, setOlympiads] = useState<Olympiad[]>(MOCK_OLYMPIADS);
  const [selectedOlympiad, setSelectedOlympiad] = useState<Olympiad | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'participants'>('setup');
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<OlympiadStatus>(OlympiadStatus.UPCOMING);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [terms, setTerms] = useState('');
  const [benefits, setBenefits] = useState<OlympiadBenefit[]>([]);
  const [questions, setQuestions] = useState<OlympiadQuestion[]>([]);

  // New Benefit Input State
  const [newBenefitTitle, setNewBenefitTitle] = useState('');

  const handleEdit = (ol: Olympiad) => {
    setSelectedOlympiad(ol);
    setTitle(ol.title);
    setDescription(ol.description);
    setStatus(ol.status);
    setStartDate(ol.startDate);
    setEndDate(ol.endDate);
    setPrice(ol.price || 0);
    setTerms(ol.terms || '');
    setBenefits(ol.benefits || []);
    setQuestions(ol.questions);
    setActiveTab('setup');
    setView('edit');
  };

  const handleAddBenefit = () => {
    if (!newBenefitTitle) return;
    setBenefits([...benefits, { title: newBenefitTitle, description: '' }]);
    setNewBenefitTitle('');
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const newOl: Olympiad = {
      id: selectedOlympiad?.id || 'ol' + Date.now(),
      title,
      description,
      status,
      startDate,
      endDate,
      price,
      terms,
      benefits,
      questions,
      participantCount: selectedOlympiad?.participantCount || 0
    };
    setOlympiads(olympiads.map(o => o.id === newOl.id ? newOl : o));
    setView('list');
  };

  const verifiedParticipants = MOCK_OLYMPIAD_REGISTRATIONS.filter(r => r.olympiadId === selectedOlympiad?.id && r.status === 'SUCCESS');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-orange-500" /> Manajemen Olimpiade
          </h2>
          <p className="text-gray-500">Buat dan kelola kompetisi bahasa Inggris tingkat nasional/regional.</p>
        </div>
        {view === 'list' && (
          <Button onClick={() => handleEdit({ id: '', title: '', description: '', status: OlympiadStatus.UPCOMING, startDate: '', endDate: '', questions: [], participantCount: 0, price: 0, terms: '', benefits: [] })}>
            <Plus className="w-4 h-4 mr-2" /> Buat Olimpiade
          </Button>
        )}
      </div>

      {view === 'list' ? (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Nama Kompetisi</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {olympiads.map(ol => (
                <tr key={ol.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{ol.title}</div>
                    <div className="text-xs text-gray-400">{ol.questions.length} Soal • {MOCK_OLYMPIAD_REGISTRATIONS.filter(r => r.olympiadId === ol.id).length} Terdaftar</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ol.status === OlympiadStatus.OPEN ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {ol.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(ol)} className="text-blue-600 font-bold text-sm hover:underline">Detail & Data</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex gap-4">
                 <button onClick={() => setActiveTab('setup')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'setup' ? 'theme-bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Setup Kompetisi</button>
                 <button onClick={() => setActiveTab('participants')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'participants' ? 'theme-bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Daftar Peserta ({verifiedParticipants.length})</button>
              </div>
              <Button variant="outline" onClick={() => setView('list')}>Kembali ke List</Button>
           </div>

           {activeTab === 'setup' ? (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                       <Card title="Olympiad Details">
                          <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul Kompetisi</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Judul Kompetisi..." />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Jelaskan kompetisi ini secara singkat..." />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mulai Pendaftaran</label>
                                   <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Batas Pendaftaran</label>
                                   <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                             </div>
                          </div>
                       </Card>

                       {/* BENEFIT PESERTA (POINTS) SECTION */}
                       <Card title="Benefit Peserta (Point-point)">
                          <div className="space-y-4">
                             <div className="flex gap-2">
                                <div className="relative flex-1">
                                   <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                                   <input 
                                     type="text" 
                                     value={newBenefitTitle} 
                                     onChange={e => setNewBenefitTitle(e.target.value)}
                                     className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" 
                                     placeholder="Ketik benefit, misal: Sertifikat Berlisensi..." 
                                     onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()}
                                   />
                                </div>
                                <Button onClick={handleAddBenefit} disabled={!newBenefitTitle} className="h-10.5 px-6">Tambah</Button>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {benefits.map((b, i) => (
                                   <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-all">
                                      <div className="flex items-center gap-3">
                                         <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                         <span className="text-sm font-bold text-gray-700">{b.title}</span>
                                      </div>
                                      <button onClick={() => removeBenefit(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                                         <X className="w-4 h-4" />
                                      </button>
                                   </div>
                                ))}
                                {benefits.length === 0 && <p className="col-span-full text-xs text-gray-400 italic text-center py-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">Belum ada benefit ditambahkan.</p>}
                             </div>
                          </div>
                       </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                       <Card title="Pricing & Terms">
                          <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Biaya Daftar (Rp)</label>
                                <div className="relative">
                                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                   <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full border rounded-xl pl-10 pr-4 py-2.5 font-bold outline-none focus:ring-1 focus:ring-blue-500" placeholder="Biaya Pendaftaran" />
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Terms & Conditions</label>
                                <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={12} className="w-full border rounded-xl p-4 text-[11px] leading-relaxed outline-none focus:ring-1 focus:ring-blue-500 font-mono" placeholder="Tuliskan syarat & ketentuan pendaftaran di sini..." />
                             </div>
                          </div>
                       </Card>
                    </div>
                 </div>
                 <div className="flex justify-end pt-4"><Button onClick={handleSave} className="px-12 shadow-lg h-14 rounded-2xl font-black uppercase text-xs tracking-widest">Simpan Perubahan Kompetisi</Button></div>
              </div>
           ) : (
              <Card title="Pendaftar Terverifikasi (Lunas)">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <tr>
                             <th className="px-6 py-4">Participant</th>
                             <th className="px-6 py-4">School & Grade</th>
                             <th className="px-6 py-4">Contact</th>
                             <th className="px-6 py-4">Payment</th>
                             <th className="px-6 py-4">Reg Date</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {verifiedParticipants.map(reg => (
                             <tr key={reg.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">{reg.name}</td>
                                <td className="px-6 py-4">
                                   <div className="text-xs font-medium text-gray-700">{reg.school}</div>
                                   <div className="text-[10px] text-gray-400 font-bold uppercase">{reg.grade}</div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-1 text-[10px] text-gray-500"><Mail className="w-3 h-3" /> {reg.email}</div>
                                   <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold"><Smartphone className="w-3 h-3 text-green-500" /> {reg.wa}</div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${reg.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                      {reg.status === 'SUCCESS' ? 'Paid' : 'Pending'}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-[10px] text-gray-400 font-bold uppercase">{new Date(reg.timestamp).toLocaleDateString()}</td>
                             </tr>
                          ))}
                          {verifiedParticipants.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">Belum ada peserta lunas untuk kompetisi ini.</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </Card>
           )}
        </div>
      )}
    </div>
  );
};
