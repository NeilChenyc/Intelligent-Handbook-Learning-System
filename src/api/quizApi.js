const API_BASE_URL = 'http://localhost:8080';

// 根据quizId获取题目列表
export const getQuestionsByQuiz = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/questions/quiz/${quizId}`);
  if (!response.ok) {
    throw new Error('获取题目列表失败');
  }
  return response.json();
};

// 根据ID获取quiz详情
export const getQuizById = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
  if (!response.ok) {
    throw new Error('获取测验详情失败');
  }
  return response.json();
};

// 开始小测尝试
export const startQuizAttempt = async (userId, quizId) => {
  const response = await fetch(`${API_BASE_URL}/quiz-attempts/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      quizId,
    }),
  });

  if (!response.ok) {
    throw new Error('开始小测失败');
  }
  return response.json();
};

// 提交quiz答案
export const submitQuizAnswers = async (attemptId, answers) => {
  const response = await fetch(`${API_BASE_URL}/quiz-attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answers),
  });

  if (!response.ok) {
    throw new Error('提交答案失败');
  }
  return response.json();
};

// 获取用户的小测尝试记录
export const getUserQuizAttempts = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/quiz-attempts/user/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取小测记录失败');
  }
  return response.json();
};

// 获取小测尝试详情
export const getQuizAttemptDetail = async (attemptId) => {
  const response = await fetch(`${API_BASE_URL}/quiz-attempts/${attemptId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取小测详情失败');
  }
  return response.json();
};

// 创建小测
export const createQuiz = async ({ courseId, title, description, passingScore }) => {
  const response = await fetch(`${API_BASE_URL}/quizzes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ courseId, title, description, passingScore }),
  });

  if (!response.ok) {
    throw new Error('创建小测失败');
  }
  return response.json();
};

// 获取课程下的小测列表
export const getQuizzesByCourse = async (courseId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/course/${courseId}`);
  if (!response.ok) {
    throw new Error('获取小测失败');
  }
  return response.json();
};