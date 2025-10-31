package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * Quiz Summary DTO - Used for quiz list display, excluding question details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizSummaryDto {
    private Long id;
    private String title;
    private String description;
    private Integer timeLimitMinutes;
    private Integer totalPoints;
    private Integer passingScore;
    private Integer maxAttempts;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Course information
    private Long courseId;
    private String courseTitle;
    
    // Question count (excluding question details)
    private Integer questionCount;
}