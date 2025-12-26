
import React, { useState, useEffect } from 'react';
import { Question, QuestionType, QuizVariant, EssayGradeResult } from '../../types';
import { MOCK_QUESTIONS } from '../../constants';
import { gradeEssay } from '../../services/geminiService';
import { Card } from '../Card';
import { Button } from '../Button';
import { AlertTriangle, CheckCircle, Brain, ArrowDown, ArrowRight } from 'lucide-react';

interface AdaptiveQuizProps {
  initialLevel: number;
}

export const AdaptiveQuiz: React.FC<AdaptiveQuizProps> = ({ initialLevel }) => {
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [variant, setVariant] = useState<QuizVariant>(QuizVariant.A);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // State for quiz execution
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; feedback: string } | null>(null);

  useEffect(() => {
    // Load questions based on Level and Variant
    const levelQs = MOCK_QUESTIONS[currentLevel] || {};
    const variantQs = levelQs[variant] || [];
    setQuestions(variantQs);
    setAnswers({});
    setResult(null);
  }, [currentLevel, variant]);

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const calculateScore = async (): Promise<number> => {
    let totalScore = 0;
    const pointsPerQuestion = 100 / questions.length;

    for (const q of questions) {
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        if (answers[q.id] === q.correctAnswer) {
          totalScore += pointsPerQuestion;
        }
      } else if (q.type === QuestionType.ESSAY) {
        // AI Integration (Backend) but UI is "Automated"
        const essayGrade: EssayGradeResult = await gradeEssay(q.text, answers[q.id] || '');
        totalScore += (essayGrade.score * (pointsPerQuestion / 100));
      }
    }
    return Math.round(totalScore);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const score = await calculateScore();
      const passed = score >= 70;
      
      let feedback = "";
      
      if (passed) {
        feedback = "Excellent! You have mastered this level.";
      } else {
        // THE LOGIC GATE (Type A -> B -> C -> Drop)
        if (variant === QuizVariant.A) {
          feedback = "Score below 70. Redirecting to Variant B (Retake).";
        } else if (variant === QuizVariant.B) {
          feedback = "Score below 70. Redirecting to Variant C (Last Chance).";
        } else {
          feedback = "Score below 70 on Variant C. Dropping Level.";
        }
      }

      setResult({ score, passed, feedback });

    } catch (e) {
      console.error(e);
      alert("Error grading quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (!result) return;

    if (result.passed) {
      // Logic to move to next level could go here
      alert("Module Completed! Moving to next curriculum.");
      setResult(null); // Reset for demo
    } else {
      // FAILURE LOGIC
      if (variant === QuizVariant.A) {
        setVariant(QuizVariant.B);
      } else if (variant === QuizVariant.B) {
        setVariant(QuizVariant.C);
      } else {
        // Failed C -> Drop Level
        if (currentLevel > 1) {
          setCurrentLevel(prev => prev - 1);
          setVariant(QuizVariant.A); // Reset to A of lower level
        } else {
          alert("Please contact your teacher for assistance.");
        }
      }
    }
    setResult(null);
  };

  if (questions.length === 0) {
    return (
      <Card>
        <div className="text-center py-10 text-gray-500">
          No content available for Level {currentLevel} Variant {variant}.
          <br/>
          (Mock data is limited in this demo)
        </div>
      </Card>
    );
  }

  if (result) {
    return (
      <Card className="text-center py-10">
        <div className="mb-4 flex justify-center">
          {result.passed ? (
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          ) : (
             <div className="bg-yellow-100 p-4 rounded-full">
              <AlertTriangle className="w-12 h-12 text-yellow-600" />
            </div>
          )}
        </div>
        <h2 className="text-3xl font-bold mb-2">{result.score}%</h2>
        <p className={`text-lg font-medium mb-6 ${result.passed ? 'text-green-700' : 'text-yellow-700'}`}>
          {result.passed ? 'PASSED' : 'FAILED'}
        </p>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">{result.feedback}</p>
        
        <Button onClick={handleNextStep} variant={result.passed ? 'primary' : 'secondary'}>
          {result.passed ? 'Continue Learning' : 'Proceed to Next Step'}
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Level {currentLevel} Assessment</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className={`px-2 py-0.5 rounded text-xs font-bold ${
               variant === 'A' ? 'bg-teal-100 text-teal-800' :
               variant === 'B' ? 'bg-orange-100 text-orange-800' :
               'bg-red-100 text-red-800'
             }`}>
               Variant {variant}
             </span>
             {variant !== 'A' && <span className="text-xs text-gray-500">(Remedial Attempt)</span>}
          </div>
        </div>
        <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Passing Grade: 70
        </div>
      </div>

      {questions.map((q, idx) => (
        <Card key={q.id} title={`Question ${idx + 1}`}>
          <div className="space-y-4">
            <p className="text-gray-800 text-lg">{q.text}</p>
            
            {q.type === QuestionType.MULTIPLE_CHOICE ? (
              <div className="space-y-2">
                {q.options?.map(opt => (
                  <label key={opt} className="flex items-center p-3 border rounded-lg hover:bg-teal-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                    <span className="ml-3 text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <textarea
                  rows={6}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  Automated Grading Enabled
                </p>
              </div>
            )}
          </div>
        </Card>
      ))}

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} isLoading={isSubmitting} className="w-full md:w-auto">
          Submit Assessment
        </Button>
      </div>
    </div>
  );
};
