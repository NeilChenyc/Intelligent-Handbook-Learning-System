package com.quiz.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz.dto.*;
import com.quiz.entity.*;
import com.quiz.repository.*;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * PDF 测验 Agent 服务类
 * 负责处理 PDF 内容分析和自动生成测验的核心业务逻辑
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfQuizAgentService {

    private final CourseRepository courseRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ObjectMapper objectMapper;

    @Value("${langchain4j.openai.api-key:}")
    private String openaiApiKey;

    @Value("${langchain4j.openai.model:gpt-5-mini}")
    private String openaiModel;

    @Value("${langchain4j.openai.base-url:https://api.openai.com/v1}")
    private String openaiBaseUrl;

    // 存储异步处理任务的状态
    private final Map<String, ProcessingStatus> taskStatusMap = new java.util.concurrent.ConcurrentHashMap<>();

    // Add OkHttp client for Responses API
    private final OkHttpClient httpClient = new OkHttpClient();

    /**
     * OpenAI 测验生成器接口
     */
    public interface QuizGenerator {
        @SystemMessage("""
            你是一个专业的教育内容分析师和测验生成专家。请根据提供的PDF内容生成高质量的测验。
            
            要求：
            1. 仔细分析PDF内容，理解核心概念和知识点
            2. 生成指定数量的测验，每个测验应该覆盖不同的主题或章节
            3. 每个测验包含指定数量的题目，题目类型主要为选择题
            4. 确保题目难度适中，选项设计合理，有明确的正确答案
            5. 为每道题提供详细的解释说明
            
            返回格式必须是标准JSON，结构如下：
            {
              "quizzes": [
                {
                  "title": "测验标题",
                  "description": "测验描述",
                  "difficulty": "easy|medium|hard",
                  "questions": [
                    {
                      "text": "题目内容",
                      "type": "MULTIPLE_CHOICE",
                      "options": [
                        {"text": "选项A", "isCorrect": false},
                        {"text": "选项B", "isCorrect": true},
                        {"text": "选项C", "isCorrect": false},
                        {"text": "选项D", "isCorrect": false}
                      ],
                      "explanation": "答案解释",
                      "points": 1
                    }
                  ]
                }
              ]
            }
            """)
        String generateQuizzes(@UserMessage String prompt);
    }

    /**
     * 处理课程的 PDF 内容，生成测验
     */
    @Transactional
    public AgentProcessResult processCourse(AgentProcessRequest request) {
        String taskId = UUID.randomUUID().toString();
        return processCourseWithTaskId(request, taskId);
    }

    /**
     * 使用指定的 taskId 处理课程 PDF 内容
     */
    @Transactional
    public AgentProcessResult processCourseWithTaskId(AgentProcessRequest request, String taskId) {
        LocalDateTime startTime = LocalDateTime.now();

        try {
            // 更新任务状态
            updateTaskStatus(taskId, "IN_PROGRESS", 10, "开始处理课程...", request.getCourseId());

            // 1. 获取课程信息
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new RuntimeException("课程不存在: " + request.getCourseId()));

            if (course.getHandbookFilePath() == null) {
                throw new RuntimeException("课程未上传PDF文件");
            }

            updateTaskStatus(taskId, "IN_PROGRESS", 20, "读取PDF内容...", request.getCourseId());

            // 2. 读取PDF内容
            String pdfContent = readPdfContent(course.getHandbookFilePath());
            if (pdfContent == null || pdfContent.trim().isEmpty()) {
                log.warn("PDF文本读取失败或为空，继续使用文件输入进行AI处理");
            }

            updateTaskStatus(taskId, "IN_PROGRESS", 40, "调用AI生成测验...", request.getCourseId());

            // 3. 调用OpenAI生成测验
            QuizGenerationRequest.QuizGenerationResponse generationResponse = 
                    generateQuizzesWithAI(pdfContent, course, request, taskId);

            updateTaskStatus(taskId, "IN_PROGRESS", 70, "保存测验到数据库...", request.getCourseId());

            // 4. 保存生成的测验到数据库
            List<AgentProcessResult.QuizSummary> quizSummaries = 
                    saveGeneratedQuizzes(course, generationResponse, request.getOverwriteExisting());

            updateTaskStatus(taskId, "COMPLETED", 100, "处理完成", request.getCourseId());

            LocalDateTime endTime = LocalDateTime.now();
            long processingTime = java.time.Duration.between(startTime, endTime).toMillis();

            return AgentProcessResult.builder()
                    .status("SUCCESS")
                    .taskId(taskId)
                    .courseId(request.getCourseId())
                    .generatedQuizzes(quizSummaries)
                    .processingLog("成功生成 " + quizSummaries.size() + " 个测验")
                    .startTime(startTime)
                    .endTime(endTime)
                    .processingTimeMs(processingTime)
                    .build();

        } catch (Exception e) {
            log.error("处理课程失败: courseId={}, error={}", request.getCourseId(), e.getMessage(), e);
            
            updateTaskStatus(taskId, "FAILED", 0, "处理失败: " + e.getMessage(), request.getCourseId());

            return AgentProcessResult.builder()
                    .status("FAILED")
                    .taskId(taskId)
                    .courseId(request.getCourseId())
                    .errorMessage(e.getMessage())
                    .processingLog("处理失败: " + e.getMessage())
                    .startTime(startTime)
                    .endTime(LocalDateTime.now())
                    .build();
        }
    }

    /**
     * 异步处理课程（生成并统一使用 taskId）
     */
    public CompletableFuture<AgentProcessResult> processCourseAsync(AgentProcessRequest request) {
        String taskId = UUID.randomUUID().toString();
        return CompletableFuture.supplyAsync(() -> processCourseWithTaskId(request, taskId));
    }

    /**
     * 异步处理课程（使用外部提供的 taskId）
     */
    public CompletableFuture<AgentProcessResult> processCourseAsync(AgentProcessRequest request, String taskId) {
        updateTaskStatus(taskId, "PENDING", 0, "任务已创建，等待开始", request.getCourseId());
        return CompletableFuture.supplyAsync(() -> processCourseWithTaskId(request, taskId));
    }

    /**
     * 获取处理状态
     */
    public ProcessingStatus getProcessingStatus(String taskId) {
        return taskStatusMap.get(taskId);
    }

    /**
     * 读取PDF内容（简化版本，实际应该使用PDF解析库）
     */
    private String readPdfContent(byte[] pdfBytes) {
        try {
            if (pdfBytes == null || pdfBytes.length == 0) {
                log.error("PDF字节数组为空");
                return null;
            }

            // 这里应该使用PDF解析库如Apache PDFBox来解析PDF内容
            // 为了演示，我们假设PDF内容可以直接转换为文本
            // 在实际应用中，需要使用专业的PDF解析库
            String content = new String(pdfBytes);
            
            // 如果内容太长，截取前10000个字符
            if (content.length() > 10000) {
                content = content.substring(0, 10000) + "...";
            }
            
            log.info("成功读取PDF内容，长度: {} 字符", content.length());
            return content;
        } catch (Exception e) {
            log.error("读取PDF内容失败", e);
            return null;
        }
    }

    /**
     * 使用AI生成测验
     */
    private QuizGenerationRequest.QuizGenerationResponse generateQuizzesWithAI(
            String pdfContent, Course course, AgentProcessRequest request, String taskId) {
        try {
            if (openaiApiKey == null || openaiApiKey.isEmpty() || "your-api-key-here".equals(openaiApiKey)) {
                log.warn("OpenAI API密钥未配置或为默认值，使用备用数据");
                updateTaskStatus(taskId, "IN_PROGRESS", 42, "OpenAI密钥未配置，使用备用数据", request.getCourseId());
                return generateFallbackQuizzes(course, request);
            }

            // 上传PDF并调用Responses API
            updateTaskStatus(taskId, "IN_PROGRESS", 45, "上传PDF到OpenAI...", request.getCourseId());
            byte[] pdfBytes = course.getHandbookFilePath();
            String fileName = java.util.Optional.ofNullable(course.getHandbookFileName()).orElse("course.pdf");
            String fileId = uploadPdfToOpenAI(pdfBytes, fileName);
            if (fileId == null) {
                log.warn("上传PDF到OpenAI失败，回退到备用测验生成");
                updateTaskStatus(taskId, "IN_PROGRESS", 46, "上传PDF失败，回退到备用测验", request.getCourseId());
                return generateFallbackQuizzes(course, request);
            }
            updateTaskStatus(taskId, "IN_PROGRESS", 48, "PDF上传成功", request.getCourseId());

            String prompt = buildPrompt(
                    (pdfContent == null || pdfContent.isBlank()) ? "（由OpenAI读取PDF内容）" : pdfContent,
                    course,
                    request
            );

            updateTaskStatus(taskId, "IN_PROGRESS", 50, "调用OpenAI Responses...", request.getCourseId());
            String responseText = callOpenAIResponses(fileId, prompt);
            if (responseText == null || responseText.isBlank()) {
                log.warn("Responses API返回为空，回退到备用测验生成");
                updateTaskStatus(taskId, "IN_PROGRESS", 52, "Responses返回为空，回退备用测验", request.getCourseId());
                return generateFallbackQuizzes(course, request);
            }
            log.info("Responses 返回文本长度: {}", responseText.length());
            updateTaskStatus(taskId, "IN_PROGRESS", 60, "解析AI响应...", request.getCourseId());

            QuizGenerationRequest.QuizGenerationResponse r = parseAIResponse(responseText);
            int quizCountParsed = r.getQuizzes() != null ? r.getQuizzes().size() : 0;
            updateTaskStatus(taskId, "IN_PROGRESS", 65, "解析完成，测验数: " + quizCountParsed, request.getCourseId());
            return r;
        } catch (Exception e) {
            log.error("AI生成测验失败，使用备用方案", e);
            updateTaskStatus(taskId, "IN_PROGRESS", 55, "AI生成失败，回退到备用测验", request.getCourseId());
            return generateFallbackQuizzes(course, request);
        }
    }

    /**
     * 构建AI提示词
     */
    private String buildPrompt(String pdfContent, Course course, AgentProcessRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("课程信息：\n");
        prompt.append("标题：").append(course.getTitle()).append("\n");
        prompt.append("描述：").append(course.getDescription()).append("\n\n");
        
        prompt.append("PDF内容：\n");
        prompt.append(pdfContent).append("\n\n");
        
        prompt.append("生成要求：\n");
        prompt.append("- 生成 ").append(request.getQuizCount()).append(" 个测验\n");
        prompt.append("- 每个测验包含 ").append(request.getQuestionsPerQuiz()).append(" 道题目\n");
        prompt.append("- 难度级别：").append(request.getDifficulty()).append("\n");
        
        if (request.getAdditionalInstructions() != null) {
            prompt.append("- 额外要求：").append(request.getAdditionalInstructions()).append("\n");
        }
        
        return prompt.toString();
    }

    /**
     * 解析AI响应
     */
    private QuizGenerationRequest.QuizGenerationResponse parseAIResponse(String response) {
        try {
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode quizzesNode = rootNode.get("quizzes");
            
            List<QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz> quizzes = new ArrayList<>();
            
            if (quizzesNode != null && quizzesNode.isArray()) {
                for (JsonNode quizNode : quizzesNode) {
                    QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz quiz = 
                            parseQuizFromJson(quizNode);
                    quizzes.add(quiz);
                }
            }
            
            return QuizGenerationRequest.QuizGenerationResponse.builder()
                    .quizzes(quizzes)
                    .processingNotes("AI生成成功")
                    .build();
                    
        } catch (Exception e) {
            log.error("解析AI响应失败", e);
            throw new RuntimeException("解析AI响应失败: " + e.getMessage());
        }
    }

    /**
     * 从JSON节点解析测验
     */
    private QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz parseQuizFromJson(JsonNode quizNode) {
        String title = quizNode.get("title").asText();
        String description = quizNode.get("description").asText();
        String difficulty = quizNode.get("difficulty").asText();
        
        List<QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion> questions = new ArrayList<>();
        JsonNode questionsNode = quizNode.get("questions");
        
        if (questionsNode != null && questionsNode.isArray()) {
            for (JsonNode questionNode : questionsNode) {
                QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion question = 
                        parseQuestionFromJson(questionNode);
                questions.add(question);
            }
        }
        
        return QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.builder()
                .title(title)
                .description(description)
                .difficulty(difficulty)
                .questions(questions)
                .build();
    }

    /**
     * 从JSON节点解析题目
     */
    private QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion parseQuestionFromJson(JsonNode questionNode) {
        String text = questionNode.get("text").asText();
        String type = questionNode.get("type").asText();
        String explanation = questionNode.get("explanation").asText();
        Integer points = questionNode.get("points").asInt(1);
        
        List<QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.GeneratedOption> options = new ArrayList<>();
        JsonNode optionsNode = questionNode.get("options");
        
        if (optionsNode != null && optionsNode.isArray()) {
            for (JsonNode optionNode : optionsNode) {
                String optionText = optionNode.get("text").asText();
                Boolean isCorrect = optionNode.get("isCorrect").asBoolean();
                
                options.add(QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.GeneratedOption.builder()
                        .text(optionText)
                        .isCorrect(isCorrect)
                        .build());
            }
        }
        
        return QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.builder()
                .text(text)
                .type(type)
                .options(options)
                .explanation(explanation)
                .points(points)
                .build();
    }

    /**
     * 生成备用测验（当AI不可用时）
     */
    private QuizGenerationRequest.QuizGenerationResponse generateFallbackQuizzes(Course course, AgentProcessRequest request) {
        List<QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz> quizzes = new ArrayList<>();
        
        for (int i = 1; i <= request.getQuizCount(); i++) {
            List<QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion> questions = new ArrayList<>();
            
            for (int j = 1; j <= request.getQuestionsPerQuiz(); j++) {
                List<QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.GeneratedOption> options = Arrays.asList(
                        QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.GeneratedOption.builder()
                                .text("选项 A")
                                .isCorrect(j == 1) // 第一题选A，其他题选B
                                .build(),
                        QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.GeneratedOption.builder()
                                .text("选项 B")
                                .isCorrect(j != 1)
                                .build(),
                        QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.GeneratedOption.builder()
                                .text("选项 C")
                                .isCorrect(false)
                                .build(),
                        QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.GeneratedOption.builder()
                                .text("选项 D")
                                .isCorrect(false)
                                .build()
                );
                
                questions.add(QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.builder()
                        .text("示例题目 " + j + "：基于《" + course.getTitle() + "》内容的问题")
                        .type("MULTIPLE_CHOICE")
                        .options(options)
                        .explanation("这是一个示例题目的解释说明。")
                        .points(1)
                        .build());
            }
            
            quizzes.add(QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.builder()
                    .title("第" + i + "章测验 - " + course.getTitle())
                    .description("基于《" + course.getTitle() + "》第" + i + "章内容的测验")
                    .difficulty(request.getDifficulty())
                    .questions(questions)
                    .build());
        }
        
        return QuizGenerationRequest.QuizGenerationResponse.builder()
                .quizzes(quizzes)
                .processingNotes("使用备用生成方案（AI服务不可用）")
                .build();
    }

    /**
     * 保存生成的测验到数据库
     */
    @Transactional
    private List<AgentProcessResult.QuizSummary> saveGeneratedQuizzes(
            Course course, 
            QuizGenerationRequest.QuizGenerationResponse generationResponse, 
            Boolean overwriteExisting) {
        
        List<AgentProcessResult.QuizSummary> summaries = new ArrayList<>();
        
        // 如果需要覆盖现有测验，先删除
        if (overwriteExisting) {
            List<Quiz> existingQuizzes = quizRepository.findByCourseIdAndIsActiveTrue(course.getId());
            for (Quiz quiz : existingQuizzes) {
                // 删除相关的题目和选项（级联删除应该自动处理）
                quizRepository.delete(quiz);
            }
        }
        
        // 保存新生成的测验
        for (QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz generatedQuiz : generationResponse.getQuizzes()) {
            Quiz quiz = new Quiz();
            quiz.setTitle(generatedQuiz.getTitle());
            quiz.setDescription(generatedQuiz.getDescription());
            quiz.setCourse(course);
            quiz.setCreatedAt(LocalDateTime.now());
            quiz.setUpdatedAt(LocalDateTime.now());
            
            Quiz savedQuiz = quizRepository.save(quiz);
            
            // 保存题目
            int questionOrder = 1;
            for (QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion generatedQuestion : generatedQuiz.getQuestions()) {
                Question question = new Question();
                question.setQuestionText(generatedQuestion.getText());
                question.setType(Question.QuestionType.valueOf(generatedQuestion.getType()));
                question.setPoints(generatedQuestion.getPoints());
                question.setExplanation(generatedQuestion.getExplanation());
                question.setQuiz(savedQuiz);
                question.setOrderIndex(questionOrder++);
                question.setIsActive(true);
                question.setCreatedAt(LocalDateTime.now());
                question.setUpdatedAt(LocalDateTime.now());
                
                Question savedQuestion = questionRepository.save(question);
                
                // 保存选项
                int optionOrder = 1;
                for (QuizGenerationRequest.QuizGenerationResponse.GeneratedQuiz.GeneratedQuestion.GeneratedOption generatedOption : generatedQuestion.getOptions()) {
                    QuestionOption option = new QuestionOption();
                    option.setOptionText(generatedOption.getText());
                    option.setIsCorrect(generatedOption.getIsCorrect());
                    option.setQuestion(savedQuestion);
                    option.setOrderIndex(optionOrder++);
                    option.setCreatedAt(LocalDateTime.now());
                    option.setUpdatedAt(LocalDateTime.now());
                    
                    questionOptionRepository.save(option);
                }
            }
            
            // 添加到摘要
            summaries.add(AgentProcessResult.QuizSummary.builder()
                    .quizId(savedQuiz.getId())
                    .title(savedQuiz.getTitle())
                    .description(savedQuiz.getDescription())
                    .questionCount(generatedQuiz.getQuestions().size())
                    .difficulty(generatedQuiz.getDifficulty())
                    .createdAt(savedQuiz.getCreatedAt())
                    .build());
        }
        
        return summaries;
    }

    /**
     * 更新任务状态
     */
    private void updateTaskStatus(String taskId, String status, Integer progress, String message, Long courseId) {
        ProcessingStatus processingStatus = taskStatusMap.computeIfAbsent(taskId, k -> 
                ProcessingStatus.builder()
                        .taskId(taskId)
                        .createdAt(LocalDateTime.now())
                        .courseId(courseId)
                        .build());
        
        processingStatus.setStatus(status);
        processingStatus.setProgress(progress);
        processingStatus.setMessage(message);
        processingStatus.setUpdatedAt(LocalDateTime.now());
        
        log.info("任务状态更新: taskId={}, status={}, progress={}%, message={}", 
                taskId, status, progress, message);
    }

