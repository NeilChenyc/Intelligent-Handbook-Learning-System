// APIConfigurationFile
const getApiBaseUrl = () => {
  // 根据EnvironmentVariable或当前域名自动确定API基础URL
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // 开发Environment - 默认使用本地后端
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080';
  }
  
  // 生产Environment - GitHub Pages
  if (window.location.hostname.includes('github.io')) {
    return 'https://5620-gpgthzarcqduh2fe.australiaeast-01.azurewebsites.net';
  }
  
  // 生产Environment - VercelDeployment
  if (window.location.hostname.includes('vercel.app')) {
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
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // 如果使用Azure Dev Tunnels，添加必要的头部
  if (API_BASE_URL.includes('devtunnels.ms')) {
    defaultHeaders['Accept'] = 'application/json, text/plain, */*';
  }
  
  const defaultOptions = {
    headers: defaultHeaders,
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