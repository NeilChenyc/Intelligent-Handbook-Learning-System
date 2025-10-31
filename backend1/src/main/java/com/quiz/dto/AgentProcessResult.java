package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/* * * Agent ProcessResult DTO
 * Used forReturn AI 自动生成测验的ProcessResult */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentProcessResult {
    
    /** * ProcessStatus：SUCCESS, FAILED, IN_PROGRESS, PARTIAL_SUCCESS */
    private String status;
    
    /* * * TaskID，Used forAsyncQueryProcessStatus */
    private String taskId;
    
    /** * CourseID */
    private Long courseId;
    
    /* * * Generate的QuizSummaryList */
    private List<QuizSummary> generatedQuizzes;
    
    /* * * ProcessLog和详细Info */
    private String processingLog;
    
    /* * * ErrorInfo（如果ProcessFailure） */
    private String errorMessage;
    
    /* * * ProcessStartTime */
    private LocalDateTime startTime;
    
    /* * * ProcessEndTime */
    private LocalDateTime endTime;
    
    /* * * Process耗时（毫Second） */
    private Long processingTimeMs;
    
    /* * * OpenAI API 调用Statistics */
    private ApiUsageStats apiUsage;
    
    /* * * QuizSummaryInfo */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizSummary {
        private Long quizId;
        private String title;
        private String description;
        private Integer questionCount;
        private String difficulty;
        private LocalDateTime createdAt;
    }
    
    /* * * API 使用Statistics */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApiUsageStats {
        private Integer totalTokens;
        private Integer promptTokens;
        private Integer completionTokens;
        private Double estimatedCost;
        private String model;
    }
}