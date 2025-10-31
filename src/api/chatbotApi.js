// TODO: Translate - Import existing API functions as tools
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

// ChatbotSessionManagement
class ChatbotSession {
  constructor() {
    this.HISTORY_TTL_MS = 10 * 60 * 1000; // 10Minute保留
    this.conversationHistory = this.loadConversationHistory();
    this.maxHistoryLength = 5; // Save at most 5 rounds of conversation
  }

  // Load conversation history from sessionStorage and filter by 10-minute TTL
  loadConversationHistory() {
    try {
      const saved = sessionStorage.getItem('chatbot_conversation_history');
      const history = saved ? JSON.parse(saved) : [];
      const now = Date.now();
      // Only keep records within 10 minutes
      const filtered = Array.isArray(history)
        ? history.filter(conv => {
            if (!conv || !conv.timestamp) return false;
            const ts = new Date(conv.timestamp).getTime();
            return now - ts <= this.HISTORY_TTL_MS;
          })
        : [];
      // Write back if there are filter changes
      if (filtered.length !== (history?.length || 0)) {
        sessionStorage.setItem('chatbot_conversation_history', JSON.stringify(filtered));
      }
      return filtered;
    } catch (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }
  }

  // Save conversation history to sessionStorage
  saveConversationHistory() {
    try {
      sessionStorage.setItem('chatbot_conversation_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }

  // Add conversation to history
  addToHistory(userMessage, botResponse, toolsUsed = []) {
    const conversation = {
      timestamp: new Date().toISOString(),
      userMessage,
      botResponse,
      toolsUsed: Array.isArray(toolsUsed) ? toolsUsed : []
    };

    this.conversationHistory.push(conversation);

    // Keep at most 5 rounds of conversation
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }

    this.saveConversationHistory();
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
    sessionStorage.removeItem('chatbot_conversation_history');
  }

  // Get context summary (for AI understanding)
  getContextSummary() {
    if (this.conversationHistory.length === 0) {
      return "这是一个新的对话会话。";
    }

    const recentConversations = this.conversationHistory.slice(-3); // Recent 3 rounds of conversation
    const contextSummary = recentConversations.map((conv, index) => 
      `第${index + 1}轮 - 用户: ${conv.userMessage.substring(0, 100)}... 助手: ${conv.botResponse.substring(0, 100)}...`
    ).join('\n');

    return `对话上下文:\n${contextSummary}`;
  }
}

// Create global session instance
const chatbotSession = new ChatbotSession();

// Available tool functions
const availableTools = {
  // Course-related tools
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

  // Compliance report related tools
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

  // Certificate related tools
  getUserCertificates: {
    name: 'getUserCertificates',
    description: '获取用户证书列表',
    function: getUserCertificates
  }
};

// Backend AI response function: call backend and return complete response object (including toolsUsed)
const generateAIResponse = async (userMessage) => {
  try {
    // Call backend OpenAI API
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
    // Return complete object including message and toolsUsed
    return data;

  } catch (error) {
    console.error('Error calling backend AI API:', error);
    
    // Use local fallback response if backend API call fails
    return { message: generateFallbackResponse(userMessage), toolsUsed: [], success: false };
  }
};

// Fallback response function (used when backend API is unavailable)
const generateFallbackResponse = (userMessage, toolResults = null, contextSummary = '') => {
  const message = userMessage.toLowerCase();
  
  // Basic greetings and help
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

  // If there are tool execution results, generate response based on results
  if (toolResults) {
    return formatToolResults(toolResults, userMessage);
  }

  // Default response
  return `I understand your question: "${userMessage}"

${contextSummary ? `\nBased on our previous conversation, ` : ''}I suggest you can:

1. 📚 Check courses and learning progress
2. 📊 Review compliance status (if you're an admin)
3. 🏆 View certificate status
4. ❓ Ask specific learning or management questions

Please tell me specifically what you need help with, and I'll provide more accurate information!`;
};

// Format tool execution results
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

// Format single tool result
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

// Determine which tools need to be called
const determineRequiredTools = (userMessage) => {
  const message = userMessage.toLowerCase();
  const requiredTools = [];

  // Course related
  if (message.includes('课程') || message.includes('course')) {
    if (message.includes('进度') || message.includes('progress')) {
      requiredTools.push('getUserCourseProgress', 'getUserLearningStats');
    } else if (message.includes('列表') || message.includes('有哪些')) {
      requiredTools.push('getAllCourses');
    }
  }

  // Compliance related
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

  // Certificate related
  if (message.includes('证书') || message.includes('certificate')) {
    requiredTools.push('getUserCertificates');
  }

  return requiredTools;
};

// Execute tool calls
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
      // Pass different parameters based on tool type
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

// Main chat interface
export const sendChatMessage = async (userMessage, userId = null) => {
  try {
    // Directly call backend to generate AI response (including toolsUsed)
    const backendResponse = await generateAIResponse(userMessage);

    // Add to conversation history
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

// Get conversation history
export const getChatHistory = () => {
  return chatbotSession.getHistory();
};

// Clear conversation history
export const clearChatHistory = () => {
  chatbotSession.clearHistory();
  return { success: true, message: '对话历史已清除' };
};

// Get available tools list
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