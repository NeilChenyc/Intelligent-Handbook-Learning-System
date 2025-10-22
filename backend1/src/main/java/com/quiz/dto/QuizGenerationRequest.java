package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

/**
 * 测验生成请求 DTO
 * 用于内部调用 OpenAI API 生成测验的数据结构
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizGenerationRequest {
    
    /**
     * PDF 文件内容（文本形式）
     */
    private String pdfContent;
    
    /**
     * 课程标题
     */
    private String courseTitle;
    
    /**
     * 课程描述
     */
    private String courseDescription;
    
    /**
     * 生成的测验数量
     */
    private Integer quizCount;
    
    /**
     * 每个测验的题目数量
     */
    private Integer questionsPerQuiz;
    
    /**
     * 难度级别
     */
    private String difficulty;
    
    /**
     * 额外指令
     */
    private String additionalInstructions;
    
    /**
     * 测验生成响应 DTO
     */
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