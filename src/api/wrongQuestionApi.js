const API_BASE_URL = 'http://localhost:8080';

// 获取用户未重做的错题列表
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

// 获取用户在特定课程下的错题
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

// 获取用户在特定小测下的错题
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

// 获取用户未重做错题数量统计
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

// 错题重做提交
export const submitWrongQuestionRedo = async (wrongQuestionId, answer) => {
  // 确保answer始终是数组格式，以匹配后端期望的selectedOptionIds
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

// 获取错题详情
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

// 批量标记错题为已重做
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

// 清理已重做的错题记录
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