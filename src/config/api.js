// API配置文件
const getApiBaseUrl = () => {
  // 根据环境变量或当前域名自动确定API基础URL
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // 开发环境
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080';
  }
  
  // 生产环境 - Azure部署
  if (window.location.hostname.includes('azurewebsites.net')) {
    return 'https://quiz-backend-app.azurewebsites.net';
  }
  
  // 默认本地开发
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();

// 通用的fetch包装器，添加错误处理和重试逻辑
export const apiRequest = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(fullUrl, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export default API_BASE_URL;