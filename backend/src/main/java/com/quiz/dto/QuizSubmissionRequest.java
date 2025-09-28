package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmissionRequest {
    
    @NotNull(message = "用户答案不能为空")
    private List<String> userAnswers;
    
    private Long timeSpent; // 答题花费时间（秒）
}