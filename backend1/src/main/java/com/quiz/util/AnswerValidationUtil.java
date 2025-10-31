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
        if (selectedOptionIds.isEmpty()) {
            return false;
        }
        
        // Get correct answer的IDList
        List<Long> correctOptionIds = correctOptions.stream()
                .map(QuestionOption::getId)
                .toList();
        
        if (questionType == Question.QuestionType.SINGLE_CHOICE) {
            // Single choice: Can only select one option, and must be the correct option
            return selectedOptionIds.size() == 1 && correctOptionIds.contains(selectedOptionIds.get(0));
        } else if (questionType == Question.QuestionType.MULTIPLE_CHOICE) {
            // Multiple choice: Selected options must exactly match correct options
            return selectedOptionIds.size() == correctOptionIds.size() && 
                   selectedOptionIds.containsAll(correctOptionIds) && 
                   correctOptionIds.containsAll(selectedOptionIds);
        }
        
        return false;
    }
}