// TODO: Translate - Import getCourseQuizListCached function
import { getCourseQuizListCached } from './quizApi';

// Course relatedAPI调用Function
const API_BASE_URL = 'http://localhost:8080';

// Get all active courses (backend already ignores PDF binary fields)
export const getAllCourses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/summaries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const courses = await response.json();
    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// New: Get complete course list (for management page, including department fields)
export const getAllCoursesFull = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const courses = await response.json();
    return courses;
  } catch (error) {
    console.error('Error fetching full courses:', error);
    throw error;
  }
};

// Download course handbook PDF on demand (only request when user clicks)
export const downloadCourseHandbook = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/handbook`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('该课程暂无手册文件');
      }
      throw new Error(`下载失败，状态码: ${response.status}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error downloading handbook:', error);
    throw error;
  }
};

// Get course details by ID
export const getCourseById = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Course not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const course = await response.json();
    return course;
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    throw error;
  }
};

// Get course list by teacher ID
export const getCoursesByTeacher = async (teacherId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/summaries/teacher/${teacherId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const courses = await response.json();
    return courses;
  } catch (error) {
    console.error('Error fetching courses by teacher:', error);
    throw error;
  }
};

// Search courses
export const searchCourses = async (title) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/summaries/search?title=${encodeURIComponent(title)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const courses = await response.json();
    return courses;
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
};

// Create course
export const createCourse = async (courseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const course = await response.json();
    return course;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Update course
export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const course = await response.json();
    return course;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

// Delete course (soft delete)
export const deleteCourse = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

// Cascade hard delete course and its associated data
export const deleteCourseCascade = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/cascade`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error cascade deleting course:', error);
    throw error;
  }
};

// Course status enum
export const COURSE_STATUS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// Filter courses by status
export const filterCoursesByStatus = (courses, status) => {
  if (!courses || !Array.isArray(courses)) {
    return [];
  }

  switch (status) {
    case COURSE_STATUS.ACTIVE:
      return courses.filter(course => course.isActive === true);
    case COURSE_STATUS.INACTIVE:
      return courses.filter(course => course.isActive === false);
    case COURSE_STATUS.ALL:
    default:
      return courses;
  }
};

// Format course data for display
export const formatCourseForDisplay = (course) => {
  if (!course) return null;

  const createdAtDate = course.createdAt ? new Date(course.createdAt) : null;
  const updatedAtDate = course.updatedAt ? new Date(course.updatedAt) : null;

  const teacherName = (
    (course.teacher && (course.teacher.fullName || course.teacher.username)) ||
    course.teacherFullName ||
    '未知教师'
  );

  const teacherObj = course.teacher || (
    (course.teacherFullName || course.teacherId)
      ? {
          id: course.teacherId ?? null,
          fullName: course.teacherFullName ?? undefined,
          username: course.teacherFullName ?? undefined,
        }
      : undefined
  );

  return {
    ...course,
    teacher: teacherObj,
    teacherName,
    formattedCreatedAt: createdAtDate ? createdAtDate.toLocaleDateString('zh-CN') : '未知',
    formattedUpdatedAt: updatedAtDate ? updatedAtDate.toLocaleDateString('zh-CN') : '未知',
    handbookContent: course.handbookContent,
    handbookFileName: course.handbookFileName,
    handbookContentType: course.handbookContentType,
    handbookFileSize: course.handbookFileSize,
  };
};


// Get user course learning progress
export const getUserCourseProgress = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/summaries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const courses = await response.json();
    
    // Get progress info for each course
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        try {
          // Get quiz list under course和User通过情况
          const { quizzes, passedQuizIds } = await getCourseQuizListCached(course.id, userId);
          
          // Calculate progress
          const totalQuizzes = quizzes.length;
          const completedQuizzes = passedQuizIds.length;
          const progress = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;
          
          return {
            ...course,
            totalQuizzes,
            completedQuizzes,
            progress,
            status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started'
          };
        } catch (error) {
          console.warn(`Failed to get progress for course ${course.id}:`, error);
          return {
            ...course,
            totalQuizzes: 0,
            completedQuizzes: 0,
            progress: 0,
            status: 'not_started'
          };
        }
      })
    );

    return coursesWithProgress;
  } catch (error) {
    console.error('Error fetching user course progress:', error);
    throw error;
  }
};

// Get user learning statistics
export const getUserLearningStats = async (userId) => {
  try {
    const coursesWithProgress = await getUserCourseProgress(userId);
    
    const totalCourses = coursesWithProgress.length;
    const completedCourses = coursesWithProgress.filter(course => course.status === 'completed').length;
    const inProgressCourses = coursesWithProgress.filter(course => course.status === 'in_progress').length;
    const totalQuizzes = coursesWithProgress.reduce((sum, course) => sum + course.totalQuizzes, 0);
    const completedQuizzes = coursesWithProgress.reduce((sum, course) => sum + course.completedQuizzes, 0);
    
    // Calculate overall progress
    const overallProgress = totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;
    
    // Calculate compliance rate (percentage of completed courses)
    const complianceRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
    
    return {
      overallProgress,
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalQuizzes,
      completedQuizzes,
      complianceRate,
      courses: coursesWithProgress
    };
  } catch (error) {
    console.error('Error fetching user learning stats:', error);
    throw error;
  }
};