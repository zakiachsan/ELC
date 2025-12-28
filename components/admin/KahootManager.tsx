
import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  Gamepad2, Plus, Pencil, Trash2, Play, ChevronLeft, Save,
  Brain, Clock, CheckCircle, XCircle, GripVertical, Copy, Eye,
  Users, X, Trophy, Target, Calendar
} from 'lucide-react';

// Types
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

interface KahootQuiz {
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

// Mock initial data
const INITIAL_QUIZZES: KahootQuiz[] = [
  {
    id: 'quiz-grammar-101',
    title: 'English Grammar Challenge',
    description: 'Test your grammar skills with 5 quick questions!',
    createdBy: 'ELC Team',
    isActive: true,
    totalPlays: 156,
    createdAt: '2024-12-01',
    participants: [
      { id: 'p1', name: 'Budi Santoso', email: 'budi@gmail.com', score: 100, correctAnswers: 5, totalQuestions: 5, completedAt: '2024-12-20 14:30' },
      { id: 'p2', name: 'Siska Putri', email: 'siska@yahoo.com', score: 80, correctAnswers: 4, totalQuestions: 5, completedAt: '2024-12-20 15:45' },
      { id: 'p3', name: 'Andi Wijaya', email: 'andi.w@gmail.com', score: 60, correctAnswers: 3, totalQuestions: 5, completedAt: '2024-12-21 09:15' },
      { id: 'p4', name: 'Maya Sari', email: 'maya.sari@gmail.com', score: 80, correctAnswers: 4, totalQuestions: 5, completedAt: '2024-12-21 10:00' },
      { id: 'p5', name: 'Reza Pratama', email: 'reza.p@gmail.com', score: 40, correctAnswers: 2, totalQuestions: 5, completedAt: '2024-12-22 11:30' },
    ],
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

export const KahootManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<KahootQuiz[]>(INITIAL_QUIZZES);
  const [view, setView] = useState<'list' | 'editor' | 'preview'>('list');
  const [editingQuiz, setEditingQuiz] = useState<KahootQuiz | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<KahootQuiz | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [viewingParticipants, setViewingParticipants] = useState<KahootQuiz | null>(null);

  const handleCreate = () => {
    const newQuiz: KahootQuiz = {
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

  const handleEdit = (quiz: KahootQuiz) => {
    setEditingQuiz({ ...quiz, questions: [...quiz.questions] });
    setView('editor');
  };

  const handlePreview = (quiz: KahootQuiz) => {
    setPreviewQuiz(quiz);
    setPreviewIndex(0);
    setView('preview');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus quiz ini? Tindakan ini tidak dapat dibatalkan.')) {
      setQuizzes(quizzes.filter(q => q.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    const targetQuiz = quizzes.find(q => q.id === id);
    if (!targetQuiz) return;

    // If activating, deactivate all others first
    if (!targetQuiz.isActive) {
      setQuizzes(quizzes.map(q =>
        q.id === id ? { ...q, isActive: true } : { ...q, isActive: false }
      ));
    } else {
      // If deactivating, just toggle off
      setQuizzes(quizzes.map(q =>
        q.id === id ? { ...q, isActive: false } : q
      ));
    }
  };

  const handleSave = () => {
    if (!editingQuiz) return;

    if (!editingQuiz.title.trim()) {
      alert('Judul quiz tidak boleh kosong!');
      return;
    }

    if (editingQuiz.questions.length === 0) {
      alert('Quiz harus memiliki minimal 1 pertanyaan!');
      return;
    }

    const existingIndex = quizzes.findIndex(q => q.id === editingQuiz.id);
    if (existingIndex >= 0) {
      setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? editingQuiz : q));
    } else {
      setQuizzes([editingQuiz, ...quizzes]);
    }
    setView('list');
    setEditingQuiz(null);
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
            <Button onClick={handleSave} className="text-xs py-1 px-3">
              Simpan
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
          <p className="text-xs text-gray-500">Kelola quiz interaktif untuk siswa.</p>
        </div>
        <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700 text-xs py-1.5 px-3">
          Buat Quiz
        </Button>
      </div>

      {/* Stats */}
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

      {/* Quiz List */}
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
                    onClick={() => setViewingParticipants(quiz)}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-all"
                  >
                    <Users className="w-3 h-3" />
                    <span>{quiz.participants?.length || 0}</span>
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

      {/* Participants Modal */}
      {viewingParticipants && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Participants: {viewingParticipants.title}
                </h3>
                <p className="text-[10px] text-gray-500">{viewingParticipants.participants?.length || 0} peserta telah mengikuti quiz ini</p>
              </div>
              <button
                onClick={() => setViewingParticipants(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100">
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-[9px] font-bold text-purple-600 uppercase">Total Peserta</p>
                <p className="text-lg font-bold text-purple-900">{viewingParticipants.participants?.length || 0}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-[9px] font-bold text-green-600 uppercase">Rata-rata Skor</p>
                <p className="text-lg font-bold text-green-900">
                  {viewingParticipants.participants && viewingParticipants.participants.length > 0
                    ? Math.round(viewingParticipants.participants.reduce((sum, p) => sum + p.score, 0) / viewingParticipants.participants.length)
                    : 0}%
                </p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-xl">
                <p className="text-[9px] font-bold text-yellow-600 uppercase">Skor Tertinggi</p>
                <p className="text-lg font-bold text-yellow-900">
                  {viewingParticipants.participants && viewingParticipants.participants.length > 0
                    ? Math.max(...viewingParticipants.participants.map(p => p.score))
                    : 0}%
                </p>
              </div>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto p-4">
              {(!viewingParticipants.participants || viewingParticipants.participants.length === 0) ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Belum ada peserta yang mengikuti quiz ini.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {viewingParticipants.participants
                    .sort((a, b) => b.score - a.score)
                    .map((participant, index) => (
                      <div key={participant.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
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
                          <p className="text-[10px] text-gray-500 truncate">{participant.email}</p>
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 justify-end">
                            <Target className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-500">{participant.correctAnswers}/{participant.totalQuestions}</span>
                          </div>
                          <p className={`text-sm font-bold ${
                            participant.score >= 80 ? 'text-green-600' :
                            participant.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {participant.score}%
                          </p>
                        </div>

                        {/* Time */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{participant.completedAt}</span>
                          </div>
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
