import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, XCircle, FileText, BookOpen, Trophy, AlertCircle } from 'lucide-react';
import { getUserWrongQuestions, submitWrongQuestionRedo, getUserWrongQuestionsCount } from '../api/wrongQuestionApi';
import { useAuth } from '../contexts/AuthContext';

const WrongQuestionsPage = () => {
  const { user } = useAuth();
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [wrongQuestionsCount, setWrongQuestionsCount] = useState(0);

  // 从认证系统获取用户ID
  const userId = user?.id;

  // 默认错题数据
  const defaultWrongQuestions = [
    {
      id: 'default-1',
      question: '公司规定员工迟到超过多少分钟算作旷工半天？',
      type: 'single',
      options: [
        { id: 'a', text: '15分钟' },
        { id: 'b', text: '30分钟' },
        { id: 'c', text: '45分钟' },
        { id: 'd', text: '60分钟' }
      ],
      correctAnswer: 'b',
      explanation: '根据公司考勤制度，员工迟到超过30分钟将被视为旷工半天。',
      courseName: '员工手册'
    },
    {
      id: 'default-2',
      question: '以下哪些情况属于违反公司保密制度的行为？',
      type: 'multiple',
      options: [
        { id: 'a', text: '向外部人员透露客户信息' },
        { id: 'b', text: '在公共场所讨论公司机密' },
        { id: 'c', text: '将工作文件带回家处理' },
        { id: 'd', text: '与同事分享工作经验' }
      ],
      correctAnswer: ['a', 'b', 'c'],
      explanation: '向外部透露客户信息、在公共场所讨论机密、私带来带工作文件都属于违反保密制度的行为。与同事正常分享工作经验是被允许的。',
      courseName: '信息安全培训'
    },
    {
      id: 'default-3',
      question: '发生工伤事故后，应该在多长时间内上报？',
      type: 'single',
      options: [
        { id: 'a', text: '立即上报' },
        { id: 'b', text: '24小时内' },
        { id: 'c', text: '48小时内' },
        { id: 'd', text: '一周内' }
      ],
      correctAnswer: 'b',
      explanation: '根据安全管理制度，工伤事故必须在24小时内上报给相关部门。',
      courseName: '安全培训'
    }
  ];

  // 从后端获取错题数据
  useEffect(() => {
    const fetchWrongQuestions = async () => {
      // 如果用户未登录，不执行数据获取
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 获取用户错题列表
        const wrongQuestionsData = await getUserWrongQuestions(userId);
        
        // 获取错题数量统计
        const countData = await getUserWrongQuestionsCount(userId);
        setWrongQuestionsCount(countData.count || 0);
        
        if (wrongQuestionsData && wrongQuestionsData.length > 0) {
          // 转换后端数据格式为前端期望的格式
          const formattedQuestions = wrongQuestionsData.map(wrongQ => ({
            id: wrongQ.wrongQuestionId,
            wrongQuestionId: wrongQ.wrongQuestionId,
            question: wrongQ.question.text,
            questionId: wrongQ.question.id, // 添加questionId用于去重
            type: wrongQ.question.type === 'MULTIPLE_CHOICE' ? 'multiple' : 'single',
            options: wrongQ.question.options.map(opt => ({
              id: opt.id,
              text: opt.text
            })),
            correctAnswer: wrongQ.question.type === 'MULTIPLE_CHOICE' 
              ? wrongQ.question.options.filter(opt => opt.isCorrect).map(opt => opt.id)
              : wrongQ.question.options.find(opt => opt.isCorrect)?.id,
            explanation: wrongQ.question.explanation || '',
            courseName: wrongQ.question.quiz?.course?.title || '未知课程',
            createdAt: wrongQ.createdAt,
            isRedone: wrongQ.isRedone
          }));
          
          // 去重处理：按questionId去重，保留最新的记录
          const uniqueQuestions = [];
          const seenQuestionIds = new Set();
          
          // 按创建时间倒序排序，确保保留最新的记录
          const sortedQuestions = formattedQuestions.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          
          for (const question of sortedQuestions) {
            if (!seenQuestionIds.has(question.questionId)) {
              // 对选项进行去重处理
              const uniqueOptions = [];
              const seenOptionIds = new Set();
              
              for (const option of question.options) {
                if (!seenOptionIds.has(option.id)) {
                  uniqueOptions.push(option);
                  seenOptionIds.add(option.id);
                }
              }
              
              // 更新题目的选项为去重后的选项
              question.options = uniqueOptions;
              uniqueQuestions.push(question);
              seenQuestionIds.add(question.questionId);
            }
          }
          
          setWrongQuestions(uniqueQuestions);
        } else {
          // 如果没有错题，使用默认错题作为演示
          setWrongQuestions(defaultWrongQuestions);
        }
        
      } catch (err) {
        console.error('获取错题失败:', err);
        setError('加载错题失败，使用本地数据');
        
        // 降级到localStorage数据
        const savedWrongQuestions = localStorage.getItem('wrongQuestions');
        if (savedWrongQuestions) {
          const parsed = JSON.parse(savedWrongQuestions);
          setWrongQuestions(parsed.length > 0 ? parsed : defaultWrongQuestions);
        } else {
          setWrongQuestions(defaultWrongQuestions);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWrongQuestions();
  }, [userId]);

  // 保存错题数据到localStorage
  const saveWrongQuestions = (questions) => {
    localStorage.setItem('wrongQuestions', JSON.stringify(questions));
    setWrongQuestions(questions);
  };

  const currentQuestion = wrongQuestions[currentQuestionIndex];

  const handleAnswerSelect = (optionId) => {
    if (showResult) return;
    
    if (currentQuestion.type === 'multiple') {
      const currentAnswers = userAnswer || [];
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
      setUserAnswer(newAnswers);
    } else {
      setUserAnswer(optionId);
    }
  };

  const checkAnswer = async () => {
    if (!userAnswer || submitting) return;

    try {
      setSubmitting(true);
      
      // 检查答案是否正确
      let correct = false;
      if (currentQuestion.type === 'multiple') {
        const correctSet = new Set(currentQuestion.correctAnswer);
        const userSet = new Set(userAnswer);
        correct = correctSet.size === userSet.size && 
                  [...correctSet].every(x => userSet.has(x));
      } else {
        correct = currentQuestion.correctAnswer === userAnswer;
      }

      setIsCorrect(correct);
      setShowResult(true);

      // 如果答对了，提交到后端并标记为已重做
      if (correct && currentQuestion.wrongQuestionId) {
        try {
          await submitWrongQuestionRedo(currentQuestion.wrongQuestionId, userAnswer);
          
          // 从错题列表中移除
          const updatedWrongQuestions = wrongQuestions.filter((_, index) => index !== currentQuestionIndex);
          setWrongQuestions(updatedWrongQuestions);
          
          // 更新错题数量
          setWrongQuestionsCount(prev => Math.max(0, prev - 1));
          
          // 更新localStorage作为备份
          localStorage.setItem('wrongQuestions', JSON.stringify(updatedWrongQuestions));
          
          // 如果当前是最后一题，回到上一题；否则保持当前索引
          if (currentQuestionIndex >= updatedWrongQuestions.length && updatedWrongQuestions.length > 0) {
            setCurrentQuestionIndex(updatedWrongQuestions.length - 1);
          }
        } catch (apiError) {
          console.error('提交错题重做失败:', apiError);
          // API失败时仍然在本地移除，但显示警告
          setError('网络错误，但答案正确已记录');
          
          const updatedWrongQuestions = wrongQuestions.filter((_, index) => index !== currentQuestionIndex);
          setWrongQuestions(updatedWrongQuestions);
          localStorage.setItem('wrongQuestions', JSON.stringify(updatedWrongQuestions));
          
          if (currentQuestionIndex >= updatedWrongQuestions.length && updatedWrongQuestions.length > 0) {
            setCurrentQuestionIndex(updatedWrongQuestions.length - 1);
          }
        }
      } else if (!correct) {
        // 答错了，保持在错题列表中
        console.log('答案错误，继续练习');
      }
      
    } catch (error) {
      console.error('检查答案失败:', error);
      setError('检查答案时出错，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (isCorrect) {
      // 如果答对了，题目已经被移除，不需要改变索引
      setUserAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      // 如果答错了，移动到下一题
      if (currentQuestionIndex < wrongQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setCurrentQuestionIndex(0);
      }
      setUserAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  const resetAnswer = () => {
    setUserAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Wrong Questions Review</h2>
          <p className="text-gray-600">Loading wrong questions data...</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Wrong Questions Review</h2>
          <p className="text-gray-600">Review and practice previously incorrect questions</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Failed</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Reload</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (wrongQuestions.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Wrong Questions Review</h2>
          <p className="text-gray-600">Review and practice previously incorrect questions</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Congratulations! No Wrong Questions Left</h3>
              <p className="text-gray-600">You have mastered all questions, keep it up!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Wrong Questions Review</h2>
        <p className="text-gray-600">Review and practice previously incorrect questions, correct one to remove one</p>
      </div>

      {/* 进度显示 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Remaining Wrong Questions: {wrongQuestions.length} </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>Current: Question {currentQuestionIndex + 1}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600">
                Course：{currentQuestion?.courseName || 'Unknown Course'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 题目显示 */}
      <Card className={showResult ? (isCorrect ? 'border-green-200' : 'border-red-200') : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              错题练习
            </span>
            {showResult && (
              isCorrect ? 
                <CheckCircle className="w-5 h-5 text-green-500" /> : 
                <XCircle className="w-5 h-5 text-red-500" />
            )}
          </CardTitle>
          <p className="text-lg text-gray-800 mt-2">{currentQuestion?.question}</p>
          {currentQuestion?.type === 'multiple' && (
            <p className="text-sm text-gray-500">(Multiple Choice)</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion?.options.map((option) => {
              const isSelected = currentQuestion.type === 'multiple' 
                ? (userAnswer || []).includes(option.id)
                : userAnswer === option.id;
              
              const isCorrectOption = currentQuestion.type === 'multiple'
                ? currentQuestion.correctAnswer.includes(option.id)
                : currentQuestion.correctAnswer === option.id;

              let optionClass = 'p-3 border rounded-lg cursor-pointer transition-colors ';
              
              if (showResult) {
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
                  key={`option-${currentQuestion.questionId}-${option.id}`}
                  className={optionClass}
                  onClick={() => handleAnswerSelect(option.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${currentQuestion.type === 'multiple' ? 'rounded-sm' : 'rounded-full'} border-2 flex items-center justify-center`}>
                      {isSelected && (
                        <div className={`w-2 h-2 bg-current ${currentQuestion.type === 'multiple' ? 'rounded-sm' : 'rounded-full'}`} />
                      )}
                    </div>
                    <span className="font-medium">{String.fromCharCode(65 + (currentQuestion.options.indexOf(option)))}.</span>
                    <span>{option.text}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {showResult && (
            <div className={`mt-4 p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h4 className={`font-medium mb-2 ${isCorrect ? 'text-green-800' : 'text-yellow-800'}`}>
                {isCorrect ? 'Congratulations! You got it right! This question has been removed from the wrong questions list.' : currentQuestion?.explanation}
              </h4>
              <p className={isCorrect ? 'text-green-700' : 'text-yellow-700'}>
                {isCorrect ? '恭喜您答对了！该题已从错题列表中移除。' : currentQuestion?.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="mt-6 flex justify-center space-x-4">
        {!showResult ? (
          <>
            <Button 
              onClick={checkAnswer}
              disabled={!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0) || submitting}
              className="px-8"
            >
              {submitting ? 'Submitting...' : 'Confirm Answer'}
            </Button>
            <Button 
              variant="outline" 
              onClick={resetAnswer}
              disabled={submitting}
              className="px-8"
            >
              Reselect
            </Button>
          </>
        ) : (
          <Button 
            onClick={nextQuestion}
            className="px-8"
          >
            {isCorrect ? 'Continue Practice' : 'Next Question'}
          </Button>
        )}
      </div>

      {/* 错题统计信息 */}
      {wrongQuestionsCount > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Total Wrong Questions: {wrongQuestionsCount} 
          </p>
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Wrong Questions Review Instructions:</p>
            <li>• These are questions you answered incorrectly in various courses</li>
            <li>• Each question shows its corresponding course name</li>
            <li>• Answer a question correctly to remove it from the wrong questions list</li>
            <li>• It's recommended to practice repeatedly until you master all wrong questions</li>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrongQuestionsPage;