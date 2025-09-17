import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import QuizEditModal from './QuizEditModal';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Target
} from 'lucide-react';

const QuizManagementPage = ({ course, onBack }) => {
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      question: 'React中的useState Hook的作用是什么？',
      type: 'multiple-choice',
      options: [
        '管理组件的状态',
        '处理副作用',
        '创建上下文',
        '优化性能'
      ],
      correctAnswer: 0,
      explanation: 'useState是React中用于在函数组件中添加状态的Hook。',
      points: 10
    },
    {
      id: 2,
      question: '以下哪个不是React的核心概念？',
      type: 'multiple-choice',
      options: [
        '组件',
        'JSX',
        'Props',
        'jQuery'
      ],
      correctAnswer: 3,
      explanation: 'jQuery是一个独立的JavaScript库，不是React的核心概念。',
      points: 10
    },
    {
      id: 3,
      question: '请解释React中的虚拟DOM概念。',
      type: 'essay',
      correctAnswer: null,
      explanation: '虚拟DOM是React在内存中维护的DOM表示，用于提高性能和用户体验。',
      points: 20
    }
  ]);

  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
  };

  const handleDeleteQuiz = (quizId) => {
    if (window.confirm('确定要删除这个题目吗？')) {
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    }
  };

  const handleSaveQuiz = (updatedQuiz) => {
    if (editingQuiz) {
      // 编辑模式
      setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
    } else {
      // 添加模式
      setQuizzes(prev => [...prev, updatedQuiz]);
    }
    setEditingQuiz(null);
    setShowAddModal(false);
  };

  const handleAddQuiz = () => {
    setShowAddModal(true);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'multiple-choice':
        return '选择题';
      case 'true-false':
        return '判断题';
      default:
        return '未知类型';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 头部导航 */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回课程管理</span>
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {course?.title} - 小测题目管理
            </h2>
            <p className="text-gray-600">管理和编辑课程的小测题目</p>
          </div>
          <Button 
            onClick={handleAddQuiz}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>添加题目</span>
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{quizzes.length}</p>
                <p className="text-sm text-gray-600">总题目数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {quizzes.filter(q => q.type === 'multiple-choice').length}
                </p>
                <p className="text-sm text-gray-600">选择题</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Edit className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {quizzes.filter(q => q.type === 'essay').length}
                </p>
                <p className="text-sm text-gray-600">问答题</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {quizzes.reduce((sum, q) => sum + q.points, 0)}
                </p>
                <p className="text-sm text-gray-600">总分值</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 题目列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span>题目列表</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quizzes.map((quiz, index) => (
              <div key={quiz.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                        题目 {index + 1}
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2 py-1 rounded">
                        {getTypeLabel(quiz.type)}
                      </span>
                      <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
                        {quiz.points} 分
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {quiz.question}
                    </h3>
                    
                    {quiz.type === 'multiple-choice' && quiz.options && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">选项：</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {quiz.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex}
                              className={`p-2 rounded border text-sm ${
                                optionIndex === quiz.correctAnswer 
                                  ? 'bg-green-50 border-green-200 text-green-800' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span> {option}
                              {optionIndex === quiz.correctAnswer && (
                                <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {quiz.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm font-medium text-blue-900 mb-1">解析：</p>
                        <p className="text-sm text-blue-800">{quiz.explanation}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-6">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEditQuiz(quiz)}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>编辑</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>删除</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {quizzes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无题目</h3>
              <p className="text-gray-500 mb-4">开始添加您的第一个小测题目</p>
              <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>添加题目</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 题目编辑模态框 */}
      <QuizEditModal
        isOpen={editingQuiz !== null}
        onClose={() => setEditingQuiz(null)}
        quiz={editingQuiz}
        onSave={handleSaveQuiz}
        isAddMode={false}
      />

      {/* 题目添加模态框 */}
      <QuizEditModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        quiz={null}
        onSave={handleSaveQuiz}
        isAddMode={true}
      />
    </div>
  );
};

export default QuizManagementPage;