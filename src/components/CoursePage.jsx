import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, Clock, AlertCircle, Plus, Calendar, User, Tag, Filter, BookOpen, Play, RefreshCw, Download } from 'lucide-react';
import CourseQuizListPage from './CourseQuizListPage';
import QuizPage from './QuizPage';
import { getAllCourses, formatCourseForDisplay, COURSE_STATUS, filterCoursesByStatus, downloadCourseHandbook } from '../api/courseApi';
import { useAuth } from '../contexts/AuthContext';

const CoursePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentView, setCurrentView] = useState('courseList'); // 'courseList', 'quizList', or 'quiz'
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  
  // 新增状态管理
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // 获取课程数据
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesData = await getAllCourses();
      const formattedCourses = coursesData.map(formatCourseForDisplay);
      
      // 根据用户部门筛选课程
      const filteredCourses = formattedCourses.filter(course => {
        // 显示 department 为 "Everyone" 或 null 的课程
        if (!course.department || course.department === 'Everyone') {
          return true;
        }
        // 显示 department 与用户部门相同的课程
        if (user && user.department && course.department === user.department) {
          return true;
        }
        return false;
      });
      
      setCourses(filteredCourses);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('获取课程列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 刷新课程数据
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchCourses();
    } finally {
      setRefreshing(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchCourses();
  }, []);

  // 根据状态筛选课程
  const displayedCourses = filterCoursesByStatus(courses, filterStatus).filter(course => {
    if (activeTab !== 'all') {
      // 将后端的isActive状态映射到前端的状态
      const frontendStatus = course.isActive ? 'active' : 'inactive';
      return activeTab === frontendStatus;
    }
    return true;
  });

  // 获取课程状态相关的辅助函数
  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = (isActive) => {
    return isActive ? '活跃' : '已停用';
  };

  // 计算课程统计
  const courseStats = {
    total: courses.length,
    active: courses.filter(c => c.isActive).length,
    inactive: courses.filter(c => !c.isActive).length,
  };

  // 处理PDF下载
  const handleDownloadHandbook = async (course) => {
    try {
      // 使用前端API按需下载PDF文件（后端路径：/courses/{id}/handbook）
      const blob = await downloadCourseHandbook(course.id);

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = course.handbookFileName || `${course.title}_手册.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载PDF文件失败:', error);
      alert('下载文件失败，请稍后重试');
    }
  };

  const handleContinueLearning = (courseId) => {
    // 找到选中的课程
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      setCurrentView('quizList');
    }
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
        courseName={selectedCourse?.title}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                <p className="text-sm text-gray-600">活跃课程</p>
                <p className="text-2xl font-bold text-green-600">{courseStats.active}</p>
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
                <p className="text-sm text-gray-600">已停用</p>
                <p className="text-2xl font-bold text-gray-600">{courseStats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: '全部课程', count: courseStats.total },
          { key: 'active', label: '活跃课程', count: courseStats.active },
          { key: 'inactive', label: '已停用', count: courseStats.inactive }
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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCourses} variant="outline">
            重试
          </Button>
        </div>
      ) : displayedCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">暂无课程数据</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedCourses.map(course => (
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">讲师: {course.teacher?.username || '未指定'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">创建时间: {new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          测验数量: {course.quizzes?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* 状态标签 */}
                    <div className="flex items-center space-x-2 mb-4">
                      {getStatusIcon(course.isActive)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(course.isActive)}`}>
                        {getStatusText(course.isActive)}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setSelectedCourse(course);
                        setCurrentView('quizList');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      开始学习
                    </Button>
                    {course.handbookFileName && (
                      <Button
                        onClick={() => handleDownloadHandbook(course)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>浏览手册</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
   );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面标题和刷新按钮 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">课程管理</h1>
          <p className="text-gray-600 mt-2">管理和查看所有课程信息</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>刷新</span>
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">全部课程</p>
                <p className="text-2xl font-bold text-blue-600">{courseStats.total}</p>
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
                <p className="text-sm text-gray-600">活跃课程</p>
                <p className="text-2xl font-bold text-green-600">{courseStats.active}</p>
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
                <p className="text-sm text-gray-600">已停用</p>
                <p className="text-2xl font-bold text-gray-600">{courseStats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: '全部课程', count: courseStats.total },
          { key: 'active', label: '活跃课程', count: courseStats.active },
          { key: 'inactive', label: '已停用', count: courseStats.inactive }
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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCourses} variant="outline">
            重试
          </Button>
        </div>
      ) : displayedCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">暂无课程数据</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedCourses.map(course => (
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">讲师: {course.teacher?.username || '未指定'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">创建时间: {new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          测验数量: {course.quizzes?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* 状态标签 */}
                    <div className="flex items-center space-x-2 mb-4">
                      {getStatusIcon(course.isActive)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(course.isActive)}`}>
                        {getStatusText(course.isActive)}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setSelectedCourse(course);
                        setCurrentView('quizList');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      查看测验
                    </Button>
                    {course.handbookFileName && (
                      <Button
                        onClick={() => handleDownloadHandbook(course)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>浏览手册</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursePage;