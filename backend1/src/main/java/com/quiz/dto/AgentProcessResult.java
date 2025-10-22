package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Agent 处理结果 DTO
 * 用于返回 AI 自动生成测验的处理结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentProcessResult {
    
    /**
     * 处理状态：SUCCESS, FAILED, IN_PROGRESS, PARTIAL_SUCCESS
     */
    private String status;
    
    /**
     * 任务ID，用于异步查询处理状态
     */
    private String taskId;
    
    /**
     * 课程ID
     */
    private Long courseId;
    
    /**
     * 生成的测验摘要列表
     */
    private List<QuizSummary> generatedQuizzes;
    
    /**
     * 处理日志和详细信息
     */
    private String processingLog;
    
    /**
     * 错误信息（如果处理失败）
     */
    private String errorMessage;
    
    /**
     * 处理开始时间
     */
    private LocalDateTime startTime;
    
    /**
     * 处理结束时间
     */
    private LocalDateTime endTime;
    
    /**
     * 处理耗时（毫秒）
     */
    private Long processingTimeMs;
    
    /**
     * OpenAI API 调用统计
     */
    private ApiUsageStats apiUsage;
    
    /**
     * 测验摘要信息
     */
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
    
    /**
     * API 使用统计
     */
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