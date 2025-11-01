package com.quiz.util;

import com.quiz.entity.Question;
import com.quiz.entity.QuestionOption;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
public class AnswerValidationUtil {
    
    /* * * ValidateAnswer是否正确
     * @param selectedOptions UserSelect的Option
     * @param correctOptions 正确AnswerOption
     * @param questionType QuestionClass型
     * @return 是否正确 */
    public static boolean isAnswerCorrect(List<QuestionOption> selectedOptions, 
                                        List<QuestionOption> correctOptions, 
                                        Question.QuestionType questionType) {
        if (selectedOptions.isEmpty()) {
            return false;
        }
        
        if (questionType == Question.QuestionType.SINGLE_CHOICE) {
            // TODO: Translate - Single choice: Can only select one option, and must be the correct option
            return selectedOptions.size() == 1 && correctOptions.contains(selectedOptions.get(0));
        } else if (questionType == Question.QuestionType.MULTIPLE_CHOICE) {
            // Multiple choice: Selected options must exactly match correct options
            return selectedOptions.size() == correctOptions.size() && 
                   selectedOptions.containsAll(correctOptions) && 
                   correctOptions.containsAll(selectedOptions);
        }
        
        return false;
    }
    
    /* * * 根据OptionIDValidateAnswer是否正确
     * @param selectedOptionIds UserSelect的OptionIDList
     * @param correctOptions 正确AnswerOption
     * @param questionType QuestionClass型
     * @return 是否正确 */
    public static boolean isAnswerCorrectByIds(List<Long> selectedOptionIds, 
                                             List<QuestionOption> correctOptions, 
                                             Question.QuestionType questionType) {
        log.info("=== AnswerValidationUtil.isAnswerCorrectByIds ===");
        log.info("Selected option IDs: {}", selectedOptionIds);
        log.info("Question type: {}", questionType);
        log.info("Correct options: {}", correctOptions);
        
        if (selectedOptionIds.isEmpty()) {
            log.info("Selected options is empty, returning false");
            return false;
        }
        
        // Get correct answer的IDList
        List<Long> correctOptionIds = correctOptions.stream()
                .map(QuestionOption::getId)
                .toList();
        
        log.info("Correct option IDs: {}", correctOptionIds);
        
        if (questionType == Question.QuestionType.SINGLE_CHOICE) {
            log.info("Processing SINGLE_CHOICE question");
            boolean sizeCheck = selectedOptionIds.size() == 1;
            
            Long selectedId = selectedOptionIds.get(0);
            log.info("Selected ID: {} (type: {})", selectedId, selectedId.getClass().getSimpleName());
            log.info("Correct option IDs details:");
            for (int i = 0; i < correctOptionIds.size(); i++) {
                Long correctId = correctOptionIds.get(i);
                log.info("  [{}]: {} (type: {})", i, correctId, correctId.getClass().getSimpleName());
                log.info("  equals check: {}", selectedId.equals(correctId));
            }
            
            boolean containsCheck = correctOptionIds.contains(selectedId);
            log.info("Size check (should be 1): {} (actual size: {})", sizeCheck, selectedOptionIds.size());
            log.info("Contains check: {} (checking if {} is in {})", containsCheck, selectedId, correctOptionIds);
            
            boolean result = sizeCheck && containsCheck;
            log.info("Final result: {}", result);
            return result;
        } else if (questionType == Question.QuestionType.MULTIPLE_CHOICE) {
            log.info("Processing MULTIPLE_CHOICE question");
            // Multiple choice: Selected options must exactly match correct options
            boolean result = selectedOptionIds.size() == correctOptionIds.size() && 
                   selectedOptionIds.containsAll(correctOptionIds) && 
                   correctOptionIds.containsAll(selectedOptionIds);
            log.info("Final result: {}", result);
            return result;
        }
        
        log.info("Unknown question type, returning false");
        return false;
    }
}