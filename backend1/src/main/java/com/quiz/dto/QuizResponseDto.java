package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponseDto {
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
    
    // Course信息
    private Long courseId;
    private String courseTitle;
    
    // 题目数量
    private Integer questionCount;
}