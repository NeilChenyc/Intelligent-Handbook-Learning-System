import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, Clock, AlertCircle, ArrowLeft, BookOpen, Play, Lock, Trophy, BarChart3 } from 'lucide-react';

const CourseQuizListPage = ({ course, onBack, onProgressUpdate, onStartQuiz }) => {
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      title: '第一章：基础概念',
      description: '学习基本概念和理论知识',
      status: 'completed',
      score: 95,
      duration: 30,
      questions: 10,
      attempts: 1,
      maxAttempts: 3,
      unlocked: true
    },
    {
      id: 2,
      title: '第二章：实践应用',
      description: '通过实际案例理解应用方法',
      status: 'available',
      score: null,
      duration: 45,
      questions: 15,
      attempts: 0,
      maxAttempts: 3,
      unlocked: true
    },
    {
      id: 3,
      title: '第三章：高级技巧',
      description: '掌握高级技巧和最佳实践',
      status: 'locked',
      score: null,
      duration: 60,
      questions: 20,
      attempts: 0,
      maxAttempts: 3,
      unlocked: false
    },
    {
      id: 4,
      title: '第四章：综合测试',
      description: '综合运用所学知识',
      status: 'locked',
      score: null,
      duration: 90,
      questions: 25,
      attempts: 0,
      maxAttempts: 2,
      unlocked: false
    }
  ]);

  const handleStartQuiz = (quizId) => {
    // 调用父组件传入的回调函数，跳转到小测页面
    if (onStartQuiz) {
      onStartQuiz(quizId);
    }
  };

  const handleCompleteQuiz = (quizId, score) => {
    // 完成小测后的逻辑
    setQuizzes(prevQuizzes => {
      const updatedQuizzes = prevQuizzes.map(quiz => {
        if (quiz.id === quizId) {
          const updatedQuiz = {
            ...quiz,
            status: 'completed',
            score: score,
            attempts: quiz.attempts + 1
          };
          return updatedQuiz;
        }
        return quiz;
      });

      // 解锁下一个小测
      const currentIndex = updatedQuizzes.findIndex(q => q.id === quizId);
      if (currentIndex < updatedQuizzes.length - 1) {
        updatedQuizzes[currentIndex + 1].unlocked = true;
        updatedQuizzes[currentIndex + 1].status = 'available';
      }

      return updatedQuizzes;
    });

    // 计算并更新课程进度
    const completedQuizzes = quizzes.filter(q => q.status === 'completed').length + 1;
    const totalQuizzes = quizzes.length;
    const newProgress = Math.round((completedQuizzes / totalQuizzes) * 100);
    
    if (onProgressUpdate) {
      onProgressUpdate(course.id, newProgress);
    }
  };

  const getQuizStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'available': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'locked': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getQuizStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'available': return <Play className="w-5 h-5 text-blue-500" />;
      case 'locked': return <Lock className="w-5 h-5 text-gray-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getQuizStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'available': return '可开始';
      case 'locked': return '未解锁';
      default: return '未知';
    }
  };

  const completedQuizzes = quizzes.filter(q => q.status === 'completed').length;
  const totalQuizzes = quizzes.length;
  const courseProgress = Math.round((completedQuizzes / totalQuizzes) * 100);
  const averageScore = quizzes.filter(q => q.score !== null).reduce((sum, q) => sum + q.score, 0) / completedQuizzes || 0;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'available':
        return <Play className="w-5 h-5 text-blue-500" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'available':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'locked':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'available':
        return '可开始';
      case 'locked':
        return '未解锁';
      default:
        return '未知';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 返回按钮和课程标题 */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-4 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回课程列表</span>
        </Button>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>讲师: {course.instructor}</span>
                <span>小测数量: {totalQuizzes}</span>
                <span>已完成: {completedQuizzes}</span>
              </div>
            </div>
          </div>
          
          {/* 课程进度 */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">课程进度</span>
              <span className="text-sm font-bold text-blue-600">{courseProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${courseProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">总小测</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuizzes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">已完成</p>
                <p className="text-2xl font-bold text-green-600">{completedQuizzes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">剩余</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {totalQuizzes - completedQuizzes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">平均分</p>
                <p className="text-2xl font-bold text-purple-600">
                  {completedQuizzes > 0 ? Math.round(averageScore) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 小测列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">小测列表</h2>
        
        {quizzes.map((quiz, index) => (
          <Card key={quiz.id} className={`transition-all duration-200 ${
            quiz.status === 'available' ? 'hover:shadow-md border-blue-200' : 
            quiz.status === 'completed' ? 'border-green-200' : 'border-gray-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* 序号和状态图标 */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    {getStatusIcon(quiz.status)}
                  </div>

                  {/* 小测信息 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getQuizStatusColor(quiz.status)}`}>
                        {getQuizStatusText(quiz.status)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{quiz.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.duration} 分钟</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{quiz.questions} 题</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>{quiz.attempts}/{quiz.maxAttempts} 次尝试</span>
                      </div>
                      {quiz.status === 'completed' && quiz.score !== null && (
                        <div className="flex items-center space-x-1">
                          <Trophy className="w-4 h-4" />
                          <span className={`font-medium ${getScoreColor(quiz.score)}`}>
                            {quiz.score} 分
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="ml-6">
                  {quiz.status === 'available' && quiz.unlocked && (
                    <Button 
                      onClick={() => handleStartQuiz(quiz.id)}
                      className="flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>开始小测</span>
                    </Button>
                  )}
                  
                  {quiz.status === 'completed' && (
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline"
                        onClick={() => handleStartQuiz(quiz.id)}
                        className="flex items-center space-x-2"
                        disabled={quiz.attempts >= quiz.maxAttempts}
                      >
                        <Play className="w-4 h-4" />
                        <span>重新测试</span>
                      </Button>
                      {quiz.attempts >= quiz.maxAttempts && (
                        <span className="text-xs text-gray-500 text-center">
                          已达最大尝试次数
                        </span>
                      )}
                    </div>
                  )}
                  
                  {quiz.status === 'locked' && (
                    <div className="text-center">
                      <Lock className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs text-gray-500">需完成前置小测</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">小测说明：</p>
            <ul className="space-y-1 text-blue-700">
              <li>• 需要按顺序完成小测，完成前一个才能解锁下一个</li>
              <li>• 每个小测最多可尝试 {quizzes[0]?.maxAttempts || 3} 次</li>
              <li>• 完成所有小测后，课程进度将更新为 100%</li>
              <li>• 建议得分达到 80 分以上再进行下一个小测</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseQuizListPage;