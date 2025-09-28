package com.quiz.dto;

import com.quiz.entity.Quiz;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizGenerationResponse {
    
    private Boolean success;
    private String message;
    private List<Quiz> quizzes;
    private Integer totalGenerated;
    private Integer totalRequested;
    private String processingTime;
}