package com.quiz.service;

import com.quiz.dto.CreateQuestionRequest;
import com.quiz.dto.QuestionDto;
import com.quiz.dto.QuestionOptionDto;
import com.quiz.entity.Question;
import com.quiz.entity.QuestionOption;
import com.quiz.entity.Quiz;
import com.quiz.repository.QuestionRepository;
import com.quiz.repository.QuestionOptionRepository;
import com.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuestionOptionRepository questionOptionRepository;

    public List<Question> getQuestionsByQuiz(Long quizId) {
        return questionRepository.findActiveByQuizIdOrderByOrderIndex(quizId);
    }

    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionDtosByQuiz(Long quizId) {
        List<Question> questions = questionRepository.findActiveByQuizIdOrderByOrderIndex(quizId);
        return questions.stream()
                .map(q -> {
                    QuestionDto dto = new QuestionDto();
                    dto.setId(q.getId());
                    dto.setQuestionText(q.getQuestionText());
                    dto.setType(q.getType());
                    dto.setExplanation(q.getExplanation());
                    dto.setPoints(q.getPoints());
                    dto.setOrderIndex(q.getOrderIndex());

                    List<QuestionOptionDto> optionDtos = (q.getOptions() != null)
                            ? q.getOptions().stream()
                                    .map(o -> new QuestionOptionDto(
                                            o.getId(),
                                            o.getOptionText(),
                                            o.getIsCorrect(),
                                            o.getOrderIndex()
                                    ))
                                    .collect(Collectors.toList())
                            : java.util.Collections.emptyList();

                    dto.setOptions(optionDtos);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Question> getQuestionsByCourse(Long courseId) {
        return questionRepository.findByCourseIdAndIsActiveTrue(courseId);
    }

    public List<Question> getAllQuestionsByQuiz(Quiz quiz) {
        return questionRepository.findByQuiz(quiz);
    }

    public Optional<Question> getQuestionById(Long id) {
        return questionRepository.findById(id);
    }

    @Transactional
    public Question createQuestion(CreateQuestionRequest request) {
        // 验证测验是否存在
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        
        // 创建Question实体
        Question question = new Question();
        question.setQuestionText(request.getText());
        question.setType(request.getType());
        question.setQuiz(quiz);
        question.setPoints(request.getPoints() != null ? request.getPoints() : 1);
        question.setExplanation(request.getExplanation());
        
        // 自动分配排序索引：获取当前quiz的最大排序索引+1
        Integer maxOrderIndex = questionRepository.getMaxOrderIndexByQuizId(quiz.getId());
        int nextOrderIndex = (maxOrderIndex != null) ? maxOrderIndex + 1 : 1;
        
        question.setOrderIndex(nextOrderIndex);
        question.setIsActive(true);
        question.setCreatedAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());

        // 先保存题目（不包含选项）
        Question savedQuestion = questionRepository.save(question);
        
        // 处理选项
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            List<CreateQuestionRequest.CreateQuestionOptionRequest> optionRequests = request.getOptions();
            for (int i = 0; i < optionRequests.size(); i++) {
                CreateQuestionRequest.CreateQuestionOptionRequest optionRequest = optionRequests.get(i);
                QuestionOption option = new QuestionOption();
                option.setOptionText(optionRequest.getText());
                option.setIsCorrect(optionRequest.getIsCorrect() != null ? optionRequest.getIsCorrect() : false);
                option.setQuestion(savedQuestion);
                option.setOrderIndex(i + 1);
                option.setCreatedAt(LocalDateTime.now());
                option.setUpdatedAt(LocalDateTime.now());
                questionOptionRepository.save(option);
            }
        }
        
        // 更新测验的总分
        updateQuizTotalPoints(quiz.getId());
        
        log.info("Question created with id: {} and {} options, orderIndex: {}", 
                savedQuestion.getId(), 
                request.getOptions() != null ? request.getOptions().size() : 0,
                nextOrderIndex);
        return savedQuestion;
    }

    public Question updateQuestion(Long id, Question updatedQuestion) {
        Question existingQuestion = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // 记录原来的quiz ID，用于更新总分
        Long originalQuizId = existingQuestion.getQuiz().getId();
        
        existingQuestion.setQuestionText(updatedQuestion.getQuestionText());
        existingQuestion.setType(updatedQuestion.getType());
        existingQuestion.setPoints(updatedQuestion.getPoints());
        existingQuestion.setOrderIndex(updatedQuestion.getOrderIndex());
        existingQuestion.setExplanation(updatedQuestion.getExplanation());
        existingQuestion.setIsActive(updatedQuestion.getIsActive());
        existingQuestion.setUpdatedAt(LocalDateTime.now());
        
        // 处理quiz的更改
        if (updatedQuestion.getQuiz() != null && updatedQuestion.getQuiz().getId() != null) {
            Long newQuizId = updatedQuestion.getQuiz().getId();
            if (!originalQuizId.equals(newQuizId)) {
                // 验证新的quiz是否存在
                Quiz newQuiz = quizRepository.findById(newQuizId)
                        .orElseThrow(() -> new RuntimeException("Target quiz not found"));
                existingQuestion.setQuiz(newQuiz);
                log.info("Question {} moved from quiz {} to quiz {}", id, originalQuizId, newQuizId);
            }
        }

        Question savedQuestion = questionRepository.save(existingQuestion);
        
        // 处理选项更新
        if (updatedQuestion.getOptions() != null) {
            // 删除现有选项
            questionOptionRepository.deleteByQuestionId(existingQuestion.getId());
            
            // 添加新选项
            List<QuestionOption> newOptions = updatedQuestion.getOptions();
            for (int i = 0; i < newOptions.size(); i++) {
                QuestionOption option = newOptions.get(i);
                option.setId(null); // 确保创建新记录
                option.setQuestion(savedQuestion);
                option.setOrderIndex(i + 1);
                option.setCreatedAt(LocalDateTime.now());
                option.setUpdatedAt(LocalDateTime.now());
            }
            questionOptionRepository.saveAll(newOptions);
            savedQuestion.setOptions(newOptions);
        }
        
        // 更新测验的总分（原quiz和新quiz都需要更新）
        updateQuizTotalPoints(originalQuizId);
        if (updatedQuestion.getQuiz() != null && updatedQuestion.getQuiz().getId() != null) {
            Long newQuizId = updatedQuestion.getQuiz().getId();
            if (!originalQuizId.equals(newQuizId)) {
                updateQuizTotalPoints(newQuizId);
            }
        }
        
        log.info("Question updated with id: {} and {} options", savedQuestion.getId(),
                updatedQuestion.getOptions() != null ? updatedQuestion.getOptions().size() : 0);
        return savedQuestion;
    }

    public void deleteQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        
        // 软删除
        question.setIsActive(false);
        question.setUpdatedAt(LocalDateTime.now());
        questionRepository.save(question);
        
        // 更新测验的总分
        updateQuizTotalPoints(question.getQuiz().getId());
        
        log.info("Question with id {} has been deactivated", id);
    }

    public void activateQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        
        question.setIsActive(true);
        question.setUpdatedAt(LocalDateTime.now());
        questionRepository.save(question);
        
        // 更新测验的总分
        updateQuizTotalPoints(question.getQuiz().getId());
        
        log.info("Question with id {} has been activated", id);
    }

    public Long getQuestionCountByQuiz(Long quizId) {
        return questionRepository.countActiveByQuizId(quizId);
    }

    public Integer getTotalPointsByQuiz(Long quizId) {
        return questionRepository.getTotalPointsByQuizId(quizId);
    }

    public List<Question> getQuestionsByIds(List<Long> questionIds) {
        return questionRepository.findAllById(questionIds);
    }

    public boolean isQuestionOwnedByTeacher(Long questionId, Long teacherId) {
        Optional<Question> question = questionRepository.findById(questionId);
        return question.isPresent() && 
               question.get().getQuiz().getCourse().getTeacher().getId().equals(teacherId);
    }

    private void updateQuizTotalPoints(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        
        Integer totalPoints = questionRepository.getTotalPointsByQuizId(quizId);
        quiz.setTotalPoints(totalPoints != null ? totalPoints : 0);
        quiz.setUpdatedAt(LocalDateTime.now());
        
        quizRepository.save(quiz);
        log.debug("Updated total points for quiz {}: {}", quizId, totalPoints);
    }

    public void assignQuestionsToQuiz(List<Long> questionIds, Long quizId) {
        Quiz targetQuiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Target quiz not found"));
        
        List<Question> questions = questionRepository.findAllById(questionIds);
        
        for (Question question : questions) {
            question.setQuiz(targetQuiz);
            question.setUpdatedAt(LocalDateTime.now());
        }
        
        questionRepository.saveAll(questions);
        
        // 更新目标quiz的总分
        updateQuizTotalPoints(quizId);
        
        // 更新原quiz的总分（如果有的话）
        questions.stream()
                .map(q -> q.getQuiz().getId())
                .distinct()
                .forEach(this::updateQuizTotalPoints);
        
        log.info("Assigned {} questions to quiz {}", questions.size(), quizId);
    }

    public void moveQuestionsToQuiz(List<Long> questionIds, Long targetQuizId) {
        Quiz targetQuiz = quizRepository.findById(targetQuizId)
                .orElseThrow(() -> new RuntimeException("Target quiz not found"));
        
        List<Question> questions = questionRepository.findAllById(questionIds);
        
        // 记录原来的quiz ID用于更新总分
        Set<Long> originalQuizIds = questions.stream()
                .map(q -> q.getQuiz().getId())
                .collect(java.util.stream.Collectors.toSet());
        
        for (Question question : questions) {
            question.setQuiz(targetQuiz);
            question.setUpdatedAt(LocalDateTime.now());
        }
        
        questionRepository.saveAll(questions);
        
        // 更新目标quiz的总分
        updateQuizTotalPoints(targetQuizId);
        
        // 更新原quiz的总分
        originalQuizIds.forEach(this::updateQuizTotalPoints);
        
        log.info("Moved {} questions to quiz {}", questions.size(), targetQuizId);
    }
}