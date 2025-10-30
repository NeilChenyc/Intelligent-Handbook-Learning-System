import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Send, Bot, User, RefreshCw, MessageCircle, Trash2 } from 'lucide-react';
import { sendChatMessage, getChatHistory, clearChatHistory, getAvailableTools } from '../api/chatbotApi';
import { useAuth } from '../contexts/AuthContext';

const ChatbotPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState([]);
  const messagesEndRef = useRef(null);

  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载聊天历史
  const loadChatHistory = () => {
    const history = getChatHistory();
    // 将会话历史（每条包含 userMessage/botResponse）转换为UI消息队列
    const reconstructed = [];
    (history || []).forEach((conv, idx) => {
      const baseTs = conv.timestamp || new Date().toISOString();
      // 用户消息
      reconstructed.push({
        id: `${baseTs}-u-${idx}`,
        type: 'user',
        content: conv.userMessage || '',
        timestamp: baseTs
      });
      // 助手消息
      reconstructed.push({
        id: `${baseTs}-a-${idx}`,
        type: 'assistant',
        content: conv.botResponse || '',
        timestamp: baseTs,
        toolsUsed: Array.isArray(conv.toolsUsed) ? conv.toolsUsed : []
      });
    });
    setMessages(reconstructed);
  };

  // 清空聊天历史
  const handleClearHistory = () => {
    clearChatHistory();
    setMessages([]);
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // 添加用户消息到界面
      const newUserMessage = {
        id: Date.now(),
        type: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newUserMessage]);

      // 发送消息并获取回复
      const response = await sendChatMessage(userMessage);
      console.log('Chatbot API response:', response); // 调试日志
      
      // 添加AI回复到界面
      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response || response.message || 'No response received',
        timestamp: new Date().toISOString(),
        toolsUsed: response.toolsUsed || []
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I encountered some issues. Please try again later.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理回车键发送
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 初始化
  useEffect(() => {
    loadChatHistory();
    setAvailableTools(getAvailableTools());
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <MessageCircle className="mr-3 text-blue-600" size={32} />
              AI Learning Assistant
            </h2>
            <p className="text-gray-600">
              I can help you learn course materials, check compliance status, and answer related questions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearHistory}
              className="flex items-center gap-2"
              disabled={messages.length === 0}
            >
              <Trash2 size={16} />
              Clear History
            </Button>
          </div>
        </div>
      </div>

      {/* 聊天区域 */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <Bot className="mr-2 text-blue-600" size={20} />
            Conversation History
            {messages.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({messages.filter(m => m.type === 'user').length} conversations)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-96">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">Welcome to AI Learning Assistant!</p>
                <p className="text-sm">
                  You can ask about course materials, check compliance status, or seek learning advice.
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>Available features:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Course material queries</li>
                    <li>• Compliance status check</li>
                    <li>• Learning progress tracking</li>
                    <li>• Certificate information</li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'assistant' && (
                        <Bot size={16} className={message.isError ? 'text-red-600' : 'text-blue-600'} />
                      )}
                      {message.type === 'user' && (
                        <User size={16} className="text-white" />
                      )}
                      <div className="flex-1">
                        {message.type === 'assistant' ? (
                          <div className="text-sm leading-relaxed break-words">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                a: ({node, ...props}) => (
                                  <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline" />
                                ),
                                code: ({inline, className, children, ...props}) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return inline ? (
                                    <code className="bg-gray-200 rounded px-1 py-0.5" {...props}>{children}</code>
                                  ) : (
                                    <pre className="bg-gray-900 text-gray-100 rounded p-3 overflow-auto">
                                      <code className={className || (match ? `language-${match[1]}` : '')} {...props}>{children}</code>
                                    </pre>
                                  );
                                },
                                table: ({node, ...props}) => (
                                  <table {...props} className="w-full border-collapse my-2" />
                                ),
                                thead: ({node, ...props}) => (
                                  <thead {...props} className="bg-gray-50" />
                                ),
                                th: ({node, ...props}) => (
                                  <th {...props} className="border px-3 py-1 text-left align-top" />
                                ),
                                td: ({node, ...props}) => (
                                  <td {...props} className="border px-3 py-1 align-top" />
                                ),
                                img: ({node, ...props}) => (
                                  <img {...props} alt={props.alt || ''} className="rounded max-w-full" />
                                )
                              }}
                            >
                              {renderAssistantContent(message.content)}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                        {message.toolsUsed && message.toolsUsed.length > 0 && (
                          <div className="mt-2 text-xs opacity-75">
                            <p>Tools used: {message.toolsUsed.join(', ')}</p>
                          </div>
                        )}
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-blue-600" />
                    <div className="flex items-center gap-1">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your question..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift + Enter for new line • Keep up to 5 recent conversations
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotPage;
  // 将“用空格列对齐”的文本转换为 Markdown 表格（GFM）
  const convertTextTablesToMarkdown = (text) => {
    if (!text || typeof text !== 'string') return text;

    const lines = text.split('\n');
    const isHeaderLike = (line) => {
      const tokens = line.trim().split(/\s{2,}/).filter(Boolean);
      const hasHeaderWords = /(课程|标题|描述|部门|老师|教师)/.test(line);
      return tokens.length >= 3 && hasHeaderWords;
    };

    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (isHeaderLike(lines[i])) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) return text;

    const headerTokens = lines[startIndex].trim().split(/\s{2,}/).filter(Boolean);
    const rows = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) break;
      const cells = line.trim().split(/\s{2,}/).filter(Boolean);
      // 至少两列才算有效数据行
      if (cells.length < 2) break;
      rows.push(cells);
    }

    if (rows.length === 0) return text;

    const header = `| ${headerTokens.join(' | ')} |`;
    const sep = `| ${headerTokens.map(() => '---').join(' | ')} |`;
    const body = rows.map(r => `| ${r.join(' | ')} |`).join('\n');

    const before = lines.slice(0, startIndex).join('\n');
    const after = lines.slice(startIndex + 1 + rows.length).join('\n');
    const table = `${header}\n${sep}\n${body}`;

    return [before, table, after].filter(Boolean).join('\n\n');
  };

  const renderAssistantContent = (text) => convertTextTablesToMarkdown(text);