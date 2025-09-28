package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizCreateRequest {
    
    @NotNull(message = "课程ID不能为空")
    private Long courseId;
    
    @NotBlank(message = "题目不能为空")
    private String question;
    
    @NotBlank(message = "题目类型不能为空")
    private String questionType; // SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE
    
    @NotNull(message = "选项不能为空")
    private List<String> options;
    
    @NotNull(message = "正确答案不能为空")
    private List<String> correctAnswers;
    
    private String explanation;
    
    private String difficulty = "MEDIUM"; // EASY, MEDIUM, HARD
    
    @Min(value = 1, message = "分数必须大于0")
    private Integer points = 1;
}