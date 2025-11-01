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
  const [currentView, setCurrentView] = useState('courseList'); // TODO: Translate - 'courseList', 'quizList', or 'quiz'
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  
  // Add state management
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch course data
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesData = await getAllCourses();
      const formattedCourses = coursesData.map(formatCourseForDisplay);
      
      // Filter courses based on user department
      const filteredCourses = formattedCourses.filter(course => {
        // Show courses with department "Everyone" or null
        if (!course.department || course.department === 'Everyone') {
          return true;
        }
        // Show courses with department matching user's department
        if (user && user.department && course.department === user.department) {
          return true;
        }
        return false;
      });
      
      setCourses(filteredCourses);
  } catch (err) {
    console.error('Failed to fetch courses:', err);
    setError('Failed to fetch course list, please try again later');
  } finally {
    setLoading(false);
  }
};

  // Refresh course data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchCourses();
    } finally {
      setRefreshing(false);
    }
  };

  // Get data when component mounts
  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses by status
  const displayedCourses = filterCoursesByStatus(courses, filterStatus).filter(course => {
    if (activeTab !== 'all') {
      // Map backend isActive status to frontend status
      const frontendStatus = course.isActive ? 'active' : 'inactive';
      return activeTab === frontendStatus;
    }
    return true;
  });

  // Get course status related helper functions
  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  // Limit description to first 3 lines
  const limitDescriptionToThreeLines = (description) => {
    if (!description) return '';
    const lines = description.split('\n');
    return lines.slice(0, 3).join('\n');
  };

  // Calculate course statistics
  const courseStats = {
    total: courses.length,
    active: courses.filter(c => c.isActive).length,
    inactive: courses.filter(c => !c.isActive).length,
  };

  // Handle PDF download
  const handleDownloadHandbook = async (course) => {
    try {
      // Use frontend API to download PDF file on demand (backend path: /courses/{id}/handbook)
      const blob = await downloadCourseHandbook(course.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = course.handbookFileName || `${course.title}_Handbook.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF file:', error);
      alert('Failed to download file, please try again later');
    }
  };

  const handleContinueLearning = (courseId) => {
    // Find selected course
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

  const handleQuizComplete = (quizId, score, passed, nextQuizId) => {
    // Processing logic after quiz completion
    if (passed && nextQuizId) {
      // If passed and has next quiz, navigate to next quiz
      setSelectedQuizId(nextQuizId);
    } else {
      // Otherwise return to quiz list page, let CourseQuizListPage refresh data
      setCurrentView('quizList');
      setSelectedQuizId(null);
      // Trigger CourseQuizListPage refresh
      if (selectedCourse && selectedCourse.refreshQuizzes) {
        selectedCourse.refreshQuizzes();
      }
    }
  };

  // If current view is quiz page, show quiz page
  if (currentView === 'quiz' && selectedQuizId) {
    return (
      <QuizPage 
        quizId={selectedQuizId}
        courseName={selectedCourse?.title}
        course={selectedCourse}
        onBack={handleBackToQuizList}
        onQuizComplete={handleQuizComplete}
      />
    );
  }

  // If current view is quiz list, show quiz list page
  if (currentView === 'quizList' && selectedCourse) {
    return (
      <CourseQuizListPage 
        course={selectedCourse}
        onBack={handleBackToCourseList}
        onStartQuiz={handleStartQuiz}
        onProgressUpdate={(courseId, newProgress) => {
          // Logic for updating course progress
          console.log(`Update course ${courseId} progress to ${newProgress}%`);
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h2>
            <p className="text-gray-600">Manage and track learning training courses</p>
          </div>
        </div>
      </div>

      {/* Statistics概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
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
                <p className="text-sm text-gray-600">Active Courses</p>
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
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{courseStats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选Label */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Courses', count: courseStats.total },
          { key: 'active', label: 'Active Courses', count: courseStats.active },
          { key: 'inactive', label: 'Inactive', count: courseStats.inactive }
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

      {/* CourseList */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCourses} variant="outline">
            Retry
          </Button>
        </div>
      ) : displayedCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No course data available</p>
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
                        <p className="text-sm text-gray-600" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{course.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Instructor: {course.teacher?.fullName || course.teacher?.username || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Created: {new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Quiz Count: {course.quizCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* StatusLabel */}
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
                      Start Learning
                    </Button>
                    {course.handbookFileName && (
                      <Button
                        onClick={() => handleDownloadHandbook(course)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Browse Handbook</span>
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