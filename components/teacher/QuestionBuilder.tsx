import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { testsService, ParsedQuestion, QuestionType } from '../../services/tests.service';
import type { Database } from '../../lib/database.types';
import {
  Plus, Trash2, X, Save, ArrowLeft, Upload, FileText,
  CheckCircle, Circle, GripVertical, Edit2, Eye, Import,
  Loader2, AlertCircle, HelpCircle
} from 'lucide-react';

type TestQuestion = Database['public']['Tables']['test_questions']['Row'];

interface QuestionBuilderProps {
  testScheduleId: string;
  testTitle: string;
  onClose: () => void;
  onSave?: () => void;
}

interface QuestionFormData {
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswerIndex: number | null;
  answerKey: string;
  points: number;
}

const defaultQuestionForm: QuestionFormData = {
  type: 'MULTIPLE_CHOICE',
  text: '',
  options: ['', '', '', ''],
  correctAnswerIndex: null,
  answerKey: '',
  points: 1,
};

export const QuestionBuilder: React.FC<QuestionBuilderProps> = ({
  testScheduleId,
  testTitle,
  onClose,
  onSave
}) => {
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormData>(defaultQuestionForm);

  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [importPreview, setImportPreview] = useState(false);

  // Load questions
  useEffect(() => {
    loadQuestions();
  }, [testScheduleId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await testsService.getQuestions(testScheduleId);
      setQuestions(data);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const updateFormField = (field: keyof QuestionFormData, value: any) => {
    setQuestionForm(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    if (questionForm.options.length < 6) {
      setQuestionForm(prev => ({ ...prev, options: [...prev.options, ''] }));
    }
  };

  const removeOption = (index: number) => {
    if (questionForm.options.length > 2) {
      const newOptions = questionForm.options.filter((_, i) => i !== index);
      let newCorrectIndex = questionForm.correctAnswerIndex;
      if (newCorrectIndex !== null) {
        if (newCorrectIndex === index) {
          newCorrectIndex = null;
        } else if (newCorrectIndex > index) {
          newCorrectIndex--;
        }
      }
      setQuestionForm(prev => ({ ...prev, options: newOptions, correctAnswerIndex: newCorrectIndex }));
    }
  };

  // Save question
  const handleSaveQuestion = async () => {
    if (!questionForm.text.trim()) {
      setError('Question text is required');
      return;
    }

    if (questionForm.type === 'MULTIPLE_CHOICE') {
      const filledOptions = questionForm.options.filter(o => o.trim());
      if (filledOptions.length < 2) {
        setError('At least 2 options are required');
        return;
      }
      if (questionForm.correctAnswerIndex === null) {
        setError('Please select the correct answer');
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const questionData = {
        test_schedule_id: testScheduleId,
        question_type: questionForm.type,
        question_text: questionForm.text.trim(),
        options: questionForm.type === 'MULTIPLE_CHOICE' ? questionForm.options.filter(o => o.trim()) : [],
        correct_answer_index: questionForm.type === 'MULTIPLE_CHOICE' ? questionForm.correctAnswerIndex : null,
        answer_key: questionForm.type === 'ESSAY' ? questionForm.answerKey.trim() : null,
        points: questionForm.points,
        question_order: editingQuestion ? editingQuestion.question_order : questions.length + 1,
      };

      if (editingQuestion) {
        await testsService.updateQuestion(editingQuestion.id, questionData);
      } else {
        await testsService.createQuestion(questionData);
      }

      await loadQuestions();
      resetForm();
      onSave?.();
    } catch (err) {
      console.error('Error saving question:', err);
      setError('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await testsService.deleteQuestion(questionId);
      await loadQuestions();
      onSave?.();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Failed to delete question');
    }
  };

  // Edit question
  const handleEditQuestion = (question: TestQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      type: question.question_type,
      text: question.question_text,
      options: question.options.length > 0 ? question.options : ['', '', '', ''],
      correctAnswerIndex: question.correct_answer_index,
      answerKey: question.answer_key || '',
      points: question.points,
    });
    setShowAddForm(true);
  };

  // Reset form
  const resetForm = () => {
    setShowAddForm(false);
    setEditingQuestion(null);
    setQuestionForm(defaultQuestionForm);
    setError(null);
  };

  // Import handling
  const handleParseImport = () => {
    if (!importText.trim()) {
      setError('Please paste your questions text');
      return;
    }

    const parsed = testsService.parseQuestionsFromText(importText);
    if (parsed.length === 0) {
      setError('No questions could be parsed. Please check the format.');
      return;
    }

    setParsedQuestions(parsed);
    setImportPreview(true);
    setError(null);
  };

  const handleConfirmImport = async () => {
    if (parsedQuestions.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      await testsService.importQuestions(testScheduleId, parsedQuestions);
      await loadQuestions();
      setShowImportModal(false);
      setImportText('');
      setParsedQuestions([]);
      setImportPreview(false);
      onSave?.();
    } catch (err) {
      console.error('Error importing questions:', err);
      setError('Failed to import questions');
    } finally {
      setSaving(false);
    }
  };

  const resetImport = () => {
    setImportText('');
    setParsedQuestions([]);
    setImportPreview(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">Loading questions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Question Builder</h2>
            <p className="text-xs text-gray-500">{testTitle} - {questions.length} questions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)} className="text-xs">
            <Import className="w-4 h-4 mr-1" /> Import from Docs
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="text-xs">
            <Plus className="w-4 h-4 mr-1" /> Add Question
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {questions.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Questions Yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Start building your test by adding questions manually or importing from Google Docs.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Import className="w-4 h-4 mr-2" /> Import from Docs
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {questions.map((q, index) => (
              <Card key={q.id} className="!p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      q.question_type === 'MULTIPLE_CHOICE'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {q.question_type === 'MULTIPLE_CHOICE' ? 'MC' : 'Essay'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 mb-2">{q.question_text}</p>
                    {q.question_type === 'MULTIPLE_CHOICE' && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-1">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                              optIndex === q.correct_answer_index
                                ? 'bg-green-100 text-green-700 font-medium'
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {optIndex === q.correct_answer_index ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <Circle className="w-3 h-3 text-gray-300" />
                            )}
                            <span className="font-bold">{String.fromCharCode(65 + optIndex)}.</span>
                            <span className="truncate">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.question_type === 'ESSAY' && q.answer_key && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        <span className="font-bold">Answer Key:</span> {q.answer_key}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">
                      {q.points} pts
                    </span>
                    <button
                      onClick={() => handleEditQuestion(q)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Question Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[110] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editingQuestion ? 'Edit Question' : 'Add Question'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Question Type */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">Question Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateFormField('type', 'MULTIPLE_CHOICE')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold border-2 transition-all ${
                      questionForm.type === 'MULTIPLE_CHOICE'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    onClick={() => updateFormField('type', 'ESSAY')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold border-2 transition-all ${
                      questionForm.type === 'ESSAY'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                    }`}
                  >
                    Essay
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Question Text *</label>
                <textarea
                  value={questionForm.text}
                  onChange={(e) => updateFormField('text', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter your question here..."
                />
              </div>

              {/* Multiple Choice Options */}
              {questionForm.type === 'MULTIPLE_CHOICE' && (
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">
                    Options (click to mark correct answer) *
                  </label>
                  <div className="space-y-2">
                    {questionForm.options.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateFormField('correctAnswerIndex', index)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                            questionForm.correctAnswerIndex === index
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        />
                        {questionForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {questionForm.options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Essay Answer Key */}
              {questionForm.type === 'ESSAY' && (
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                    Answer Key / Rubric (optional)
                  </label>
                  <textarea
                    value={questionForm.answerKey}
                    onChange={(e) => updateFormField('answerKey', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                    placeholder="Expected answer or grading rubric..."
                  />
                </div>
              )}

              {/* Points */}
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Points</label>
                <input
                  type="number"
                  value={questionForm.points}
                  onChange={(e) => updateFormField('points', parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min={1}
                  max={100}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuestion} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    {editingQuestion ? 'Update' : 'Save'} Question
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[110] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Import Questions from Docs</h3>
              <button onClick={() => { setShowImportModal(false); resetImport(); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {!importPreview ? (
                <div className="space-y-4">
                  {/* Format Guide */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">Supported Format:</h4>
                    <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-blue-200">
{`[PG] What is the capital of France?
A. London
B. Paris *
C. Berlin
D. Madrid

[ESSAY] Explain the importance of learning English.
KEY: English is important because...

[PG] Which word is a noun?
A. Run
B. Beautiful
C. Computer *
D. Quickly`}
                    </pre>
                    <p className="text-[10px] text-blue-700 mt-2">
                      Use [PG] or [MC] for Multiple Choice, [ESSAY] for Essay. Mark correct answer with * at the end.
                    </p>
                  </div>

                  {/* Text Input */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                      Paste your questions here
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={12}
                      placeholder="Paste your questions from Google Docs here..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900">
                      Preview: {parsedQuestions.length} questions found
                    </h4>
                    <button
                      onClick={() => setImportPreview(false)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Edit Text
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {parsedQuestions.map((q, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded flex items-center justify-center text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            q.type === 'MULTIPLE_CHOICE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {q.type === 'MULTIPLE_CHOICE' ? 'MC' : 'Essay'}
                          </span>
                          <p className="text-sm text-gray-900">{q.text}</p>
                        </div>
                        {q.type === 'MULTIPLE_CHOICE' && q.options && (
                          <div className="ml-8 grid grid-cols-2 gap-1">
                            {q.options.map((opt, optIndex) => (
                              <div
                                key={optIndex}
                                className={`text-xs px-2 py-1 rounded ${
                                  optIndex === q.correctAnswerIndex
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-white text-gray-600'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}. {opt}
                                {optIndex === q.correctAnswerIndex && ' ✓'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={() => { setShowImportModal(false); resetImport(); }}>
                Cancel
              </Button>
              {!importPreview ? (
                <Button onClick={handleParseImport} disabled={!importText.trim()}>
                  <Eye className="w-4 h-4 mr-1" /> Preview
                </Button>
              ) : (
                <Button onClick={handleConfirmImport} disabled={saving || parsedQuestions.length === 0}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-1" />
                      Import {parsedQuestions.length} Questions
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBuilder;
