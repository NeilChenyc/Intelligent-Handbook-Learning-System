const API_BASE_URL = 'http://localhost:8080';

// Get user's unredone wrong questions list
export const getUserWrongQuestions = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/wrong-questions/user/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取错题列表失败');
  }
  return response.json();
};

// Get user's wrong questions under specific course
export const getUserWrongQuestionsByCourse = async (userId, courseId) => {
  const response = await fetch(`${API_BASE_URL}/api/wrong-questions/user/${userId}/course/${courseId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取课程错题列表失败');
  }
  return response.json();
};

// Get user's wrong questions under specific quiz
export const getUserWrongQuestionsByQuiz = async (userId, quizId) => {
  const response = await fetch(`${API_BASE_URL}/api/wrong-questions/user/${userId}/quiz/${quizId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取小测错题列表失败');
  }
  return response.json();
};

// Get user's unredone wrong questions count statistics
export const getUserWrongQuestionsCount = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/wrong-questions/user/${userId}/count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取错题数量统计失败');
  }
  return response.json();
};

// Wrong question redo submission
export const submitWrongQuestionRedo = async (wrongQuestionId, answer) => {
  // Ensure answer is always array format to match backend expected selectedOptionIds
  const selectedOptionIds = Array.isArray(answer) ? answer : [answer];
  
  const response = await fetch(`${API_BASE_URL}/api/wrong-questions/${wrongQuestionId}/redo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ selectedOptionIds }),
  });

  if (!response.ok) {
    throw new Error('错题重做提交失败');
  }
  return response.json();
};

// Get wrong question details
export const getWrongQuestionDetail = async (wrongQuestionId) => {
  const response = await fetch(`${API_BASE_URL}/api/wrong-questions/${wrongQuestionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取错题详情失败');
  }
  return response.json();
};

// Batch mark wrong questions as redone
export const markWrongQuestionsAsRedone = async (wrongQuestionIds) => {
  const response = await fetch(`${API_BASE_URL}/api/wrong-questions/mark-redone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ wrongQuestionIds }),
  });

  if (!response.ok) {
    throw new Error('批量标记错题失败');
  }
  return response.json();
};

// Clean redone wrong question records
export const cleanupRedoneWrongQuestions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/wrong-questions/cleanup`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('清理错题记录失败');
  }
  return response.json();
};