package com.quiz.agent;

import com.quiz.dto.QuizCreateRequest;
import com.quiz.entity.Quiz;
import com.quiz.entity.Course;
import com.quiz.service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PdfQuizAgent {

    private final QuizGenerationAgent quizGenerationAgent;
    private final QuizService quizService;

    public List<Quiz> generateQuizzesFromPdf(MultipartFile pdfFile, Course course, String difficulty, int numberOfQuestions) {
        try {
            String extractedText = extractTextFromPdf(pdfFile);
            
            // Analyze content first
            String contentAnalysis = quizGenerationAgent.analyzeContent(extractedText);
            log.info("Content analysis: {}", contentAnalysis);
            
            // Generate quizzes using AI
            String quizJson = quizGenerationAgent.generateQuizzes(extractedText, difficulty, numberOfQuestions);
            
            // Parse and create quiz entities
            List<Quiz> quizzes = parseQuizJsonToEntities(quizJson, course);
            
            // Save quizzes
            List<Quiz> savedQuizzes = new ArrayList<>();
            for (Quiz quiz : quizzes) {
                // Convert Quiz entity to QuizCreateRequest
                QuizCreateRequest request = new QuizCreateRequest();
                request.setCourseId(quiz.getCourse().getId());
                request.setTitle(quiz.getTitle());
                request.setDescription(quiz.getDescription());
                request.setTimeLimitMinutes(quiz.getTimeLimitMinutes());
                request.setTotalPoints(quiz.getTotalPoints());
                request.setPassingScore(quiz.getPassingScore());
                request.setMaxAttempts(quiz.getMaxAttempts());
                request.setIsActive(quiz.getIsActive());
                
                savedQuizzes.add(quizService.createQuiz(request));
            }
            
            return savedQuizzes;
            
        } catch (Exception e) {
            log.error("Error generating quizzes from PDF", e);
            throw new RuntimeException("Failed to generate quizzes from PDF: " + e.getMessage());
        }
    }

    private String extractTextFromPdf(MultipartFile pdfFile) throws IOException {
        // For MVP demo, we'll simulate PDF text extraction
        // In a real implementation, you would use libraries like Apache PDFBox or iText
        
        if (pdfFile.getOriginalFilename() != null && pdfFile.getOriginalFilename().endsWith(".txt")) {
            // If it's a text file, read directly
            return new String(pdfFile.getBytes(), StandardCharsets.UTF_8);
        }
        
        // Simulate PDF text extraction with sample content
        return "This is simulated PDF content for demonstration purposes. " +
               "In a real implementation, this would contain the actual extracted text from the PDF file. " +
               "The content would include educational material such as definitions, concepts, examples, and explanations " +
               "that can be used to generate meaningful quiz questions. " +
               "For example, if this were a computer science PDF, it might contain information about algorithms, " +
               "data structures, programming concepts, and software engineering principles.";
    }

    private List<Quiz> parseQuizJsonToEntities(String quizJson, Course course) {
        // For MVP, we'll create a simple parser
        // In a real implementation, you would use Jackson or Gson for proper JSON parsing
        
        List<Quiz> quizzes = new ArrayList<>();
        
        try {
            // Simple parsing for demo - in real implementation use proper JSON library
            if (quizJson.contains("\"questions\"")) {
                // Create sample quiz with new structure
                Quiz quiz = new Quiz();
                quiz.setCourse(course);
                quiz.setTitle("Generated Quiz from PDF");
                quiz.setDescription("This quiz was generated from the uploaded PDF content");
                quiz.setTimeLimitMinutes(30);
                quiz.setTotalPoints(30); // Will be calculated based on questions
                quiz.setPassingScore(70);
                quiz.setMaxAttempts(3);
                quiz.setIsActive(true);
                
                quizzes.add(quiz);
            }
        } catch (Exception e) {
            log.error("Error parsing quiz JSON", e);
            // Create fallback quiz with new structure
            Quiz fallbackQuiz = new Quiz();
            fallbackQuiz.setCourse(course);
            fallbackQuiz.setTitle("Sample Quiz from PDF");
            fallbackQuiz.setDescription("This is a sample quiz generated from uploaded content");
            fallbackQuiz.setTimeLimitMinutes(30);
            fallbackQuiz.setTotalPoints(10);
            fallbackQuiz.setPassingScore(60);
            fallbackQuiz.setMaxAttempts(3);
            fallbackQuiz.setIsActive(true);
            
            quizzes.add(fallbackQuiz);
        }
        
        return quizzes;
    }

    public String analyzeUploadedContent(MultipartFile file) {
        try {
            String content = extractTextFromPdf(file);
            return quizGenerationAgent.analyzeContent(content);
        } catch (Exception e) {
            log.error("Error analyzing uploaded content", e);
            return "Content analysis failed: " + e.getMessage();
        }
    }
}