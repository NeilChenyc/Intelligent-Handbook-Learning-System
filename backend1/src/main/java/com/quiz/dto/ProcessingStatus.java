package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/* * * ProcessStatus DTO
 * Used forAsynchronousQuery AI ProcessTask的当前Status */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingStatus {
    
    /* * * TaskID */
    private String taskId;
    
    /* * * 当前Status：PENDING, IN_PROGRESS, COMPLETED, FAILED */
    private String status;
    
    /* * * ProgressPercentage (0-100) */
    private Integer progress;
    
    /* * * 当前Process步骤描述 */
    private String currentStep;
    
    /** * StatusMessage */
    private String message;
    
    /* * * TaskCreateTime */
    private LocalDateTime createdAt;
    
    /* * * 最后UpdateTime */
    private LocalDateTime updatedAt;
    
    /* * * 预估剩余Time（Second） */
    private Long estimatedRemainingSeconds;
    
    /* * * ErrorInfo（如果Failure） */
    private String errorMessage;
    
    /** * CourseID */
    private Long courseId;
    
    /* * * 已完成的QuizQuantity */
    private Integer completedQuizzes;
    
    /* * * 总QuizQuantity */
    private Integer totalQuizzes;
}