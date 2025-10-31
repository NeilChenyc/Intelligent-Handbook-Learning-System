const API_BASE_URL = 'http://localhost:8080';

// 根据quizIdGetQuestionList
export const getQuestionsByQuiz = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/questions/quiz/${quizId}`);
  if (!response.ok) {
    throw new Error('获取题目列表失败');
  }
  return response.json();
};

// 根据IDGetquizDetails
export const getQuizById = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
  if (!response.ok) {
    throw new Error('获取测验详情失败');
  }
  return response.json();
};

// StartQuiz尝试
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

// CommitquizAnswer
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

// GetUser的Quiz尝试Record
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

// GetQuiz尝试Details
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

// CreateQuiz
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

// GetCourse下的QuizList
export const getQuizzesByCourse = async (courseId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/course/${courseId}`);
  if (!response.ok) {
    throw new Error('获取小测失败');
  }
  return response.json();
};

// GetCourseQuizSummary（OptimizationVersion，不Package含QuestionDetails）
export const getQuizSummariesByCourse = async (courseId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/course/${courseId}/summaries`);
  if (!response.ok) {
    throw new Error('获取小测摘要失败');
  }
  return response.json();
};

// GetCourse下的QuizList（带User通过Information），采用后端聚合与Cache
export const getCourseQuizListCached = async (courseId, userId) => {
  const url = `${API_BASE_URL}/quizzes/course/${courseId}/list-cached?userId=${userId}`;
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    // CloneResponse以便在非200时Output原始Text
    const rawText = await response.clone().text().catch(() => '');

    if (!response.ok) {
      console.error('获取缓存小测列表失败: 非200响应', {
        status: response.status,
        url,
        body: rawText,
      });
      throw new Error(`获取缓存小测列表失败: ${response.status}`);
    }

    if (contentType.includes('application/json')) {
      return response.json();
    }

    // 非JSON但可能是可Parse的Text
    console.warn('缓存接口返回非JSON，尝试解析文本', { url, rawText });
    try {
      return JSON.parse(rawText);
    } catch (e) {
      console.error('解析非JSON文本失败', e);
      throw new Error('获取缓存小测列表失败: 返回体不可解析');
    }
  } catch (err) {
    console.error('调用缓存接口异常', { url, err });
    throw err;
  }
};