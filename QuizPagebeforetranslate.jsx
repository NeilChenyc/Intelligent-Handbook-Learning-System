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

  // 获取下一个小测ID
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
      console.error('获取下一个小测失败:', error);
    }
    return null;
  };

  useEffect(() => {
    const fetchNextQuizId = async () => {
      const nextId = await getNextQuizId();
      setNextQuizId(nextId);
    };
    
    // 在组件加载时就获取下一个小测ID，不需要等到提交后
    if (course?.id && quizId) {
      fetchNextQuizId();
    }
  }, [course?.id, quizId]);

  // 从认证系统获取用户ID
  const userId = user?.id;

  // 从后端获取题目数据并开始小测尝试
  useEffect(() => {
    const initializeQuiz = async () => {
      // 如果用户未登录或没有quizId，不执行数据获取
      if (!userId || !quizId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Debug: 开始初始化小测, quizId:', quizId, 'userId:', userId);
        
        // 开始小测尝试
        console.log('Debug: 调用 startQuizAttempt API');
        const attemptResponse = await startQuizAttempt(userId, quizId);
        console.log('Debug: startQuizAttempt 响应:', attemptResponse);
        setAttemptId(attemptResponse.id);
        
        // 获取题目列表
        console.log('Debug: 调用 getQuestionsByQuiz API');
        const data = await getQuestionsByQuiz(quizId);
        console.log('Debug: getQuestionsByQuiz 响应:', data);
        
        // 转换后端数据格式为前端需要的格式
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
          explanation: question.explanation || '暂无解析'
        }));
        
        console.log('Debug: 原始API数据', data);
        console.log('Debug: 转换后的题目数据', formattedQuestions);
        setQuestions(formattedQuestions);
        
        setError(null);
      } catch (err) {
        console.error('初始化小测失败:', err);
        console.error('错误详情:', err.message);
        console.error('错误堆栈:', err.stack);
        setError(`加载题目失败: ${err.message || '请检查网络连接或联系管理员'}`);
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
      console.log('Debug: 提交被阻止 - attemptId为空或正在提交中');
      console.log('Debug: attemptId 是否为空:', !attemptId);
      console.log('Debug: 是否正在提交:', submitting);
      return;
    }
    
    // 准备答案数据，格式化为后端期望的格式
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId: parseInt(questionId),
      selectedOptions: Array.isArray(answer) ? answer : [answer]
    }));
    
    try {
      setSubmitting(true);
      console.log('Debug: 开始提交小测');
      console.log('Debug: attemptId:', attemptId);
      console.log('Debug: formattedAnswers:', formattedAnswers);
      
      // 提交到后端
      const result = await submitQuizAnswers(attemptId, formattedAnswers);
      console.log('Debug: 提交成功，结果:', result);
      
      // 设置提交状态
      setSubmitted(true);
      
      // 保存测验结果
      setQuizResult(result);
      
      // 计算错题数量（从后端返回的结果中获取）
      if (result.wrongQuestions) {
        setWrongQuestionsCount(result.wrongQuestions.length);
      } else {
        // 如果后端没有返回错题信息，本地计算
        const wrongCount = questions.filter(question => {
          const userAnswer = answers[question.id];
          return !isCorrectAnswer(question, userAnswer);
        }).length;
        setWrongQuestionsCount(wrongCount);
      }
      
      // 保留localStorage逻辑作为备份（可选）
      const wrongQuestions = [];
      questions.forEach(question => {
        const userAnswer = answers[question.id];
        const isCorrect = isCorrectAnswer(question, userAnswer);
        
        if (!isCorrect) {
          const wrongQuestion = {
            ...question,
            courseName: courseName || '员工手册学习',
            userAnswer: userAnswer,
            timestamp: new Date().toISOString()
          };
          wrongQuestions.push(wrongQuestion);
        }
      });
      
      // 更新localStorage
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
      
      // 结果已保存，展示结果页由下方按钮控制导航
      
    } catch (error) {
      console.error('提交小测失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        attemptId: attemptId,
        formattedAnswers: formattedAnswers
      });
      
      // 更详细的错误信息
      let errorMessage = '提交失败，请重试';
      if (error.message) {
        errorMessage = `提交失败: ${error.message}`;
      }
      if (error.response) {
        errorMessage = `提交失败 (${error.response.status}): ${error.response.statusText}`;
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

  const getScore = () => {
    let correct = 0;
    questions.forEach(question => {
      if (isCorrectAnswer(question, answers[question.id])) {
        correct++;
      }
    });
    return { correct, total: questions.length };
  };

  const score = submitted ? getScore() : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button 
          onClick={onBack}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回课程
        </Button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">正在加载题目...</p>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">加载题目失败：{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && questions.length === 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-700">该测验暂无题目</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && questions.length > 0 && (
        <>
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                {courseName ? `${courseName} - 小测` : '测验'}
              </h2>
            </div>
            <p className="text-gray-600">请仔细阅读题目并选择正确答案，共 {questions.length} 道题</p>
          </div>

      {submitted && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="font-medium">
                合规考核完成！得分：{quizResult?.score !== undefined && quizResult?.maxPossibleScore !== undefined
                  ? `${quizResult.score}/${quizResult.maxPossibleScore} (${Math.round((quizResult.score / quizResult.maxPossibleScore) * 100)}%)`
                  : `${score.correct}/${score.total} (${Math.round((score.correct / score.total) * 100)}%)`
                }
                {quizResult?.score !== undefined && quizResult?.maxPossibleScore !== undefined
                  ? ((quizResult.score / quizResult.maxPossibleScore) >= 0.8 ? ' - 考核通过' : ' - 需要重新学习')
                  : (score.correct / score.total >= 0.8 ? ' - 考核通过' : ' - 需要重新学习')
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = answers[question.id];
          const isCorrect = submitted ? isCorrectAnswer(question, userAnswer) : null;

          return (
            <Card key={question.id} className={submitted ? (isCorrect ? 'border-green-200' : 'border-red-200') : ''}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    第 {index + 1} 题
                  </span>
                  {submitted && (
                    isCorrect ? 
                      <CheckCircle className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </CardTitle>
                <p className="text-lg text-gray-800 mt-2">{question.questionText}</p>
                {question.type === 'multiple' && (
                  <p className="text-sm text-gray-500">（多选题）</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {question.options.map((option) => {
                    const isSelected = question.type === 'multiple' 
                      ? (userAnswer || []).includes(option.id)
                      : userAnswer === option.id;
                    
                    const isCorrectOption = question.type === 'multiple'
                      ? question.correctAnswer.includes(option.id)
                      : question.correctAnswer === option.id;

                    let optionClass = 'p-3 border rounded-lg cursor-pointer transition-colors ';
                    
                    if (submitted) {
                      if (isCorrectOption) {
                        optionClass += 'bg-green-100 border-green-300 text-green-800';
                      } else if (isSelected && !isCorrectOption) {
                        optionClass += 'bg-red-100 border-red-300 text-red-800';
                      } else {
                        optionClass += 'bg-gray-50 border-gray-200 text-gray-600';
                      }
                    } else {
                      optionClass += isSelected 
                        ? 'bg-blue-100 border-blue-300 text-blue-800' 
                        : 'bg-white border-gray-200 hover:bg-gray-50';
                    }

                    return (
                      <div
                        key={option.id}
                        className={optionClass}
                        onClick={() => handleAnswerChange(question.id, option.id, question.type === 'multiple')}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${question.type === 'multiple' ? 'rounded-sm' : 'rounded-full'} border-2 flex items-center justify-center`}>
                            {isSelected && (
                              <div className={`w-2 h-2 bg-current ${question.type === 'multiple' ? 'rounded-sm' : 'rounded-full'}`} />
                            )}
                          </div>
                          <span className="font-medium">{option.id.toUpperCase()}.</span>
                          <span>{option.optionText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Explanation:</h4>
                    <p className="text-yellow-700">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={handleSubmit}
            size="lg"
            className="px-8"
            disabled={Object.keys(answers).length === 0}
          >
            提交考核
          </Button>
        </div>
      )}

      {submitted && (
        <>
          {/* 测验结果显示 */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">测验结果</h3>
              
              {/* 成绩显示 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-blue-600">
                    {quizResult?.score !== undefined && quizResult?.maxPossibleScore !== undefined
                      ? `${quizResult.score}/${quizResult.maxPossibleScore}`
                      : `${questions.length - wrongQuestionsCount}/${questions.length}`}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">总分/满分</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-green-600">
                    {questions.length - wrongQuestionsCount}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">正确题数</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-red-600">
                    {wrongQuestionsCount}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">错误题数</div>
                </div>
              </div>
              
              {/* 通过情况 */}
              <div className="mb-6">
                {(() => {
                  const hasBackendScores = quizResult?.score !== undefined && quizResult?.maxPossibleScore !== undefined;
                  const percent = hasBackendScores && quizResult.maxPossibleScore > 0
                    ? (quizResult.score / quizResult.maxPossibleScore) * 100
                    : ((questions.length - wrongQuestionsCount) / questions.length) * 100;
                  const passed = quizResult?.passed !== undefined
                    ? quizResult.passed
                    : percent >= 80;

                  return (
                    <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                      passed 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {passed ? (
                        <>
                          <CheckCircle className="w-6 h-6 mr-2" />
                          恭喜通过！得分比例: {percent.toFixed(1)}%
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 mr-2" />
                          未通过，得分比例: {percent.toFixed(1)}%
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {/* 提示信息 */}
              <div className="text-gray-600 mb-4">
                {wrongQuestionsCount === 0 
                  ? "太棒了！全部答对了！" 
                  : `还有 ${wrongQuestionsCount} 道题需要加强学习，请查看下方解析。`
                }
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center space-x-4">
            {/* 判断是否通过并显示相应按钮 */}
            {(() => {
              const score = quizResult?.score !== undefined ? quizResult.score : Math.round((questions.length - wrongQuestionsCount) / questions.length * 100);
              const passed = quizResult?.passed !== undefined ? quizResult.passed : (score >= 80);
              
              if (passed && nextQuizId) {
                // 通过且有下一个小测，显示"下一个测验"按钮
                return (
                  <Button 
                    onClick={() => {
                      if (onQuizComplete) {
                        const score = quizResult?.score !== undefined ? quizResult.score : Math.round((questions.length - wrongQuestionsCount) / questions.length * 100);
                        const passed = quizResult?.passed !== undefined ? quizResult.passed : (score >= 80);
                        onQuizComplete(quizId, score, passed);
                      }
                    }}
                    size="lg"
                    className="px-8"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    继续考核
                  </Button>
                );
              } else if (passed && !nextQuizId) {
                // 通过但没有下一个小测，显示"返回课程"按钮
                return (
                  <Button 
                    onClick={onBack}
                    size="lg"
                    className="px-8"
                  >
                    返回课程
                  </Button>
                );
              } else {
                // 未通过，显示"重新考核"按钮
                return (
                  <Button 
                    onClick={() => {
                      setAnswers({});
                      setSubmitted(false);
                      setQuizResult(null);
                      setWrongQuestionsCount(0);
                      // 保留 nextQuizId，避免重新考核后丢失“继续考核”能力
                    }}
                    variant="outline"
                    size="lg"
                    className="px-8"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重新考核
                  </Button>
                );
              }
            })()}
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
};

export default QuizPage;