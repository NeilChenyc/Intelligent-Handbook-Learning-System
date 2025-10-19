package com.quiz.dto;

import com.quiz.entity.Question;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionRequest {
    private String text;
    private Question.QuestionType type;
    private Long quizId;
    private List<CreateQuestionOptionRequest> options;
    private Integer points = 1;
    private String explanation;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateQuestionOptionRequest {
        private String text;
        private Boolean isCorrect = false;
    }
}