import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, XCircle, FileText, BookOpen, Trophy, AlertCircle } from 'lucide-react';

const WrongQuestionsPage = () => {
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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
      explanation: '向外部透露客户信息、在公共场所讨论机密、私自带走工作文件都属于违反保密制度的行为。与同事正常分享工作经验是被允许的。',
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

  // 从localStorage获取错题数据
  useEffect(() => {
    const savedWrongQuestions = localStorage.getItem('wrongQuestions');
    if (savedWrongQuestions) {
      const parsed = JSON.parse(savedWrongQuestions);
      if (parsed.length > 0) {
        setWrongQuestions(parsed);
      } else {
        // 如果没有错题，使用默认错题
        setWrongQuestions(defaultWrongQuestions);
        localStorage.setItem('wrongQuestions', JSON.stringify(defaultWrongQuestions));
      }
    } else {
      // 如果localStorage中没有数据，使用默认错题
      setWrongQuestions(defaultWrongQuestions);
      localStorage.setItem('wrongQuestions', JSON.stringify(defaultWrongQuestions));
    }
  }, []);

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

  const checkAnswer = () => {
    if (!userAnswer) return;

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

    // 如果答对了，从错题列表中移除
    if (correct) {
      const updatedWrongQuestions = wrongQuestions.filter((_, index) => index !== currentQuestionIndex);
      saveWrongQuestions(updatedWrongQuestions);
      
      // 如果当前是最后一题，回到上一题；否则保持当前索引
      if (currentQuestionIndex >= updatedWrongQuestions.length && updatedWrongQuestions.length > 0) {
        setCurrentQuestionIndex(updatedWrongQuestions.length - 1);
      }
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

  if (wrongQuestions.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">错题重做</h2>
          <p className="text-gray-600">重新练习之前做错的题目</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">恭喜！没有错题了</h3>
              <p className="text-gray-600">您已经掌握了所有题目，继续保持！</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">错题重做</h2>
        <p className="text-gray-600">重新练习之前做错的题目，做对一道少一道</p>
      </div>

      {/* 进度显示 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="font-medium">剩余错题：{wrongQuestions.length} 道</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>当前：第 {currentQuestionIndex + 1} 道</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600">
                所属课程：{currentQuestion?.courseName || '未知课程'}
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
            <p className="text-sm text-gray-500">（多选题）</p>
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
                  key={option.id}
                  className={optionClass}
                  onClick={() => handleAnswerSelect(option.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${currentQuestion.type === 'multiple' ? 'rounded-sm' : 'rounded-full'} border-2 flex items-center justify-center`}>
                      {isSelected && (
                        <div className={`w-2 h-2 bg-current ${currentQuestion.type === 'multiple' ? 'rounded-sm' : 'rounded-full'}`} />
                      )}
                    </div>
                    <span className="font-medium">{option.id.toUpperCase()}.</span>
                    <span>{option.text}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {showResult && (
            <div className={`mt-4 p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h4 className={`font-medium mb-2 ${isCorrect ? 'text-green-800' : 'text-yellow-800'}`}>
                {isCorrect ? '回答正确！' : '解析：'}
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
              disabled={!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)}
              className="px-8"
            >
              确认答案
            </Button>
            <Button 
              variant="outline"
              onClick={resetAnswer}
              className="px-8"
            >
              重新选择
            </Button>
          </>
        ) : (
          <Button 
            onClick={nextQuestion}
            className="px-8"
          >
            {isCorrect ? '继续练习' : '下一题'}
          </Button>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">错题重做说明：</p>
            <ul className="space-y-1 text-blue-700">
              <li>• 这里显示的是您在各个课程中答错的题目</li>
              <li>• 每道题都标明了所属的课程名称</li>
              <li>• 答对一道题，该题就会从错题列表中移除</li>
              <li>• 建议反复练习直到掌握所有错题</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrongQuestionsPage;