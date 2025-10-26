package com.quiz.dto;

import com.quiz.entity.Question;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private Long id;
    private String questionText;
    private Question.QuestionType type;
    private String explanation;
    private Integer points;
    private Integer orderIndex;
    private List<QuestionOptionDto> options;
}