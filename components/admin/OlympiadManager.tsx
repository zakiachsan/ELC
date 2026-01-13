
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Trophy, Trash2, CheckCircle, Sparkles, Mail, Smartphone, X, ToggleLeft, ToggleRight, MapPin, Clock, Calendar, User, Home, Users, Eye, GraduationCap, Loader2, Mic, Zap, BookOpen } from 'lucide-react';
import { useOlympiads, useOlympiadRegistrations } from '../../hooks/useOlympiads';
import { Olympiad, OlympiadStatus, OlympiadQuestion, OlympiadBenefit, OlympiadRegistration, CompetitionType, COMPETITION_TYPE_LABELS, COMPETITION_TYPE_COLORS } from '../../types';

export const OlympiadManager: React.FC = () => {
  const { olympiads: olympiadsData, loading, error, createOlympiad, updateOlympiad } = useOlympiads();
  const { registrations: registrationsData } = useOlympiadRegistrations();

  const [view, setView] = useState<'list' | 'edit'>('list');
  const [selectedOlympiad, setSelectedOlympiad] = useState<Olympiad | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'participants'>('setup');
  const [selectedParticipant, setSelectedParticipant] = useState<OlympiadRegistration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map database format to component format
  const olympiads: Olympiad[] = olympiadsData.map(o => ({
    id: o.id,
    title: o.title,
    description: o.description || '',
    status: o.status as OlympiadStatus,
    competitionType: (o as any).competition_type as CompetitionType || CompetitionType.OLYMPIAD,
    startDate: o.start_date,
    endDate: o.end_date,
    eventDate: o.event_date || undefined,
    eventTime: o.event_time || undefined,
    eventLocation: o.event_location || undefined,
    price: o.price || 0,
    terms: o.terms || '',
    benefits: (o.benefits as OlympiadBenefit[]) || [],
    questions: (o.questions as OlympiadQuestion[]) || [],
    participantCount: registrationsData.filter(r => r.olympiad_id === o.id && r.status === 'SUCCESS').length,
    isActive: o.is_active,
  }));

  const allRegistrations: OlympiadRegistration[] = registrationsData.map(r => ({
    id: r.id,
    olympiadId: r.olympiad_id,
    name: r.name,
    email: r.email,
    school: r.school,
    schoolOrigin: r.school,
    grade: r.grade,
    dob: r.dob || undefined,
    wa: r.whatsapp || '',
    personalWa: r.whatsapp || undefined,
    parentName: r.parent_name || undefined,
    parentWa: r.parent_whatsapp || undefined,
    address: r.address || undefined,
    timestamp: r.created_at,
    status: r.status as 'PENDING' | 'SUCCESS',
  }));

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<OlympiadStatus>(OlympiadStatus.UPCOMING);
  const [competitionType, setCompetitionType] = useState<CompetitionType>(CompetitionType.OLYMPIAD);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [terms, setTerms] = useState('');
  const [benefits, setBenefits] = useState<OlympiadBenefit[]>([]);
  const [questions, setQuestions] = useState<OlympiadQuestion[]>([]);

  // New Benefit Input State
  const [newBenefitTitle, setNewBenefitTitle] = useState('');

  const handleToggleActive = async (olympiadId: string) => {
    try {
      // First set all to inactive, then set the target one to active
      for (const o of olympiadsData) {
        if (o.id === olympiadId) {
          await updateOlympiad(o.id, { is_active: !o.is_active });
        } else if (o.is_active) {
          await updateOlympiad(o.id, { is_active: false });
        }
      }
    } catch (err) {
      console.error('Error toggling active:', err);
    }
  };

  const handleEdit = (ol: Olympiad) => {
    setSelectedOlympiad(ol);
    setTitle(ol.title);
    setDescription(ol.description);
    setStatus(ol.status);
    setCompetitionType(ol.competitionType || CompetitionType.OLYMPIAD);
    setStartDate(ol.startDate);
    setEndDate(ol.endDate);
    setEventDate(ol.eventDate || '');
    setEventTime(ol.eventTime || '');
    setEventLocation(ol.eventLocation || '');
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

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const olympiadData = {
        title,
        description,
        status,
        competition_type: competitionType,
        start_date: startDate,
        end_date: endDate,
        event_date: eventDate || null,
        event_time: eventTime || null,
        event_location: eventLocation || null,
        price,
        terms,
        benefits,
        questions,
        is_active: selectedOlympiad?.isActive || false,
      };

      if (selectedOlympiad?.id && olympiadsData.find(o => o.id === selectedOlympiad.id)) {
        await updateOlympiad(selectedOlympiad.id, olympiadData);
      } else {
        await createOlympiad(olympiadData);
      }
      setView('list');
    } catch (err) {
      console.error('Error saving olympiad:', err);
      alert('Failed to save olympiad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading olympiads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Error loading olympiads: {error.message}
      </div>
    );
  }

  const verifiedParticipants = allRegistrations.filter(r => r.olympiadId === selectedOlympiad?.id && r.status === 'SUCCESS');

  return (
    <div className="space-y-4">
      {/* Participant Detail Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-sm">Detail Peserta</h3>
              <button onClick={() => setSelectedParticipant(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Student Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <User className="w-3 h-3" /> Data Siswa
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">Nama Lengkap</div>
                    <div className="font-bold text-gray-900">{selectedParticipant.name}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">Tanggal Lahir</div>
                    <div className="font-bold text-gray-900">{selectedParticipant.dob || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">Email</div>
                    <div className="font-bold text-gray-900">{selectedParticipant.email}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">WhatsApp Siswa</div>
                    <div className="font-bold text-gray-900">{selectedParticipant.personalWa || selectedParticipant.wa}</div>
                  </div>
                </div>
              </div>

              {/* School Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Data Sekolah
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">Asal Sekolah</div>
                    <div className="font-bold text-gray-900">{selectedParticipant.schoolOrigin || selectedParticipant.school}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">Kelas</div>
                    <div className="font-bold text-gray-900">{selectedParticipant.grade}</div>
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Users className="w-3 h-3" /> Data Orang Tua
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">Nama Orang Tua</div>
                    <div className="font-bold text-gray-900">{selectedParticipant.parentName || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">WhatsApp Orang Tua</div>
                    <div className="font-bold text-gray-900">{selectedParticipant.parentWa || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Home className="w-3 h-3" /> Alamat
                </h4>
                <div className="bg-gray-50 rounded-lg p-2 text-xs">
                  <div className="font-medium text-gray-900">{selectedParticipant.address || '-'}</div>
                </div>
              </div>

              {/* Registration Info */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Info Pendaftaran
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">Tanggal Daftar</div>
                    <div className="font-bold text-gray-900">{new Date(selectedParticipant.timestamp).toLocaleDateString('id-ID')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">Status Pembayaran</div>
                    <div className={`font-bold ${selectedParticipant.status === 'SUCCESS' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedParticipant.status === 'SUCCESS' ? 'Lunas' : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setSelectedParticipant(null)} className="w-full text-xs py-2">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" /> ELC's Competition
          </h2>
          <p className="text-xs text-gray-500">Kelola lomba-lomba: Olympiad, Spelling Bee, Speed Competition, Story Telling</p>
        </div>
        {view === 'list' && (
          <Button onClick={() => handleEdit({ id: '', title: '', description: '', status: OlympiadStatus.UPCOMING, competitionType: CompetitionType.OLYMPIAD, startDate: '', endDate: '', questions: [], participantCount: 0, price: 0, terms: '', benefits: [] })} className="text-xs py-1.5 px-3">
            Buat Kompetisi
          </Button>
        )}
      </div>

      {view === 'list' ? (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-2.5">Nama Kompetisi</th>
                <th className="px-4 py-2.5">Jenis</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-center">Tampil Homepage</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {olympiads.map(ol => {
                const typeColors = COMPETITION_TYPE_COLORS[ol.competitionType] || COMPETITION_TYPE_COLORS[CompetitionType.OLYMPIAD];
                return (
                <tr key={ol.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-bold text-gray-900 text-xs">{ol.title}</div>
                    <div className="text-[10px] text-gray-400">{ol.questions.length} Soal • {allRegistrations.filter(r => r.olympiadId === ol.id).length} Peserta</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${typeColors.bg} ${typeColors.text}`}>
                      {COMPETITION_TYPE_LABELS[ol.competitionType] || 'Olympiad'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${ol.status === OlympiadStatus.OPEN ? 'bg-green-100 text-green-700' : ol.status === OlympiadStatus.CLOSED ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {ol.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleToggleActive(ol.id)}
                      className={`transition-colors ${ol.isActive ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                      title={ol.isActive ? 'Aktif di Homepage' : 'Klik untuk aktifkan di Homepage'}
                    >
                      {ol.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    {ol.isActive && <div className="text-[9px] text-green-600 font-bold mt-0.5">AKTIF</div>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => handleEdit(ol)} className="text-blue-600 font-bold text-[11px] hover:underline">Detail</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="space-y-4">
           <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div className="flex gap-2">
                 <button onClick={() => setActiveTab('setup')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'setup' ? 'theme-bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Setup Kompetisi</button>
                 <button onClick={() => setActiveTab('participants')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'participants' ? 'theme-bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Daftar Peserta ({verifiedParticipants.length})</button>
              </div>
              <Button variant="outline" onClick={() => setView('list')} className="text-xs py-1 px-3">Kembali</Button>
           </div>

           {activeTab === 'setup' ? (
              <div className="space-y-4">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                       <Card title="Detail Kompetisi" className="!p-4">
                          <div className="space-y-3">
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Judul Kompetisi</label>
                                   <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Judul Kompetisi..." />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Jenis Lomba</label>
                                   <select value={competitionType} onChange={e => setCompetitionType(e.target.value as CompetitionType)} className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500">
                                     <option value={CompetitionType.OLYMPIAD}>Olympiad</option>
                                     <option value={CompetitionType.SPELLING_BEE}>Spelling Bee</option>
                                     <option value={CompetitionType.SPEED_COMPETITION}>Speed Competition</option>
                                     <option value={CompetitionType.STORY_TELLING}>Story Telling</option>
                                   </select>
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deskripsi</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Deskripsi singkat..." />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mulai Pendaftaran</label>
                                   <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Batas Pendaftaran</label>
                                   <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                             </div>
                          </div>
                       </Card>

                       {/* Event Details Card - NEW */}
                       <Card title="Detail Pelaksanaan" className="!p-4">
                          <div className="space-y-3">
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                     <Calendar className="w-3 h-3" /> Tanggal Pelaksanaan
                                   </label>
                                   <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                     <Clock className="w-3 h-3" /> Waktu Pelaksanaan
                                   </label>
                                   <input type="text" value={eventTime} onChange={e => setEventTime(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="09:00 - 12:00 WIB" />
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> Lokasi Pelaksanaan
                                </label>
                                <input type="text" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Gedung Serbaguna, Jl. Contoh No. 123" />
                             </div>
                          </div>
                       </Card>

                       {/* Benefit Section */}
                       <Card title="Benefit Peserta" className="!p-4">
                          <div className="space-y-3">
                             <div className="flex gap-2">
                                <div className="relative flex-1">
                                   <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-yellow-500" />
                                   <input
                                     type="text"
                                     value={newBenefitTitle}
                                     onChange={e => setNewBenefitTitle(e.target.value)}
                                     className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                     placeholder="Ketik benefit..."
                                     onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()}
                                   />
                                </div>
                                <Button onClick={handleAddBenefit} disabled={!newBenefitTitle} className="text-xs py-1.5 px-4">Tambah</Button>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {benefits.map((b, i) => (
                                   <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition-all">
                                      <div className="flex items-center gap-2">
                                         <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                                         <span className="text-xs font-medium text-gray-700">{b.title}</span>
                                      </div>
                                      <button onClick={() => removeBenefit(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                                         <X className="w-3 h-3" />
                                      </button>
                                   </div>
                                ))}
                                {benefits.length === 0 && <p className="col-span-full text-[10px] text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-100">Belum ada benefit.</p>}
                             </div>
                          </div>
                       </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-4">
                       <Card title="Harga & Ketentuan" className="!p-4">
                          <div className="space-y-3">
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Biaya Daftar (Rp)</label>
                                <div className="relative">
                                   <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                   <input
                                     type="text"
                                     value={price.toLocaleString('id-ID')}
                                     onChange={e => {
                                       const value = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                       setPrice(value ? Number(value) : 0);
                                     }}
                                     className="w-full border rounded-lg pl-9 pr-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                                     placeholder="0"
                                   />
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value as OlympiadStatus)} className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500">
                                  <option value={OlympiadStatus.UPCOMING}>Upcoming</option>
                                  <option value={OlympiadStatus.OPEN}>Open</option>
                                  <option value={OlympiadStatus.CLOSED}>Closed</option>
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Terms & Conditions</label>
                                <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={8} className="w-full border rounded-lg p-2 text-[10px] leading-relaxed outline-none focus:ring-1 focus:ring-blue-500 font-mono" placeholder="Syarat & ketentuan..." />
                             </div>
                          </div>
                       </Card>
                    </div>
                 </div>
                 <div className="flex justify-end pt-2">
                   <Button onClick={handleSave} className="px-8 shadow-md py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest">
                     Simpan Perubahan
                   </Button>
                 </div>
              </div>
           ) : (
              <Card title="Peserta Terverifikasi" className="!p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                       <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          <tr>
                             <th className="px-4 py-2.5">Nama</th>
                             <th className="px-4 py-2.5">Sekolah</th>
                             <th className="px-4 py-2.5">Kontak</th>
                             <th className="px-4 py-2.5">Orang Tua</th>
                             <th className="px-4 py-2.5">Tgl Daftar</th>
                             <th className="px-4 py-2.5 text-center">Aksi</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {verifiedParticipants.map(reg => (
                             <tr key={reg.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                  <div className="font-bold text-gray-900 text-xs">{reg.name}</div>
                                  <div className="text-[10px] text-gray-400">{reg.grade}</div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="text-xs text-gray-700">{reg.schoolOrigin || reg.school}</div>
                                </td>
                                <td className="px-4 py-2">
                                   <div className="flex items-center gap-1 text-[10px] text-gray-500"><Mail className="w-2.5 h-2.5" /> {reg.email}</div>
                                   <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium"><Smartphone className="w-2.5 h-2.5" /> {reg.personalWa || reg.wa}</div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="text-xs text-gray-700">{reg.parentName || '-'}</div>
                                  <div className="text-[10px] text-gray-400">{reg.parentWa || '-'}</div>
                                </td>
                                <td className="px-4 py-2 text-[10px] text-gray-400">{new Date(reg.timestamp).toLocaleDateString('id-ID')}</td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => setSelectedParticipant(reg)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </td>
                             </tr>
                          ))}
                          {verifiedParticipants.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic text-xs">Belum ada peserta lunas.</td>
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