/**
 * 上传PDF到OpenAI并返回file_id
 */
private String uploadPdfToOpenAI(byte[] pdfBytes, String fileName) {
    try {
        RequestBody fileBody = RequestBody.create(pdfBytes, MediaType.parse("application/pdf"));
        MultipartBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", fileName, fileBody)
                .addFormDataPart("purpose", "user_data")
                .build();

        Request request = new Request.Builder()
                .url(openaiBaseUrl + "/files")
                .post(requestBody)
                .addHeader("Authorization", "Bearer " + openaiApiKey)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String requestId = response.header("x-request-id");
            String respBody = response.body() != null ? response.body().string() : null;
            if (!response.isSuccessful()) {
                String errMsg = null;
                String errType = null;
                String errCode = null;
                String errParam = null;
                try {
                    if (respBody != null) {
                        JsonNode errNode = objectMapper.readTree(respBody);
                        if (errNode.has("error")) {
                            JsonNode e = errNode.get("error");
                            if (e.has("message")) errMsg = e.get("message").asText();
                            if (e.has("type")) errType = e.get("type").asText();
                            if (e.has("code")) errCode = e.get("code").asText();
                            if (e.has("param")) errParam = e.get("param").asText();
                        }
                    }
                } catch (Exception parseEx) {
                    // ignore parse error
                }
                log.error("上传PDF到OpenAI失败，HTTP {}，requestId={}，type={}，code={}，param={}，错误信息={}",
                        response.code(), requestId, errType, errCode, errParam, errMsg != null ? errMsg : respBody);
                return null;
            }
            if (respBody == null) {
                log.error("上传PDF到OpenAI失败：响应体为空，requestId={}", requestId);
                return null;
            }
            JsonNode node = objectMapper.readTree(respBody);
            return node.has("id") ? node.get("id").asText() : null;
        }
    } catch (Exception e) {
        log.error("上传PDF到OpenAI异常", e);
        return null;
    }
}

