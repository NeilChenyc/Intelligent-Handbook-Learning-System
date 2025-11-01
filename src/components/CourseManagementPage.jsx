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
import { getAllCourses, updateCourse, deleteCourse, deleteCourseCascade, formatCourseForDisplay, downloadCourseHandbook } from '../api/courseApi';

const CourseManagementPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourseForQuestions, setSelectedCourseForQuestions] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // 过滤和搜索课程
  const filteredCourses = courses.filter(course => {
    // 搜索过滤
    const matchesSearch = searchTerm === '' || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.teacher?.fullName && course.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.teacher?.username && course.teacher.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 状态过滤
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'published' && course.isActive) ||
      (filterStatus === 'unpublished' && !course.isActive);
    
    // 部门过滤
    const matchesDepartment = filterDepartment === 'all' || 
      course.department === filterDepartment ||
      (filterDepartment === 'everyone' && (!course.department || course.department === 'Everyone'));
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // 获取所有唯一的部门
  const departments = [...new Set(courses.map(course => course.department || 'Everyone'))];

  // GetCourseData
  const fetchCourses = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const coursesData = await getAllCourses();
      setCourses(coursesData.map(formatCourseForDisplay));
    } catch (err) {
      console.log('Error fetching courses:', error);
      setError('Failed to load courses');
      
      // 如果是NetworkMistake且Retry次数少于3次，自动Retry
      if (retryCount < 3 && (err.name === 'AbortError' || err.message.includes('fetch'))) {
        console.log(`重试获取课程数据，第 ${retryCount + 1} 次`);
        setTimeout(() => {
          fetchCourses(retryCount + 1);
        }, 1000 * (retryCount + 1)); // 递增Latency
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

  useEffect(() => {
    fetchCourses();
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handlePreviewCourse = async (course) => {
    try {
      const blob = await downloadCourseHandbook(course.id);
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
      alert(error.message || '下载文件失败，请稍后重试');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
  };

  const handleSaveCourse = async (updatedCourse) => {
    try {
      await updateCourse(updatedCourse.id, updatedCourse);
      alert('Course update successful');
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      alert('Course update failed: ' + err.message);
    }
  };

  const handleQuestionManagement = (course) => {
    setSelectedCourseForQuestions(course);
  };

  // 新增：DeleteCourse（级联硬Delete）
  const handleDeleteCourse = async (course) => {
    const ok = window.confirm(
      `Are you sure you want to delete the course?“${course.title}”`
    );
    if (!ok) return;

    try {
      await deleteCourseCascade(course.id);
      alert('Courses and related data have been deleted.');
      fetchCourses();
    } catch (err) {
      alert('删除失败: ' + (err.message || '请检查后端服务'));
    }
  };

  if (selectedCourseForQuestions) {
    return (
      <QuestionManagementPage 
        course={selectedCourseForQuestions}
        onBack={() => setSelectedCourseForQuestions(null)}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600">Manage and upload course manuals, automatically generate quiz questions</p>
          </div>
          <div>
            <Button onClick={handleUploadClick} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Upload Course</span>
            </Button>
          </div>
        </div>

        {/* Search and filter */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 pl-9"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          </div>
          <div className="relative filter-dropdown-container">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </Button>
            
            {/* Filter dropdown */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-4 space-y-4">
                  {/* Status filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="unpublished">Unpublished</option>
                    </select>
                  </div>
                  
                  {/* Department filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select 
                      value={filterDepartment} 
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="all">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Clear filters */}
                  <div className="pt-2 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterDepartment('all');
                        setSearchTerm('');
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span>Course List</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchCourses()} variant="outline">
                Retry
              </Button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <BookOpen className="w-12 h-12 mx-auto" />
              </div>
              {courses.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
                  <p className="text-gray-500 mb-4">Start by uploading your first course manual</p>
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses match your filters</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setFilterDepartment('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {course.isActive ? 'Published' : 'Unpublished'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>{course.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {new Date(course.createdAt).toLocaleDateString('en-US')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>Instructor: {course.teacher?.fullName || course.teacher?.username || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4" />
                          <span>Department: {course.department || 'Everyone'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-6">
                      {course.handbookFileName && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex items-center space-x-1"
                          onClick={() => handlePreviewCourse(course)}
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview</span>
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center space-x-1"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center space-x-1"
                        onClick={() => handleQuestionManagement(course)}
                      >
                        <Edit className="w-4 h-4" />
                        <span>Question Management</span>
                      </Button>
                      {/* 新增：DeleteButton */}
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteCourse(course)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload modal */}
      <CourseUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={() => fetchCourses()}
      />

      {/* Edit modal */}
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