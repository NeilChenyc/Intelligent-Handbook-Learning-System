// APIConfigurationFile
const getApiBaseUrl = () => {
  // 根据EnvironmentVariable或当前域名自动确定API基础URL
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // 开发Environment
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080';
  }
  
  // 生产Environment - GitHub Pages
  if (window.location.hostname.includes('github.io')) {
    return 'https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net';
  }
  
  // 生产Environment - VercelDeployment
  if (window.location.hostname.includes('vercel.app')) {
    // 对于Vercel部署，可以使用环境变量或者你的后端API地址
    return process.env.REACT_APP_PRODUCTION_API_URL || 'https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net';
  }
  
  // 生产Environment - AzureDeployment
  if (window.location.hostname.includes('azurewebsites.net')) {
    return 'https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net';
  }
  
  // Default本地开发
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();

// Common的fetchWrapper，AddMistakeProcess和Retry逻辑
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