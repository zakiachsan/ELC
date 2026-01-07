import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { testsService, TestSchedule, TestType } from '../../services/tests.service';
import {
  ArrowLeft, Loader2, FileText, Clock, Calendar, Download,
  Trash2, Edit, Users, CheckCircle, AlertCircle, Play, Eye
} from 'lucide-react';
import type { Database } from '../../lib/database.types';

type TestQuestion = Database['public']['Tables']['test_questions']['Row'];

const TEST_TYPE_LABELS: Record<TestType, string> = {
  'QUIZ': 'Quiz',
  'MID_SEMESTER': 'UTS (Mid Semester)',
  'FINAL_SEMESTER': 'UAS (Final Semester)',
};

const TEST_TYPE_COLORS: Record<TestType, string> = {
  'QUIZ': 'bg-blue-100 text-blue-700 border-blue-200',
  'MID_SEMESTER': 'bg-orange-100 text-orange-700 border-orange-200',
  'FINAL_SEMESTER': 'bg-purple-100 text-purple-700 border-purple-200',
};

export const TestDetail: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<TestSchedule | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (testId) {
      loadTestData();
    }
  }, [testId]);

  const loadTestData = async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);

    try {
      const [testData, questionsData] = await Promise.all([
        testsService.getById(testId),
        testsService.getQuestions(testId),
      ]);
      setTest(testData);
      setQuestions(questionsData);
    } catch (err) {
      console.error('Error loading test:', err);
      setError('Failed to load test details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!test || !confirm('Are you sure you want to delete this test schedule?')) return;

    setDeleting(true);
    try {
      await testsService.delete(test.id);
      alert('Test schedule deleted successfully.');
      navigate(-1);
    } catch (err) {
      console.error('Error deleting test:', err);
      alert('Failed to delete test schedule.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    if (test) {
      navigate(`/teacher/tests/edit/${test.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">Loading test details...</span>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">{error || 'Test not found'}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const testDate = new Date(test.date_time);
  const isUpcoming = testDate >= new Date();
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const mcCount = questions.filter(q => q.question_type === 'MULTIPLE_CHOICE').length;
  const essayCount = questions.filter(q => q.question_type === 'ESSAY').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Test Details</h1>
              <p className="text-xs text-gray-500">{test.location} - {test.class_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button onClick={handleEdit} className="text-xs">
              Edit Test
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Main Info Card */}
        <Card className="!p-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
              test.test_type === 'QUIZ' ? 'bg-blue-100' :
              test.test_type === 'MID_SEMESTER' ? 'bg-orange-100' : 'bg-purple-100'
            }`}>
              <FileText className={`w-7 h-7 ${
                test.test_type === 'QUIZ' ? 'text-blue-600' :
                test.test_type === 'MID_SEMESTER' ? 'text-orange-600' : 'text-purple-600'
              }`} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{test.title}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                {test.test_type === 'QUIZ' && test.quiz_number ? (
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">
                    Quiz {test.quiz_number}
                  </span>
                ) : (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${TEST_TYPE_COLORS[test.test_type]}`}>
                    {TEST_TYPE_LABELS[test.test_type]}
                  </span>
                )}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  isUpcoming ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isUpcoming ? 'Upcoming' : 'Completed'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Schedule Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Date</p>
                <p className="text-sm font-bold text-gray-900">
                  {testDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Time</p>
                <p className="text-sm font-bold text-gray-900">
                  {testDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Duration</p>
                <p className="text-sm font-bold text-gray-900">{test.duration_minutes} min</p>
              </div>
            </div>
          </Card>

          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Period</p>
                <p className="text-sm font-bold text-gray-900">
                  {test.academic_year} / Sem {test.semester}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Description */}
        {test.description && (
          <Card className="!p-4">
            <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Description</p>
            <p className="text-sm text-gray-700">{test.description}</p>
          </Card>
        )}

        {/* Materials */}
        {test.materials && test.materials.length > 0 && (
          <Card className="!p-4">
            <p className="text-[9px] font-bold text-gray-400 uppercase mb-3">
              Materials ({test.materials.length} file{test.materials.length > 1 ? 's' : ''})
            </p>
            <div className="space-y-2">
              {test.materials.map((file, idx) => {
                const fileName = file.split('/').pop() || file;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <FileText className="w-5 h-5 text-purple-500 shrink-0" />
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate flex-1"
                      title={fileName}
                    >
                      {fileName}
                    </a>
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Questions Summary */}
        {test.has_online_test && (
          <Card className="!p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-bold text-gray-400 uppercase">Online Test Questions</p>
              {questions.length > 0 && (
                <span className="text-xs text-gray-500">{totalPoints} total points</span>
              )}
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No questions added yet</p>
                <Button onClick={handleEdit} className="mt-3 text-xs">
                  Add Questions
                </Button>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                    <p className="text-[10px] text-gray-500">Total Questions</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{mcCount}</p>
                    <p className="text-[10px] text-blue-600">Multiple Choice</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{essayCount}</p>
                    <p className="text-[10px] text-green-600">Essay</p>
                  </div>
                </div>

                {/* Question List Preview */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {questions.slice(0, 5).map((q, idx) => (
                    <div key={q.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            q.question_type === 'MULTIPLE_CHOICE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {q.question_type === 'MULTIPLE_CHOICE' ? 'MC' : 'Essay'}
                          </span>
                          <span className="text-[10px] text-gray-400">{q.points} pts</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{q.question_text}</p>
                      </div>
                    </div>
                  ))}
                  {questions.length > 5 && (
                    <p className="text-center text-xs text-gray-400 py-2">
                      +{questions.length - 5} more questions
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>
        )}

        {/* Teacher Info */}
        {test.teacher && (
          <Card className="!p-4">
            <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Created By</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{test.teacher.name}</p>
                <p className="text-xs text-gray-500">{test.teacher.email}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestDetail;
