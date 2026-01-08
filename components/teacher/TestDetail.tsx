import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { testsService, TestSchedule, TestType } from '../../services/tests.service';
import {
  ArrowLeft, Loader2, FileText, Clock, Calendar, Download,
  Trash2, Edit, Users, CheckCircle, AlertCircle, Play, Eye, X
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'info' | 'submissions'>('info');

  // Submissions state
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissionAnswers, setSubmissionAnswers] = useState<any[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [submissionScores, setSubmissionScores] = useState<Record<string, { mcScore: number; mcTotal: number; essayScore: number; essayTotal: number; essayGraded: number; essayCount: number }>>({});

  // Grading state
  const [gradingAnswerId, setGradingAnswerId] = useState<string | null>(null);
  const [essayScore, setEssayScore] = useState<string>('');
  const [essayFeedback, setEssayFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    if (testId) {
      loadTestData();
    }
  }, [testId]);

  // Load submissions when tab changes
  useEffect(() => {
    if (activeTab === 'submissions' && testId && submissions.length === 0) {
      loadSubmissions();
    }
  }, [activeTab, testId]);

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

  const loadSubmissions = async () => {
    if (!testId) return;
    setSubmissionsLoading(true);

    try {
      const data = await testsService.getSubmissions(testId);
      setSubmissions(data || []);
      
      // Load scores for each submission
      const scoresMap: Record<string, any> = {};
      await Promise.all((data || []).map(async (sub: any) => {
        try {
          const answers = await testsService.getAnswers(sub.id);
          scoresMap[sub.id] = calculateScoresFromAnswers(answers || []);
        } catch (err) {
          console.error('Error loading answers for submission:', sub.id, err);
        }
      }));
      setSubmissionScores(scoresMap);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };
  
  // Calculate scores from answers array (for submission list)
  const calculateScoresFromAnswers = (answers: any[]) => {
    let mcScore = 0;
    let mcTotal = 0;
    let essayScoreVal = 0;
    let essayTotal = 0;
    let essayGraded = 0;
    let essayCount = 0;

    answers.forEach(a => {
      if (a.question?.question_type === 'MULTIPLE_CHOICE') {
        mcTotal += a.question.points;
        if (a.is_correct) {
          mcScore += a.question.points;
        }
      } else if (a.question?.question_type === 'ESSAY') {
        essayTotal += a.question.points;
        essayCount++;
        if (a.score !== null && a.score !== undefined) {
          essayScoreVal += a.score;
          essayGraded++;
        }
      }
    });

    return { mcScore, mcTotal, essayScore: essayScoreVal, essayTotal, essayGraded, essayCount };
  };

  const loadSubmissionAnswers = async (submissionId: string) => {
    setLoadingAnswers(true);
    try {
      const answers = await testsService.getAnswers(submissionId);
      setSubmissionAnswers(answers || []);
    } catch (err) {
      console.error('Error loading answers:', err);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const handleSelectSubmission = async (submission: any) => {
    setSelectedSubmission(submission);
    await loadSubmissionAnswers(submission.id);
  };

  const handleStartGrading = (answer: any) => {
    setGradingAnswerId(answer.id);
    setEssayScore(answer.score?.toString() || '');
    setEssayFeedback(answer.teacher_feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!gradingAnswerId || essayScore === '') return;

    setSavingGrade(true);
    try {
      await testsService.gradeEssayAnswer(
        gradingAnswerId,
        parseFloat(essayScore),
        essayFeedback || undefined
      );
      
      // Update local state
      setSubmissionAnswers(prev => prev.map(a => 
        a.id === gradingAnswerId 
          ? { ...a, score: parseFloat(essayScore), teacher_feedback: essayFeedback }
          : a
      ));
      
      setGradingAnswerId(null);
      setEssayScore('');
      setEssayFeedback('');
      
      // Refresh submissions to update scores
      loadSubmissions();
    } catch (err) {
      console.error('Error saving grade:', err);
      alert('Failed to save grade');
    } finally {
      setSavingGrade(false);
    }
  };

  const handleDelete = async () => {
    if (!test) return;

    setDeleting(true);
    try {
      await testsService.delete(test.id);
      setShowDeleteModal(false);
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

  // Calculate scores for a submission
  const calculateScores = (answers: any[]) => {
    let mcScore = 0;
    let mcTotal = 0;
    let essayScoreVal = 0;
    let essayTotal = 0;
    let essayGraded = 0;
    let essayCount = 0;

    answers.forEach(a => {
      if (a.question?.question_type === 'MULTIPLE_CHOICE') {
        mcTotal += a.question.points;
        if (a.is_correct) {
          mcScore += a.question.points;
        }
      } else if (a.question?.question_type === 'ESSAY') {
        essayTotal += a.question.points;
        essayCount++;
        if (a.score !== null && a.score !== undefined) {
          essayScoreVal += a.score;
          essayGraded++;
        }
      }
    });

    return { mcScore, mcTotal, essayScore: essayScoreVal, essayTotal, essayGraded, essayCount };
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
  const essayCountVal = questions.filter(q => q.question_type === 'ESSAY').length;

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
              onClick={() => setShowDeleteModal(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
            >
              Delete
            </Button>
            <Button onClick={handleEdit} className="text-xs">
              Edit Test
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {test.has_online_test && (
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="max-w-4xl mx-auto flex gap-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Test Info
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'submissions'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Student Submissions
              {submissions.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                  {submissions.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {activeTab === 'info' ? (
          <>
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
                        <p className="text-2xl font-bold text-green-600">{essayCountVal}</p>
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
          </>
        ) : (
          /* Submissions Tab */
          <>
            {submissionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">Loading submissions...</span>
              </div>
            ) : submissions.length === 0 ? (
              <Card className="!p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Submissions Yet</h3>
                <p className="text-sm text-gray-500">Students haven't submitted their answers for this test.</p>
              </Card>
            ) : selectedSubmission ? (
              /* Submission Detail View */
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSelectedSubmission(null);
                    setSubmissionAnswers([]);
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Back to submissions</span>
                </button>

                <Card className="!p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-700">
                          {selectedSubmission.student?.name?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedSubmission.student?.name || 'Unknown Student'}</p>
                        <p className="text-xs text-gray-500">{selectedSubmission.student?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        selectedSubmission.status === 'SUBMITTED' || selectedSubmission.status === 'GRADED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedSubmission.status}
                      </span>
                      {selectedSubmission.submitted_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(selectedSubmission.submitted_at).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Score Summary */}
                {submissionAnswers.length > 0 && (
                  <Card className="!p-4">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-3">Score Summary</p>
                    {(() => {
                      const scores = calculateScores(submissionAnswers);
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600 mb-1">Multiple Choice</p>
                            <p className="text-xl font-bold text-blue-700">
                              {scores.mcScore}/{scores.mcTotal}
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600 mb-1">
                              Essay ({scores.essayGraded}/{scores.essayCount} graded)
                            </p>
                            <p className="text-xl font-bold text-green-700">
                              {scores.essayScore}/{scores.essayTotal}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </Card>
                )}

                {/* Answers */}
                {loadingAnswers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Answers</p>
                    {submissionAnswers.map((answer, idx) => (
                      <Card key={answer.id} className="!p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                answer.question?.question_type === 'MULTIPLE_CHOICE'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {answer.question?.question_type === 'MULTIPLE_CHOICE' ? 'MC' : 'Essay'}
                              </span>
                              <span className="text-[10px] text-gray-400">{answer.question?.points} pts</span>
                              {answer.question?.question_type === 'MULTIPLE_CHOICE' && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  answer.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {answer.is_correct ? 'Correct' : 'Wrong'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{answer.question?.question_text}</p>

                            {/* Answer Display */}
                            {answer.question?.question_type === 'MULTIPLE_CHOICE' ? (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Student Answer:</p>
                                <p className="text-sm font-medium">
                                  {answer.selected_option !== null && answer.question?.options
                                    ? `${String.fromCharCode(65 + answer.selected_option)}. ${answer.question.options[answer.selected_option]}`
                                    : 'No answer'}
                                </p>
                                {!answer.is_correct && answer.question?.correct_answer !== null && (
                                  <p className="text-xs text-green-600 mt-2">
                                    Correct: {String.fromCharCode(65 + answer.question.correct_answer)}. {answer.question.options[answer.question.correct_answer]}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs text-gray-500 mb-1">Student Answer:</p>
                                  <p className="text-sm whitespace-pre-wrap">{answer.answer_text || 'No answer'}</p>
                                </div>

                                {/* Grading Section */}
                                {gradingAnswerId === answer.id ? (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-3">
                                    <div>
                                      <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Score (max {answer.question?.points} pts)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max={answer.question?.points}
                                        value={essayScore}
                                        onChange={(e) => setEssayScore(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        placeholder="Enter score"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Feedback (optional)
                                      </label>
                                      <textarea
                                        value={essayFeedback}
                                        onChange={(e) => setEssayFeedback(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        rows={2}
                                        placeholder="Add feedback for student"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={handleSaveGrade}
                                        disabled={savingGrade || essayScore === ''}
                                        className="text-xs"
                                      >
                                        {savingGrade ? (
                                          <>
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            Saving...
                                          </>
                                        ) : (
                                          'Save Grade'
                                        )}
                                      </Button>
                                      <button
                                        onClick={() => setGradingAnswerId(null)}
                                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                    <div>
                                      <p className="text-xs text-gray-500">Score:</p>
                                      <p className="text-lg font-bold text-gray-900">
                                        {answer.score !== null ? `${answer.score}/${answer.question?.points}` : 'Not graded'}
                                      </p>
                                      {answer.teacher_feedback && (
                                        <p className="text-xs text-gray-600 mt-1">Feedback: {answer.teacher_feedback}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleStartGrading(answer)}
                                      className="text-xs"
                                    >
                                      {answer.score !== null ? 'Edit Grade' : 'Grade'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Submissions List */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{submissions.length} student(s) submitted</p>
                  <Button variant="outline" onClick={loadSubmissions} className="text-xs">
                    Refresh
                  </Button>
                </div>

                {submissions.map((submission) => {
                  const scores = submissionScores[submission.id];
                  return (
                    <Card
                      key={submission.id}
                      className="!p-4 cursor-pointer hover:border-purple-300 transition-colors"
                      onClick={() => handleSelectSubmission(submission)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-700">
                              {submission.student?.name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{submission.student?.name || 'Unknown Student'}</p>
                            <p className="text-xs text-gray-500">
                              {submission.submitted_at
                                ? `Submitted ${new Date(submission.submitted_at).toLocaleString('id-ID')}`
                                : 'In progress'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Score Summary */}
                          {scores && (
                            <div className="flex items-center gap-2 mr-2">
                              {scores.mcTotal > 0 && (
                                <div className="text-center px-2 py-1 bg-blue-50 rounded">
                                  <p className="text-[10px] text-blue-600">MC</p>
                                  <p className="text-xs font-bold text-blue-700">{scores.mcScore}/{scores.mcTotal}</p>
                                </div>
                              )}
                              {scores.essayCount > 0 && (
                                <div className="text-center px-2 py-1 bg-green-50 rounded">
                                  <p className="text-[10px] text-green-600">Essay</p>
                                  <p className="text-xs font-bold text-green-700">
                                    {scores.essayGraded === 0 ? '-' : scores.essayScore}/{scores.essayTotal}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            submission.status === 'SUBMITTED' || submission.status === 'GRADED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {submission.status}
                          </span>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-sm !p-4 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Delete Test Schedule?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this test? This action cannot be undone.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${TEST_TYPE_COLORS[test.test_type]}`}>
                  {TEST_TYPE_LABELS[test.test_type]}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-900">{test.title}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {new Date(test.date_time).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })} • {new Date(test.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px] text-gray-500">{test.location} - {test.class_name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-xs py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete Test'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TestDetail;
