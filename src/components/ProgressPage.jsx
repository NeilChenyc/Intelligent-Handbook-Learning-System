import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Progress } from './ui/Progress';
import { BookOpen, Clock, Award, Target, Shield, FileText, Building } from 'lucide-react';
import { getUserLearningStats } from '../api/courseApi';
import { useAuth } from '../contexts/AuthContext';

const ProgressPage = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // GetUserLearningProgressData
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const stats = await getUserLearningStats(user.id);
        
        // ConversionDataFormat以适配现有的UIComponent
        const formattedData = {
          overall: stats.overallProgress,
          handbooks: stats.courses.map((course, index) => ({
            id: course.id,
            name: course.title,
            progress: course.progress,
            totalSections: course.totalQuizzes,
            completedSections: course.completedQuizzes,
            category: getCategoryFromCourse(course),
            mandatory: true // 假设所有Course都是必修的
          })),
          stats: {
            totalStudyTime: Math.round(stats.completedQuizzes * 0.5), // 估算LearningTime，每个quiz 0.5Hour
            completedHandbooks: stats.completedCourses,
            totalHandbooks: stats.totalCourses,
            certifications: stats.completedCourses, // 完成的Course数作为Certificate数
            complianceRate: stats.complianceRate
          }
        };
        
        setProgressData(formattedData);
      } catch (err) {
        console.error('Failed to fetch progress data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [user?.id]);

  // 根据CourseInformation推断分Class
  const getCategoryFromCourse = (course) => {
    const title = course.title?.toLowerCase() || '';
    if (title.includes('employee') || title.includes('员工') || title.includes('行为') || title.includes('考勤')) {
      return 'employee';
    } else if (title.includes('lab') || title.includes('实验') || title.includes('化学') || title.includes('设备')) {
      return 'lab';
    } else if (title.includes('safety') || title.includes('安全') || title.includes('消防')) {
      return 'safety';
    } else if (title.includes('quality') || title.includes('质量') || title.includes('iso')) {
      return 'quality';
    } else if (title.includes('compliance') || title.includes('合规') || title.includes('隐私') || title.includes('数据')) {
      return 'compliance';
    }
    return 'employee'; // Default分Class
  };

  // Get分ClassGraph标
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'employee': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'lab': return <Building className="w-5 h-5 text-green-500" />;
      case 'safety': return <Shield className="w-5 h-5 text-red-500" />;
      case 'quality': return <Award className="w-5 h-5 text-purple-500" />;
      case 'compliance': return <Shield className="w-5 h-5 text-orange-500" />;
      default: return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get分ClassName
  const getCategoryName = (category) => {
    switch (category) {
      case 'employee': return 'Employee Handbook';
      case 'lab': return 'Laboratory Manual';
      case 'safety': return 'Safety Standards';
      case 'quality': return 'Quality Management';
      case 'compliance': return 'Compliance Policy';
      default: return 'Other';
    }
  };

  // 环形ProgressComponent
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading progress data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error loading progress data: {error}</div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">No progress data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Policy Learning Progress</h2>
        <p className="text-gray-600">Track your company policy learning progress and compliance status</p>
      </div>

      {/* PopulationProgress卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>Overall Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CircularProgress percentage={progressData.overall} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Learning Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{progressData.stats.totalStudyTime}h</p>
                  <p className="text-sm text-gray-600">Study Hours</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {progressData.stats.completedHandbooks}/{progressData.stats.totalHandbooks}
                  </p>
                  <p className="text-sm text-gray-600">Completed Policies</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{progressData.stats.certifications}</p>
                  <p className="text-sm text-gray-600">Certifications Earned</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{progressData.stats.complianceRate}%</p>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 制度ManualProgressList */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Learning Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {progressData.handbooks.map((handbook) => (
              <div key={handbook.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(handbook.category)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{handbook.name}</h3>
                      <p className="text-sm text-gray-600">
                        {handbook.completedSections}/{handbook.totalSections} sections completed • {getCategoryName(handbook.category)}
                        {handbook.mandatory && <span className="text-red-600 ml-2">Required</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">{handbook.progress}%</span>
                  </div>
                </div>
                
                <Progress value={handbook.progress} className="h-3" />
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Completed {handbook.completedSections} sections</span>
                  <span>Need {handbook.totalSections - handbook.completedSections} more sections</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Learning Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Personalized Recommendations</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              {progressData.handbooks.filter(h => h.progress > 0 && h.progress < 100).length > 0 ? (
                <>
                  <li>• Continue with courses in progress to maintain learning momentum</li>
                  <li>• Focus on completing mandatory courses first</li>
                  <li>• Consider taking quizzes to test your knowledge</li>
                </>
              ) : (
                <>
                  <li>• Great job on your learning progress!</li>
                  <li>• Keep up the excellent work with your studies</li>
                  <li>• Consider reviewing completed materials periodically</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPage;