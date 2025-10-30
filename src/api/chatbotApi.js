// 导入现有API函数作为tools
import { 
  getAllCourses, 
  getAllCoursesFull, 
  getCourseById, 
  downloadCourseHandbook,
  getUserCourseProgress,
  getUserLearningStats 
} from './courseApi';
import { 
  getOrganizationReport, 
  getDepartmentStats, 
  getEmployeeReports, 
  getComplianceCategories, 
  getMonthlyTrend 
} from './reportApi';
import { getUserCertificates } from './certificateApi';

const API_BASE_URL = 'http://localhost:8080';

// Chatbot会话管理
class ChatbotSession {
  constructor() {
    this.HISTORY_TTL_MS = 10 * 60 * 1000; // 10分钟保留
    this.conversationHistory = this.loadConversationHistory();
    this.maxHistoryLength = 5; // 最多保存5轮对话
  }

  // 从sessionStorage加载对话历史，并按10分钟TTL过滤
  loadConversationHistory() {
    try {
      const saved = sessionStorage.getItem('chatbot_conversation_history');
      const history = saved ? JSON.parse(saved) : [];
      const now = Date.now();
      // 仅保留10分钟内的记录
      const filtered = Array.isArray(history)
        ? history.filter(conv => {
            if (!conv || !conv.timestamp) return false;
            const ts = new Date(conv.timestamp).getTime();
            return now - ts <= this.HISTORY_TTL_MS;
          })
        : [];
      // 如果有过滤变化则写回
      if (filtered.length !== (history?.length || 0)) {
        sessionStorage.setItem('chatbot_conversation_history', JSON.stringify(filtered));
      }
      return filtered;
    } catch (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }
  }

  // 保存对话历史到sessionStorage
  saveConversationHistory() {
    try {
      sessionStorage.setItem('chatbot_conversation_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }

  // 添加对话到历史记录
  addToHistory(userMessage, botResponse, toolsUsed = []) {
    const conversation = {
      timestamp: new Date().toISOString(),
      userMessage,
      botResponse,
      toolsUsed: Array.isArray(toolsUsed) ? toolsUsed : []
    };

    this.conversationHistory.push(conversation);

    // 保持最多5轮对话
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }

    this.saveConversationHistory();
  }

  // 获取对话历史
  getHistory() {
    return this.conversationHistory;
  }

  // 清除对话历史
  clearHistory() {
    this.conversationHistory = [];
    sessionStorage.removeItem('chatbot_conversation_history');
  }

  // 获取上下文摘要（用于AI理解）
  getContextSummary() {
    if (this.conversationHistory.length === 0) {
      return "这是一个新的对话会话。";
    }

    const recentConversations = this.conversationHistory.slice(-3); // 最近3轮对话
    const contextSummary = recentConversations.map((conv, index) => 
      `第${index + 1}轮 - 用户: ${conv.userMessage.substring(0, 100)}... 助手: ${conv.botResponse.substring(0, 100)}...`
    ).join('\n');

    return `对话上下文:\n${contextSummary}`;
  }
}

// 创建全局会话实例
const chatbotSession = new ChatbotSession();

// 可用的工具函数
const availableTools = {
  // 课程相关工具
  getAllCourses: {
    name: 'getAllCourses',
    description: '获取所有活跃课程列表',
    function: getAllCourses
  },
  
  getAllCoursesFull: {
    name: 'getAllCoursesFull', 
    description: '获取完整课程列表（包含部门信息）',
    function: getAllCoursesFull
  },

  getCourseById: {
    name: 'getCourseById',
    description: '根据课程ID获取课程详情',
    function: getCourseById
  },

  downloadCourseHandbook: {
    name: 'downloadCourseHandbook',
    description: '下载课程手册PDF文件',
    function: downloadCourseHandbook
  },

  getUserCourseProgress: {
    name: 'getUserCourseProgress',
    description: '获取用户课程学习进度',
    function: getUserCourseProgress
  },

  getUserLearningStats: {
    name: 'getUserLearningStats',
    description: '获取用户学习统计信息',
    function: getUserLearningStats
  },

  // 合规报告相关工具
  getOrganizationReport: {
    name: 'getOrganizationReport',
    description: '获取组织合规报告数据',
    function: getOrganizationReport
  },

  getDepartmentStats: {
    name: 'getDepartmentStats',
    description: '获取部门合规统计',
    function: getDepartmentStats
  },

  getEmployeeReports: {
    name: 'getEmployeeReports',
    description: '获取员工报告详情',
    function: getEmployeeReports
  },

  getComplianceCategories: {
    name: 'getComplianceCategories',
    description: '获取合规类别完成情况',
    function: getComplianceCategories
  },

  getMonthlyTrend: {
    name: 'getMonthlyTrend',
    description: '获取月度合规趋势',
    function: getMonthlyTrend
  },

  // 证书相关工具
  getUserCertificates: {
    name: 'getUserCertificates',
    description: '获取用户证书列表',
    function: getUserCertificates
  }
};

// 后端AI响应函数：调用后端并返回完整响应对象（包含 toolsUsed）
const generateAIResponse = async (userMessage) => {
  try {
    // 调用后端的OpenAI API
    const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // 返回完整对象，包含 message 与 toolsUsed
    return data;

  } catch (error) {
    console.error('Error calling backend AI API:', error);
    
    // 如果后端API调用失败，使用本地后备响应
    return { message: generateFallbackResponse(userMessage), toolsUsed: [], success: false };
  }
};

// 后备响应函数（当后端API不可用时使用）
const generateFallbackResponse = (userMessage, toolResults = null, contextSummary = '') => {
  const message = userMessage.toLowerCase();
  
  // 基础问候和帮助
  if (message.includes('你好') || message.includes('hello') || message.includes('hi')) {
    return `Hello! I'm your intelligent learning assistant. I can help you with:

📚 **Learning Support**
• View course content and handbooks
• Track learning progress
• Get learning recommendations

📊 **Compliance Monitoring** (Admin/Auditor)
• View organizational compliance reports
• Monitor department completion status
• Analyze employee learning status

🏆 **Certificate Management**
• View earned certificates
• Understand certificate requirements

Please tell me what you need help with!`;
  }

  if (message.includes('帮助') || message.includes('help')) {
    return `I can assist you with the following:

**📖 Learning Related**
• "How is my course progress?" - Check learning progress
• "What courses are available?" - Browse available courses
• "Where are the course handbooks?" - Get learning materials

**📊 Compliance Management** (Admin features)
• "How is organizational compliance?" - View overall compliance reports
• "Department completion status" - View department statistics
• "Employee learning status" - View employee reports

**🏆 Certificate Inquiry**
• "My certificates" - View earned certificates

You can also ask specific questions directly, and I'll do my best to help!`;
  }

  // 如果有工具执行结果，基于结果生成响应
  if (toolResults) {
    return formatToolResults(toolResults, userMessage);
  }

  // 默认响应
  return `I understand your question: "${userMessage}"

${contextSummary ? `\nBased on our previous conversation, ` : ''}I suggest you can:

1. 📚 Check courses and learning progress
2. 📊 Review compliance status (if you're an admin)
3. 🏆 View certificate status
4. ❓ Ask specific learning or management questions

Please tell me specifically what you need help with, and I'll provide more accurate information!`;
};

// 格式化工具执行结果
const formatToolResults = (results, userMessage) => {
  if (!results || results.length === 0) {
    return '抱歉，没有找到相关信息。请尝试重新描述您的问题。';
  }

  let response = '根据您的查询，我找到了以下信息：\n\n';

  results.forEach((result, index) => {
    if (result.error) {
      response += `❌ ${result.toolName}: ${result.error}\n`;
    } else {
      response += formatSingleResult(result.toolName, result.data);
    }
  });

  return response;
};

// 格式化单个工具结果
const formatSingleResult = (toolName, data) => {
  switch (toolName) {
    case 'getAllCourses':
      return `📚 **可用课程** (${data.length}门):\n${data.slice(0, 5).map(course => 
        `• ${course.title} - ${course.description || '暂无描述'}`
      ).join('\n')}\n${data.length > 5 ? `\n...还有${data.length - 5}门课程\n` : ''}\n`;

    case 'getUserCourseProgress':
      return `📈 **学习进度统计**:\n${data.map(course => 
        `• ${course.title}: ${course.progress}% (${course.completedQuizzes}/${course.totalQuizzes})`
      ).join('\n')}\n\n`;

    case 'getUserLearningStats':
      return `📊 **整体学习统计**:
• 总体进度: ${data.overallProgress}%
• 完成课程: ${data.completedCourses}/${data.totalCourses}
• 合规率: ${data.complianceRate}%
• 完成测验: ${data.completedQuizzes}/${data.totalQuizzes}\n\n`;

    case 'getOrganizationReport':
      return `🏢 **组织合规报告**:
• 总体合规率: ${data.overallComplianceRate || 'N/A'}%
• 活跃用户: ${data.activeUsers || 'N/A'}
• 完成课程数: ${data.completedCourses || 'N/A'}\n\n`;

    case 'getDepartmentStats':
      return `🏬 **部门统计** (${data.length}个部门):\n${data.slice(0, 3).map(dept => 
        `• ${dept.department}: ${dept.completionRate || dept.rate || 'N/A'}% 完成率`
      ).join('\n')}\n${data.length > 3 ? `\n...还有${data.length - 3}个部门\n` : ''}\n`;

    case 'getUserCertificates':
      return `🏆 **证书列表** (${data.length}个):\n${data.slice(0, 3).map(cert => 
        `• ${cert.certificateName} - ${cert.issueDate || '已颁发'}`
      ).join('\n')}\n${data.length > 3 ? `\n...还有${data.length - 3}个证书\n` : ''}\n`;

    default:
      return `✅ ${toolName}: 查询成功\n\n`;
  }
};

// 确定需要调用的工具
const determineRequiredTools = (userMessage) => {
  const message = userMessage.toLowerCase();
  const requiredTools = [];

  // 课程相关
  if (message.includes('课程') || message.includes('course')) {
    if (message.includes('进度') || message.includes('progress')) {
      requiredTools.push('getUserCourseProgress', 'getUserLearningStats');
    } else if (message.includes('列表') || message.includes('有哪些')) {
      requiredTools.push('getAllCourses');
    }
  }

  // 合规相关
  if (message.includes('合规') || message.includes('compliance')) {
    if (message.includes('组织') || message.includes('整体')) {
      requiredTools.push('getOrganizationReport');
    }
    if (message.includes('部门') || message.includes('department')) {
      requiredTools.push('getDepartmentStats');
    }
    if (message.includes('员工') || message.includes('employee')) {
      requiredTools.push('getEmployeeReports');
    }
  }

  // 证书相关
  if (message.includes('证书') || message.includes('certificate')) {
    requiredTools.push('getUserCertificates');
  }

  return requiredTools;
};

// 执行工具调用
const executeTools = async (toolNames, userId = null) => {
  const results = [];

  for (const toolName of toolNames) {
    const tool = availableTools[toolName];
    if (!tool) {
      results.push({
        toolName,
        error: `工具 ${toolName} 不存在`
      });
      continue;
    }

    try {
      let data;
      // 根据工具类型传递不同参数
      if (toolName.includes('User') && userId) {
        data = await tool.function(userId);
      } else {
        data = await tool.function();
      }
      
      results.push({
        toolName,
        data
      });
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      results.push({
        toolName,
        error: error.message || '执行失败'
      });
    }
  }

  return results;
};

// 主要的聊天接口
export const sendChatMessage = async (userMessage, userId = null) => {
  try {
    // 直接调用后端生成AI响应（包含 toolsUsed）
    const backendResponse = await generateAIResponse(userMessage);

    // 添加到对话历史
    chatbotSession.addToHistory(
      userMessage,
      backendResponse.message || backendResponse.response || '',
      backendResponse.toolsUsed || []
    );

    return {
      success: true,
      response: backendResponse.message || backendResponse.response || 'No response received',
      toolsUsed: backendResponse.toolsUsed || [],
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    return {
      success: false,
      error: error.message || '处理消息时发生错误',
      timestamp: new Date().toISOString()
    };
  }
};

// 获取对话历史
export const getChatHistory = () => {
  return chatbotSession.getHistory();
};

// 清除对话历史
export const clearChatHistory = () => {
  chatbotSession.clearHistory();
  return { success: true, message: '对话历史已清除' };
};

// 获取可用工具列表
export const getAvailableTools = () => {
  return Object.keys(availableTools).map(key => ({
    name: key,
    description: availableTools[key].description
  }));
};

export default {
  sendChatMessage,
  getChatHistory,
  clearChatHistory,
  getAvailableTools
};