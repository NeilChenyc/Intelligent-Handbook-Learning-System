package com.quiz.util;

import com.quiz.entity.Question;
import com.quiz.entity.QuestionOption;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
public class AnswerValidationUtil {
    
    /**
     * 验证答案是否正确
     * @param selectedOptions 用户选择的选项
     * @param correctOptions 正确答案选项
     * @param questionType 题目类型
     * @return 是否正确
     */
    public static boolean isAnswerCorrect(List<QuestionOption> selectedOptions, 
                                        List<QuestionOption> correctOptions, 
                                        Question.QuestionType questionType) {
        if (selectedOptions.isEmpty()) {
            return false;
        }
        
        if (questionType == Question.QuestionType.SINGLE_CHOICE) {
            // 单选题：只能选择一个选项，且必须是正确选项
            return selectedOptions.size() == 1 && correctOptions.contains(selectedOptions.get(0));
        } else if (questionType == Question.QuestionType.MULTIPLE_CHOICE) {
            // 多选题：选择的选项必须与正确选项完全匹配
            return selectedOptions.size() == correctOptions.size() && 
                   selectedOptions.containsAll(correctOptions) && 
                   correctOptions.containsAll(selectedOptions);
        }
        
        return false;
    }
    
    /**
     * 根据选项ID验证答案是否正确
     * @param selectedOptionIds 用户选择的选项ID列表
     * @param correctOptions 正确答案选项
     * @param questionType 题目类型
     * @return 是否正确
     */
    public static boolean isAnswerCorrectByIds(List<Long> selectedOptionIds, 
                                             List<QuestionOption> correctOptions, 
                                             Question.QuestionType questionType) {
        if (selectedOptionIds.isEmpty()) {
            return false;
        }
        
        // 获取正确答案的ID列表
        List<Long> correctOptionIds = correctOptions.stream()
                .map(QuestionOption::getId)
                .toList();
        
        if (questionType == Question.QuestionType.SINGLE_CHOICE) {
            // 单选题：只能选择一个选项，且必须是正确选项
            return selectedOptionIds.size() == 1 && correctOptionIds.contains(selectedOptionIds.get(0));
        } else if (questionType == Question.QuestionType.MULTIPLE_CHOICE) {
            // 多选题：选择的选项必须与正确选项完全匹配
            return selectedOptionIds.size() == correctOptionIds.size() && 
                   selectedOptionIds.containsAll(correctOptionIds) && 
                   correctOptionIds.containsAll(selectedOptionIds);
        }
        
        return false;
    }
}