/**
 * 调用OpenAI Responses API（文件输入）并返回文本输出
 */
private String callOpenAIResponses(String fileId, String prompt) {
    try {
        // 构建请求JSON
        com.fasterxml.jackson.databind.node.ObjectNode root = objectMapper.createObjectNode();
        root.put("model", openaiModel);
        com.fasterxml.jackson.databind.node.ArrayNode input = root.putArray("input");

        com.fasterxml.jackson.databind.node.ObjectNode systemMsg = input.addObject();
        systemMsg.put("role", "system");
        com.fasterxml.jackson.databind.node.ArrayNode systemContent = systemMsg.putArray("content");
        systemContent.addObject().put("type", "text").put("text", "你是一个专业的教育内容分析师和测验生成专家。请根据提供的PDF内容生成高质量的测验并严格返回JSON格式。");

        com.fasterxml.jackson.databind.node.ObjectNode userMsg = input.addObject();
        userMsg.put("role", "user");
        com.fasterxml.jackson.databind.node.ArrayNode userContent = userMsg.putArray("content");
        userContent.addObject().put("type", "input_text").put("text", prompt);
        userContent.addObject().put("type", "input_file").put("file_id", fileId);

        root.put("temperature", 0.2);

        String json = objectMapper.writeValueAsString(root);
        RequestBody body = RequestBody.create(json, MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url(openaiBaseUrl + "/responses")
                .post(body)
                .addHeader("Authorization", "Bearer " + openaiApiKey)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String requestId = response.header("x-request-id");
            String respBody = response.body() != null ? response.body().string() : null;
            if (!response.isSuccessful()) {
                String errMsg = null;
                String errType = null;
                String errCode = null;
                String errParam = null;
                try {
                    if (respBody != null) {
                        JsonNode errNode = objectMapper.readTree(respBody);
                        if (errNode.has("error")) {
                            JsonNode e = errNode.get("error");
                            if (e.has("message")) errMsg = e.get("message").asText();
                            if (e.has("type")) errType = e.get("type").asText();
                            if (e.has("code")) errCode = e.get("code").asText();
                            if (e.has("param")) errParam = e.get("param").asText();
                        }
                    }
                } catch (Exception parseEx) {
                    // ignore
                }
                log.error("调用Responses API失败，HTTP {}，requestId={}，type={}，code={}，param={}，错误信息={}",
                        response.code(), requestId, errType, errCode, errParam, errMsg != null ? errMsg : respBody);
                return null;
            }
            if (respBody == null) {
                log.warn("Responses API返回为空，requestId={}", requestId);
                return null;
            }
            JsonNode node = objectMapper.readTree(respBody);
            // 优先解析 output 数组中的 output_text
            if (node.has("output") && node.get("output").isArray()) {
                for (JsonNode out : node.get("output")) {
                    if (out.has("content") && out.get("content").isArray()) {
                        for (JsonNode part : out.get("content")) {
                            if (part.has("type") && "output_text".equals(part.get("type").asText()) && part.has("text")) {
                                return part.get("text").asText();
                            }
                        }
                    }
                    if (out.has("type") && "output_text".equals(out.get("type").asText()) && out.has("text")) {
                        return out.get("text").asText();
                    }
                }
            }
            // 兼容：有些实现可能返回 output_text 字段
            if (node.has("output_text")) {
                return node.get("output_text").asText();
            }
            // 兜底：如果返回content结构（不太可能），尝试取第一段text
            if (node.has("content") && node.get("content").isArray() && node.get("content").size() > 0) {
                JsonNode c0 = node.get("content").get(0);
                if (c0.has("text")) return c0.get("text").asText();
            }
            log.warn("Responses API未返回可解析的文本输出");
            return null;
        }
    } catch (Exception e) {
        log.error("调用Responses API异常", e);
        return null;
    }
}
}