import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import QuestionEditModal from './QuestionEditModal';
import { 
  getQuestionsByCourse, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion 
} from '../api/questionApi';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  Target,
  BookOpen,
  AlertCircle
} from 'lucide-react';

const QuestionManagementPage = ({ course, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 获取课程下的所有题目
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await getQuestionsByCourse(course.id);
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取课程下的所有quiz
  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/quizzes/course/${course.id}`);
      if (!response.ok) {
        throw new Error('获取小测失败');
      }
      const data = await response.json();
      setQuizzes(data);
    } catch (err) {
      console.error('获取小测失败:', err);
    }
  };

  useEffect(() => {
    if (course?.id) {
      fetchQuestions();
      fetchQuizzes();
    }
  }, [course?.id]);

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('确定要删除这个题目吗？')) {
      try {
        await deleteQuestion(questionId);
        await fetchQuestions(); // 重新获取题目列表
      } catch (err) {
        alert('删除题目失败: ' + err.message);
      }
    }
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      if (editingQuestion) {
        // 编辑模式
        await updateQuestion(editingQuestion.id, questionData);
        setSuccessMessage('题目修改成功！');
      } else {
        // 添加模式
        await createQuestion(questionData);
        setSuccessMessage('题目添加成功！');
      }

      await fetchQuestions(); // 重新获取题目列表
      setEditingQuestion(null);
      setShowAddModal(false);
      
      // 显示成功提示
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000); // 减少显示时间从3秒到2秒
    } catch (err) {
      alert((editingQuestion ? '更新题目失败: ' : '创建题目失败: ') + err.message);
    }
  };

  const handleAddQuestion = () => {
    setShowAddModal(true);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'SINGLE_CHOICE':
        return '单选题';
      case 'MULTIPLE_CHOICE':
        return '多选题';
      case 'TRUE_FALSE':
        return '判断题';
      case 'ESSAY':
        return '问答题';
      default:
        return '未知类型';
    }
  };

  const getQuizTitle = (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz ? quiz.title : '未分配';
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchQuestions}>重试</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 成功提示 */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

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
              {course?.title} - 题目管理
            </h2>
            <p className="text-gray-600">管理和编辑课程的题目库</p>
          </div>
          <Button 
            onClick={handleAddQuestion}
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
                <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
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
                  {questions.filter(q => q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE').length}
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
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{quizzes.length}</p>
                <p className="text-sm text-gray-600">小测数量</p>
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
                  {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
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
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                        题目 {index + 1}
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2 py-1 rounded">
                        {getTypeLabel(question.type)}
                      </span>
                      <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
                        {question.points || 0} 分
                      </span>
                      <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2 py-1 rounded">
                        {getQuizTitle(question.quiz?.id)}
                      </span>
                      {!question.isActive && (
                        <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                          已删除
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {question.questionText}
                    </h3>
                    
                    {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && question.options && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">选项：</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex}
                              className={`p-2 rounded border text-sm ${
                                option.isCorrect
                                  ? 'bg-green-50 border-green-200 text-green-800' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span> {option.optionText}
                              {option.isCorrect && (
                                <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm font-medium text-blue-900 mb-1">解析：</p>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-6">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEditQuestion(question)}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>编辑</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteQuestion(question.id)}
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

          {questions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无题目</h3>
              <p className="text-gray-500 mb-4">开始添加您的第一个题目</p>
              <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>添加题目</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 题目编辑模态框 */}
      <QuestionEditModal
        isOpen={editingQuestion !== null}
        onClose={() => setEditingQuestion(null)}
        question={editingQuestion}
        quizzes={quizzes}
        onSave={handleSaveQuestion}
        isAddMode={false}
      />

      {/* 题目添加模态框 */}
      <QuestionEditModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        question={null}
        quizzes={quizzes}
        onSave={handleSaveQuestion}
        isAddMode={true}
      />
    </div>
  );
};

export default QuestionManagementPage;