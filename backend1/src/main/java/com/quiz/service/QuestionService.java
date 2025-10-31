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
        // TODO: Translate - Validate if quiz exists
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        
        // Create Question entity
        Question question = new Question();
        question.setQuestionText(request.getText());
        question.setType(request.getType());
        question.setQuiz(quiz);
        question.setPoints(request.getPoints() != null ? request.getPoints() : 1);
        question.setExplanation(request.getExplanation());
        
        // Auto assign sort index: get current quiz's max sort index + 1
        Integer maxOrderIndex = questionRepository.getMaxOrderIndexByQuizId(quiz.getId());
        int nextOrderIndex = (maxOrderIndex != null) ? maxOrderIndex + 1 : 1;
        
        question.setOrderIndex(nextOrderIndex);
        question.setIsActive(true);
        question.setCreatedAt(LocalDateTime.now());
        question.setUpdatedAt(LocalDateTime.now());

        // Save question first (excluding options)
        Question savedQuestion = questionRepository.save(question);
        
        // Handle options
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
        
        // Update quiz total score
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

        // Record original quiz ID for updating total score
        Long originalQuizId = existingQuestion.getQuiz().getId();
        
        existingQuestion.setQuestionText(updatedQuestion.getQuestionText());
        existingQuestion.setType(updatedQuestion.getType());
        existingQuestion.setPoints(updatedQuestion.getPoints());
        existingQuestion.setOrderIndex(updatedQuestion.getOrderIndex());
        existingQuestion.setExplanation(updatedQuestion.getExplanation());
        existingQuestion.setIsActive(updatedQuestion.getIsActive());
        existingQuestion.setUpdatedAt(LocalDateTime.now());
        
        // Handle quiz changes
        if (updatedQuestion.getQuiz() != null && updatedQuestion.getQuiz().getId() != null) {
            Long newQuizId = updatedQuestion.getQuiz().getId();
            if (!originalQuizId.equals(newQuizId)) {
                // Validate if new quiz exists
                Quiz newQuiz = quizRepository.findById(newQuizId)
                        .orElseThrow(() -> new RuntimeException("Target quiz not found"));
                existingQuestion.setQuiz(newQuiz);
                log.info("Question {} moved from quiz {} to quiz {}", id, originalQuizId, newQuizId);
            }
        }

        Question savedQuestion = questionRepository.save(existingQuestion);
        
        // Handle optionsUpdate
        if (updatedQuestion.getOptions() != null) {
            // Delete existing options
            questionOptionRepository.deleteByQuestionId(existingQuestion.getId());
            
            // Add new options
            List<QuestionOption> newOptions = updatedQuestion.getOptions();
            for (int i = 0; i < newOptions.size(); i++) {
                QuestionOption option = newOptions.get(i);
                option.setId(null); // Ensure creating new record
                option.setQuestion(savedQuestion);
                option.setOrderIndex(i + 1);
                option.setCreatedAt(LocalDateTime.now());
                option.setUpdatedAt(LocalDateTime.now());
            }
            questionOptionRepository.saveAll(newOptions);
            savedQuestion.setOptions(newOptions);
        }
        
        // Update quiz total score（原quiz和新quiz都需要Update）
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
        
        // Soft delete
        question.setIsActive(false);
        question.setUpdatedAt(LocalDateTime.now());
        questionRepository.save(question);
        
        // Update quiz total score
        updateQuizTotalPoints(question.getQuiz().getId());
        
        log.info("Question with id {} has been deactivated", id);
    }

    public void activateQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        
        question.setIsActive(true);
        question.setUpdatedAt(LocalDateTime.now());
        questionRepository.save(question);
        
        // Update quiz total score
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
        
        // Update target quiz total score
        updateQuizTotalPoints(quizId);
        
        // Update original quiz total score (if any)
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
        
        // Record original quiz ID for updating total score
        Set<Long> originalQuizIds = questions.stream()
                .map(q -> q.getQuiz().getId())
                .collect(java.util.stream.Collectors.toSet());
        
        for (Question question : questions) {
            question.setQuiz(targetQuiz);
            question.setUpdatedAt(LocalDateTime.now());
        }
        
        questionRepository.saveAll(questions);
        
        // Update target quiz total score
        updateQuizTotalPoints(targetQuizId);
        
        // Update original quiz total score
        originalQuizIds.forEach(this::updateQuizTotalPoints);
        
        log.info("Moved {} questions to quiz {}", questions.size(), targetQuizId);
    }
}