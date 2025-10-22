// 课程相关API调用函数
const API_BASE_URL = 'http://localhost:8080';

// 获取所有活跃课程
export const getAllCourses = async () => {
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
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// 根据ID获取课程详情
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

// 根据教师ID获取课程列表
export const getCoursesByTeacher = async (teacherId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/teacher/${teacherId}`, {
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

// 搜索课程
export const searchCourses = async (title) => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/search?title=${encodeURIComponent(title)}`, {
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

// 创建新课程
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

// 更新课程
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

// 删除课程（软删除）
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

// 课程状态枚举
export const COURSE_STATUS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// 根据状态筛选课程
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

// 格式化课程数据用于显示
export const formatCourseForDisplay = (course) => {
  if (!course) return null;

  return {
    ...course,
    formattedCreatedAt: new Date(course.createdAt).toLocaleDateString('zh-CN'),
    formattedUpdatedAt: new Date(course.updatedAt).toLocaleDateString('zh-CN'),
    teacherName: course.teacher?.fullName || course.teacher?.username || '未知教师',
    quizCount: course.quizzes?.length || 0,
    statusText: course.isActive ? '活跃' : '已停用',
    // 确保PDF相关字段被包含
    handbookContent: course.handbookContent,
    handbookFileName: course.handbookFileName,
    handbookContentType: course.handbookContentType,
    handbookFileSize: course.handbookFileSize
  };
};