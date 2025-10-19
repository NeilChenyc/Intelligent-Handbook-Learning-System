import React, { useState } from 'react';
import { User, Lock, UserCheck, GraduationCap } from 'lucide-react';

const LoginPage = ({ onLogin, onShowRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'admin' // 'admin' or 'student'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 模拟用户数据
  const users = {
    admin: {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: '系统管理员'
    },
    student: {
      username: 'student',
      password: 'student123', 
      role: 'student',
      name: '学员用户'
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // 清除错误信息
  };

  const handleUserTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      userType: type,
      username: '',
      password: ''
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 调用后端登录API
      const response = await fetch('http://localhost:8081/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // 登录成功
        const userInfo = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          fullName: data.user.fullName,
          role: data.user.role.toLowerCase(),
          name: data.user.fullName || data.user.username,
          loginTime: new Date().toISOString()
        };
        
        // 保存到localStorage
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        // 调用父组件的登录回调
        onLogin(userInfo);
      } else {
        setError(data.message || '登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">智能手册学习系统</h1>
          <p className="text-gray-600">请选择身份类型并登录</p>
        </div>

        {/* 身份类型选择 */}
        <div className="mb-6">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => handleUserTypeChange('student')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                formData.userType === 'student'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              学员登录
            </button>
            <button
              type="button"
              onClick={() => handleUserTypeChange('admin')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                formData.userType === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              管理员登录
            </button>
          </div>
        </div>

        {/* 功能提示 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">💡</span>
              </div>
            </div>
            <div>
               <p className="text-blue-800 text-sm font-medium mb-1">功能体验提示</p>
               <p className="text-blue-700 text-sm">
                 请在管理员模式登录demo浏览完整功能，账号密码随便输即可
               </p>
             </div>
          </div>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder={formData.userType === 'admin' ? '请输入管理员用户名' : '请输入学员用户名'}
                required
              />
            </div>
          </div>

          {/* 密码输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              还没有账户？
              <button
                onClick={onShowRegister}
                className="text-blue-600 hover:text-blue-700 font-medium ml-1"
              >
                立即注册
              </button>
            </p>
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            } text-white`}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;