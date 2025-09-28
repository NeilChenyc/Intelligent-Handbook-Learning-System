package com.quiz.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz.dto.QuizCreateRequest;
import com.quiz.dto.QuizResponse;
import com.quiz.dto.QuizSubmissionRequest;
import com.quiz.dto.QuizSubmissionResponse;
import com.quiz.entity.Course;
import com.quiz.entity.Quiz;
import com.quiz.entity.User;
import com.quiz.entity.UserQuizAnswer;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.QuizRepository;
import com.quiz.repository.UserQuizAnswerRepository;
import com.quiz.repository.UserRepository;
import com.quiz.service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {
    
    private final QuizRepository quizRepository;
    private final UserQuizAnswerRepository userQuizAnswerRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public Page<QuizResponse> getAllQuizzes(Pageable pageable) {
        log.info("获取所有小测，页码: {}, 大小: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Quiz> quizzes = quizRepository.findAll(pageable);
        return quizzes.map(this::convertToResponse);
    }
    
    @Override
    public QuizResponse getQuizById(Long id) {
        log.info("获取小测详情: {}", id);
        
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("小测不存在"));
        
        return convertToResponse(quiz);
    }
    
    @Override
    public List<QuizResponse> getQuizzesByCourse(Long courseId) {
        log.info("根据课程ID获取小测: {}", courseId);
        
        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);
        return quizzes.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public QuizResponse createQuiz(QuizCreateRequest request) {
        log.info("创建小测: {}", request.getQuestion());
        
        // 验证课程是否存在
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 创建小测
        Quiz quiz = new Quiz();
        quiz.setCourse(course);
        quiz.setQuestion(request.getQuestion());
        quiz.setType(Quiz.QuizType.valueOf(request.getQuestionType()));
        
        // 将选项列表转换为JSON字符串存储
        try {
            quiz.setOptions(objectMapper.writeValueAsString(request.getOptions()));
            quiz.setCorrectAnswer(objectMapper.writeValueAsString(request.getCorrectAnswers()));
        } catch (Exception e) {
            throw new RuntimeException("选项或答案格式错误", e);
        }
        
        quiz.setExplanation(request.getExplanation());
        quiz.setPoints(request.getPoints());
        
        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("小测创建成功: {}", savedQuiz.getId());
        
        return convertToResponse(savedQuiz);
    }
    
    @Override
    @Transactional
    public QuizResponse updateQuiz(Long id, QuizCreateRequest request) {
        log.info("更新小测: {}", id);
        
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("小测不存在"));
        
        // 更新小测信息
        if (request.getQuestion() != null) {
            quiz.setQuestion(request.getQuestion());
        }
        if (request.getQuestionType() != null) {
            quiz.setType(Quiz.QuizType.valueOf(request.getQuestionType()));
        }
        if (request.getOptions() != null) {
            try {
                quiz.setOptions(objectMapper.writeValueAsString(request.getOptions()));
            } catch (Exception e) {
                throw new RuntimeException("选项格式错误", e);
            }
        }
        if (request.getCorrectAnswers() != null) {
            try {
                quiz.setCorrectAnswer(objectMapper.writeValueAsString(request.getCorrectAnswers()));
            } catch (Exception e) {
                throw new RuntimeException("答案格式错误", e);
            }
        }
        if (request.getExplanation() != null) {
            quiz.setExplanation(request.getExplanation());
        }
        if (request.getPoints() != null) {
            quiz.setPoints(request.getPoints());
        }
        
        Quiz updatedQuiz = quizRepository.save(quiz);
        log.info("小测更新成功: {}", updatedQuiz.getId());
        
        return convertToResponse(updatedQuiz);
    }
    
    @Override
    @Transactional
    public void deleteQuiz(Long id) {
        log.info("删除小测: {}", id);
        
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("小测不存在"));
        
        quizRepository.delete(quiz);
        log.info("小测删除成功: {}", id);
    }
    
    @Override
    @Transactional
    public QuizSubmissionResponse submitQuiz(Long quizId, QuizSubmissionRequest request, String token) {
        log.info("提交小测答案: 小测ID={}", quizId);
        
        // 从token获取用户信息（这里简化处理，实际应该解析JWT）
        User user = userRepository.findByUsername("admin")
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("小测不存在"));
        
        // 检查用户答案
        List<String> userAnswers = request.getUserAnswers();
        List<String> correctAnswers;
        try {
            correctAnswers = objectMapper.readValue(quiz.getCorrectAnswer(), List.class);
        } catch (Exception e) {
            throw new RuntimeException("正确答案格式错误", e);
        }
        
        boolean isCorrect = userAnswers.equals(correctAnswers);
        int score = isCorrect ? quiz.getPoints() : 0;
        
        // 保存用户答题记录
        UserQuizAnswer userQuizAnswer = new UserQuizAnswer();
        userQuizAnswer.setUser(user);
        userQuizAnswer.setQuiz(quiz);
        try {
            userQuizAnswer.setUserAnswer(objectMapper.writeValueAsString(userAnswers));
        } catch (Exception e) {
            throw new RuntimeException("用户答案格式错误", e);
        }
        userQuizAnswer.setIsCorrect(isCorrect);
        userQuizAnswer.setScore(score);
        userQuizAnswer.setTimeSpentSeconds(request.getTimeSpent().intValue());
        
        // 计算尝试次数
        Long attemptCount = userQuizAnswerRepository.countByUserAndQuiz(user, quiz);
        userQuizAnswer.setAttemptCount(attemptCount.intValue() + 1);
        
        userQuizAnswerRepository.save(userQuizAnswer);
        
        // 构建响应
        QuizSubmissionResponse response = new QuizSubmissionResponse();
        response.setQuizId(quizId);
        response.setCorrect(isCorrect);
        response.setScore(score);
        response.setTotalPoints(quiz.getPoints());
        response.setUserAnswers(userAnswers);
        response.setCorrectAnswers(correctAnswers);
        response.setExplanation(quiz.getExplanation());
        response.setTimeSpent(request.getTimeSpent());
        response.setAttemptCount(userQuizAnswer.getAttemptCount());
        
        log.info("小测答案提交成功: 用户={}, 小测={}, 正确={}", user.getUsername(), quizId, isCorrect);
        
        return response;
    }
    
    @Override
    public List<QuizResponse> getWrongQuestions(String token) {
        log.info("获取用户错题列表");
        
        // 从token获取用户信息（这里简化处理）
        User user = userRepository.findByUsername("admin")
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        List<UserQuizAnswer> wrongAnswers = userQuizAnswerRepository.findByUserIdAndIsCorrect(user.getId(), false);
        
        return wrongAnswers.stream()
                .map(answer -> convertToResponse(answer.getQuiz()))
                .collect(Collectors.toList());
    }
    
    @Override
    public List<QuizResponse> generateQuizzes(Long courseId, Integer count, String difficulty) {
        log.info("为课程生成小测: courseId={}, count={}, difficulty={}", courseId, count, difficulty);
        
        // 这里简化实现，实际应该根据难度和数量生成小测
        List<Quiz> quizzes = quizRepository.findRandomQuizzesByCourse(courseId, count);
        
        return quizzes.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * 转换Quiz实体为QuizResponse DTO
     */
    private QuizResponse convertToResponse(Quiz quiz) {
        QuizResponse response = new QuizResponse();
        response.setId(quiz.getId());
        response.setCourseId(quiz.getCourse().getId());
        response.setCourseName(quiz.getCourse().getTitle());
        response.setQuestion(quiz.getQuestion());
        response.setQuestionType(quiz.getType().name());
        
        // 解析JSON格式的选项和答案
        try {
            List<String> options = objectMapper.readValue(quiz.getOptions(), List.class);
            response.setOptions(options);
            
            List<String> correctAnswers = objectMapper.readValue(quiz.getCorrectAnswer(), List.class);
            response.setCorrectAnswers(correctAnswers);
        } catch (Exception e) {
            log.error("解析小测选项或答案失败: {}", e.getMessage());
        }
        
        response.setExplanation(quiz.getExplanation());
        response.setPoints(quiz.getPoints());
        response.setCreatedAt(quiz.getCreatedAt());
        response.setUpdatedAt(quiz.getUpdatedAt());
        
        return response;
    }
}