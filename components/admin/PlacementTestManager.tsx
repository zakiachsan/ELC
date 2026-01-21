
import React, { useState, useMemo } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  BookOpen, Users, Plus, Pencil, Trash2, CheckCircle, Search, Mail, Smartphone, Calendar, Eye, X, MapPin, School, GraduationCap, FileText, User as UserIcon, Cake,
  Phone, Clock, MessageCircle, XCircle, Award, Mic, Loader2
} from 'lucide-react';
import { CEFRLevel } from '../../types';
import { usePlacementSubmissions, usePlacementQuestions, useOralTestSlots } from '../../hooks/usePlacement';

export const PlacementTestManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'oral' | 'questions'>('leads');
  const [isAddingQ, setIsAddingQ] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // Supabase Data Hooks
  const {
    submissions: results,
    loading: resultsLoading,
    deleteSubmission,
    completeOralTest,
    refetch: refetchSubmissions
  } = usePlacementSubmissions();

  const {
    questions,
    loading: questionsLoading,
    createQuestion,
    updateQuestion,
    toggleActive,
    deleteQuestion,
    refetch: refetchQuestions
  } = usePlacementQuestions();

  const {
    slots: rawSlots,
    loading: slotsLoading,
    createSlots,
    deleteSlot,
    refetch: refetchSlots
  } = useOralTestSlots();

  // Group slots by date for display (only show available/unbooked slots)
  const slots = useMemo(() => {
    const grouped: Record<string, { id: string; date: string; day: string; times: string[] }> = {};
    // Filter only unbooked slots for available slots display
    rawSlots.filter(slot => !slot.is_booked).forEach(slot => {
      if (!grouped[slot.date]) {
        const dayName = new Date(slot.date).toLocaleDateString('id-ID', { weekday: 'long' });
        grouped[slot.date] = { id: slot.id, date: slot.date, day: dayName, times: [] };
      }
      grouped[slot.date].times.push(slot.time);
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [rawSlots]);

  // Oral Test State
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTimes, setNewSlotTimes] = useState<string[]>([]);

  // Oral Score Modal
  const [scoringLead, setScoringLead] = useState<any | null>(null);
  const [selectedOralScore, setSelectedOralScore] = useState<CEFRLevel | ''>('');

  // Question Edit/Delete State
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionOptions, setEditQuestionOptions] = useState<string[]>(['', '', '', '']);
  const [editQuestionCorrect, setEditQuestionCorrect] = useState(0);
  const [editQuestionWeight, setEditQuestionWeight] = useState(1);
  const [deletingQuestion, setDeletingQuestion] = useState<any | null>(null);

  // New Question State
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(['', '', '', '']);
  const [newQuestionCorrect, setNewQuestionCorrect] = useState(0);
  const [newQuestionWeight, setNewQuestionWeight] = useState(1);

  const filteredResults = results.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get oral test bookings (leads with booked status) - using snake_case from Supabase
  const oralBookings = results.filter(r => r.oral_test_status === 'booked' || r.oral_test_status === 'completed');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format time without seconds (HH:MM:SS -> HH:MM)
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    return timeStr.slice(0, 5);
  };

  const getDayName = (dateStr: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date(dateStr).getDay()];
  };

  const handleAddSlot = () => {
    setEditingSlot(null);
    setNewSlotDate('');
    setNewSlotTimes([]);
    setShowSlotModal(true);
  };

  const handleEditSlot = (slot: any) => {
    setEditingSlot(slot);
    setNewSlotDate(slot.date);
    setNewSlotTimes([...slot.times]);
    setShowSlotModal(true);
  };

  const handleDeleteSlot = async (date: string) => {
    if (window.confirm('Hapus slot ini?')) {
      // Delete all slots for this date
      const slotsToDelete = rawSlots.filter(s => s.date === date);
      for (const slot of slotsToDelete) {
        await deleteSlot(slot.id);
      }
      refetchSlots();
    }
  };

  const handleSaveSlot = async () => {
    if (!newSlotDate || newSlotTimes.length === 0) {
      alert('Pilih tanggal dan minimal 1 waktu!');
      return;
    }

    // Create slots in Supabase
    const slotsToCreate = newSlotTimes.map(time => ({
      date: newSlotDate,
      time: time,
      is_booked: false,
    }));

    try {
      await createSlots(slotsToCreate);
      refetchSlots();
    } catch (err) {
      console.error('Error creating slots:', err);
      alert('Gagal menyimpan slot. Silakan coba lagi.');
      return;
    }
    setShowSlotModal(false);
  };

  const toggleTime = (time: string) => {
    if (newSlotTimes.includes(time)) {
      setNewSlotTimes(newSlotTimes.filter(t => t !== time));
    } else {
      setNewSlotTimes([...newSlotTimes, time]);
    }
  };

  const handleMarkOralDone = (lead: any) => {
    setScoringLead(lead);
    setSelectedOralScore('');
  };

  const handleSaveOralScore = async () => {
    if (!scoringLead || !selectedOralScore) return;
    try {
      await completeOralTest(scoringLead.id, selectedOralScore);
      refetchSubmissions();
    } catch (err) {
      console.error('Error saving oral score:', err);
      alert('Gagal menyimpan skor oral test.');
      return;
    }
    setScoringLead(null);
    setSelectedOralScore('');
  };

  const handleWhatsAppReminder = (lead: any) => {
    const cefrResult = lead.cefr_result || '';
    const message = encodeURIComponent(
      `Halo ${lead.name}!\n\n` +
      `Reminder Oral Test:\n` +
      `📅 ${formatDate(lead.oral_test_date)}\n` +
      `⏰ ${formatTime(lead.oral_test_time)} WIB\n` +
      `📊 Written CEFR: ${cefrResult.split(' - ')[0]}\n\n` +
      `Tim ELC`
    );
    const wa = lead.parent_wa || lead.personal_wa || lead.wa;
    window.open(`https://wa.me/${wa?.replace(/\D/g,'') || ''}?text=${message}`, '_blank');
  };

  const getOralStatusBadge = (status?: string) => {
    if (status === 'completed') return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-green-100 text-green-700">Done</span>;
    if (status === 'booked') return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-yellow-100 text-yellow-700">Booked</span>;
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-gray-100 text-gray-500">None</span>;
  };

  const availableTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const cefrLevels = Object.values(CEFRLevel);

  // Question Edit/Delete Handlers
  const handleEditQuestion = (q: any) => {
    setEditingQuestion(q);
    setEditQuestionText(q.text);
    setEditQuestionOptions([...q.options]);
    setEditQuestionCorrect(q.correct_answer_index);
    setEditQuestionWeight(q.weight || 1);
  };

  const handleSaveEditQuestion = async () => {
    if (!editingQuestion) return;
    try {
      await updateQuestion(editingQuestion.id, {
        text: editQuestionText,
        options: editQuestionOptions,
        correct_answer_index: editQuestionCorrect,
        weight: editQuestionWeight,
      });
      setEditingQuestion(null);
      refetchQuestions();
    } catch (err) {
      console.error('Error updating question:', err);
      alert('Gagal menyimpan perubahan.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuestion) return;
    try {
      await deleteQuestion(deletingQuestion.id);
      setDeletingQuestion(null);
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Gagal menghapus pertanyaan.');
    }
  };

  const handleSaveNewQuestion = async () => {
    // Validation
    if (!newQuestionText.trim()) {
      alert('Pertanyaan tidak boleh kosong!');
      return;
    }
    const filledOptions = newQuestionOptions.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      alert('Minimal 2 pilihan jawaban harus diisi!');
      return;
    }
    if (!newQuestionOptions[newQuestionCorrect]?.trim()) {
      alert('Pilih jawaban yang benar!');
      return;
    }

    try {
      await createQuestion({
        text: newQuestionText.trim(),
        options: newQuestionOptions,
        correct_answer_index: newQuestionCorrect,
        weight: newQuestionWeight,
        is_active: true,
      });
      // Reset form
      setNewQuestionText('');
      setNewQuestionOptions(['', '', '', '']);
      setNewQuestionCorrect(0);
      setNewQuestionWeight(1);
      setIsAddingQ(false);
      refetchQuestions();
    } catch (err) {
      console.error('Error creating question:', err);
      alert('Gagal menyimpan pertanyaan.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" /> CEFR Placement Center
          </h2>
          <p className="text-xs text-gray-500">Manage written test, oral test, and student leads.</p>
        </div>
        <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
           <button
             onClick={() => setActiveTab('leads')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${activeTab === 'leads' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Student Leads
           </button>
           <button
             onClick={() => setActiveTab('oral')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${activeTab === 'oral' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Oral Test
           </button>
           <button
             onClick={() => setActiveTab('questions')}
             className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${activeTab === 'questions' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Questions
           </button>
        </div>
      </div>

      {/* STUDENT LEADS TAB */}
      {activeTab === 'leads' && (
        <div className="space-y-3">
           <div className="flex gap-3">
              <div className="flex-1 relative">
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                 <input
                   type="text"
                   placeholder="Search leads by name or email..."
                   className="w-full pl-8 pr-3 py-1.5 border rounded-lg shadow-sm outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>

           <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left text-xs">
                 <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                       <th className="px-3 py-2">Participant</th>
                       <th className="px-3 py-2">Grade</th>
                       <th className="px-3 py-2">Written</th>
                       <th className="px-3 py-2">Oral</th>
                       <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {filteredResults.map(res => (
                       <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2">
                             <div className="font-bold text-xs text-gray-900">{res.name}</div>
                             <div className="flex items-center gap-1 text-[9px] text-gray-400"><Mail className="w-2.5 h-2.5" /> {res.email}</div>
                          </td>
                          <td className="px-3 py-2">
                             <div className="text-xs text-gray-700">{res.grade}</div>
                          </td>
                          <td className="px-3 py-2">
                             <div className="inline-flex items-center gap-2 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">
                                <span className="font-black text-xs text-teal-700">{res.score}%</span>
                                <span className="text-teal-300">|</span>
                                <span className="text-[9px] font-bold text-teal-600">{(res.cefr_result || '').split(' - ')[0]}</span>
                             </div>
                          </td>
                          <td className="px-3 py-2">
                             {res.oral_test_score ? (
                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-[9px] font-bold border border-green-100">
                                   {res.oral_test_score.split(' - ')[0]}
                                </span>
                             ) : res.oral_test_status === 'booked' ? (
                                <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-[9px] font-bold border border-yellow-100">Booked</span>
                             ) : (
                                <span className="text-[10px] text-gray-400">—</span>
                             )}
                          </td>
                          <td className="px-3 py-2 text-right">
                             <button
                                onClick={() => setSelectedLead(res)}
                                className="flex items-center gap-1.5 ml-auto bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                             >
                                <Eye className="w-3 h-3" /> Detail
                             </button>
                          </td>
                       </tr>
                    ))}
                    {resultsLoading ? (
                       <tr><td colSpan={5} className="px-3 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-teal-600 mx-auto" /></td></tr>
                    ) : filteredResults.length === 0 ? (
                       <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400 italic text-xs">No leads found.</td></tr>
                    ) : null}
                 </tbody>
              </table>
           </Card>
        </div>
      )}

      {/* ORAL TEST TAB */}
      {activeTab === 'oral' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="!p-3 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
              <p className="text-[9px] font-bold text-yellow-600 uppercase">Booked</p>
              <p className="text-xl font-bold text-yellow-900">{results.filter(r => r.oral_test_status === 'booked').length}</p>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <p className="text-[9px] font-bold text-green-600 uppercase">Done</p>
              <p className="text-xl font-bold text-green-900">{results.filter(r => r.oral_test_status === 'completed').length}</p>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100">
              <p className="text-[9px] font-bold text-gray-600 uppercase">No Booking</p>
              <p className="text-xl font-bold text-gray-900">{results.filter(r => !r.oral_test_status || r.oral_test_status === 'none').length}</p>
            </Card>
            <Card className="!p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
              <p className="text-[9px] font-bold text-purple-600 uppercase">Slots</p>
              <p className="text-xl font-bold text-purple-900">{slots.reduce((sum, s) => sum + s.times.length, 0)}</p>
            </Card>
          </div>

          {/* Sub Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button className="px-3 py-1.5 text-xs font-bold border-b-2 border-teal-600 text-teal-600">Booking List</button>
            <button onClick={handleAddSlot} className="px-3 py-1.5 text-xs font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Manage Slots
            </button>
          </div>

          {/* Bookings Table */}
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Written CEFR</th>
                  <th className="px-4 py-2.5">Schedule</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Oral Score</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {oralBookings.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{lead.name}</div>
                          <div className="text-[10px] text-gray-400">{lead.wa}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-100">
                        {(lead.cefr_result || '').split(' - ')[0]}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 text-xs text-gray-700">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(lead.oral_test_date)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock className="w-2.5 h-2.5 text-gray-400" />
                        {formatTime(lead.oral_test_time)} WIB
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {getOralStatusBadge(lead.oral_test_status)}
                    </td>
                    <td className="px-4 py-2">
                      {lead.oral_test_score ? (
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold border border-green-100">
                          {lead.oral_test_score.split(' - ')[0]}
                        </span>
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">Not scored</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        {lead.oral_test_status === 'booked' && (
                          <button
                            onClick={() => handleMarkOralDone(lead)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-all"
                            title="Input Score & Mark Done"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {lead.oral_test_status === 'completed' && !lead.oral_test_score && (
                          <button
                            onClick={() => handleMarkOralDone(lead)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-all"
                            title="Input Score"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleWhatsAppReminder(lead)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-all"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {oralBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Phone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Belum ada booking oral test.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Slots Cards */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Available Slots</h3>
              <Button onClick={handleAddSlot} className="text-[10px] py-1 px-2 h-auto">
                Add Slot
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {slots.map(slot => (
                <Card key={slot.id} className="!p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{slot.day}</p>
                      <p className="text-[10px] text-gray-500">{formatDate(slot.date)}</p>
                    </div>
                    <div className="flex gap-0.5">
                      <button onClick={() => handleEditSlot(slot)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => handleDeleteSlot(slot.date)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {slot.times.map(time => (
                      <span key={time} className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] font-medium rounded">{formatTime(time)}</span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QUESTIONS TAB */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
           <div className="flex justify-end">
              <Button onClick={() => setIsAddingQ(true)} className="text-xs px-3 py-1.5 h-auto">
                 <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Question
              </Button>
           </div>

           {isAddingQ && (
              <Card className="!p-4 animate-in slide-in-from-top-4 duration-300">
                 <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">New Placement Question</h3>
                 <div className="space-y-3">
                    <textarea
                      className="w-full border rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                      rows={2}
                      placeholder="Type the question text here..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                       {[0, 1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-2">
                             <input
                               type="radio"
                               name="newCorrect"
                               className="w-3 h-3 text-teal-600"
                               checked={newQuestionCorrect === i}
                               onChange={() => setNewQuestionCorrect(i)}
                             />
                             <input
                               type="text"
                               className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                               placeholder={`Option ${String.fromCharCode(65+i)}`}
                               value={newQuestionOptions[i]}
                               onChange={(e) => {
                                 const updated = [...newQuestionOptions];
                                 updated[i] = e.target.value;
                                 setNewQuestionOptions(updated);
                               }}
                             />
                          </div>
                       ))}
                    </div>
                    <div className="flex items-center gap-3">
                       <label className="text-[9px] font-black text-gray-400 uppercase">Weight:</label>
                       <input
                         type="number"
                         min={1}
                         max={10}
                         className="w-16 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                         value={newQuestionWeight}
                         onChange={(e) => setNewQuestionWeight(Number(e.target.value))}
                       />
                       <span className="text-[10px] text-gray-400">pts</span>
                    </div>
                    <div className="flex justify-end gap-2 pt-3">
                       <Button variant="outline" onClick={() => setIsAddingQ(false)} className="text-xs px-3 py-1.5 h-auto">Cancel</Button>
                       <Button onClick={handleSaveNewQuestion} className="text-xs px-3 py-1.5 h-auto">Save Question</Button>
                    </div>
                 </div>
              </Card>
           )}

           <div className="space-y-3">
              {questions.map((q, idx) => (
                 <Card key={q.id} className="relative group !p-3">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleEditQuestion(q)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                       <button onClick={() => setDeletingQuestion(q)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-start gap-2">
                          <span className="bg-gray-100 text-gray-500 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0">{idx+1}</span>
                          <p className="font-bold text-xs text-gray-900">{q.text}</p>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-7">
                          {q.options.map((opt, oIdx) => (
                             <div key={oIdx} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border ${oIdx === q.correct_answer_index ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-100 text-gray-500'}`}>
                                {String.fromCharCode(65+oIdx)}. {opt}
                             </div>
                          ))}
                       </div>
                       <div className="pl-7">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">CEFR Weight: {q.weight} pts</span>
                       </div>
                    </div>
                 </Card>
              ))}
           </div>
        </div>
      )}

      {/* LEAD DETAIL MODAL */}
      {selectedLead && (
         <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative border border-gray-100 flex flex-col max-h-[90vh]">
               <div className="absolute top-3 right-3 z-10">
                  <button onClick={() => setSelectedLead(null)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                     <X className="w-4 h-4" />
                  </button>
               </div>

               <div className="p-5 overflow-y-auto space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 theme-bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-white shrink-0">
                        {selectedLead.name.charAt(0)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="text-base font-black text-gray-900 leading-tight truncate">{selectedLead.name}</h3>
                        <p className="text-gray-400 font-bold uppercase text-[8px] tracking-widest mt-0.5">CEFR Test Participant</p>
                     </div>
                  </div>

                  {/* Score Cards - Both Written & Oral */}
                  <div className="grid grid-cols-2 gap-2">
                     <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100 text-center">
                        <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest flex items-center justify-center gap-1"><FileText className="w-3 h-3" /> Written Test</p>
                        <p className="text-lg font-black text-teal-900">{selectedLead.score}%</p>
                        <p className="text-[10px] font-bold text-teal-700">{(selectedLead.cefr_result || '').split(' - ')[0]}</p>
                     </div>
                     <div className={`p-2.5 rounded-xl border text-center ${selectedLead.oral_test_score ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 ${selectedLead.oral_test_score ? 'text-green-600' : 'text-gray-400'}`}>
                          <Mic className="w-3 h-3" /> Oral Test
                        </p>
                        {selectedLead.oral_test_score ? (
                          <>
                            <p className="text-lg font-black text-green-900">{selectedLead.oral_test_score.split(' - ')[0]}</p>
                            <p className="text-[10px] font-bold text-green-700">{selectedLead.oral_test_score.split(' - ')[1]}</p>
                          </>
                        ) : selectedLead.oral_test_status === 'booked' ? (
                          <>
                            <p className="text-sm font-bold text-yellow-600">Booked</p>
                            <p className="text-[9px] text-gray-500">{formatDate(selectedLead.oral_test_date)} {formatTime(selectedLead.oral_test_time)}</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-gray-400">Not Taken</p>
                        )}
                     </div>
                  </div>

                  {/* Student Info */}
                  <div className="space-y-2">
                     <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Data Siswa</h4>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                           <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                           <div className="min-w-0">
                              <p className="text-[8px] text-gray-400 uppercase font-bold">Email</p>
                              <p className="text-[10px] font-bold text-gray-800 truncate">{selectedLead.email}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                           <Smartphone className="w-3.5 h-3.5 text-green-500 shrink-0" />
                           <div className="min-w-0">
                              <p className="text-[8px] text-gray-400 uppercase font-bold">WhatsApp</p>
                              <p className="text-[10px] font-bold text-gray-800">{selectedLead.personal_wa || selectedLead.wa}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                           <Cake className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                           <div className="min-w-0">
                              <p className="text-[8px] text-gray-400 uppercase font-bold">Tanggal Lahir</p>
                              <p className="text-[10px] font-bold text-gray-800">{formatDate(selectedLead.dob)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                           <GraduationCap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                           <div className="min-w-0">
                              <p className="text-[8px] text-gray-400 uppercase font-bold">Kelas</p>
                              <p className="text-[10px] font-bold text-gray-800">{selectedLead.grade}</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <School className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                           <p className="text-[8px] text-gray-400 uppercase font-bold">Asal Sekolah</p>
                           <p className="text-[10px] font-bold text-gray-800">{selectedLead.school_origin || '-'}</p>
                        </div>
                     </div>
                  </div>

                  {/* Parent Info */}
                  <div className="space-y-2">
                     <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Data Orang Tua</h4>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-100">
                           <UserIcon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                           <div className="min-w-0">
                              <p className="text-[8px] text-orange-500 uppercase font-bold">Nama Ortu</p>
                              <p className="text-[10px] font-bold text-gray-800">{selectedLead.parent_name || '-'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-100">
                           <Smartphone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                           <div className="min-w-0">
                              <p className="text-[8px] text-orange-500 uppercase font-bold">WA Ortu</p>
                              <p className="text-[10px] font-bold text-gray-800">{selectedLead.parent_wa || '-'}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                     <Button
                        onClick={() => {
                           const wa = selectedLead.parent_wa || selectedLead.personal_wa || selectedLead.wa;
                           const cefrResult = selectedLead.cefr_result || '';
                           const msg = `Halo, kami dari ELC ingin mendiskusikan hasil CEFR Test ${selectedLead.name}.\n\nWritten: ${cefrResult}${selectedLead.oral_test_score ? `\nOral: ${selectedLead.oral_test_score}` : ''}`;
                           window.open(`https://wa.me/${wa?.replace(/\D/g,'') || ''}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white h-9 rounded-lg flex items-center justify-center gap-2 font-black uppercase text-[10px]"
                     >
                        <Smartphone className="w-3.5 h-3.5" /> WhatsApp Follow Up
                     </Button>
                     <Button variant="outline" onClick={() => setSelectedLead(null)} className="h-8 rounded-lg font-bold text-[10px] uppercase">
                        Close
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* ORAL SCORE INPUT MODAL */}
      {scoringLead && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm !p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" /> Input Oral Test Score
              </h3>
              <button onClick={() => setScoringLead(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-bold text-gray-900">{scoringLead.name}</p>
              <p className="text-[10px] text-gray-500">Written: {(scoringLead.cefr_result || '').split(' - ')[0]} ({scoringLead.score}%)</p>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Oral CEFR Level</label>
              <div className="grid grid-cols-2 gap-2">
                {cefrLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedOralScore(level)}
                    className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                      selectedOralScore === level
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {level.split(' - ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setScoringLead(null)}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <Button
                onClick={handleSaveOralScore}
                disabled={!selectedOralScore}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs py-2"
              >
                Save Score
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* SLOT MODAL */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm !p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">{editingSlot ? 'Edit Slot' : 'Add New Slot'}</h3>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase">Select Date</label>
              <input
                type="date"
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase">Select Times</label>
              <div className="flex flex-wrap gap-1.5">
                {availableTimes.map(time => (
                  <button
                    key={time}
                    onClick={() => toggleTime(time)}
                    className={`px-2.5 py-1.5 text-[10px] font-medium rounded border transition-all ${
                      newSlotTimes.includes(time)
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowSlotModal(false)} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <Button onClick={handleSaveSlot} className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs py-1.5">
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* EDIT QUESTION MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg !p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-teal-600" /> Edit Pertanyaan
              </h3>
              <button onClick={() => setEditingQuestion(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Pertanyaan</label>
                <textarea
                  className="w-full border rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  rows={2}
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  placeholder="Ketik pertanyaan..."
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pilihan Jawaban</label>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="editCorrect"
                        checked={editQuestionCorrect === i}
                        onChange={() => setEditQuestionCorrect(i)}
                        className="w-3 h-3 text-teal-600"
                      />
                      <input
                        type="text"
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        value={editQuestionOptions[i]}
                        onChange={(e) => {
                          const newOptions = [...editQuestionOptions];
                          newOptions[i] = e.target.value;
                          setEditQuestionOptions(newOptions);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">CEFR Weight (pts)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="w-24 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  value={editQuestionWeight}
                  onChange={(e) => setEditQuestionWeight(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingQuestion(null)}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <Button
                onClick={handleSaveEditQuestion}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs py-2"
              >
                Simpan Perubahan
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm !p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Hapus Pertanyaan?</h3>
                <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-700 line-clamp-2">{deletingQuestion.text}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDeletingQuestion(null)}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-xs py-2"
              >
                Ya, Hapus
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
