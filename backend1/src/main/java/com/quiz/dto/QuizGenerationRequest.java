package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

/* * * 测验生成Request DTO
 * Used for内部调用 OpenAI API 生成测验的DataStructure */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizGenerationRequest {
    
    /* * * PDF FileContent（Text形式） */
    private String pdfContent;
    
    /* * * CourseTitle */
    private String courseTitle;
    
    /* * * Course描述 */
    private String courseDescription;
    
    /* * * Generate的QuizQuantity */
    private Integer quizCount;
    
    /* * * 每个Quiz的QuestionQuantity */
    private Integer questionsPerQuiz;
    
    /* * * 难度级别 */
    private String difficulty;
    
    /* * * 额外指令 */
    private String additionalInstructions;
    
    /** * QuizGenerateResponse DTO */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizGenerationResponse {
        private List<GeneratedQuiz> quizzes;
        private String processingNotes;
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class GeneratedQuiz {
            private String title;
            private String description;
            private String difficulty;
            private List<GeneratedQuestion> questions;
            
            @Data
            @NoArgsConstructor
            @AllArgsConstructor
            @Builder
            public static class GeneratedQuestion {
                private String text;
                private String type; // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
                private List<GeneratedOption> options;
                private String explanation;
                private Integer points;
                
                @Data
                @NoArgsConstructor
                @AllArgsConstructor
                @Builder
                public static class GeneratedOption {
                    private String text;
                    private Boolean isCorrect;
                }
            }
        }
    }
}