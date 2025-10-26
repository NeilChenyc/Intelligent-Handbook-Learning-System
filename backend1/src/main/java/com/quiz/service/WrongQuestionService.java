package com.quiz.service;

import com.quiz.dto.WrongQuestionDTO;
import com.quiz.entity.*;
import com.quiz.repository.*;
import com.quiz.util.AnswerValidationUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class WrongQuestionService {

    @Autowired
    private WrongQuestionRepository wrongQuestionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private QuestionOptionRepository questionOptionRepository;

    @Autowired
    private StudentAnswerRepository studentAnswerRepository;

    /**
     * 创建错题记录
     */
    @Transactional
    public WrongQuestion createWrongQuestion(Long userId, Long questionId, Long quizAttemptId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        QuizAttempt quizAttempt = quizAttemptRepository.findById(quizAttemptId)
                .orElseThrow(() -> new RuntimeException("Quiz attempt not found"));

        // 检查是否已存在相同用户和题目的未重做错题记录
        Optional<WrongQuestion> existing = wrongQuestionRepository
                .findByUserAndQuestionAndIsRedoneFalse(user, question);
        if (existing.isPresent()) {
            log.warn("Wrong question record already exists for user {} question {} (not redone)", 
                    userId, questionId);
            return existing.get();
        }

        WrongQuestion wrongQuestion = new WrongQuestion();
        wrongQuestion.setUser(user);
        wrongQuestion.setQuestion(question);
        wrongQuestion.setQuizAttempt(quizAttempt);
        wrongQuestion.setCreatedAt(LocalDateTime.now());
        wrongQuestion.setIsRedone(false);
        wrongQuestion.setUpdatedAt(LocalDateTime.now());

        WrongQuestion saved = wrongQuestionRepository.save(wrongQuestion);
        log.info("Created wrong question record: user={}, question={}, attempt={}", 
                userId, questionId, quizAttemptId);
        return saved;
    }

    /**
     * 批量创建错题记录
     */
    @Transactional
    public void createWrongQuestionsFromAttempt(QuizAttempt quizAttempt) {
        List<StudentAnswer> answers = studentAnswerRepository.findByQuizAttemptId(quizAttempt.getId());
        
        for (StudentAnswer answer : answers) {
            if (answer.getIsCorrect() != null && !answer.getIsCorrect()) {
                createWrongQuestion(
                    quizAttempt.getUser().getId(),
                    answer.getQuestion().getId(),
                    quizAttempt.getId()
                );
            }
        }
    }

    /**
     * 获取用户未重做的错题列表
     */
    @Transactional(readOnly = true)
    public List<WrongQuestionDTO> getUserWrongQuestions(Long userId) {
        try {
            log.info("Getting wrong questions for user: {}", userId);
            // 使用轻量投影查询，避免抓取重量级实体字段
            List<com.quiz.dto.WrongQuestionLiteDto> rows = wrongQuestionRepository.findLiteByUserIdAndIsRedoneFalse(userId);
            log.info("Found {} wrong questions (lite) for user {}", rows.size(), userId);

            // 批量获取所有题目的选项，避免N+1查询
            List<Long> questionIds = rows.stream()
                    .map(com.quiz.dto.WrongQuestionLiteDto::getQuestionId)
                    .distinct()
                    .collect(Collectors.toList());

            Map<Long, List<QuestionOption>> optionsByQuestion = questionIds.isEmpty()
                    ? Map.of()
                    : questionOptionRepository.findByQuestionIdsOrderByQuestionAndOrder(questionIds).stream()
                        .collect(Collectors.groupingBy(opt -> opt.getQuestion().getId()));

            // 组装为前端期望的 WrongQuestionDTO 结构
            List<WrongQuestionDTO> dtos = rows.stream().map(row -> {
                WrongQuestionDTO dto = new WrongQuestionDTO();
                dto.setWrongQuestionId(row.getWrongQuestionId());
                dto.setUserId(row.getUserId());
                dto.setUserName(row.getUserName());
                dto.setQuizAttemptId(row.getQuizAttemptId());
                dto.setCreatedAt(row.getCreatedAt());
                dto.setIsRedone(row.getIsRedone());
                dto.setRedoneAt(row.getRedoneAt());
                dto.setUpdatedAt(row.getUpdatedAt());

                // Question
                WrongQuestionDTO.QuestionDTO qdto = new WrongQuestionDTO.QuestionDTO();
                qdto.setId(row.getQuestionId());
                qdto.setText(row.getQuestionText());
                qdto.setType(row.getQuestionType() != null ? row.getQuestionType().name() : null);
                qdto.setExplanation(row.getExplanation());

                // Options
                List<QuestionOption> opts = optionsByQuestion.getOrDefault(row.getQuestionId(), List.of());
                List<WrongQuestionDTO.OptionDTO> optDtos = opts.stream()
                        .map(o -> new WrongQuestionDTO.OptionDTO(o.getId(), o.getOptionText(), o.getIsCorrect()))
                        .collect(Collectors.toList());
                qdto.setOptions(optDtos);

                // Quiz & Course
                WrongQuestionDTO.QuizDTO quizDto = new WrongQuestionDTO.QuizDTO();
                quizDto.setId(row.getQuizId());
                quizDto.setTitle(row.getQuizTitle());
                WrongQuestionDTO.CourseDTO courseDto = new WrongQuestionDTO.CourseDTO();
                courseDto.setId(row.getCourseId());
                courseDto.setTitle(row.getCourseTitle());
                quizDto.setCourse(courseDto);
                qdto.setQuiz(quizDto);

                dto.setQuestion(qdto);
                return dto;
            }).collect(Collectors.toList());

            log.info("Successfully built {} WrongQuestionDTOs for user {}", dtos.size(), userId);
            return dtos;
        } catch (Exception e) {
            log.error("Error getting user wrong questions for user {}", userId, e);
            throw e;
        }
    }

    /**
     * 获取用户在特定课程下的错题
     */
    public List<WrongQuestionDTO> getUserWrongQuestionsByCourse(Long userId, Long courseId) {
        List<WrongQuestion> wrongQuestions = wrongQuestionRepository.findByUserIdAndCourseIdAndIsRedoneFalse(userId, courseId);
        return wrongQuestions.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取用户在特定小测下的错题
     */
    public List<WrongQuestionDTO> getUserWrongQuestionsByQuiz(Long userId, Long quizId) {
        List<WrongQuestion> wrongQuestions = wrongQuestionRepository.findByUserIdAndQuizIdAndIsRedoneFalse(userId, quizId);
        return wrongQuestions.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 转换WrongQuestion实体为DTO
     */
    private WrongQuestionDTO convertToDTO(WrongQuestion wrongQuestion) {
        try {
            log.debug("Converting wrong question {} to DTO", wrongQuestion.getWrongQuestionId());
            
            WrongQuestionDTO dto = new WrongQuestionDTO();
            dto.setWrongQuestionId(wrongQuestion.getWrongQuestionId());
            dto.setUserId(wrongQuestion.getUser().getId());
            dto.setUserName(wrongQuestion.getUser().getUsername());
            dto.setQuizAttemptId(wrongQuestion.getQuizAttempt().getId());
            dto.setCreatedAt(wrongQuestion.getCreatedAt());
            dto.setIsRedone(wrongQuestion.getIsRedone());
            dto.setRedoneAt(wrongQuestion.getRedoneAt());
            dto.setUpdatedAt(wrongQuestion.getUpdatedAt());

            // 转换Question
            Question question = wrongQuestion.getQuestion();
            if (question == null) {
                log.error("Question is null for wrong question {}", wrongQuestion.getWrongQuestionId());
                throw new RuntimeException("Question is null");
            }
            
            WrongQuestionDTO.QuestionDTO questionDTO = new WrongQuestionDTO.QuestionDTO();
            questionDTO.setId(question.getId());
            questionDTO.setText(question.getQuestionText());
            questionDTO.setType(question.getType().name());
            questionDTO.setExplanation(question.getExplanation());

            // 转换Options
            if (question.getOptions() != null) {
                List<WrongQuestionDTO.OptionDTO> optionDTOs = question.getOptions().stream()
                        .map(option -> {
                            WrongQuestionDTO.OptionDTO optionDTO = new WrongQuestionDTO.OptionDTO();
                            optionDTO.setId(option.getId());
                            optionDTO.setText(option.getOptionText());
                            optionDTO.setIsCorrect(option.getIsCorrect());
                            return optionDTO;
                        })
                        .collect(Collectors.toList());
                questionDTO.setOptions(optionDTOs);
            } else {
                log.warn("Options is null for question {}", question.getId());
                questionDTO.setOptions(List.of());
            }

            // 转换Quiz
            if (question.getQuiz() != null) {
                WrongQuestionDTO.QuizDTO quizDTO = new WrongQuestionDTO.QuizDTO();
                quizDTO.setId(question.getQuiz().getId());
                quizDTO.setTitle(question.getQuiz().getTitle());

                // 转换Course
                if (question.getQuiz().getCourse() != null) {
                    WrongQuestionDTO.CourseDTO courseDTO = new WrongQuestionDTO.CourseDTO();
                    courseDTO.setId(question.getQuiz().getCourse().getId());
                    courseDTO.setTitle(question.getQuiz().getCourse().getTitle());
                    quizDTO.setCourse(courseDTO);
                }
                questionDTO.setQuiz(quizDTO);
            } else {
                log.warn("Quiz is null for question {}", question.getId());
            }

            dto.setQuestion(questionDTO);
            log.debug("Successfully converted wrong question {} to DTO", wrongQuestion.getWrongQuestionId());
            return dto;
        } catch (Exception e) {
            log.error("Error converting wrong question {} to DTO", wrongQuestion.getWrongQuestionId(), e);
            throw e;
        }
    }

    /**
     * 统计用户未重做的错题数量
     */
    public Long countUserWrongQuestions(Long userId) {
        return wrongQuestionRepository.countByUserIdAndIsRedoneFalse(userId);
    }

    /**
     * 验证错题重做答案
     */
    @Transactional
    public boolean validateAndMarkRedone(Long wrongQuestionId, List<Long> selectedOptionIds) {
        WrongQuestion wrongQuestion = wrongQuestionRepository.findById(wrongQuestionId)
                .orElseThrow(() -> new RuntimeException("Wrong question not found"));

        if (wrongQuestion.getIsRedone()) {
            throw new RuntimeException("This question has already been redone");
        }

        Question question = wrongQuestion.getQuestion();
        
        // 获取正确答案
        List<QuestionOption> correctOptions = questionOptionRepository
                .findCorrectOptionsByQuestionId(question.getId());

        // 添加调试日志
        log.info("Question ID: {}, Selected options: {}, Correct options: {}", 
                question.getId(), selectedOptionIds, 
                correctOptions.stream().map(QuestionOption::getId).toList());

        // 使用公共验证工具类验证答案
        boolean isCorrect = AnswerValidationUtil.isAnswerCorrectByIds(
                selectedOptionIds, correctOptions, question.getType());
        
        log.info("Is correct: {}", isCorrect);

        if (isCorrect) {
            wrongQuestion.markAsRedone();
            wrongQuestionRepository.save(wrongQuestion);
            log.info("Wrong question {} marked as redone for user {}", 
                    wrongQuestionId, wrongQuestion.getUser().getId());
        }

        return isCorrect;
    }

    /**
     * 获取错题详情（包含题目和选项信息）
     */
    public Optional<WrongQuestion> getWrongQuestionById(Long wrongQuestionId) {
        return wrongQuestionRepository.findById(wrongQuestionId);
    }

    /**
     * 标记错题为已重做（不验证答案）
     */
    @Transactional
    public void markAsRedone(Long wrongQuestionId) {
        WrongQuestion wrongQuestion = wrongQuestionRepository.findById(wrongQuestionId)
                .orElseThrow(() -> new RuntimeException("Wrong question not found"));
        
        wrongQuestion.markAsRedone();
        wrongQuestionRepository.save(wrongQuestion);
        log.info("Wrong question {} marked as redone", wrongQuestionId);
    }

    /**
     * 批量清理已重做的错题记录
     */
    @Transactional
    public int cleanupRedoneWrongQuestions() {
        List<WrongQuestion> redoneQuestions = wrongQuestionRepository.findByIsRedoneTrue();
        int deletedCount = redoneQuestions.size();
        
        if (!redoneQuestions.isEmpty()) {
            wrongQuestionRepository.deleteAll(redoneQuestions);
            log.info("Cleaned up {} redone wrong questions", deletedCount);
        }
        
        return deletedCount;
    }
}