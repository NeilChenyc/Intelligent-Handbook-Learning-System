import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import CourseUploadModal from './CourseUploadModal';
import CourseEditModal from './CourseEditModal';
import QuizManagementPage from './QuizManagementPage';
import { 
  Upload, 
  BookOpen, 
  Edit, 
  Eye, 
  FileText, 
  Calendar,
  Users,
  Clock,
  Plus
} from 'lucide-react';

const CourseManagementPage = () => {
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: 'React 基础教程',
      description: '学习 React 的基础知识和核心概念',
      uploadDate: '2024-01-15',
      status: 'published',
      studentsCount: 45,
      quizCount: 12,
      fileSize: '2.3 MB'
    },
    {
      id: 2,
      title: 'JavaScript 高级特性',
      description: '深入了解 JavaScript 的高级特性和最佳实践',
      uploadDate: '2024-01-10',
      status: 'draft',
      studentsCount: 23,
      quizCount: 8,
      fileSize: '1.8 MB'
    }
  ]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleUpload = (courseData) => {
    // 生成新的课程ID
    const newCourse = {
      ...courseData,
      id: courses.length + 1,
      tags: courseData.tags ? courseData.tags.split(',').map(tag => tag.trim()) : []
    };
    
    setCourses(prev => [...prev, newCourse]);
    setShowUploadModal(false);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
  };

  const handleSaveCourse = (updatedCourse) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    setEditingCourse(null);
  };

  const handleQuizManagement = (course) => {
    setSelectedCourse(course);
  };

  // 如果选中了课程，显示小测题目管理页面
  if (selectedCourse) {
    return (
      <QuizManagementPage 
        course={selectedCourse} 
        onBack={() => setSelectedCourse(null)} 
      />
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published':
        return '已发布';
      case 'draft':
        return '草稿';
      case 'processing':
        return '处理中';
      default:
        return '未知';
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((sum, course) => sum + course.studentsCount, 0)}
                </p>
                <p className="text-sm text-gray-600">学习人数</p>
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
                  {courses.reduce((sum, course) => sum + course.quizCount, 0)}
                </p>
                <p className="text-sm text-gray-600">小测题目</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(course => course.status === 'published').length}
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                        {getStatusText(course.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{course.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>上传时间: {course.uploadDate}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>学习人数: {course.studentsCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>题目数: {course.quizCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Upload className="w-4 h-4" />
                        <span>文件大小: {course.fileSize}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-6">
                    <Button size="sm" variant="outline" className="flex items-center space-x-1">
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
                      className="flex items-center space-x-1"
                      onClick={() => handleQuizManagement(course)}
                    >
                      <FileText className="w-4 h-4" />
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