package com.quiz.agent;

import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class QuizGenerationAgent {

    private final QuizGenerator quizGenerator;

    public QuizGenerationAgent() {
        // For MVP, we'll use a mock implementation instead of actual OpenAI
        // This avoids the need for API keys during development
        QuizGenerator tempGenerator = null;
        try {
            // Try to create with OpenAI if API key is available
            String apiKey = System.getenv("OPENAI_API_KEY");
            if (apiKey != null && !apiKey.isEmpty()) {
                tempGenerator = AiServices.builder(QuizGenerator.class)
                        .chatLanguageModel(OpenAiChatModel.withApiKey(apiKey))
                        .build();
            } else {
                // Use mock implementation for development
                log.warn("OpenAI API key not found, using mock quiz generation");
            }
        } catch (Exception e) {
            log.error("Failed to initialize QuizGenerator, using mock implementation", e);
        }
        this.quizGenerator = tempGenerator;
    }

    public interface QuizGenerator {
        @SystemMessage("You are an expert quiz generator. Generate educational quiz questions based on the given content. " +
                "Return the response in JSON format with the following structure: " +
                "{ \"questions\": [{ \"question\": \"question text\", \"type\": \"MULTIPLE_CHOICE\", " +
                "\"options\": [\"option1\", \"option2\", \"option3\", \"option4\"], " +
                "\"correctAnswers\": [\"correct answer\"], \"explanation\": \"explanation text\", \"points\": 1 }] }")
        String generateQuizzes(@UserMessage String content, @UserMessage String difficulty, @UserMessage int numberOfQuestions);

        @SystemMessage("You are an educational content analyzer. Analyze the given text and extract key learning points. " +
                "Return a summary of the main concepts that could be used for quiz generation.")
        String analyzeContent(@UserMessage String content);

        @SystemMessage("You are a quiz difficulty assessor. Rate the difficulty of the given quiz question on a scale of 1-5 " +
                "where 1 is very easy and 5 is very difficult. Also provide suggestions for improvement.")
        String assessQuizDifficulty(@UserMessage String question, @UserMessage List<String> options);
    }

    public String generateQuizzes(String content, String difficulty, int numberOfQuestions) {
        try {
            if (quizGenerator != null) {
                return quizGenerator.generateQuizzes(content, difficulty, numberOfQuestions);
            } else {
                return generateFallbackQuiz(content, numberOfQuestions);
            }
        } catch (Exception e) {
            // Fallback for demo purposes
            return generateFallbackQuiz(content, numberOfQuestions);
        }
    }

    public String analyzeContent(String content) {
        try {
            if (quizGenerator != null) {
                return quizGenerator.analyzeContent(content);
            } else {
                return "Content analysis unavailable. Please ensure AI service is properly configured.";
            }
        } catch (Exception e) {
            return "Content analysis unavailable. Please ensure AI service is properly configured.";
        }
    }

    public String assessQuizDifficulty(String question, List<String> options) {
        try {
            if (quizGenerator != null) {
                return quizGenerator.assessQuizDifficulty(question, options);
            } else {
                return "Difficulty assessment unavailable. Please ensure AI service is properly configured.";
            }
        } catch (Exception e) {
            return "Difficulty assessment unavailable. Please ensure AI service is properly configured.";
        }
    }

    private String generateFallbackQuiz(String content, int numberOfQuestions) {
        // Simple fallback quiz generation for demo
        StringBuilder json = new StringBuilder();
        json.append("{ \"questions\": [");
        
        for (int i = 0; i < numberOfQuestions; i++) {
            if (i > 0) json.append(", ");
            json.append("{ ")
                .append("\"question\": \"Sample question ").append(i + 1).append(" based on: ").append(content.substring(0, Math.min(50, content.length()))).append("...\", ")
                .append("\"type\": \"MULTIPLE_CHOICE\", ")
                .append("\"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"], ")
                .append("\"correctAnswers\": [\"Option A\"], ")
                .append("\"explanation\": \"This is a sample explanation for demonstration purposes.\", ")
                .append("\"points\": 1 ")
                .append("}");
        }
        
        json.append("] }");
        return json.toString();
    }
}