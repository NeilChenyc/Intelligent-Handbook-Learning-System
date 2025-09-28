package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmissionResponse {
    
    private Long quizId;
    private boolean isCorrect;
    private Integer score;
    private Integer totalPoints;
    private List<String> userAnswers;
    private List<String> correctAnswers;
    private String explanation;
    private Long timeSpent;
    private Integer attemptCount;
}