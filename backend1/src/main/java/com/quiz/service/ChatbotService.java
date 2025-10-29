package com.quiz.service;

import com.quiz.dto.ChatbotRequest;
import com.quiz.dto.ChatbotResponse;
import com.quiz.entity.Course;
import com.quiz.entity.UserCertificate;
import com.quiz.dto.CourseSummaryDTO;
import com.quiz.dto.QuestionDto;
import com.quiz.dto.QuizSummaryDto;
import com.quiz.service.QuestionService;
import com.quiz.service.QuizService;
import com.quiz.service.PdfQuizAgentService;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.exception.IllegalConfigurationException;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final CourseService courseService;
    private final ReportService reportService;
    private final CertificateService certificateService;
    private final QuestionService questionService;
    private final QuizService quizService;
    private final PdfQuizAgentService pdfQuizAgentService;

    // In-memory store for chat memories per session
    private final Map<String, ChatMemory> memoryStore = new java.util.concurrent.ConcurrentHashMap<>();

    // Per-request tool call tracking for frontend display
    private final ThreadLocal<List<String>> toolCallsContext = ThreadLocal.withInitial(java.util.ArrayList::new);

    private void recordToolCall(String toolName) {
        try {
            List<String> calls = toolCallsContext.get();
            calls.add(toolName);
            log.info("Tool invoked: {}", toolName);
        } catch (Exception e) {
            log.warn("Failed to record tool call: {}", toolName, e);
        }
    }

    private ChatMemory getOrCreateMemory(String sessionId) {
        String key = (sessionId == null || sessionId.isBlank()) ? "default" : sessionId;
        return memoryStore.computeIfAbsent(key, k -> MessageWindowChatMemory.withMaxMessages(20));
    }

    @Value("${langchain4j.openai.api-key:}")
    private String openaiApiKey;

    @Value("${langchain4j.openai.model:gpt-4o-mini}")
    private String openaiModel;

    @Value("${langchain4j.openai.base-url:https://api.openai.com/v1}")
    private String openaiBaseUrl;

    // Toggle chat memory to avoid OpenAI tool-call role ordering issues
    @Value("${chatbot.memory.enabled:false}")
    private boolean chatMemoryEnabled;

    /**
     * AI助手接口，用于生成智能回复
     */
    public interface ChatAssistant {
        @SystemMessage("""
            You are an AI Learning Assistant for an educational platform. Your role is to help users with:
            
            1. Course Information: Provide details about available courses, learning materials, and handbooks
            2. Compliance Monitoring: Help users understand compliance reports, department statistics, and completion rates
            3. Certificate Management: Assist with certificate inquiries and learning progress tracking
            4. Learning Guidance: Answer questions related to courses and provide learning recommendations
            
            Guidelines:
            - Be helpful, professional, and encouraging
            - Provide clear and concise responses
            - Use the available tools to get accurate and up-to-date information
            - If you don't have specific information, guide users on how to find it
            - Always respond in a friendly and supportive manner
            - Format your responses with appropriate emojis and structure for better readability
            
            Available Tools:
            - getAllCoursesSummary: Get summarized active courses (no PDFs)
            - getComplianceReport: Get organization compliance report
            - getUserCertificates: Get user certificates (requires userId)
            - getUserProgress: Get user learning progress (requires userId)
            - getCourseHandbookText: Read a course’s PDF handbook text (courseId)
            - getQuizSummariesByCourse: List quizzes for a course (courseId)
            - getQuizQuestionsWithAnswers: Get quiz questions and correct answers (quizId)
            - getDepartmentComplianceStats: Department-level compliance stats
            - getEmployeeComplianceReports: Employee completion by department (department or "all")
            - getComplianceCategoriesOverview: Completion by course category

            Data formatting:
            - When listing courses, use summary data only (id, title, description, department, teacher).
            - Do NOT include handbook binary/base64 or large PDF content.
            - For handbook Q&A, call getCourseHandbookText and cite sections; avoid dumping long text.
            - For quizzes: use getQuizSummariesByCourse to list, getQuizQuestionsWithAnswers for details.
            - When summarizing compliance or certificates, present totals and key metrics clearly.
            - If a user asks for certificates or progress without providing 'userId', ask for it.
            - Keep outputs compact; truncate overly long passages and focus on the user’s question.
            
            When users ask about courses, compliance, certificates, or progress, use the appropriate tools to provide accurate information.
            """)
        String chat(@UserMessage String message);
    }

    // ==================== TOOL DEFINITIONS ====================
    
    // Deprecated heavy tool (may load PDFs). Kept without @Tool to avoid OOM.
    public List<Course> getAllCourses() {
        try {
            log.info("Internal call: getAllCourses (deprecated for tools)");
            List<Course> courses = courseService.getAllActiveCourses();
            log.info("Retrieved {} courses", courses.size());
            return courses;
        } catch (Exception e) {
            log.error("Error in getAllCourses internal method", e);
            return Collections.emptyList();
        }
    }

    @Tool("Get summarized list of active courses without PDF content")
    public List<CourseSummaryDTO> getAllCoursesSummary() {
        try {
            log.info("Tool called: getAllCoursesSummary");
            recordToolCall("getAllCoursesSummary");
            List<CourseSummaryDTO> summaries = courseService.getCourseSummaries();
            log.info("Retrieved {} course summaries", summaries.size());
            return summaries;
        } catch (Exception e) {
            log.error("Error in getAllCoursesSummary tool", e);
            return Collections.emptyList();
        }
    }

    @Tool("Get organization compliance report data")
    public Map<String, Object> getComplianceReport() {
        try {
            log.info("Tool called: getComplianceReport");
            recordToolCall("getComplianceReport");
            Map<String, Object> report = reportService.getOrganizationReportData();
            log.info("Retrieved compliance report with {} entries", report.size());
            return report;
        } catch (Exception e) {
            log.error("Error in getComplianceReport tool", e);
            return Collections.emptyMap();
        }
    }

    @Tool("Get user certificates by user ID")
    public List<UserCertificate> getUserCertificates(Long userId) {
        try {
            log.info("Tool called: getUserCertificates for userId: {}", userId);
            recordToolCall("getUserCertificates");
            if (userId == null) {
                log.warn("UserId is null, cannot retrieve certificates");
                return Collections.emptyList();
            }
            List<UserCertificate> certificates = certificateService.getUserCertificates(userId);
            log.info("Retrieved {} certificates for user {}", certificates.size(), userId);
            return certificates;
        } catch (Exception e) {
            log.error("Error in getUserCertificates tool for userId: {}", userId, e);
            return Collections.emptyList();
        }
    }

    @Tool("Get user learning progress by user ID")
    public Map<String, Object> getUserProgress(Long userId) {
        try {
            log.info("Tool called: getUserProgress for userId: {}", userId);
            recordToolCall("getUserProgress");
            if (userId == null) {
                log.warn("UserId is null, cannot retrieve progress");
                return Map.of("error", "User ID is required");
            }
            // 这里可以实现具体的用户进度逻辑
            Map<String, Object> progress = new HashMap<>();
            progress.put("userId", userId);
            progress.put("message", "User progress feature is under development");
            progress.put("status", "available_soon");
            log.info("Retrieved progress data for user {}", userId);
            return progress;
        } catch (Exception e) {
            log.error("Error in getUserProgress tool for userId: {}", userId, e);
            return Map.of("error", "Failed to retrieve user progress");
        }
    }

    @Tool("Read course handbook text by course ID; returns extracted text preview and metadata. Use for answering questions about a course’s handbook. Avoid returning large payloads.")
    public Map<String, Object> getCourseHandbookText(Long courseId) {
        try {
            log.info("Tool called: getCourseHandbookText for courseId: {}", courseId);
            recordToolCall("getCourseHandbookText");
            if (courseId == null) {
                return Map.of("error", "courseId is required");
            }
            Optional<Course> courseOpt = courseService.getCourseById(courseId);
            if (courseOpt.isEmpty()) {
                return Map.of("error", "course not found", "courseId", courseId);
            }
            Course course = courseOpt.get();

            boolean hasPdf = course.getHandbookFilePath() != null && course.getHandbookFileSize() != null && course.getHandbookFileSize() > 0;
            Map<String, Object> result = new HashMap<>();
            result.put("courseId", course.getId());
            result.put("title", course.getTitle());
            result.put("handbookPresent", hasPdf);
            result.put("handbookFileName", course.getHandbookFileName());
            result.put("handbookContentType", course.getHandbookContentType());
            result.put("handbookFileSize", course.getHandbookFileSize());
            result.put("downloadEndpoint", "/api/courses/" + course.getId() + "/pdf/download");

            if (hasPdf) {
                // Extract text using agent service (lightweight stub implementation)
                String text = safeExtractPdfText(course.getHandbookFilePath());
                if (text != null) {
                    int maxLen = Math.min(text.length(), 10000);
                    result.put("textPreview", text.substring(0, maxLen));
                    result.put("textTruncated", text.length() > maxLen);
                    result.put("textLength", text.length());
                } else {
                    result.put("warning", "Failed to extract text from PDF; consider downloading and reviewing manually.");
                }
            }

            return result;
        } catch (Exception e) {
            log.error("Error in getCourseHandbookText for courseId: {}", courseId, e);
            return Map.of("error", "failed to read course handbook", "courseId", courseId);
        }
    }

    @Tool("Get quiz summaries for a course by ID (no question details). Use this to list quizzes available for a course.")
    public List<QuizSummaryDto> getQuizSummariesByCourse(Long courseId) {
        try {
            log.info("Tool called: getQuizSummariesByCourse for courseId: {}", courseId);
            recordToolCall("getQuizSummariesByCourse");
            if (courseId == null) {
                return java.util.Collections.emptyList();
            }
            return quizService.getQuizSummaryDtosByCourse(courseId);
        } catch (Exception e) {
            log.error("Error in getQuizSummariesByCourse for courseId: {}", courseId, e);
            return java.util.Collections.emptyList();
        }
    }

    @Tool("Get detailed quiz questions with options and correct answers by quiz ID. Use when the user asks for quiz questions and answers.")
    public List<QuestionDto> getQuizQuestionsWithAnswers(Long quizId) {
        try {
            log.info("Tool called: getQuizQuestionsWithAnswers for quizId: {}", quizId);
            recordToolCall("getQuizQuestionsWithAnswers");
            if (quizId == null) {
                return java.util.Collections.emptyList();
            }
            return questionService.getQuestionDtosByQuiz(quizId);
        } catch (Exception e) {
            log.error("Error in getQuizQuestionsWithAnswers for quizId: {}", quizId, e);
            return java.util.Collections.emptyList();
        }
    }

    @Tool("Get department-level compliance statistics (totals, completed, pending, rates) across all departments.")
    public Map<String, Object> getDepartmentComplianceStats() {
        try {
            log.info("Tool called: getDepartmentComplianceStats");
            recordToolCall("getDepartmentComplianceStats");
            return reportService.getDepartmentStats();
        } catch (Exception e) {
            log.error("Error in getDepartmentComplianceStats", e);
            return java.util.Collections.emptyMap();
        }
    }

    @Tool("Get employee compliance reports. Pass a department name or 'all' to retrieve all employees.")
    public Map<String, Object> getEmployeeComplianceReports(String department) {
        try {
            log.info("Tool called: getEmployeeComplianceReports for department: {}", department);
            recordToolCall("getEmployeeComplianceReports");
            String filter = (department == null || department.isBlank()) ? "all" : department;
            return reportService.getEmployeeReports(filter);
        } catch (Exception e) {
            log.error("Error in getEmployeeComplianceReports for department: {}", department, e);
            return java.util.Collections.emptyMap();
        }
    }

    @Tool("Get compliance categories overview showing completion rates per course category.")
    public Map<String, Object> getComplianceCategoriesOverview() {
        try {
            log.info("Tool called: getComplianceCategoriesOverview");
            recordToolCall("getComplianceCategoriesOverview");
            return reportService.getComplianceCategories();
        } catch (Exception e) {
            log.error("Error in getComplianceCategoriesOverview", e);
            return java.util.Collections.emptyMap();
        }
    }

    // ==================== SERVICE METHODS ====================

    /**
     * 处理用户消息并生成AI回复
     */
    public ChatbotResponse processMessage(ChatbotRequest request) {
        try {
            log.info("Processing chatbot message: {}", request.getMessage());
            log.info("Chat sessionId: {}", request.getSessionId());
            log.info("Chat userId: {}", request.getUserId());
            // Initialize per-request tool calls tracking
            toolCallsContext.set(new java.util.ArrayList<>());
            
            // 生成AI回复（AI会自主决定是否调用工具）
            String response = generateResponse(request.getMessage(), request.getSessionId());
            
            boolean isFallback = isFallbackResponse(response);
            if (isFallback) {
                log.warn("AI returned fallback response for message: {}", request.getMessage());
            } else {
                log.info("AI response generated successfully for message: {}", request.getMessage());
            }

            // Collect tools used in this request
            List<String> toolsUsed = new java.util.ArrayList<>(toolCallsContext.get());
            toolCallsContext.remove();
            
            return ChatbotResponse.builder()
                    .message(response)
                    .success(true)
                    .sessionId(request.getSessionId())
                    .toolsUsed(toolsUsed)
                    .responseType("text")
                    .build();
                    
        } catch (Exception e) {
            log.error("Error processing chatbot message", e);
            return ChatbotResponse.builder()
                    .message("Sorry, I encountered some issues. Please try again later.")
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    /**
     * 获取当前已注册的工具列表（用于前端展示/调试）
     */
    public List<String> getAvailableTools() {
        try {
            // 显式返回在本服务中通过 @Tool 暴露的工具名称
            List<String> tools = List.of(
                "getAllCoursesSummary",
                "getComplianceReport",
                "getUserCertificates",
                "getUserProgress",
                "getCourseHandbookText",
                "getQuizSummariesByCourse",
                "getQuizQuestionsWithAnswers",
                "getDepartmentComplianceStats",
                "getEmployeeComplianceReports",
                "getComplianceCategoriesOverview"
            );
            log.info("Available tools: {}", tools);
            return tools;
        } catch (Exception e) {
            log.error("Error assembling available tools list", e);
            return Collections.emptyList();
        }
    }

    /**
     * 获取课程手册内容与元数据，供AI上下文或前端调试使用
     */
    public Map<String, Object> getCourseHandbookContent(Long courseId) {
        try {
            if (courseId == null) {
                return Map.of("error", "courseId is required");
            }
            Optional<Course> courseOpt = courseService.getCourseById(courseId);
            if (courseOpt.isEmpty()) {
                return Map.of("error", "course not found", "courseId", courseId);
            }
            Course course = courseOpt.get();

            Map<String, Object> result = new HashMap<>();
            result.put("courseId", course.getId());
            result.put("title", course.getTitle());
            result.put("description", course.getDescription());
            result.put("handbookFileName", course.getHandbookFileName());
            result.put("handbookContentType", course.getHandbookContentType());
            result.put("handbookFileSize", course.getHandbookFileSize());

            boolean hasHandbook = course.getHandbookFilePath() != null && course.getHandbookFileSize() != null && course.getHandbookFileSize() > 0;
            result.put("handbookPresent", hasHandbook);

            // 提供一个受限长度的Base64预览，避免传输过大
            if (hasHandbook) {
                String base64 = course.getHandbookContent();
                if (base64 != null) {
                    int previewLen = Math.min(base64.length(), 2000);
                    result.put("handbookContentBase64Preview", base64.substring(0, previewLen));
                    result.put("handbookContentBase64Truncated", base64.length() > previewLen);
                }
            }

            log.info("Prepared handbook content metadata for course {}", courseId);
            return result;
        } catch (Exception e) {
            log.error("Error retrieving handbook content for course {}", courseId, e);
            return Map.of("error", "failed to retrieve handbook content", "courseId", courseId);
        }
    }

    /**
     * Generate AI response using OpenAI API with LangChain4j tools
     */
    private String generateResponse(String userMessage) {
        // Keep backward compatibility without memory
        return generateResponse(userMessage, null);
    }

    /**
     * Generate AI response using OpenAI API with LangChain4j tools and session memory
     */
    private String generateResponse(String userMessage, String sessionId) {
        try {
            log.info("Starting AI response generation for message: '{}'", userMessage);
            
            // Validate OpenAI API key
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
                log.warn("OpenAI API key is not configured - falling back to default response");
                return generateFallbackResponse(userMessage);
            }
            
            log.info("OpenAI API key is configured (length: {})", openaiApiKey.length());
            log.info("Using OpenAI model: {}", openaiModel);
            log.info("Using OpenAI base URL: {}", openaiBaseUrl);
            
            // Build OpenAI chat model
            log.info("Building OpenAI chat model...");
            OpenAiChatModel chatModel = OpenAiChatModel.builder()
                    .apiKey(openaiApiKey)
                    .baseUrl(openaiBaseUrl)
                    .modelName(openaiModel)
                    .temperature(0.7)
                    .maxTokens(1000)
                    .timeout(java.time.Duration.ofSeconds(60))
                    .logRequests(true)
                    .logResponses(true)
                    .maxRetries(1)
                    .build();
            
            log.info("OpenAI chat model built successfully");
            
            // Prepare session memory (required when tools are enabled)
            ChatMemory memory = getOrCreateMemory(sessionId);
            log.info("Chat memory prepared for session: {}", (sessionId == null ? "default" : sessionId));

            // Create AI assistant with tools
            log.info("Creating AI assistant with registered tools...");
            var builder = AiServices.builder(ChatAssistant.class)
                    .chatLanguageModel(chatModel)
                    .tools(this);

            builder = builder.chatMemory(memory);

            ChatAssistant assistant = builder.build();
            
            log.info("AI assistant created successfully with tools registered");
            
            // Generate response using AI assistant
            log.info("Calling AI assistant to generate response...");
            String response = assistant.chat(userMessage);
            
            if (response == null || response.trim().isEmpty()) {
                log.warn("AI assistant returned empty response - using fallback");
                return generateFallbackResponse(userMessage);
            }
            
            log.info("AI response generated successfully. Response length: {} characters", response.length());
            log.debug("AI response content: {}", response);
            
            return response;

        } catch (IllegalConfigurationException e) {
            log.error("LangChain4j configuration error: {}", e.getMessage());
            log.error("This usually indicates an issue with OpenAI API key or model configuration");
            log.error("Full exception details:", e);
            return generateFallbackResponse(userMessage);
            
        } catch (Exception e) {
            log.error("Unexpected error during AI response generation: {}", e.getMessage());
            log.error("Exception type: {}", e.getClass().getSimpleName());
            
            if (e.getCause() != null) {
                log.error("Root cause: {} - {}", e.getCause().getClass().getSimpleName(), e.getCause().getMessage());
            }
            
            log.error("Full exception stack trace:", e);
            return generateFallbackResponse(userMessage);
        }
    }

    /**
     * OpenAI 健康检查：快速验证模型能否返回内容
     */
    public java.util.Map<String, Object> pingOpenAI() {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        try {
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
                result.put("status", "no_api_key");
                result.put("message", "langchain4j.openai.api-key 未配置");
                return result;
            }

            OpenAiChatModel chatModel = OpenAiChatModel.builder()
                    .apiKey(openaiApiKey)
                    .baseUrl(openaiBaseUrl)
                    .modelName(openaiModel)
                    .temperature(0.3)
                    .maxTokens(256)
                    .timeout(java.time.Duration.ofSeconds(25))
                    .logRequests(true)
                    .logResponses(true)
                    .maxRetries(1)
                    .build();

            String resp = chatModel.generate("Say 'pong' in one word.");
            result.put("status", (resp != null && !resp.isBlank()) ? "ok" : "empty");
            result.put("model", openaiModel);
            result.put("baseUrl", openaiBaseUrl);
            result.put("length", resp != null ? resp.length() : 0);
            result.put("sample", resp != null ? resp : null);
            return result;
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getClass().getSimpleName() + ": " + e.getMessage());
            return result;
        }
    }

    /**
     * 生成后备回复
     */
    private String generateFallbackResponse(String userMessage) {
        String message = userMessage.toLowerCase().trim();
        
        if (message.contains("hello") || message.contains("hi") || message.contains("你好")) {
            return "Hello! 😊 How can I assist you today?";
        } else if (message.contains("help") || message.contains("帮助")) {
            return "I'm here to help! You can ask me about:\n\n" +
                   "📚 **Courses** - Information about available courses\n" +
                   "📊 **Compliance** - Reports and statistics\n" +
                   "🏆 **Certificates** - Your learning achievements\n" +
                   "📈 **Progress** - Your learning journey\n\n" +
                   "What would you like to know?";
        } else if (message.contains("course") || message.contains("课程")) {
            return "I can help you with course information! 📚\n\n" +
                   "You can ask me about:\n" +
                   "• Available courses\n" +
                   "• Course details and materials\n" +
                   "• Learning handbooks\n\n" +
                   "What specific course information do you need?";
        } else if (message.contains("compliance") || message.contains("合规")) {
            return "I can provide compliance information! 📊\n\n" +
                   "Available reports:\n" +
                   "• Organization compliance status\n" +
                   "• Department statistics\n" +
                   "• Completion rates\n\n" +
                   "What compliance data would you like to see?";
        } else if (message.contains("certificate") || message.contains("证书")) {
            return "I can help with certificate information! 🏆\n\n" +
                   "Available services:\n" +
                   "• View your certificates\n" +
                   "• Check certificate status\n" +
                   "• Learning achievements\n\n" +
                   "What certificate information do you need?";
        } else {
            return "I'm here to help with your learning journey! 🌟\n\n" +
                   "You can ask me about courses, compliance reports, certificates, or your learning progress.\n\n" +
                   "What would you like to know?";
        }
    }

    private boolean isFallbackResponse(String response) {
        if (response == null) return true;
        String r = response.toLowerCase();
        return r.contains("how can i assist you today")
                || r.contains("i'm here to help")
                || r.contains("what would you like to know")
                || r.contains("i can help you with course information")
                || r.contains("i can provide compliance information")
                || r.contains("i can help with certificate information")
                || r.contains("help with your learning journey");
    }

    // -------- Helper methods --------
    private String safeExtractPdfText(byte[] pdfBytes) {
        try {
            if (pdfBytes == null || pdfBytes.length == 0) return null;
            // Delegate to agent service if available; fallback to simple conversion
            String content = pdfQuizAgentService != null ? invokeAgentPdfRead(pdfBytes) : null;
            if (content == null || content.isBlank()) {
                content = new String(pdfBytes);
            }
            return content;
        } catch (Exception e) {
            log.warn("PDF text extraction failed, falling back", e);
            try {
                return new String(pdfBytes);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    private String invokeAgentPdfRead(byte[] pdfBytes) {
        try {
            // PdfQuizAgentService has an internal reader; we call a constrained path via preflight check if needed
            // For safety, just convert bytes; replace with a real parser when available
            String content = new String(pdfBytes);
            if (content.length() > 20000) {
                return content.substring(0, 20000) + "...";
            }
            return content;
        } catch (Exception e) {
            return null;
        }
    }
}