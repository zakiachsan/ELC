import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../Card';
import { Button } from '../Button';
import { testsService } from '../../services/tests.service';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';
import {
  Clock, CheckCircle, Circle, AlertCircle, ArrowLeft, ArrowRight,
  Loader2, Play, Send, FileText, Timer, HelpCircle, Check
} from 'lucide-react';

type TestQuestion = Database['public']['Tables']['test_questions']['Row'];
type TestSubmission = Database['public']['Tables']['test_submissions']['Row'];
type TestAnswer = Database['public']['Tables']['test_answers']['Row'];

interface StudentAnswer {
  questionId: string;
  selectedOption?: number;
  answerText?: string;
}

export const OnlineTest: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testInfo, setTestInfo] = useState<any>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [submission, setSubmission] = useState<TestSubmission | null>(null);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  // Load test data
  useEffect(() => {
    if (testId) {
      loadTestData();
    }
  }, [testId]);

  // Timer countdown
  useEffect(() => {
    if (!testStarted || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, timeRemaining]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && testStarted && !testCompleted) {
      handleSubmitTest();
    }
  }, [timeRemaining, testStarted, testCompleted]);

  const loadTestData = async () => {
    if (!testId) return;

    try {
      setLoading(true);
      setError(null);

      // Load test info and questions
      const testData = await testsService.getTestWithQuestions(testId);
      setTestInfo(testData);
      setQuestions(testData.questions || []);

      // Check if test is published
      if (!testData.is_published) {
        setError('This test is not available yet.');
        return;
      }

      // Check for existing submission
      if (user?.id) {
        const existingSubmission = await testsService.getSubmissionByStudent(testId, user.id);
        if (existingSubmission) {
          setSubmission(existingSubmission);

          if (existingSubmission.status !== 'IN_PROGRESS') {
            setTestCompleted(true);
          } else {
            // Load existing answers
            const existingAnswers = await testsService.getAnswers(existingSubmission.id);
            if (existingAnswers) {
              setAnswers(existingAnswers.map((a: any) => ({
                questionId: a.question_id,
                selectedOption: a.selected_option,
                answerText: a.answer_text,
              })));
            }
            setTestStarted(true);
            // Calculate remaining time
            const startTime = new Date(existingSubmission.started_at).getTime();
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const totalSeconds = (testData.duration_minutes || 60) * 60;
            setTimeRemaining(Math.max(0, totalSeconds - elapsed));
          }
        }
      }

      // Initialize answers array
      if (testData.questions) {
        setAnswers(testData.questions.map((q: TestQuestion) => ({
          questionId: q.id,
          selectedOption: undefined,
          answerText: undefined,
        })));
      }
    } catch (err) {
      console.error('Error loading test:', err);
      setError('Failed to load test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!testId || !user?.id) return;

    try {
      setSubmitting(true);
      const newSubmission = await testsService.startTest(testId, user.id);
      setSubmission(newSubmission);
      setTestStarted(true);
      setTimeRemaining((testInfo?.duration_minutes || 60) * 60);
    } catch (err) {
      console.error('Error starting test:', err);
      setError('Failed to start test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: number | string) => {
    setAnswers(prev => prev.map(a => {
      if (a.questionId === questionId) {
        if (typeof value === 'number') {
          return { ...a, selectedOption: value };
        } else {
          return { ...a, answerText: value };
        }
      }
      return a;
    }));
  };

  const handleSaveAnswer = async (questionId: string) => {
    if (!submission) return;

    const answer = answers.find(a => a.questionId === questionId);
    if (!answer) return;

    try {
      await testsService.saveAnswer({
        submission_id: submission.id,
        question_id: questionId,
        selected_option: answer.selectedOption ?? null,
        answer_text: answer.answerText || null,
      });
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  };

  const handleSubmitTest = async () => {
    if (!submission) return;

    if (!confirm('Are you sure you want to submit your test? You cannot change your answers after submission.')) {
      return;
    }

    try {
      setSubmitting(true);

      // Save all answers first
      const answersToSave = answers.map(a => ({
        submission_id: submission.id,
        question_id: a.questionId,
        selected_option: a.selectedOption ?? null,
        answer_text: a.answerText || null,
      }));
      await testsService.saveAnswers(answersToSave);

      // Submit the test
      await testsService.submitTest(submission.id);
      setTestCompleted(true);
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = (): number => {
    return answers.filter(a =>
      a.selectedOption !== undefined || (a.answerText && a.answerText.trim())
    ).length;
  };

  const currentQuestion = questions[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">Loading test...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center !p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  // Test completed view
  if (testCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center !p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Test Submitted!</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your test has been submitted successfully. Your teacher will review your answers.
          </p>
          {submission && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">Submitted at</p>
              <p className="text-sm font-bold text-gray-900">
                {submission.submitted_at
                  ? new Date(submission.submitted_at).toLocaleString('id-ID')
                  : 'Just now'
                }
              </p>
            </div>
          )}
          <Button onClick={() => navigate('/student')} className="w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Test intro view
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <Card className="!p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{testInfo?.title}</h1>
              <p className="text-sm text-gray-500">{testInfo?.location} - {testInfo?.class_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <HelpCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Timer className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{testInfo?.duration_minutes || 60}</p>
                <p className="text-xs text-gray-500">Minutes</p>
              </div>
            </div>

            {testInfo?.description && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-yellow-800">{testInfo.description}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="text-sm font-bold text-blue-900 mb-2">Instructions:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>- Once you start, the timer will begin counting down.</li>
                <li>- You can navigate between questions using the navigation buttons.</li>
                <li>- Your answers are saved automatically when you move to another question.</li>
                <li>- Make sure to submit before the time runs out.</li>
                <li>- You cannot change your answers after submission.</li>
              </ul>
            </div>

            <Button
              onClick={handleStartTest}
              disabled={submitting || questions.length === 0}
              className="w-full py-4 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Test
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Test taking view
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900 truncate">{testInfo?.title}</h1>
            <p className="text-xs text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            timeRemaining !== null && timeRemaining < 300
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-bold font-mono">
              {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Question Navigation */}
          <div className="bg-white rounded-lg p-3 mb-4 flex items-center gap-2 overflow-x-auto">
            {questions.map((q, index) => {
              const answer = answers.find(a => a.questionId === q.id);
              const isAnswered = answer?.selectedOption !== undefined || (answer?.answerText && answer.answerText.trim());
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    index === currentIndex
                      ? 'bg-purple-600 text-white'
                      : isAnswered
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question */}
          {currentQuestion && (
            <Card className="!p-6">
              <div className="flex items-start gap-3 mb-6">
                <span className="w-10 h-10 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-lg font-bold shrink-0">
                  {currentIndex + 1}
                </span>
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    currentQuestion.question_type === 'MULTIPLE_CHOICE'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {currentQuestion.question_type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Essay'}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-2">
                    {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <p className="text-gray-900 mb-6 whitespace-pre-wrap">
                {currentQuestion.question_text}
              </p>

              {/* Multiple Choice Options */}
              {currentQuestion.question_type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  {currentQuestion.options.map((opt, optIndex) => {
                    const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
                    const isSelected = currentAnswer?.selectedOption === optIndex;
                    return (
                      <button
                        key={optIndex}
                        onClick={() => {
                          handleAnswerChange(currentQuestion.id, optIndex);
                          handleSaveAnswer(currentQuestion.id);
                        }}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className={`text-sm ${isSelected ? 'text-purple-900 font-medium' : 'text-gray-700'}`}>
                          {opt}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-purple-600 ml-auto shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Essay Answer */}
              {currentQuestion.question_type === 'ESSAY' && (
                <textarea
                  value={answers.find(a => a.questionId === currentQuestion.id)?.answerText || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  onBlur={() => handleSaveAnswer(currentQuestion.id)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={8}
                  placeholder="Type your answer here..."
                />
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              {getAnsweredCount()} of {questions.length} answered
            </p>
          </div>

          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitTest}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  Submit Test
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineTest;
