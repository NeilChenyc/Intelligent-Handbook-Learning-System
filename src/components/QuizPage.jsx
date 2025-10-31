import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, RotateCcw, Trophy, FileText, Shield } from 'lucide-react';
import { getQuestionsByQuiz, startQuizAttempt, submitQuizAnswers } from '../api/quizApi';
import { useAuth } from '../contexts/AuthContext';

const QuizPage = ({ quizId, courseName, onBack, onQuizComplete, course }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nextQuizId, setNextQuizId] = useState(null);
  const [wrongQuestionsCount, setWrongQuestionsCount] = useState(0);
  const [quizResult, setQuizResult] = useState(null);

  // Get next quiz ID
  const getNextQuizId = async () => {
    if (!course?.id || !quizId) return null;
    
    try {
      const response = await fetch(`http://localhost:8080/quizzes/course/${course.id}/summaries`);
      if (response.ok) {
        const quizzes = await response.json();
        const sortedQuizzes = quizzes.sort((a, b) => a.id - b.id);
        const currentIndex = sortedQuizzes.findIndex(quiz => quiz.id === quizId);
        
        if (currentIndex >= 0 && currentIndex < sortedQuizzes.length - 1) {
          return sortedQuizzes[currentIndex + 1].id;
        }
      }
    } catch (error) {
      console.error('Failed to get next quiz:', error);
    }
    return null;
  };

  useEffect(() => {
    const fetchNextQuizId = async () => {
      const nextId = await getNextQuizId();
      setNextQuizId(nextId);
    };
    
    // Get next quiz ID when component loads, no need to wait until after submission
    if (course?.id && quizId) {
      fetchNextQuizId();
    }
  }, [course?.id, quizId]);

  // 从Authentication系统GetUserID
  const userId = user?.id;

  // 从后端GetQuestionData并StartQuiz尝试
  useEffect(() => {
    const initializeQuiz = async () => {
      // 如果User未Login或没有quizId，不ExecutionDataGet
      if (!userId || !quizId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Reset所有Status，确保新测验的干净Status
        setAnswers({});
        setSubmitted(false);
        setSubmitting(false);
        setWrongQuestionsCount(0);
        setQuizResult(null);
        setAttemptId(null);
        setError(null);
        
        console.log('Debug: 开始初始化小测, quizId:', quizId, 'userId:', userId);
        
        // StartQuiz尝试
        console.log('Debug: 调用 startQuizAttempt API');
        const attemptResponse = await startQuizAttempt(userId, quizId);
        console.log('Debug: startQuizAttempt 响应:', attemptResponse);
        setAttemptId(attemptResponse.id);
        
        // GetQuestionList
        console.log('Debug: 调用 getQuestionsByQuiz API');
        const data = await getQuestionsByQuiz(quizId);
        console.log('Debug: getQuestionsByQuiz 响应:', data);
        
        // Conversion后端DataFormat为前端需要的Format
        const formattedQuestions = data.map(question => ({
          id: question.id,
          questionText: question.questionText,
          type: question.type === 'SINGLE_CHOICE' ? 'single' : 'multiple',
          options: question.options.map((option, index) => ({
            id: String.fromCharCode(97 + index), // 'a', 'b', 'c', 'd'
            optionText: option.optionText || option.text || option.content
          })),
          correctAnswer: question.type === 'SINGLE_CHOICE' 
            ? String.fromCharCode(97 + question.options.findIndex(opt => opt.isCorrect))
            : question.options
                .map((opt, index) => opt.isCorrect ? String.fromCharCode(97 + index) : null)
                .filter(Boolean),
          explanation: question.explanation || 'No explanation available'
        }));
        
        console.log('Debug: 原始API数据', data);
        console.log('Debug: 转换后的题目数据', formattedQuestions);
        setQuestions(formattedQuestions);
        
      } catch (err) {
        console.error('Quiz initialization failed:', err);
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
        setError(`Failed to load questions: ${err.message || 'Please check network connection or contact administrator'}`);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      initializeQuiz();
    }
  }, [quizId, userId]);

  const [answers, setAnswers] = useState({});

  const handleAnswerChange = (questionId, optionId, isMultiple = false) => {
    if (submitted) return;

    setAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = prev[questionId] || [];
        const newAnswers = currentAnswers.includes(optionId)
          ? currentAnswers.filter(id => id !== optionId)
          : [...currentAnswers, optionId];
        return { ...prev, [questionId]: newAnswers };
      } else {
        return { ...prev, [questionId]: optionId };
      }
    });
  };

  const handleSubmit = async () => {
    console.log('Debug: handleSubmit 被调用');
    console.log('Debug: attemptId:', attemptId);
    console.log('Debug: submitting:', submitting);
    console.log('Debug: submitted:', submitted);
    
    if (!attemptId || submitting) {
      console.log('Debug: Submission blocked - attemptId is empty or submitting');
      console.log('Debug: Is attemptId empty:', !attemptId);
      console.log('Debug: Is submitting:', submitting);
      return;
    }
    
    // 准备AnswerData，Format化为后端Expectation的Format
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId: parseInt(questionId),
      selectedOptions: Array.isArray(answer) ? answer : [answer]
    }));
    
    try {
      setSubmitting(true);
      console.log('Debug: Starting quiz submission');
      console.log('Debug: attemptId:', attemptId);
      console.log('Debug: formattedAnswers:', formattedAnswers);
      
      // Commit到后端
      const result = await submitQuizAnswers(attemptId, formattedAnswers);
      console.log('Debug: Submission successful, result:', result);
      
      // SettingCommitStatus
      setSubmitted(true);
      
      // Save测验Result
      setQuizResult(result);
      
      // Calculate错题Quantity（从后端Return的Result中Get）
      if (result.wrongQuestions) {
        setWrongQuestionsCount(result.wrongQuestions.length);
      } else {
        // 如果后端没有Return错题Information，本地Calculate
        const wrongCount = questions.filter(question => {
          const userAnswer = answers[question.id];
          return !isCorrectAnswer(question, userAnswer);
        }).length;
        setWrongQuestionsCount(wrongCount);
      }
      
      // 保留localStorage逻辑作为Backup（可选）
      const wrongQuestions = [];
      questions.forEach(question => {
        const userAnswer = answers[question.id];
        const isCorrect = isCorrectAnswer(question, userAnswer);
        
        if (!isCorrect) {
          const wrongQuestion = {
            ...question,
            courseName: courseName || 'Employee Handbook Learning',
            userAnswer: userAnswer,
            timestamp: new Date().toISOString()
          };
          wrongQuestions.push(wrongQuestion);
        }
      });
      
      // UpdatelocalStorage
      const existingWrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
      const updatedWrongQuestions = [...existingWrongQuestions];
      wrongQuestions.forEach(newWrongQ => {
        const existingIndex = updatedWrongQuestions.findIndex(
          existing => existing.id === newWrongQ.id && existing.courseName === newWrongQ.courseName
        );
        
        if (existingIndex >= 0) {
          updatedWrongQuestions[existingIndex] = newWrongQ;
        } else {
          updatedWrongQuestions.push(newWrongQ);
        }
      });
      
      localStorage.setItem('wrongQuestions', JSON.stringify(updatedWrongQuestions));
      
      // Result已Save，展示Result页由下方ButtonControl导航
      
    } catch (error) {
      console.error('Quiz submission failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        attemptId: attemptId,
        formattedAnswers: formattedAnswers
      });
      
      // 更详细的MistakeInformation
      let errorMessage = 'Submission failed, please try again';
      if (error.message) {
        errorMessage = `Submission failed: ${error.message}`;
      }
      if (error.response) {
        errorMessage = `Submission failed (${error.response.status}): ${error.response.statusText}`;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const isCorrectAnswer = (question, userAnswer) => {
    if (question.type === 'multiple') {
      const correctSet = new Set(question.correctAnswer);
      const userSet = new Set(userAnswer || []);
      return correctSet.size === userSet.size && 
             [...correctSet].every(x => userSet.has(x));
    } else {
      return question.correctAnswer === userAnswer;
    }
  };

  const getAnswerStatus = (question, userAnswer) => {
    if (!submitted) return null;
    return isCorrectAnswer(question, userAnswer) ? 'correct' : 'incorrect';
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setSubmitting(false);
    setError(null);
    setQuizResult(null);
    setWrongQuestionsCount(0);
  };

  const handleNextQuiz = () => {
    if (nextQuizId && onQuizComplete) {
      // Calculate当前测验的分数和通过Status
      const score = quizResult?.score !== undefined ? quizResult.score : calculateScore();
      const passed = quizResult?.passed !== undefined ? quizResult.passed : isQuizPassed();
      
      // 调用父Component的回调，传递当前测验ID、分数、通过Status和下一个测验ID
      onQuizComplete(quizId, score, passed, nextQuizId);
    }
  };

  const handleBackToCourseList = () => {
    if (onBack) {
      onBack();
    }
  };

  const calculateScore = () => {
    const totalQuestions = questions.length;
    const correctAnswers = questions.filter(question => {
      const userAnswer = answers[question.id];
      return isCorrectAnswer(question, userAnswer);
    }).length;
    
    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  };

  const isQuizPassed = () => {
    return calculateScore() >= 80; // 80分及格
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-4 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Loading Failed</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-4 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No question data available</p>
          </div>
        </div>
      </div>
    );
  }

  // 如果已Commit，DisplayResultPage
  if (submitted) {
    const score = calculateScore();
    const passed = isQuizPassed();
    const totalQuestions = questions.length;
    const correctAnswers = totalQuestions - wrongQuestionsCount;

    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* ResultPageTitle */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {passed ? (
              <Trophy className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {passed ? 'Congratulations! Passed!' : 'Quiz Not Passed'}
          </h1>
          <p className="text-gray-600">
            {passed ? 'You have successfully completed this quiz' : 'Please keep trying and attempt again'}
          </p>
        </div>

        {/* GradeStatistics */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{score}%</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{wrongQuestionsCount}</div>
                <div className="text-sm text-gray-600">Wrong Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 mb-2">{totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QuestionDetails */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Answer Details</h2>
          
          {questions.map((question, index) => {
            const userAnswer = answers[question.id];
            const status = getAnswerStatus(question, userAnswer);
            
            return (
              <Card key={question.id} className={`border-l-4 ${
                status === 'correct' ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'correct' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {status === 'correct' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Question {index + 1}: {question.questionText}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        {question.options.map((option) => {
                          const isCorrect = question.type === 'multiple' 
                            ? question.correctAnswer.includes(option.id)
                            : question.correctAnswer === option.id;
                          const isSelected = question.type === 'multiple'
                            ? (userAnswer || []).includes(option.id)
                            : userAnswer === option.id;
                          
                          let optionClass = 'p-3 rounded-lg border ';
                          if (isCorrect) {
                            optionClass += 'bg-green-50 border-green-200 text-green-800';
                          } else if (isSelected && !isCorrect) {
                            optionClass += 'bg-red-50 border-red-200 text-red-800';
                          } else {
                            optionClass += 'bg-gray-50 border-gray-200 text-gray-700';
                          }
                          
                          return (
                            <div key={option.id} className={optionClass}>
                              <div className="flex items-center space-x-3">
                                <span className="font-medium">{option.id.toUpperCase()}.</span>
                                <span>{option.optionText}</span>
                                {isCorrect && (
                                  <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                                )}
                                {isSelected && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {question.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start space-x-2">
                            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900 mb-1">Explanation</p>
                              <p className="text-blue-800 text-sm">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 操作Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {passed && nextQuizId ? (
            // 通过且有下一个测验，DisplayNext QuizButton
            <Button 
              onClick={handleNextQuiz}
              className="flex items-center space-x-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Next Quiz</span>
            </Button>
          ) : (
            // 未通过或没有下一个测验，DisplayRetake QuizButton
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleBackToCourseList}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course List</span>
          </Button>
        </div>
      </div>
    );
  }

  // Normal的答题Page
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* PageTitle和ReturnButton */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </Button>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{courseName || 'Quiz'}</h1>
          <p className="text-gray-600">Total {questions.length} questions</p>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>No time limit</span>
        </div>
      </div>

      {/* Progress条 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Answer Progress</span>
          <span className="text-sm text-gray-600">
            {Object.keys(answers).length} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* QuestionList */}
      <div className="space-y-6 mb-8">
        {questions.map((question, index) => (
          <Card key={question.id} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {question.questionText}
                    </h3>
                    <p className="text-sm text-blue-600 mb-3">
                      ({question.type === 'multiple' ? 'Multiple Choice' : 'Single Choice'})
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {question.options.map((option) => {
                  const isSelected = question.type === 'multiple'
                    ? (answers[question.id] || []).includes(option.id)
                    : answers[question.id] === option.id;
                  
                  return (
                    <div
                      key={option.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => handleAnswerChange(question.id, option.id, question.type === 'multiple')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="font-medium text-gray-700">{option.id.toUpperCase()}.</span>
                        <span className="text-gray-900">{option.optionText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SubmitButton */}
      <div className="text-center">
        <Button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(answers).length === 0}
          className="px-8 py-3 text-lg"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            'Submit Answers'
          )}
        </Button>
        
        {Object.keys(answers).length < questions.length && (
          <p className="text-sm text-gray-600 mt-2">
            {questions.length - Object.keys(answers).length} questions remaining
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizPage;