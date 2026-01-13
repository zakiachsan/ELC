
import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  Gamepad2, Plus, Pencil, Trash2, Play, ChevronLeft, Save,
  Brain, Clock, CheckCircle, XCircle, GripVertical, Copy, Eye,
  Users, X, Trophy, Target, Calendar, Loader2, Phone
} from 'lucide-react';
import { useKahootQuizzes } from '../../hooks/useOlympiads';
import { olympiadService } from '../../services/olympiad.service';
import type { Database } from '../../lib/database.types';

type DBKahootQuiz = Database['public']['Tables']['kahoot_quizzes']['Row'];
type DBKahootParticipant = Database['public']['Tables']['kahoot_participants']['Row'];

// Types for UI
interface KahootQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

interface QuizParticipant {
  id: string;
  name: string;
  email: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
}

interface UIKahootQuiz {
  id: string;
  title: string;
  description: string;
  questions: KahootQuestion[];
  createdBy: string;
  isActive: boolean;
  totalPlays: number;
  createdAt: string;
  participants?: QuizParticipant[];
}

// Helper to convert DB format to UI format
const dbToUI = (dbQuiz: DBKahootQuiz): UIKahootQuiz => ({
  id: dbQuiz.id,
  title: dbQuiz.title,
  description: dbQuiz.description || '',
  questions: (dbQuiz.questions as unknown as KahootQuestion[]) || [],
  createdBy: dbQuiz.created_by || 'Admin',
  isActive: dbQuiz.is_active,
  totalPlays: dbQuiz.play_count || 0,
  createdAt: dbQuiz.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
});

// Helper to convert UI format to DB format for insert/update
const uiToDB = (uiQuiz: UIKahootQuiz): Partial<DBKahootQuiz> => ({
  title: uiQuiz.title,
  description: uiQuiz.description || null,
  questions: uiQuiz.questions as any,
  created_by: uiQuiz.createdBy || null,
  is_active: uiQuiz.isActive,
});

