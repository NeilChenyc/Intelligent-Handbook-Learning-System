import { API_BASE_URL } from '../config/api';

// Get all questions under course
export const getQuestionsByCourse = async (courseId) => {
  const response = await fetch(`${API_BASE_URL}/questions/course/${courseId}`);
  if (!response.ok) {
    throw new Error('获取题目列表失败');
  }
  return response.json();
};

// Create new question
export const createQuestion = async (questionData) => {
  // Build request data to match backend DTO format
  const requestData = {
    text: questionData.questionText,
    type: questionData.type,
    points: questionData.points,
    quizId: questionData.quizId,
    explanation: questionData.explanation || '',
    options: (questionData.options || []).map(option => ({
      text: option.optionText,
      isCorrect: option.isCorrect
    }))
  };

  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`创建题目失败: ${errorText}`);
  }
  return response.json();
};

// Update question
export const updateQuestion = async (questionId, questionData) => {
  // Build request data, ensure quiz object format is correct
  const requestData = {
    questionText: questionData.questionText,
    type: questionData.type,
    points: questionData.points,
    orderIndex: questionData.orderIndex || 0,
    explanation: questionData.explanation || '',
    quiz: {
      id: questionData.quizId
    },
    options: questionData.options || []
  };

  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`更新题目失败: ${errorText}`);
  }
  return response.json();
};

// Delete question
export const deleteQuestion = async (questionId) => {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`删除题目失败: ${errorText}`);
  }
  return response.json();
};

// Batch assign questions to quiz
export const assignQuestionsToQuiz = async (questionIds, quizId) => {
  const response = await fetch(`${API_BASE_URL}/questions/assign-to-quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      questionIds,
      quizId,
    }),
  });

  if (!response.ok) {
    throw new Error('批量分配题目失败');
  }
  return response.json();
};

// Batch move questions to quiz
export const moveQuestionsToQuiz = async (questionIds, fromQuizId, toQuizId) => {
  const response = await fetch(`${API_BASE_URL}/questions/move-to-quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      questionIds,
      fromQuizId,
      toQuizId,
    }),
  });

  if (!response.ok) {
    throw new Error('批量移动题目失败');
  }
  return response.json();
};