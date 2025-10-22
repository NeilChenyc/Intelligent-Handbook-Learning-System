package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 处理状态 DTO
 * 用于异步查询 AI 处理任务的当前状态
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingStatus {
    
    /**
     * 任务ID
     */
    private String taskId;
    
    /**
     * 当前状态：PENDING, IN_PROGRESS, COMPLETED, FAILED
     */
    private String status;
    
    /**
     * 进度百分比 (0-100)
     */
    private Integer progress;
    
    /**
     * 当前处理步骤描述
     */
    private String currentStep;
    
    /**
     * 状态消息
     */
    private String message;
    
    /**
     * 任务创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 最后更新时间
     */
    private LocalDateTime updatedAt;
    
    /**
     * 预估剩余时间（秒）
     */
    private Long estimatedRemainingSeconds;
    
    /**
     * 错误信息（如果失败）
     */
    private String errorMessage;
    
    /**
     * 课程ID
     */
    private Long courseId;
    
    /**
     * 已完成的测验数量
     */
    private Integer completedQuizzes;
    
    /**
     * 总测验数量
     */
    private Integer totalQuizzes;
}