export const KahootManager: React.FC = () => {
  const { quizzes: dbQuizzes, loading, error, createQuiz, updateQuiz, deleteQuiz, setActive, refetch } = useKahootQuizzes();

  // Convert DB quizzes to UI format (filter out any null values)
  const quizzes: UIKahootQuiz[] = dbQuizzes.filter(q => q !== null).map(dbToUI);
  const [view, setView] = useState<'list' | 'editor' | 'preview'>('list');
  const [editingQuiz, setEditingQuiz] = useState<UIKahootQuiz | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<UIKahootQuiz | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [viewingParticipants, setViewingParticipants] = useState<UIKahootQuiz | null>(null);
  const [participants, setParticipants] = useState<DBKahootParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantView, setParticipantView] = useState<'today' | 'overall'>('today');

  // Filter participants for today
  const today = new Date().toISOString().split('T')[0];
  const todayParticipants = participants.filter(p => p.completed_at.split('T')[0] === today);
  const displayedParticipants = participantView === 'today' ? todayParticipants : participants;

  // Fetch participants when modal opens
  const handleViewParticipants = async (quiz: UIKahootQuiz) => {
    setViewingParticipants(quiz);
    setLoadingParticipants(true);
    setParticipantView('today'); // Reset to today view when opening
    try {
      const data = await olympiadService.getKahootParticipants(quiz.id);
      setParticipants(data || []);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleCreate = () => {
    const newQuiz: UIKahootQuiz = {
      id: `quiz-${Date.now()}`,
      title: '',
      description: '',
      questions: [],
      createdBy: 'Admin',
      isActive: false,
      totalPlays: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setEditingQuiz(newQuiz);
    setView('editor');
  };

  const handleEdit = (quiz: UIKahootQuiz) => {
    setEditingQuiz({ ...quiz, questions: [...quiz.questions] });
    setView('editor');
  };

  const handlePreview = (quiz: UIKahootQuiz) => {
    setPreviewQuiz(quiz);
    setPreviewIndex(0);
    setView('preview');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus quiz ini? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        await deleteQuiz(id);
      } catch (err) {
        alert('Gagal menghapus quiz: ' + (err as Error).message);
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    const targetQuiz = quizzes.find(q => q.id === id);
    if (!targetQuiz) return;

    try {
      if (!targetQuiz.isActive) {
        // Activate this quiz (setActive will deactivate others)
        await setActive(id);
      } else {
        // Deactivate by setting is_active to false
        await updateQuiz(id, { is_active: false });
      }
    } catch (err) {
      alert('Gagal mengubah status quiz: ' + (err as Error).message);
    }
  };

  const handleSave = async () => {
    if (!editingQuiz) return;

    if (!editingQuiz.title.trim()) {
      alert('Judul quiz tidak boleh kosong!');
      return;
    }

    if (editingQuiz.questions.length === 0) {
      alert('Quiz harus memiliki minimal 1 pertanyaan!');
      return;
    }

    setSaving(true);
    try {
      const existingQuiz = dbQuizzes.find(q => q.id === editingQuiz.id);
      if (existingQuiz) {
        // Update existing quiz
        await updateQuiz(editingQuiz.id, uiToDB(editingQuiz));
      } else {
        // Create new quiz
        await createQuiz({
          title: editingQuiz.title,
          description: editingQuiz.description || null,
          questions: editingQuiz.questions as any,
          created_by: editingQuiz.createdBy || null,
          is_active: false,
        });
      }
      setView('list');
      setEditingQuiz(null);
    } catch (err) {
      alert('Gagal menyimpan quiz: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    if (!editingQuiz) return;
    const newQuestion: KahootQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      timeLimit: 15
    };
    setEditingQuiz({
      ...editingQuiz,
      questions: [...editingQuiz.questions, newQuestion]
    });
  };

  const handleUpdateQuestion = (index: number, field: keyof KahootQuestion, value: any) => {
    if (!editingQuiz) return;
    const updated = [...editingQuiz.questions];
    updated[index] = { ...updated[index], [field]: value };
    setEditingQuiz({ ...editingQuiz, questions: updated });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    if (!editingQuiz) return;
    const updated = [...editingQuiz.questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    setEditingQuiz({ ...editingQuiz, questions: updated });
  };

  const handleDeleteQuestion = (index: number) => {
    if (!editingQuiz) return;
    const updated = editingQuiz.questions.filter((_, i) => i !== index);
    setEditingQuiz({ ...editingQuiz, questions: updated });
  };

  const handleDuplicateQuestion = (index: number) => {
    if (!editingQuiz) return;
    const question = editingQuiz.questions[index];
    const duplicated: KahootQuestion = {
      ...question,
      id: `q-${Date.now()}`
    };
    const updated = [...editingQuiz.questions];
    updated.splice(index + 1, 0, duplicated);
    setEditingQuiz({ ...editingQuiz, questions: updated });
  };

  // Preview View
  if (view === 'preview' && previewQuiz) {
    const currentQ = previewQuiz.questions[previewIndex];
    const colors = [
      'from-red-500 to-red-600',
      'from-blue-500 to-blue-600',
      'from-yellow-500 to-yellow-600',
      'from-green-500 to-green-600'
    ];
    const shapes = ['▲', '◆', '●', '■'];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Preview: {previewQuiz.title}</h2>
            <p className="text-[10px] text-gray-500">Question {previewIndex + 1} of {previewQuiz.questions.length}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-xl p-6 min-h-[400px] flex flex-col">
          {/* Timer Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full w-full" />
          </div>

          {/* Question */}
          <div className="bg-white rounded-xl px-6 py-4 mb-4 text-center shadow-lg">
            <p className="text-[10px] text-gray-400 mb-1">Time: {currentQ.timeLimit}s</p>
            <h3 className="text-sm font-bold text-gray-900">{currentQ.question || '(No question text)'}</h3>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            {currentQ.options.map((opt, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-white flex items-center gap-2 bg-gradient-to-br ${colors[idx]} ${idx === currentQ.correctIndex ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-purple-900' : ''}`}
              >
                <span className="text-lg">{shapes[idx]}</span>
                <span className="text-xs font-medium">{opt || `(Option ${idx + 1})`}</span>
                {idx === currentQ.correctIndex && <CheckCircle className="w-4 h-4 ml-auto" />}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
              disabled={previewIndex === 0}
              className="px-3 py-1.5 text-xs bg-white/10 text-white rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPreviewIndex(Math.min(previewQuiz.questions.length - 1, previewIndex + 1))}
              disabled={previewIndex === previewQuiz.questions.length - 1}
              className="px-3 py-1.5 text-xs bg-white/10 text-white rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Editor View
  if (view === 'editor' && editingQuiz) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('list'); setEditingQuiz(null); }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-4 h-4" /> Kembali
            </button>
            <h2 className="text-sm font-bold text-gray-900">
              {quizzes.find(q => q.id === editingQuiz.id) ? 'Edit Quiz' : 'Buat Quiz Baru'}
            </h2>
          </div>
          <div className="flex gap-2">
            {editingQuiz.questions.length > 0 && (
              <Button variant="outline" onClick={() => handlePreview(editingQuiz)} className="text-xs py-1 px-3">
                Preview
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="text-xs py-1 px-3">
              {saving ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Menyimpan...</> : 'Simpan'}
            </Button>
          </div>
        </div>

        {/* Quiz Info */}
        <Card className="!p-4 space-y-3">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Info Quiz</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase">Judul Quiz</label>
              <input
                type="text"
                value={editingQuiz.title}
                onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="English Grammar Challenge"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase">Dibuat Oleh</label>
              <input
                type="text"
                value={editingQuiz.createdBy}
                onChange={(e) => setEditingQuiz({ ...editingQuiz, createdBy: e.target.value })}
                className="w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="ELC Team"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase">Deskripsi</label>
              <textarea
                value={editingQuiz.description}
                onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="Deskripsi singkat..."
              />
            </div>
          </div>
        </Card>

        {/* Questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Pertanyaan ({editingQuiz.questions.length})
            </h3>
            <Button variant="outline" onClick={handleAddQuestion} className="text-xs py-1 px-3">
              Tambah
            </Button>
          </div>

          {editingQuiz.questions.length === 0 ? (
            <Card className="!p-6 text-center">
              <Brain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Belum ada pertanyaan.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {editingQuiz.questions.map((q, qIndex) => (
                <Card key={q.id} className="!p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-6 h-6 bg-purple-100 text-purple-700 rounded flex items-center justify-center font-bold text-[10px]">
                        {qIndex + 1}
                      </div>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                        className="flex-1 border-b border-gray-200 py-1 text-xs font-medium focus:outline-none focus:border-blue-500"
                        placeholder="Tulis pertanyaan..."
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                        <Clock className="w-3 h-3" />
                        <input
                          type="number"
                          value={q.timeLimit}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'timeLimit', parseInt(e.target.value) || 10)}
                          className="w-8 border rounded px-1 py-0.5 text-center text-[10px]"
                          min={5}
                          max={60}
                        />
                        <span>s</span>
                      </div>
                      <button onClick={() => handleDuplicateQuestion(qIndex)} className="p-1 text-gray-400 hover:text-blue-600 rounded" title="Duplikat">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeleteQuestion(qIndex)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Hapus">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-2 pl-8">
                    {q.options.map((opt, optIndex) => {
                      const optColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
                      const shapes = ['▲', '◆', '●', '■'];
                      return (
                        <div key={optIndex} className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateQuestion(qIndex, 'correctIndex', optIndex)}
                            className={`w-6 h-6 rounded flex items-center justify-center text-white text-[10px] shrink-0 transition-all ${
                              q.correctIndex === optIndex
                                ? `${optColors[optIndex]} ring-1 ring-offset-1 ring-green-500`
                                : `${optColors[optIndex]} opacity-50 hover:opacity-75`
                            }`}
                            title={q.correctIndex === optIndex ? 'Jawaban benar' : 'Set sebagai jawaban benar'}
                          >
                            {shapes[optIndex]}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={`Opsi ${optIndex + 1}`}
                          />
                          {q.correctIndex === optIndex && (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-600" /> Live Quiz Manager
          </h2>
          <p className="text-xs text-gray-500">Kelola quiz interaktif untuk siswa. Data terintegrasi dengan homepage.</p>
        </div>
        <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700 text-xs py-1.5 px-3">
          Buat Quiz
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Memuat data quiz...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="!p-4 bg-red-50 border-red-200">
          <p className="text-xs text-red-600">Gagal memuat data: {error.message}</p>
          <Button variant="outline" onClick={() => refetch()} className="text-xs py-1 px-3 mt-2">
            Coba Lagi
          </Button>
        </Card>
      )}

      {/* Stats - only show when not loading */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="!p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
            <p className="text-[9px] font-bold text-purple-600 uppercase">Total Quiz</p>
            <p className="text-xl font-bold text-purple-900">{quizzes.length}</p>
          </Card>
          <Card className="!p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <p className="text-[9px] font-bold text-green-600 uppercase">Quiz Aktif</p>
            <p className="text-xl font-bold text-green-900">{quizzes.filter(q => q.isActive).length}</p>
          </Card>
          <Card className="!p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
            <p className="text-[9px] font-bold text-blue-600 uppercase">Total Plays</p>
            <p className="text-xl font-bold text-blue-900">{quizzes.reduce((sum, q) => sum + q.totalPlays, 0)}</p>
          </Card>
        </div>
      )}

      {/* Quiz List - only show when not loading */}
      {!loading && !error && (
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-2.5">Quiz</th>
              <th className="px-4 py-2.5">Soal</th>
              <th className="px-4 py-2.5">Plays</th>
              <th className="px-4 py-2.5">Participants</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quizzes.map(quiz => (
              <tr key={quiz.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded flex items-center justify-center">
                      <Brain className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{quiz.title}</div>
                      <div className="text-[10px] text-gray-400">by {quiz.createdBy}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-medium text-gray-700">{quiz.questions.length}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-medium text-gray-700">{quiz.totalPlays}</span>
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => handleViewParticipants(quiz)}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-all"
                  >
                    <Users className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => handleToggleActive(quiz.id)}
                    className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase transition-all ${
                      quiz.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {quiz.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right space-x-0.5">
                  <button onClick={() => handlePreview(quiz)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all" title="Preview">
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleEdit(quiz)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(quiz.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {quizzes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Gamepad2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Belum ada quiz.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      )}

      {/* Participants Modal */}
      {viewingParticipants && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    Participants: {viewingParticipants.title}
                  </h3>
                  <p className="text-[10px] text-gray-500">{participants.length} peserta telah mengikuti quiz ini</p>
                </div>
                <button
                  onClick={() => setViewingParticipants(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Tab Switcher */}
              <div className="flex gap-2">
                <button
                  onClick={() => setParticipantView('today')}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                    participantView === 'today'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Hari Ini ({todayParticipants.length})
                </button>
                <button
                  onClick={() => setParticipantView('overall')}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                    participantView === 'overall'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Semua ({participants.length})
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100">
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-[9px] font-bold text-purple-600 uppercase">Total Peserta</p>
                <p className="text-lg font-bold text-purple-900">{displayedParticipants.length}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-[9px] font-bold text-green-600 uppercase">Rata-rata Skor</p>
                <p className="text-lg font-bold text-green-900">
                  {displayedParticipants.length > 0
                    ? Math.round(displayedParticipants.reduce((sum, p) => sum + p.score, 0) / displayedParticipants.length)
                    : 0}
                </p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-xl">
                <p className="text-[9px] font-bold text-yellow-600 uppercase">Skor Tertinggi</p>
                <p className="text-lg font-bold text-yellow-900">
                  {displayedParticipants.length > 0
                    ? Math.max(...displayedParticipants.map(p => p.score))
                    : 0}
                </p>
              </div>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingParticipants ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Memuat data peserta...</span>
                </div>
              ) : displayedParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">
                    {participantView === 'today' 
                      ? 'Belum ada peserta yang mengikuti quiz hari ini.' 
                      : 'Belum ada peserta yang mengikuti quiz ini.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedParticipants
                    .sort((a, b) => b.score - a.score)
                    .map((participant, index) => (
                      <div key={participant.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          {/* Rank */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {index === 0 ? <Trophy className="w-3.5 h-3.5" /> : index + 1}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{participant.name}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                              {participant.position && (
                                <span className="text-[10px] text-purple-600 font-medium">{participant.position}</span>
                              )}
                              {participant.school && (
                                <span className="text-[10px] text-gray-500">{participant.school}</span>
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 justify-end">
                              <Target className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] text-gray-500">{participant.correct_answers}/{participant.total_questions}</span>
                            </div>
                            <p className={`text-sm font-bold ${
                              participant.score >= 80 ? 'text-green-600' :
                              participant.score >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {participant.score} pts
                            </p>
                          </div>

                          {/* Time Spent */}
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{participant.time_spent}s</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Additional Info Row */}
                        <div className="flex items-center gap-4 mt-2 pl-10 text-[10px] text-gray-400">
                          {participant.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {participant.phone}
                            </span>
                          )}
                          <span>
                            {new Date(participant.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
