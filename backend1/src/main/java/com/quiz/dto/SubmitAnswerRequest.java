package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerRequest {
    private Long questionId;
    private List<String> selectedOptions; // Frontend sends option identifiers, like ["a", "b"]
}