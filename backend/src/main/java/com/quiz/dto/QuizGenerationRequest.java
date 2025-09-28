package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizGenerationRequest {
    
    private Long courseId;
    private String courseTitle;
    private String courseDescription;
    private Integer questionCount = 10;
    private String difficulty = "medium"; // easy, medium, hard
    private String[] questionTypes = {"SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"};
    private String language = "zh-CN";
    private Boolean includeExplanations = true;
}