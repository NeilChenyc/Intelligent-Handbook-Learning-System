package com.quiz.service;

import com.quiz.entity.Question;
import com.quiz.entity.QuestionOption;
import com.quiz.repository.QuestionOptionRepository;
import com.quiz.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionOptionService {

    private final QuestionOptionRepository questionOptionRepository;
    private final QuestionRepository questionRepository;

    public List<QuestionOption> getOptionsByQuestion(Long questionId) {
        return questionOptionRepository.findByQuestionIdOrderByOrderIndexAsc(questionId);
    }

    public List<QuestionOption> getOptionsByQuestion(Question question) {
        return questionOptionRepository.findByQuestionOrderByOrderIndexAsc(question);
    }

    public List<QuestionOption> getCorrectOptionsByQuestion(Long questionId) {
        return questionOptionRepository.findCorrectOptionsByQuestionId(questionId);
    }

    public Optional<QuestionOption> getOptionById(Long id) {
        return questionOptionRepository.findById(id);
    }

    public QuestionOption createOption(QuestionOption option) {
        // 验证题目是否存在
        Question question = questionRepository.findById(option.getQuestion().getId())
                .orElseThrow(() -> new RuntimeException("Question not found"));
        
        option.setQuestion(question);
        option.setCreatedAt(LocalDateTime.now());
        option.setUpdatedAt(LocalDateTime.now());

        QuestionOption savedOption = questionOptionRepository.save(option);
        log.info("Question option created with id: {}", savedOption.getId());
        return savedOption;
    }

    public QuestionOption updateOption(Long id, QuestionOption updatedOption) {
        QuestionOption existingOption = questionOptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question option not found"));

        existingOption.setOptionText(updatedOption.getOptionText());
        existingOption.setIsCorrect(updatedOption.getIsCorrect());
        existingOption.setOrderIndex(updatedOption.getOrderIndex());
        existingOption.setUpdatedAt(LocalDateTime.now());

        QuestionOption savedOption = questionOptionRepository.save(existingOption);
        log.info("Question option updated with id: {}", savedOption.getId());
        return savedOption;
    }

    public void deleteOption(Long id) {
        QuestionOption option = questionOptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question option not found"));
        
        questionOptionRepository.delete(option);
        log.info("Question option with id {} has been deleted", id);
    }

    public List<QuestionOption> createOptionsForQuestion(Long questionId, List<QuestionOption> options) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        return options.stream()
                .map(option -> {
                    option.setQuestion(question);
                    option.setCreatedAt(LocalDateTime.now());
                    option.setUpdatedAt(LocalDateTime.now());
                    return questionOptionRepository.save(option);
                })
                .toList();
    }

    public void deleteAllOptionsByQuestion(Long questionId) {
        List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderByOrderIndexAsc(questionId);
        questionOptionRepository.deleteAll(options);
        log.info("Deleted all options for question with id: {}", questionId);
    }

    public Long getCorrectOptionsCount(Long questionId) {
        return questionOptionRepository.countCorrectOptionsByQuestionId(questionId);
    }

    public boolean isOptionOwnedByTeacher(Long optionId, Long teacherId) {
        Optional<QuestionOption> option = questionOptionRepository.findById(optionId);
        return option.isPresent() && 
               option.get().getQuestion().getQuiz().getCourse().getTeacher().getId().equals(teacherId);
    }

    public boolean validateQuestionOptions(Long questionId) {
        List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderByOrderIndexAsc(questionId);
        
        if (options.isEmpty()) {
            return false;
        }

        // 检查是否至少有一个正确答案
        long correctCount = options.stream()
                .mapToLong(option -> option.getIsCorrect() ? 1 : 0)
                .sum();
        
        return correctCount > 0;
    }
}