package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartQuizRequest {
    @JsonProperty("userId")
    private Long userId;
    
    @JsonProperty("quizId")
    private Long quizId;
}