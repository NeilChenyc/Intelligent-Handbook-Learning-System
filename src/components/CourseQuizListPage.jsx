import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, Clock, AlertCircle, ArrowLeft, BookOpen, Play, Lock, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCourseQuizListCached } from '../api/quizApi';
import { API_BASE_URL } from '../config/api';

const CourseQuizListPage = ({ course, onBack, onProgressUpdate, onStartQuiz }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // TODO: Translate - Get course quiz data from backend
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        
        // Use backend aggregation + cache interface to get quiz summary and passed IDs
        const { quizzes: courseQuizzes, passedQuizIds } = await getCourseQuizListCached(course.id, user.id);

        // Sort quizzes by ID
        const sortedQuizzes = courseQuizzes.sort((a, b) => a.id - b.id);
        
        // Convert quiz data to component required format and set unlock status based on pass status
        const formattedQuizzes = sortedQuizzes.map((quiz, index) => {
          const isCompleted = passedQuizIds.includes(quiz.id);
          const isPreviousCompleted = index === 0 || passedQuizIds.includes(sortedQuizzes[index - 1].id);
          
          let status, unlocked;
          if (isCompleted) {
            status = 'completed';
            unlocked = true;
          } else if (isPreviousCompleted) {
            status = 'available';
            unlocked = true;
          } else {
            status = 'locked';
            unlocked = false;
          }
          
          return {
            id: quiz.id,
            quizNumber: index + 1,
            title: `Quiz ${index + 1}: ${quiz.title}`,
            description: quiz.description || 'No description available',
            status: status,
            score: null, // Can be extended later to get specific scores
            duration: quiz.timeLimitMinutes || 30,
            questions: quiz.questionCount || 0,
            attempts: 0, // Can be extended later to get attempt counts
            maxAttempts: quiz.maxAttempts || 3,
            unlocked: unlocked,
            totalPoints: quiz.totalPoints || 0,
            passingScore: quiz.passingScore || 80
          };
        });
        
        setQuizzes(formattedQuizzes);
      } catch (err) {
        console.error('Failed to fetch quiz data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (course?.id && user?.id) {
      fetchQuizzes();
    }
  }, [course?.id, user?.id, refreshTrigger]);

  // Add refresh function for external calls
  const refreshQuizzes = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Expose refresh function to parent component
  useEffect(() => {
    if (course && course.refreshQuizzes !== refreshQuizzes) {
      course.refreshQuizzes = refreshQuizzes;
    }
  }, [course, refreshQuizzes]);

  const handleStartQuiz = (quizId) => {
    // Call parent component callback function to navigate to quiz page
    if (onStartQuiz) {
      onStartQuiz(quizId);
    }
  };

  const handleCompleteQuiz = async (quizId, score) => {
    // Refetch data after quiz completion to update unlock status
    try {
      // Get all quizzes for the course
      const quizzesResponse = await fetch(`${API_BASE_URL}/quizzes/course/${course.id}`);
      if (!quizzesResponse.ok) {
        throw new Error('Failed to fetch quiz data');
      }
      const courseQuizzes = await quizzesResponse.json();
      
      // Get list of quiz IDs user has passed in this course
      let passedQuizIds = [];
      if (user?.id) {
        try {
          const passedResponse = await fetch(`${API_BASE_URL}/quiz-attempts/user/${user.id}/course/${course.id}/passed`);
          if (passedResponse.ok) {
            passedQuizIds = await passedResponse.json();
          }
        } catch (error) {
          console.warn('Failed to fetch passed quiz information:', error);
        }
      }
      
      // Sort quizzes by ID
      const sortedQuizzes = courseQuizzes.sort((a, b) => a.id - b.id);
      
      // Convert quiz data to component required format and set unlock status based on pass status
      const formattedQuizzes = sortedQuizzes.map((quiz, index) => {
        const isCompleted = passedQuizIds.includes(quiz.id);
        const isPreviousCompleted = index === 0 || passedQuizIds.includes(sortedQuizzes[index - 1].id);
        
        let status, unlocked;
        if (isCompleted) {
          status = 'completed';
          unlocked = true;
        } else if (isPreviousCompleted) {
          status = 'available';
          unlocked = true;
        } else {
          status = 'locked';
          unlocked = false;
        }
        
        return {
          id: quiz.id,
          quizNumber: index + 1,
          title: `Quiz ${index + 1}: ${quiz.title}`,
          description: quiz.description || 'No description available',
          status: status,
          score: null, // Can be extended later to get specific scores
          duration: quiz.timeLimitMinutes || 30,
          questions: quiz.questionCount || 0,
          attempts: 0, // Can be extended later to get attempt counts
          maxAttempts: quiz.maxAttempts || 3,
          unlocked: unlocked,
          totalPoints: quiz.totalPoints || 0,
          passingScore: quiz.passingScore || 80
        };
      });
      
      setQuizzes(formattedQuizzes);

      // Calculate and update course progress
      const completedQuizzes = passedQuizIds.length;
      const totalQuizzes = formattedQuizzes.length;
      const newProgress = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;
      
      if (onProgressUpdate) {
        onProgressUpdate(course.id, newProgress);
      }
    } catch (error) {
      console.error('Update quiz status failed:', error);
    }
  };

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

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate statistics
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter(q => q.status === 'completed').length;
  const courseProgress = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;
  const averageScore = quizzes.filter(q => q.score !== null).reduce((sum, q) => sum + q.score, 0) / (completedQuizzes || 1);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-4 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course List</span>
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quiz data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-4 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course List</span>
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Loading Failed</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ReturnButton和CourseTitle */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-4 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course List</span>
        </Button>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <div className="mb-4">
                <p 
                  className={`text-gray-600 ${
                    !isDescriptionExpanded 
                      ? 'line-clamp-3 overflow-hidden' 
                      : ''
                  }`}
                  style={!isDescriptionExpanded ? {
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'pre-wrap'
                  } : {
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {course.description}
                </p>
                {course.description && course.description.split('\n').length > 3 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 transition-colors"
                  >
                    <span>{isDescriptionExpanded ? 'Show Less' : 'Show More'}</span>
                    {isDescriptionExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>Course ID: {course.id}</span>
                <span>Quiz Count: {totalQuizzes}</span>
                <span>Completed: {completedQuizzes}</span>
              </div>
            </div>
          </div>
          
          {/* CourseProgress */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Course Progress</span>
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

      {/* StatisticsInfo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Quizzes</p>
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
                <p className="text-sm text-gray-600">Completed</p>
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
                <p className="text-sm text-gray-600">Remaining</p>
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
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {completedQuizzes > 0 ? Math.round(averageScore) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QuizList */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz List</h2>
        
        {quizzes.map((quiz, index) => (
          <Card key={quiz.id} className={`transition-all duration-200 ${
            quiz.status === 'available' ? 'hover:shadow-md border-blue-200' : 
            quiz.status === 'completed' ? 'border-green-200' : 'border-gray-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Serial Number和StatusGraph标 */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {quiz.quizNumber}
                    </div>
                    {getStatusIcon(quiz.status)}
                  </div>

                  {/* QuizInfo */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                    </div>
                    
                    <p 
                      className="text-gray-600 mb-3"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {quiz.description}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.duration} minutes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{quiz.questions} questions</span>
                      </div>
                      {quiz.status === 'completed' && quiz.score !== null && (
                        <div className="flex items-center space-x-1">
                          <Trophy className="w-4 h-4" />
                          <span className={`font-medium ${getScoreColor(quiz.score)}`}>
                            {quiz.score} points
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作Button */}
                <div className="ml-6">
                  {quiz.status === 'available' && quiz.unlocked && (
                    <Button 
                      onClick={() => handleStartQuiz(quiz.id)}
                      className="flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Quiz</span>
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
                        <span>Retake Quiz</span>
                      </Button>
                      {quiz.attempts >= quiz.maxAttempts && (
                        <span className="text-xs text-gray-500 text-center">
                          Maximum attempts reached
                        </span>
                      )}
                    </div>
                  )}
                  
                  {quiz.status === 'locked' && (
                    <div className="text-center">
                      <Lock className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs text-gray-500">Need to complete previous quiz</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* HintInfo */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Quiz Instructions:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Quizzes must be completed in order, finish the previous one to unlock the next</li>
              <li>• Each quiz can be attempted up to {quizzes[0]?.maxAttempts || 3} times</li>
              <li>• After completing all quizzes, course progress will be updated to 100%</li>
              <li>• Quiz passing standard is 80% accuracy (80 points or above)</li>
              <li>• Only by passing the previous quiz can you unlock the next quiz</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseQuizListPage;