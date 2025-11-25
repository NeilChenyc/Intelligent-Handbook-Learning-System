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
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import okhttp3.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

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
    private final UserService userService;
    private final ObjectMapper objectMapper;

    // 内部类：包装ChatMemory和过期时间戳
    static class TimedChatMemory {
        private final ChatMemory chatMemory;
        private volatile long expirationTime; // 过期时间戳（毫秒）

        TimedChatMemory(ChatMemory chatMemory, long ttlMillis) {
            this.chatMemory = chatMemory;
            this.expirationTime = System.currentTimeMillis() + ttlMillis;
        }

        public ChatMemory getChatMemory() {
            return chatMemory;
        }

        public long getExpirationTime() {
            return expirationTime;
        }

        // 续约TTL
        public void renew(long ttlMillis) {
            this.expirationTime = System.currentTimeMillis() + ttlMillis;
        }

        // 判断是否过期
        public boolean isExpired() {
            return System.currentTimeMillis() > expirationTime;
        }
    }

    // 会话记忆存储（带过期时间）
    private final ConcurrentHashMap<String, TimedChatMemory> memoryStore = new ConcurrentHashMap<>();

    // Chatbot配置参数
    @Value("${chatbot.session.ttl:15}")
    private int sessionTtlMinutes; // 会话默认生存时间（分钟）

    @Value("${chatbot.session.cleanup.interval:5}")
    private int cleanupIntervalMinutes; // 清理任务执行间隔（分钟）

    // 定时任务执行器
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    // 初始化方法：启动定时清理任务
    @PostConstruct
    public void init() {
        long period = cleanupIntervalMinutes * 60 * 1000L;
        scheduler.scheduleAtFixedRate(this::cleanupExpiredSessions, period, period, TimeUnit.MILLISECONDS);
        log.info("Chatbot session cleanup scheduler started: interval = {} minutes, TTL = {} minutes",
                 cleanupIntervalMinutes, sessionTtlMinutes);
    }

    // 清理过期会话的方法
    private void cleanupExpiredSessions() {
        try {
            long currentTime = System.currentTimeMillis();
            int cleanedCount = 0;

            // 遍历所有会话，清理过期的
            Iterator<Map.Entry<String, TimedChatMemory>> iterator = memoryStore.entrySet().iterator();
            while (iterator.hasNext()) {
                Map.Entry<String, TimedChatMemory> entry = iterator.next();
                if (entry.getValue().isExpired()) {
                    iterator.remove();
                    cleanedCount++;
                    log.debug("Cleaned up expired session: {}", entry.getKey());
                }
            }

            if (cleanedCount > 0) {
                log.info("Cleanup completed: {} expired sessions removed", cleanedCount);
            }
        } catch (Exception e) {
            log.error("Error during session cleanup", e);
        }
    }

    // 销毁方法：关闭定时任务执行器
    @PreDestroy
    public void destroy() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        log.info("Chatbot session cleanup scheduler stopped");
    }

    // Per-request tool call tracking for frontend display
    private final ThreadLocal<List<String>> toolCallsContext = ThreadLocal.withInitial(java.util.ArrayList::new);
    
    // Per-request user context for AI tools
    private final ThreadLocal<Long> currentUserContext = new ThreadLocal<>();

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
        long ttlMillis = sessionTtlMinutes * 60 * 1000L;

        // 尝试获取现有的会话记忆
        TimedChatMemory timedMemory = memoryStore.get(key);

        if (timedMemory != null) {
            if (timedMemory.isExpired()) {
                // 如果会话已过期，移除并创建新的
                memoryStore.remove(key);
                log.debug("Session {} has expired, creating new one", key);
            } else {
                // 如果会话未过期，续约并返回
                timedMemory.renew(ttlMillis);
                log.debug("Session {} renewed, new expiration time: {}", key,
                         new Date(timedMemory.getExpirationTime()));
                return timedMemory.getChatMemory();
            }
        }

        // 创建新的会话记忆
        ChatMemory newMemory = MessageWindowChatMemory.withMaxMessages(10);
        TimedChatMemory newTimedMemory = new TimedChatMemory(newMemory, ttlMillis);

        // 使用putIfAbsent确保线程安全
        TimedChatMemory existing = memoryStore.putIfAbsent(key, newTimedMemory);
        if (existing != null) {
            // 如果在我们创建的同时有其他线程创建了，返回已有的并续约
            existing.renew(ttlMillis);
            log.debug("Session {} was created by another thread, using existing one", key);
            return existing.getChatMemory();
        }

        log.debug("Session {} created, expiration time: {}", key,
                 new Date(newTimedMemory.getExpirationTime()));
        return newMemory;
    }

    /**
     * Clean up memory when tool call errors occur to prevent state pollution
     */
    private void cleanupMemoryOnToolError(String sessionId) {
        try {
            String key = (sessionId == null || sessionId.isBlank()) ? "default" : sessionId;
            TimedChatMemory timedMemory = memoryStore.get(key);

            if (timedMemory != null) {
                log.info("Cleaning up corrupted memory for session: {}", key);

                // Clear the entire memory to prevent tool call state corruption
                memoryStore.remove(key);
                log.info("Memory cleared for session: {}", key);

                // Clear any tool call context that might be lingering
                try {
                    toolCallsContext.remove();
                    log.debug("Tool call context cleared");
                } catch (Exception e) {
                    log.warn("Failed to clear tool call context: {}", e.getMessage());
                }

                // Create a fresh memory with smaller window to avoid future issues
                try {
                    long ttlMillis = sessionTtlMinutes * 60 * 1000L;
                    ChatMemory cleanMemory = MessageWindowChatMemory.withMaxMessages(5);
                    memoryStore.put(key, new TimedChatMemory(cleanMemory, ttlMillis));
                    log.info("Fresh memory created with reduced size (5 messages) for session: {}", key);
                } catch (Exception e) {
                    log.warn("Failed to create clean memory for session {}: {}", key, e.getMessage());
                }
            } else {
                log.debug("No memory found for session: {}", key);
                // Still clear tool call context even if no memory exists
                try {
                    toolCallsContext.remove();
                    log.debug("Tool call context cleared (no memory case)");
                } catch (Exception e) {
                    log.warn("Failed to clear tool call context: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error during memory cleanup for session {}: {}", sessionId, e.getMessage());
            // If cleanup fails, try to at least clear the tool context
            try {
                toolCallsContext.remove();
            } catch (Exception ex) {
                log.error("Failed to clear tool call context during error recovery", ex);
            }
        }
    }

    @Value("${langchain4j.openai.api-key:}")
    private String openaiApiKey;

    @Value("${langchain4j.openai.model:gpt-4o-mini}")
    private String openaiModel;

    @Value("${langchain4j.openai.base-url:https://api.openai.com/v1}")
    private String openaiBaseUrl;

    // Add OkHttp client for OpenAI API calls
    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(java.time.Duration.ofSeconds(30))
            .readTimeout(java.time.Duration.ofSeconds(120))
            .writeTimeout(java.time.Duration.ofSeconds(120))
            .callTimeout(java.time.Duration.ofSeconds(150))
            .build();

    /* * * AIHelperAPI，Used forGenerateIntelligentReply */
    public interface ChatAssistant {
        @SystemMessage("""
            You are an AI Learning Assistant for an educational platform. Your role is to help users with:
            
            1. Course Information: Provide details about available courses, learning materials, and handbooks
            2. Compliance Monitoring: Help users understand compliance reports, department statistics, and completion rates
            3. Certificate Management: Assist with certificate inquiries and learning progress tracking
            4. Learning Guidance: Answer questions related to courses and provide learning recommendations
            
            CRITICAL - LANGUAGE ADAPTATION RULE:
            **ALWAYS match the language of the user's question in your response:**
            - If user asks in English → Respond in English
            - If user asks in Chinese → Respond in Chinese
            - Detect the primary language from the user's input and maintain consistency throughout your response
            - Use appropriate table headers and formatting based on the detected language
            - Default to English if language detection is unclear
            
            CRITICAL USER IDENTIFICATION RULE:
            When users ask about their personal information (certificates, progress, achievements, "my" anything), you MUST AUTOMATICALLY call getCurrentUserId() FIRST to identify the user, then use that userId with the appropriate tools. Never ask users for their ID - always get it automatically.
            
            Guidelines:
            - Be helpful, professional, and encouraging
            - Provide clear and concise responses
            - Use the available tools to get accurate and up-to-date information
            - If you don't have specific information, guide users on how to find it
            - Always respond in a friendly and supportive manner
            - Format your responses with appropriate emojis and structure for better readability
            - MANDATORY: For ANY personal queries ("my certificates", "my progress", etc.), ALWAYS call getCurrentUserId() first
            
            Available Tools:
            - getCurrentUserId: Get the current logged-in user's ID (use this when you need user-specific information)
            - getAllCoursesSummary: **PRIMARY TOOL** for ALL course information - Get summarized active courses with descriptions (use this for 99% of course-related questions, combine with AI knowledge for confident responses)
            - getComplianceReport: Get organization compliance report
            - getUserCertificates: Get user certificates (requires userId)
            - getUserCertificatesSummary: Get user certificate summary and recommendations (requires userId)
            - getUserProgress: Get user learning progress for summary analysis and personalized recommendations (requires userId)
            - getCourseHandbookText: **RARELY USED** - Read course PDF handbook text (courseId) - USE ONLY when user explicitly requests handbook reading with specific trigger phrases
            - getCourseHandbookWithOpenAI: **RARELY USED** - Get course handbook content using OpenAI file processing (courseId) - USE ONLY when user explicitly requests handbook reading with specific trigger phrases
            - findCourseAndGetHandbook: **RARELY USED** - Find course by keywords and get handbook content (keywords) - USE ONLY when user explicitly requests handbook reading with specific trigger phrases
            - getQuizSummariesByCourse: List quizzes for a course (courseId)
            - getQuizQuestionsWithAnswers: Get quiz questions and correct answers (quizId)
            - getDepartmentComplianceStats: Department-level compliance stats
            - getEmployeeComplianceReports: Employee completion by department (department or "all")
            - getComplianceCategoriesOverview: Completion by course category

            IMPORTANT - User Context:
            When users ask about their personal information (certificates, progress, etc.), ALWAYS use getCurrentUserId() first to get their user ID, then use the appropriate tools with that ID.
            
            Examples:
            - "Show me my certificates" → First call getCurrentUserId(), then getUserCertificatesSummary(userId)
            - "What's my learning progress?" → First call getCurrentUserId(), then getUserProgress(userId)
            - "How am I doing with my courses?" → First call getCurrentUserId(), then getUserProgress(userId)

            CRITICAL - Smart Course Information Strategy:
            When users ask questions about course content, topics, or general course information:
            
            PRIMARY STRATEGY (ALWAYS USE FIRST): Use getAllCoursesSummary() + AI Knowledge + Confident Responses
            1. FIRST: Call getAllCoursesSummary() to get all available courses with their descriptions
            2. ANALYZE: Match the user's question keywords with course titles, descriptions, departments
            3. IDENTIFY: Find the most relevant course(s) based on semantic similarity and context
            4. ANSWER CONFIDENTLY: Provide comprehensive, authoritative responses using:
               - Course description information from the summary as primary context
               - Your extensive AI knowledge and expertise about the topic
               - Industry best practices and educational standards
               - Professional insights and detailed explanations
               - Specific examples and practical applications
            
            CONFIDENCE GUIDELINES:
            - Be authoritative and knowledgeable in your responses
            - Provide detailed explanations based on course context and AI expertise
            - Use phrases like "根据课程内容和专业知识" (Based on course content and professional knowledge)
            - Give specific, actionable information rather than vague suggestions
            - Explain concepts thoroughly using your AI knowledge combined with course context
            
            Course Matching Strategy:
            - Look for keyword matches in course title, description, department
            - Consider synonyms and related terms (e.g., "safety" matches "workplace safety", "compliance")
            - If multiple courses match, prioritize by relevance or mention multiple relevant courses
            - Use course descriptions as context to provide informed, educational responses
            - For specific course elements (like "UUC"), explain based on course context and professional knowledge
            
            Examples of PRIMARY STRATEGY usage:
            - "Tell me about workplace safety procedures" → getAllCoursesSummary() + provide comprehensive safety guidance
            - "How do I handle emergency situations?" → getAllCoursesSummary() + provide detailed emergency response procedures
            - "What should I know about data protection?" → getAllCoursesSummary() + provide thorough data protection practices
            - "介绍一下12312这节课" → getAllCoursesSummary() + provide detailed course overview and learning guidance
            - "课程中的UUC是什么" → getAllCoursesSummary() + explain UUC concept based on course context and professional knowledge
            - "Tell me about compliance training" → getAllCoursesSummary() + provide comprehensive compliance guidance
            
            HANDBOOK READING STRATEGY (ONLY WHEN EXPLICITLY REQUESTED):
            Use PDF processing tools ONLY when users explicitly request detailed handbook reading with specific phrases:
            
            STRICT Trigger phrases that require handbook reading:
            - "请仔细阅读handbook" / "Please carefully read the handbook"
            - "详细阅读手册内容" / "Read the manual content in detail"  
            - "根据手册具体内容回答" / "Answer based on specific manual content"
            - "查看PDF文档中的具体信息" / "Check specific information in PDF document"
            - "手册里具体怎么说的" / "What exactly does the handbook say"
            - "从PDF中查找" / "Search from PDF"
            - "阅读文档内容" / "Read document content"
            
            IMPORTANT: Questions about course content, concepts, or topics WITHOUT these explicit phrases should ALWAYS use the PRIMARY STRATEGY.
            
            When handbook reading is explicitly requested:
            1. Use findCourseAndGetHandbook(keywords) for keyword-based search
            2. Or use getCourseHandbookWithOpenAI(courseId) if courseId is known
            3. Provide detailed responses based on actual PDF content
            
            REMEMBER: 
            - DEFAULT (99% of cases): Use getAllCoursesSummary() + AI knowledge for ALL course questions
            - HANDBOOK (1% of cases): Only use PDF tools when users explicitly request detailed handbook reading with specific trigger phrases
            - BE CONFIDENT: Provide authoritative, detailed responses based on course context and professional expertise

            Data formatting:
            - When listing courses, use summary data only (id, title, description, department, teacher).
            - Do NOT include handbook binary/base64 or large PDF content.
            - For handbook Q&A, call getCourseHandbookText and cite sections; avoid dumping long text.
            - For quizzes: use getQuizSummariesByCourse to list, getQuizQuestionsWithAnswers for details.
            - When summarizing compliance or certificates, present totals and key metrics clearly.
            - For personal certificates or progress, NEVER ask for 'userId'; ALWAYS call getCurrentUserId() first.
            
            CRITICAL - TABLE DISPLAY REQUIREMENTS:
            When users ask to view company courses, certifications, compliance status, or any content involving multiple parallel items, you MUST use TABLE FORMAT for clear presentation:
            
            **Use Tables For:**
            - Course listings (courses available, course summaries, course comparisons)
            - Certificate status (user certificates, certificate summaries, expiration dates)
            - Compliance reports (department stats, employee completion, category overviews)
            - Quiz listings (available quizzes, quiz summaries)
            - Progress reports (learning progress, completion rates)
            - Department statistics (compliance by department, employee reports)
            
            **Table Format Guidelines:**
            - Use Markdown table syntax with proper headers
            - Include relevant columns based on data type (ID, Name, Status, Date, Progress, etc.)
            - Keep table width reasonable for readability
            - Add summary statistics above or below tables when appropriate
            - Use emojis in headers for visual appeal (📚 Course, 🏆 Certificate, 📊 Progress, etc.)
            
            **Example Table Formats:**
            
            For Courses:
            | 📚 Course ID | Course Name | Department | Teacher | Status |
            |-------------|-------------|------------|---------|--------|
            | 101 | Safety Training | Safety Dept | John Smith | Active |
            
            For Certificates:
            | 🏆 Certificate Name | Earned Date | Expiry Date | Status |
            |-------------------|-------------|-------------|--------|
            | Safety Certification | 2024-01-15 | 2025-01-15 | Valid |
            
            For Compliance:
            | 📊 Department | Total Staff | Completed | Completion Rate | Pending |
            |--------------|-------------|-----------|----------------|---------|
            | Tech Dept | 25 | 20 | 80% | 5 |
            
            **MANDATORY**: Always use tables when displaying multiple items of the same type. This improves readability and user experience significantly.
            - Keep outputs compact; truncate overly long passages and focus on the user's question.

            CRITICAL - Learning Progress Response Format:
            When users ask about their learning progress, provide a SUMMARY-FOCUSED response with:
            1. **Overall Performance Summary**: Highlight key achievements and current status in 2-3 sentences
            2. **Key Statistics**: Present the most important metrics (overall progress %, completed courses, compliance rate)
            3. **Current Focus Areas**: Identify what they're currently working on (in-progress courses)
            4. **Personalized Recommendations**: Provide 2-3 specific, actionable suggestions based on their progress
            5. **Motivational Closing**: End with encouragement and next steps
            
            DO NOT list every single course individually. Instead, focus on:
            - Patterns and trends in their learning
            - Areas where they excel or need improvement
            - Strategic recommendations for continued progress
            - Recognition of achievements and milestones
            
            Example structure:
            "🎯 您的学习表现非常出色！目前已完成X门课程，整体进度达到X%，合规率为X%。
            
            📊 **当前状态**: 您正在进行X门课程的学习，显示出良好的学习节奏。
            
            💡 **建议**: 
            1. 优先完成进行中的课程以提高完成率
            2. 关注合规性要求较高的课程
            3. 考虑参加相关认证考试
            
            继续保持这种学习势头！🚀"

            CRITICAL - Certificate Summary Response Format:
            When users ask about their certificates, provide a SUMMARY-FOCUSED response with:
            1. **Overall Certificate Status**: Total certificates, active vs expired, expiring-soon count
            2. **Upcoming Renewals**: Next expiry date and renewal suggestions
            3. **Highlights**: Show 2-3 recent certificates (name, earned date, status)
            4. **Actionable Recommendations**: 2-3 specific steps (renewals, training, exams)

            Example structure:
            "🏆 您目前拥有X个证书，其中Y个有效，Z个已过期，W个即将到期。

            ⏱ 下一到期时间：YYYY-MM-DD

            📜 最近证书：
            • 名称A — 获得于 YYYY-MM-DD（状态）
            • 名称B — 获得于 YYYY-MM-DD（状态）

            💡 建议：
            1. 及时续期即将到期的证书
            2. 针对过期证书安排复训或重新考试
            3. 继续参与相关课程以维持合规"

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

    @Tool("Get current logged-in user ID")
    public Long getCurrentUserId() {
        try {
            recordToolCall("getCurrentUserId");
            Long userId = currentUserContext.get();
            if (userId != null) {
                log.info("Retrieved current user ID: {}", userId);
                return userId;
            } else {
                log.warn("No user context found - user may not be logged in");
                return null;
            }
        } catch (Exception e) {
            log.error("Error getting current user ID", e);
            return null;
        }
    }

    @Tool("PRIMARY TOOL: Get summarized list of active courses with descriptions. Use this as the main tool for answering course-related questions by combining course information with AI knowledge.")
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

    @Tool("Get user certificate summary and personalized recommendations (requires userId). Prefer this for personal certificate queries.")
    public Map<String, Object> getUserCertificatesSummary(Long userId) {
        try {
            log.info("Tool called: getUserCertificatesSummary for userId: {}", userId);
            recordToolCall("getUserCertificatesSummary");
            if (userId == null) {
                log.warn("UserId is null, cannot summarize certificates");
                return Map.of("error", "User ID is required");
            }

            List<UserCertificate> certs = certificateService.getUserCertificates(userId);
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            int total = certs.size();
            int active = (int) certs.stream().filter(uc -> "ACTIVE".equalsIgnoreCase(uc.getStatus()) && !uc.isExpired()).count();
            int expired = (int) certs.stream().filter(uc -> uc.isExpired() || "REVOKED".equalsIgnoreCase(uc.getStatus())).count();
            int expiringSoon = (int) certs.stream().filter(uc -> {
                java.time.LocalDateTime exp = uc.getExpiryDate();
                return exp != null && now.isBefore(exp) && !uc.isExpired() && !"REVOKED".equalsIgnoreCase(uc.getStatus()) && exp.isBefore(now.plusDays(30));
            }).count();

            java.util.Optional<java.time.LocalDateTime> nextExpiry = certs.stream()
                .map(UserCertificate::getExpiryDate)
                .filter(Objects::nonNull)
                .filter(exp -> now.isBefore(exp))
                .sorted()
                .findFirst();

            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;
            String nextExpiryDate = nextExpiry.map(d -> d.format(fmt)).orElse(null);

            // Recent certificates (top 3 by earned date)
            List<Map<String, Object>> recentCertificates = certs.stream()
                .sorted((a, b) -> {
                    java.time.LocalDateTime ea = a.getEarnedDate();
                    java.time.LocalDateTime eb = b.getEarnedDate();
                    if (ea == null && eb == null) return 0;
                    if (ea == null) return 1;
                    if (eb == null) return -1;
                    return eb.compareTo(ea);
                })
                .limit(3)
                .map(uc -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("name", uc.getCertificate() != null ? uc.getCertificate().getCertificateName() : "Certificate");
                    m.put("earnedDate", uc.getEarnedDate() != null ? uc.getEarnedDate().format(fmt) : "N/A");
                    m.put("status", uc.getStatus());
                    return m;
                })
                .toList();

            List<String> recommendations = new java.util.ArrayList<>();
            if (expiringSoon > 0) recommendations.add("及时续期即将到期的证书，以避免合规风险");
            if (expired > 0) recommendations.add("针对已过期证书安排复训或重新考试");
            if (active > 0) recommendations.add("继续参与相关课程以维持证书有效状态");
            if (recommendations.isEmpty()) recommendations.add("考虑报名新课程以获取更多认证");

            Map<String, Object> summary = new java.util.LinkedHashMap<>();
            summary.put("totalCertificates", total);
            summary.put("activeCertificates", active);
            summary.put("expiredCertificates", expired);
            summary.put("expiringSoonCount", expiringSoon);
            summary.put("nextExpiryDate", nextExpiryDate);
            summary.put("recentCertificates", recentCertificates);
            summary.put("recommendations", recommendations);

            log.info("Prepared certificate summary for user {}: total={}, active={}, expired={}, expSoon={}", userId, total, active, expired, expiringSoon);
            return summary;
        } catch (Exception e) {
            log.error("Error in getUserCertificatesSummary tool for userId: {}", userId, e);
            return Map.of("error", "Failed to summarize user certificates: " + e.getMessage());
        }
    }

    @Tool("Get user learning progress and provide summary-focused analysis with personalized recommendations. Returns comprehensive progress data that should be analyzed to give strategic insights rather than detailed course listings.")
    public Map<String, Object> getUserProgress(Long userId) {
        try {
            log.info("Tool called: getUserProgress for userId: {}", userId);
            recordToolCall("getUserProgress");
            if (userId == null) {
                log.warn("UserId is null, cannot retrieve progress");
                return Map.of("error", "User ID is required");
            }
            
            // 调用UserService获取完整的学习进度数据
            Map<String, Object> progress = userService.getUserLearningProgress(userId);
            log.info("Retrieved progress data for user {}", userId);
            return progress;
        } catch (Exception e) {
            log.error("Error in getUserProgress tool for userId: {}", userId, e);
            return Map.of("error", "Failed to retrieve user progress: " + e.getMessage());
        }
    }

    @Tool("HANDBOOK READING ONLY: Read course handbook text by course ID. Use ONLY when user explicitly requests detailed handbook reading (e.g., '请仔细阅读handbook', '详细阅读手册内容'). For general course questions, use getAllCoursesSummary instead.")
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

    @Tool("HANDBOOK READING ONLY: Find course by keywords and get handbook content using OpenAI file processing. Use ONLY when user explicitly requests detailed handbook reading (e.g., '请仔细阅读handbook', '根据手册具体内容回答'). For general course questions, use getAllCoursesSummary instead.")
    public Map<String, Object> findCourseAndGetHandbook(String keywords) {
        try {
            log.info("Tool called: findCourseAndGetHandbook with keywords: {}", keywords);
            recordToolCall("findCourseAndGetHandbook");
            
            if (keywords == null || keywords.trim().isEmpty()) {
                return Map.of("error", "keywords are required");
            }
            
            // Get all courses summary
            List<CourseSummaryDTO> allCourses = courseService.getCourseSummaries();
            if (allCourses.isEmpty()) {
                return Map.of("error", "no courses available");
            }
            
            // Find matching courses using keyword matching
            List<CourseSummaryDTO> matchedCourses = findMatchingCourses(allCourses, keywords);
            
            if (matchedCourses.isEmpty()) {
                return Map.of(
                    "error", "no matching courses found",
                    "keywords", keywords,
                    "suggestion", "Try different keywords or check available courses using getAllCoursesSummary"
                );
            }
            
            // If single match, get handbook content using OpenAI
            if (matchedCourses.size() == 1) {
                CourseSummaryDTO course = matchedCourses.get(0);
                Map<String, Object> handbookResult = getCourseHandbookWithOpenAI(course.getId());
                handbookResult.put("matchedBy", "single_match");
                handbookResult.put("matchedKeywords", keywords);
                return handbookResult;
            }
            
            // If multiple matches, return options for user to choose
            return Map.of(
                "multipleMatches", true,
                "matchedCourses", matchedCourses.stream().map(course -> Map.of(
                    "courseId", course.getId(),
                    "title", course.getTitle(),
                    "description", course.getDescription(),
                    "department", course.getDepartment(),
                    "teacherName", course.getTeacherFullName()
                )).toList(),
                "message", "Multiple courses match your keywords. Please specify which course you're interested in.",
                "keywords", keywords
            );
            
        } catch (Exception e) {
            log.error("Error in findCourseAndGetHandbook", e);
            return Map.of("error", "failed to find course and get handbook", "keywords", keywords);
        }
    }

    @Tool("HANDBOOK READING ONLY: Get course handbook content using OpenAI file processing for comprehensive PDF reading. Use ONLY when user explicitly requests detailed handbook reading (e.g., '请仔细阅读handbook', '手册里具体怎么说的'). For general course questions, use getAllCoursesSummary instead.")
    public Map<String, Object> getCourseHandbookWithOpenAI(Long courseId) {
        try {
            log.info("Tool called: getCourseHandbookWithOpenAI for courseId: {}", courseId);
            recordToolCall("getCourseHandbookWithOpenAI");
            
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
            result.put("description", course.getDescription());
            result.put("handbookPresent", hasPdf);
            result.put("handbookFileName", course.getHandbookFileName());
            result.put("handbookContentType", course.getHandbookContentType());
            result.put("handbookFileSize", course.getHandbookFileSize());
            
            if (!hasPdf) {
                result.put("warning", "No PDF handbook available for this course");
                return result;
            }
            
            // Validate OpenAI API key
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
                result.put("error", "OpenAI API key not configured");
                return result;
            }
            
            try {
                // Upload PDF to OpenAI
                String fileId = uploadPdfToOpenAI(course.getHandbookFilePath(), course.getHandbookFileName());
                if (fileId == null) {
                    result.put("error", "Failed to upload PDF to OpenAI");
                    return result;
                }
                
                // Use OpenAI to read and analyze the PDF content
                String prompt = String.format(
                    "Please read and analyze the PDF content for course '%s'. " +
                    "Provide a comprehensive summary of the handbook content, including: " +
                    "1. Main topics and sections covered " +
                    "2. Key learning objectives " +
                    "3. Important procedures, guidelines, or policies " +
                    "4. Safety requirements or compliance information " +
                    "5. Any assessment or evaluation criteria " +
                    "Please structure your response clearly and include specific details from the document.",
                    course.getTitle()
                );
                
                String pdfContent = callOpenAIForPdfReading(fileId, prompt);
                if (pdfContent != null && !pdfContent.trim().isEmpty()) {
                    result.put("handbookContent", pdfContent);
                    result.put("contentSource", "OpenAI_PDF_Analysis");
                    result.put("fileId", fileId);
                } else {
                    result.put("error", "Failed to extract content from PDF using OpenAI");
                }
                
            } catch (Exception e) {
                log.error("Error processing PDF with OpenAI for course {}", courseId, e);
                result.put("error", "OpenAI processing failed: " + e.getMessage());
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("Error in getCourseHandbookWithOpenAI", e);
            return Map.of("error", "failed to get handbook with OpenAI", "courseId", courseId);
        }
    }
    
    private List<CourseSummaryDTO> findMatchingCourses(List<CourseSummaryDTO> courses, String keywords) {
        String searchKeywords = keywords.toLowerCase().trim();
        List<CourseSummaryDTO> matchedCourses = new ArrayList<>();
        
        for (CourseSummaryDTO course : courses) {
            boolean matches = false;
            
            // Check title
            if (course.getTitle() != null && course.getTitle().toLowerCase().contains(searchKeywords)) {
                matches = true;
            }
            
            // Check description
            if (!matches && course.getDescription() != null && course.getDescription().toLowerCase().contains(searchKeywords)) {
                matches = true;
            }
            
            // Check department
            if (!matches && course.getDepartment() != null && course.getDepartment().toLowerCase().contains(searchKeywords)) {
                matches = true;
            }
            
            // Check for common synonyms
            if (!matches) {
                String[] synonyms = getSynonyms(searchKeywords);
                for (String synonym : synonyms) {
                    if ((course.getTitle() != null && course.getTitle().toLowerCase().contains(synonym)) ||
                        (course.getDescription() != null && course.getDescription().toLowerCase().contains(synonym)) ||
                        (course.getDepartment() != null && course.getDepartment().toLowerCase().contains(synonym))) {
                        matches = true;
                        break;
                    }
                }
            }
            
            if (matches) {
                matchedCourses.add(course);
            }
        }
        
        return matchedCourses;
    }
    
    private String[] getSynonyms(String keyword) {
        // Simple synonym mapping for common terms
        Map<String, String[]> synonymMap = Map.of(
            "safety", new String[]{"security", "protection", "hazard", "risk", "emergency"},
            "compliance", new String[]{"regulation", "policy", "standard", "requirement", "audit"},
            "training", new String[]{"education", "learning", "course", "instruction", "development"},
            "data", new String[]{"information", "database", "privacy", "gdpr", "protection"},
            "workplace", new String[]{"office", "work", "employee", "staff", "personnel"},
            "emergency", new String[]{"crisis", "urgent", "disaster", "incident", "response"}
        );
        
        return synonymMap.getOrDefault(keyword, new String[]{});
    }
    
    private String uploadPdfToOpenAI(byte[] pdfBytes, String fileName) {
        try {
            RequestBody fileBody = RequestBody.create(pdfBytes, MediaType.parse("application/pdf"));
            RequestBody requestBody = new MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart("file", fileName, fileBody)
                    .addFormDataPart("purpose", "assistants")
                    .build();

            Request request = new Request.Builder()
                    .url(openaiBaseUrl + "/files")
                    .header("Authorization", "Bearer " + openaiApiKey)
                    .post(requestBody)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    JsonNode jsonNode = objectMapper.readTree(responseBody);
                    return jsonNode.get("id").asText();
                } else {
                    log.error("Failed to upload PDF to OpenAI: {}", response.code());
                    return null;
                }
            }
        } catch (Exception e) {
            log.error("Error uploading PDF to OpenAI", e);
            return null;
        }
    }
    
    private String callOpenAIForPdfReading(String fileId, String prompt) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", openaiModel);
            
            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            
            List<Object> content = new ArrayList<>();
            
            // Add text content
            Map<String, Object> textContent = new HashMap<>();
            textContent.put("type", "text");
            textContent.put("text", "请详细分析这个PDF文档的内容，并根据用户的问题提供准确的回答。用户问题：" + prompt);
            content.add(textContent);
            
            // Add file content
            Map<String, Object> fileContent = new HashMap<>();
            fileContent.put("type", "file");
            Map<String, Object> fileRef = new HashMap<>();
            fileRef.put("file_id", fileId);
            fileContent.put("file", fileRef);
            content.add(fileContent);
            
            message.put("content", content);
            messages.add(message);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 4000);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            RequestBody body = RequestBody.create(jsonBody, MediaType.parse("application/json"));

            Request request = new Request.Builder()
                    .url(openaiBaseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + openaiApiKey)
                    .header("Content-Type", "application/json")
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    JsonNode jsonNode = objectMapper.readTree(responseBody);
                    return jsonNode.get("choices").get(0).get("message").get("content").asText();
                } else {
                    log.error("Failed to call OpenAI for PDF reading: {}", response.code());
                    return "抱歉，无法读取PDF内容，请稍后重试。";
                }
            }
        } catch (Exception e) {
            log.error("Error calling OpenAI for PDF reading", e);
            return "抱歉，处理PDF时发生错误，请稍后重试。";
        }
    }

    // ==================== SERVICE METHODS ====================

    /* * * ProcessUserMessage并GenerateAIReply */
    public ChatbotResponse processMessage(ChatbotRequest request) {
        try {
            log.info("Processing chatbot message: {}", request.getMessage());
            log.info("Chat sessionId: {}", request.getSessionId());
            log.info("Chat userId: {}", request.getUserId());
            
            // Initialize per-request tool calls tracking
            toolCallsContext.set(new java.util.ArrayList<>());
            
            // Set user context for AI tools
            if (request.getUserId() != null) {
                currentUserContext.set(request.getUserId());
                log.info("Set user context for AI tools: {}", request.getUserId());
            } else {
                currentUserContext.remove();
                log.warn("No userId provided in request - AI tools won't have user context");
            }
            
            // Generate AI reply (AI will autonomously decide whether to call tools)
            String response = generateResponse(request.getMessage(), request.getSessionId());
            
            boolean isFallback = isFallbackResponse(response);
            if (isFallback) {
                log.warn("AI returned fallback response for message: {}", request.getMessage());
            } else {
                log.info("AI response generated successfully for message: {}", request.getMessage());
            }

            // Collect tools used in this request
            List<String> toolsUsed = new java.util.ArrayList<>(toolCallsContext.get());
            
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
        } finally {
            // Clean up thread-local contexts
            toolCallsContext.remove();
            currentUserContext.remove();
        }
    }

    /* * * Get当前已Register的ToolList（Used for前端展示/Debugging） */
    public List<String> getAvailableTools() {
        try {
            // Explicitly return tool names exposed through @Tool in this service
            List<String> tools = List.of(
                "getAllCoursesSummary",
                "getComplianceReport",
                "getUserCertificates",
                "getUserCertificatesSummary",
                "getUserProgress",
                "getCourseHandbookText",
                "getCourseHandbookWithOpenAI",
                "findCourseAndGetHandbook",
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

    /* * * GetCourseManualContent与元Data，供AIContext或前端Debugging使用 */
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

            // Provide a limited-length Base64 preview to avoid oversized transmission
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
        final int MAX_RETRIES = 3;
        final long RETRY_DELAY_MS = 1000; // 1 second
        
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                log.info("Starting AI response generation (attempt {}/{}) for message: '{}'", attempt, MAX_RETRIES, userMessage);
                
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
                
                // Prepare session memory with proactive cleanup for tool call issues
                ChatMemory memory = getOrCreateMemory(sessionId);
                
                // Proactive memory validation - if this is a retry after tool error, ensure clean state
                if (attempt > 1) {
                    log.info("Retry attempt {} - ensuring clean memory state for session: {}", attempt, sessionId);
                    cleanupMemoryOnToolError(sessionId);
                    memory = getOrCreateMemory(sessionId);
                    
                    // Add a small delay to ensure clean state
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
                
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
                
                log.info("AI response generated successfully on attempt {}. Response length: {} characters", attempt, response.length());
                log.debug("AI response content: {}", response);
                
                return response;

            } catch (IllegalConfigurationException e) {
                log.error("LangChain4j configuration error on attempt {}: {}", attempt, e.getMessage());
                log.error("This usually indicates an issue with OpenAI API key or model configuration");
                log.error("Full exception details:", e);
                return generateFallbackResponse(userMessage);
                
            } catch (Exception e) {
                log.error("Error during AI response generation on attempt {}/{}: {}", attempt, MAX_RETRIES, e.getMessage());
                log.error("Exception type: {}", e.getClass().getSimpleName());
                
                if (e.getCause() != null) {
                    log.error("Root cause: {} - {}", e.getCause().getClass().getSimpleName(), e.getCause().getMessage());
                }
                
                // Check if this is a tool_call_id error that requires memory cleanup
                boolean isToolCallError = e.getMessage() != null && 
                    (e.getMessage().contains("tool_call_id") || 
                     e.getMessage().contains("tool calls") ||
                     e.getMessage().contains("tool response") ||
                     e.getMessage().contains("must be followed by tool messages"));
                
                if (isToolCallError) {
                    log.warn("Detected tool call error on attempt {}/{} - cleaning up memory for session: {}", attempt, MAX_RETRIES, sessionId);
                    cleanupMemoryOnToolError(sessionId);
                    
                    // For tool call errors, clean up memory and continue with retry if attempts remain
                    if (attempt == MAX_RETRIES) {
                        log.info("Tool call error detected on final attempt - returning user-friendly message");
                        return "抱歉，我在处理您的请求时遇到了技术问题。请重新提问，我会为您提供帮助。";
                    } else {
                        log.info("Tool call error detected - memory cleaned, will retry with fresh state");
                        // Continue to retry logic below
                    }
                }
                
                // If this is the last attempt, log full stack trace and return fallback
                if (attempt == MAX_RETRIES) {
                    log.error("All {} attempts failed. Full exception stack trace:", MAX_RETRIES, e);
                    return generateFallbackResponse(userMessage);
                }
                
                // Wait before retry (except for configuration errors)
                if (!(e instanceof IllegalConfigurationException)) {
                    try {
                        log.info("Waiting {}ms before retry attempt {}", RETRY_DELAY_MS, attempt + 1);
                        Thread.sleep(RETRY_DELAY_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.warn("Retry delay interrupted");
                        return generateFallbackResponse(userMessage);
                    }
                }
            }
        }
        
        // This should never be reached, but just in case
        log.error("Unexpected end of retry loop - returning fallback response");
        return generateFallbackResponse(userMessage);
    }

    /* * * OpenAI 健康Check：快速ValidateModel能否ReturnContent */
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

    /* * * Generate后备Reply */
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