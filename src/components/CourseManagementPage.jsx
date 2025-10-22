import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Trash2, 
  MoreVertical,
  FileText,
  Clock,
  Tag
} from 'lucide-react';
import CourseUploadModal from './CourseUploadModal';
import CourseEditModal from './CourseEditModal';
import QuestionManagementPage from './QuestionManagementPage';
import { getAllCourses, updateCourse, deleteCourse } from '../api/courseApi';

const CourseManagementPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourseForQuestions, setSelectedCourseForQuestions] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // 获取课程数据
  const fetchCourses = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const coursesData = await getAllCourses();
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      
      // 如果是网络错误且重试次数少于3次，自动重试
      if (retryCount < 3 && (err.name === 'AbortError' || err.message.includes('fetch'))) {
        console.log(`重试获取课程数据，第 ${retryCount + 1} 次`);
        setTimeout(() => {
          fetchCourses(retryCount + 1);
        }, 1000 * (retryCount + 1)); // 递增延迟
        return;
      }
      
      let errorMessage = '获取课程列表失败，请稍后重试';
      if (err.name === 'AbortError') {
        errorMessage = '请求超时，请检查网络连接';
      } else if (err.message.includes('500')) {
        errorMessage = '服务器内部错误，请稍后重试';
      } else if (err.message.includes('404')) {
        errorMessage = '服务未找到，请检查后端服务是否正常运行';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchCourses();
  }, []);

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleUpload = (courseData) => {
    // 重新获取课程列表以确保数据同步
    fetchCourses();
    setShowUploadModal(false);
  };

  // 添加加载和错误状态的处理
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">加载课程数据中...</p>
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
            <div className="text-red-500 mb-4">
              <BookOpen className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchCourses} className="flex items-center space-x-2">
              <span>重试</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course);
  };

  const handleSaveCourse = async (updatedCourse) => {
    try {
      const savedCourse = await updateCourse(updatedCourse.id, {
        title: updatedCourse.title,
        description: updatedCourse.description,
        teacherId: updatedCourse.teacher?.id
      });
      
      // 更新本地状态
      setCourses(prev => prev.map(c => c.id === savedCourse.id ? savedCourse : c));
      setEditingCourse(null);
      
      // 可选：显示成功消息
      alert('课程更新成功！');
    } catch (error) {
      console.error('Failed to update course:', error);
      alert('更新课程失败，请稍后重试');
    }
  };

  const handleQuestionManagement = (course) => {
    setSelectedCourseForQuestions(course);
  };

  const handlePreviewCourse = async (course) => {
    try {
      // 调用后端API下载PDF文件
      const response = await fetch(`http://localhost:8080/api/courses/${course.id}/handbook`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert('该课程暂无手册文件');
          return;
        }
        throw new Error('下载失败');
      }

      // 获取文件内容
      const blob = await response.blob();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = course.handbookFileName || `${course.title}_手册.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载PDF失败:', error);
      alert('下载失败，请稍后重试');
    }
  };

  // 如果选中了课程进行题目管理，显示题目管理页面
  if (selectedCourseForQuestions) {
    return (
      <QuestionManagementPage 
        course={selectedCourseForQuestions} 
        onBack={() => setSelectedCourseForQuestions(null)} 
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">课程管理</h2>
            <p className="text-gray-600">管理和上传课程手册，自动生成小测题目</p>
          </div>
          <Button 
            onClick={handleUploadClick}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>上传新课程</span>
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                <p className="text-sm text-gray-600">总课程数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((sum, course) => sum + (course.quizzes?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">小测题目</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(course => course.isActive).length}
                </p>
                <p className="text-sm text-gray-600">已发布</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 课程列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span>课程列表</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {course.isActive ? '已发布' : '未发布'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{course.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>创建时间: {new Date(course.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>教师: {course.teacher?.fullName || course.teacher?.username || '未知'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-6">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center space-x-1"
                      onClick={() => handlePreviewCourse(course)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>预览</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center space-x-1"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit className="w-4 h-4" />
                      <span>编辑</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center space-x-1"
                      onClick={() => handleQuestionManagement(course)}
                    >
                      <Edit className="w-4 h-4" />
                      <span>题目管理</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <BookOpen className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无课程</h3>
              <p className="text-gray-500 mb-4">开始上传您的第一个课程手册</p>
              <Button onClick={handleUploadClick} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>上传课程</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 上传模态框 */}
      <CourseUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />

      {/* 编辑模态框 */}
      {editingCourse && (
        <CourseEditModal
          isOpen={!!editingCourse}
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSave={handleSaveCourse}
        />
      )}
    </div>
  );
};

export default CourseManagementPage;