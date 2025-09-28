package com.quiz.agent;

import com.quiz.dto.QuizGenerationRequest;
import com.quiz.dto.QuizGenerationResponse;
import com.quiz.entity.Quiz;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Slf4j
public class PdfQuizAgent {
    
    @Value("${openai.api.key:}")
    private String openaiApiKey;
    
    @Value("${quiz.generation.max-questions:10}")
    private int maxQuestions;
    
    private ChatLanguageModel chatModel;
    
    // 使用@PostConstruct注解来初始化，确保@Value注入完成后再执行
    @jakarta.annotation.PostConstruct
    public void init() {
        // 初始化ChatModel，如果没有API key则使用模拟模式
        if (openaiApiKey != null && !openaiApiKey.isEmpty()) {
            this.chatModel = OpenAiChatModel.builder()
                    .apiKey(openaiApiKey)
                    .modelName("gpt-3.5-turbo")
                    .temperature(0.7)
                    .build();
        }
    }
    
    /**
     * 从PDF文件生成Quiz题目
     */
    public QuizGenerationResponse generateQuizFromPdf(MultipartFile pdfFile, QuizGenerationRequest request) {
        try {
            // 1. 提取PDF文本内容
            String pdfContent = extractTextFromPdf(pdfFile);
            log.info("Extracted {} characters from PDF", pdfContent.length());
            
            // 2. 生成Quiz题目
            List<Quiz> quizzes = generateQuizzes(pdfContent, request);
            
            // 3. 构建响应
            QuizGenerationResponse response = new QuizGenerationResponse();
            response.setSuccess(true);
            response.setQuizzes(quizzes);
            response.setTotalGenerated(quizzes.size());
            response.setMessage("成功生成 " + quizzes.size() + " 道题目");
            
            return response;
            
        } catch (Exception e) {
            log.error("Error generating quiz from PDF", e);
            QuizGenerationResponse response = new QuizGenerationResponse();
            response.setSuccess(false);
            response.setMessage("生成题目失败: " + e.getMessage());
            return response;
        }
    }
    
    /**
     * 从PDF文件中提取文本内容
     */
    private String extractTextFromPdf(MultipartFile pdfFile) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfFile.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
    
    /**
     * 基于文本内容生成Quiz题目
     */
    private List<Quiz> generateQuizzes(String content, QuizGenerationRequest request) {
        List<Quiz> quizzes = new ArrayList<>();
        
        if (chatModel != null && openaiApiKey != null && !openaiApiKey.isEmpty()) {
            // 使用AI生成题目
            quizzes = generateQuizzesWithAI(content, request);
        } else {
            // 使用规则生成题目（模拟模式）
            quizzes = generateQuizzesWithRules(content, request);
        }
        
        return quizzes;
    }
    
    /**
     * 使用AI模型生成题目
     */
    private List<Quiz> generateQuizzesWithAI(String content, QuizGenerationRequest request) {
        List<Quiz> quizzes = new ArrayList<>();
        
        try {
            String prompt = buildPrompt(content, request);
            String response = chatModel.generate(prompt);
            quizzes = parseAIResponse(response);
            
        } catch (Exception e) {
            log.error("Error generating quizzes with AI", e);
            // 如果AI生成失败，回退到规则生成
            quizzes = generateQuizzesWithRules(content, request);
        }
        
        return quizzes;
    }
    
    /**
     * 构建AI提示词
     */
    private String buildPrompt(String content, QuizGenerationRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("基于以下文档内容，生成").append(request.getQuestionCount()).append("道小测题目。\n\n");
        prompt.append("文档内容：\n").append(content).append("\n\n");
        prompt.append("要求：\n");
        prompt.append("1. 题目类型包括：单选题、多选题、判断题\n");
        prompt.append("2. 每道题目包含：题目、选项、正确答案、解释\n");
        prompt.append("3. 题目应该覆盖文档的关键知识点\n");
        prompt.append("4. 难度适中，适合员工培训考核\n\n");
        prompt.append("请按照以下JSON格式返回：\n");
        prompt.append("{\n");
        prompt.append("  \"quizzes\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"question\": \"题目内容\",\n");
        prompt.append("      \"type\": \"SINGLE_CHOICE\",\n");
        prompt.append("      \"options\": [\"选项A\", \"选项B\", \"选项C\", \"选项D\"],\n");
        prompt.append("      \"correctAnswer\": \"0\",\n");
        prompt.append("      \"explanation\": \"答案解释\",\n");
        prompt.append("      \"points\": 10\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }
    
    /**
     * 解析AI响应
     */
    private List<Quiz> parseAIResponse(String response) {
        List<Quiz> quizzes = new ArrayList<>();
        
        // 这里应该实现JSON解析逻辑
        // 为了简化，先返回空列表，实际项目中需要完善JSON解析
        log.info("AI Response: {}", response);
        
        return quizzes;
    }
    
    /**
     * 使用规则生成题目（模拟模式）
     */
    private List<Quiz> generateQuizzesWithRules(String content, QuizGenerationRequest request) {
        List<Quiz> quizzes = new ArrayList<>();
        
        // 简单的规则：基于关键词生成题目
        List<String> sentences = extractKeySentences(content);
        int questionCount = Math.min(request.getQuestionCount(), sentences.size());
        
        for (int i = 0; i < questionCount && i < maxQuestions; i++) {
            Quiz quiz = createSampleQuiz(sentences.get(i), i + 1);
            quizzes.add(quiz);
        }
        
        return quizzes;
    }
    
    /**
     * 提取关键句子
     */
    private List<String> extractKeySentences(String content) {
        List<String> sentences = new ArrayList<>();
        
        // 简单的句子分割
        String[] parts = content.split("[。！？\\n]");
        for (String part : parts) {
            String sentence = part.trim();
            if (sentence.length() > 10 && sentence.length() < 200) {
                sentences.add(sentence);
            }
        }
        
        return sentences;
    }
    
    /**
     * 创建示例题目
     */
    private Quiz createSampleQuiz(String baseSentence, int index) {
        Quiz quiz = new Quiz();
        quiz.setQuestion("根据文档内容，以下关于「" + baseSentence.substring(0, Math.min(20, baseSentence.length())) + "...」的描述，哪个是正确的？");
        quiz.setType(Quiz.QuizType.SINGLE_CHOICE);
        quiz.setOptions("[\"选项A\", \"选项B\", \"选项C\", \"选项D\"]");
        quiz.setCorrectAnswer("0");
        quiz.setExplanation("根据文档内容，正确答案是选项A。");
        quiz.setPoints(10);
        quiz.setOrderIndex(index);
        
        return quiz;
    }
}