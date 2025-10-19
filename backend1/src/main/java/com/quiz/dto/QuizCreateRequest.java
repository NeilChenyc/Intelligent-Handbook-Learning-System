package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizCreateRequest {
    private Long courseId;
    private String title;
    private String description;
    private Integer timeLimitMinutes;
    private Integer totalPoints;
    private Integer passingScore;
    private Integer maxAttempts;
    private Boolean isActive;
}