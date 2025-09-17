import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, Clock, AlertCircle, Plus, Calendar, User, Tag, Filter, BookOpen, Play } from 'lucide-react';
import CourseQuizListPage from './CourseQuizListPage';
import QuizPage from './QuizPage';

const CoursePage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentView, setCurrentView] = useState('courseList'); // 'courseList', 'quizList', or 'quiz'
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  // 模拟课程数据
  const coursesData = [
    {
      id: 1,
      title: '员工手册学习',
      description: '全面了解公司规章制度、企业文化和工作流程',
      status: 'completed',
      priority: 'high',
      dueDate: '2024-01-15',
      completedDate: '2024-01-14',
      instructor: '人事部',
      category: '入职培训',
      progress: 100,
      totalQuizzes: 5,
      completedQuizzes: 5,
      tags: ['员工手册', '必修']
    },
    {
      id: 2,
      title: '实验室安全培训',
      description: '学习实验室安全操作规程和应急处理措施',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2024-01-20',
      instructor: '安全部',
      category: '安全培训',
      progress: 65,
      totalQuizzes: 8,
      completedQuizzes: 5,
      tags: ['实验室', '安全培训']
    },
    {
      id: 3,
      title: '合规管理基础',
      description: '了解企业合规管理体系和相关法律法规',
      status: 'pending',
      priority: 'medium',
      dueDate: '2024-01-25',
      instructor: '法务部',
      category: '合规培训',
      progress: 0,
      totalQuizzes: 6,
      completedQuizzes: 0,
      tags: ['合规', '法律法规']
    },
    {
      id: 4,
      title: '信息安全意识培训',
      description: '提升信息安全防护意识和技能',
      status: 'overdue',
      priority: 'high',
      dueDate: '2024-01-10',
      instructor: 'IT部',
      category: '信息安全',
      progress: 30,
      totalQuizzes: 7,
      completedQuizzes: 2,
      tags: ['信息安全', '必修']
    },
    {
      id: 5,
      title: '质量管理体系',
      description: '学习ISO质量管理体系标准和实施要求',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2024-01-30',
      instructor: '质量部',
      category: '质量管理',
      progress: 45,
      totalQuizzes: 9,
      completedQuizzes: 4,
      tags: ['质量管理', 'ISO标准']
    },
    {
      id: 6,
      title: '新员工入职培训',
      description: '新员工必修的综合入职培训课程',
      status: 'pending',
      priority: 'low',
      dueDate: '2024-02-05',
      instructor: '人事部',
      category: '入职培训',
      progress: 0,
      totalQuizzes: 4,
      completedQuizzes: 0,
      tags: ['入职培训', '新员工']
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '学习中';
      case 'pending': return '未开始';
      case 'overdue': return '已逾期';
      default: return '未知';
    }
  };

  const filteredCourses = coursesData.filter(course => {
    if (activeTab !== 'all' && course.status !== activeTab) return false;
    if (filterStatus !== 'all' && course.status !== filterStatus) return false;
    return true;
  });

  const courseStats = {
    total: coursesData.length,
    completed: coursesData.filter(c => c.status === 'completed').length,
    in_progress: coursesData.filter(c => c.status === 'in_progress').length,
    pending: coursesData.filter(c => c.status === 'pending').length,
    overdue: coursesData.filter(c => c.status === 'overdue').length
  };

  const handleContinueLearning = (courseId) => {
    // 找到选中的课程
    const course = coursesData.find(c => c.id === courseId);
    setSelectedCourse(course);
    setCurrentView('quizList');
  };

  const handleBackToCourseList = () => {
    setCurrentView('courseList');
    setSelectedCourse(null);
    setSelectedQuizId(null);
  };

  const handleStartQuiz = (quizId) => {
    setSelectedQuizId(quizId);
    setCurrentView('quiz');
  };

  const handleBackToQuizList = () => {
    setCurrentView('quizList');
    setSelectedQuizId(null);
  };

  // 如果当前视图是小测页面，显示小测页面
  if (currentView === 'quiz' && selectedQuizId) {
    return (
      <QuizPage 
        quizId={selectedQuizId}
        onBack={handleBackToQuizList}
      />
    );
  }

  // 如果当前视图是小测列表，显示小测列表页面
  if (currentView === 'quizList' && selectedCourse) {
    return (
      <CourseQuizListPage 
        course={selectedCourse}
        onBack={handleBackToCourseList}
        onStartQuiz={handleStartQuiz}
        onProgressUpdate={(courseId, newProgress) => {
          // 更新课程进度的逻辑
          console.log(`更新课程 ${courseId} 进度为 ${newProgress}%`);
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">我的课程</h2>
            <p className="text-gray-600">管理和跟踪学习培训课程</p>
          </div>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">总课程</p>
                <p className="text-2xl font-bold text-gray-900">{courseStats.total}</p>
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
                <p className="text-2xl font-bold text-green-600">{courseStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">学习中</p>
                <p className="text-2xl font-bold text-blue-600">{courseStats.in_progress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">未开始</p>
                <p className="text-2xl font-bold text-gray-600">{courseStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">已逾期</p>
                <p className="text-2xl font-bold text-red-600">{courseStats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: '全部课程', count: courseStats.total },
          { key: 'pending', label: '未开始', count: courseStats.pending },
          { key: 'in_progress', label: '学习中', count: courseStats.in_progress },
          { key: 'completed', label: '已完成', count: courseStats.completed },
          { key: 'overdue', label: '已逾期', count: courseStats.overdue }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* 课程列表 */}
      <div className="grid gap-4">
        {filteredCourses.map(course => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600">{course.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">讲师: {course.instructor}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">截止: {course.dueDate}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">类别: {course.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        小测: {course.completedQuizzes}/{course.totalQuizzes}
                      </span>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">学习进度</span>
                      <span className="text-sm font-medium text-gray-900">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-3 ml-6">
                  {/* 状态标签 */}
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(course.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                      {getStatusText(course.status)}
                    </span>
                  </div>

                  {/* 优先级标签 */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(course.priority)}`}>
                    {course.priority === 'high' ? '高优先级' : course.priority === 'medium' ? '中优先级' : '低优先级'}
                  </span>

                  {/* 操作按钮 */}
                  {course.status !== 'completed' && (
                    <Button 
                      onClick={() => handleContinueLearning(course.id)}
                      className="flex items-center space-x-2"
                      size="sm"
                    >
                      <Play className="w-4 h-4" />
                      <span>{course.status === 'pending' ? '开始学习' : '继续学习'}</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无课程</h3>
          <p className="text-gray-600">当前筛选条件下没有找到相关课程</p>
        </div>
      )}
    </div>
  );
};

export default CoursePage;