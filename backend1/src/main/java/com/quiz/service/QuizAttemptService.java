package com.quiz.service;

import com.quiz.entity.*;
import com.quiz.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class QuizAttemptService {

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private StudentAnswerRepository studentAnswerRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionOptionRepository questionOptionRepository;

    public List<QuizAttempt> getAttemptsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return quizAttemptRepository.findByUser(user);
    }

    public List<QuizAttempt> getAttemptsByQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        return quizAttemptRepository.findByQuiz(quiz);
    }

    public List<QuizAttempt> getAttemptsByUserAndQuiz(Long userId, Long quizId) {
        return quizAttemptRepository.findByUserIdAndQuizIdOrderByAttemptNumberDesc(userId, quizId);
    }

    public Optional<QuizAttempt> getAttemptById(Long id) {
        return quizAttemptRepository.findById(id);
    }

    public QuizAttempt startQuizAttempt(Long userId, Long quizId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        // 检查是否已达到最大尝试次数
        Long attemptCount = quizAttemptRepository.countByUserIdAndQuizId(userId, quizId);
        if (quiz.getMaxAttempts() != null && attemptCount >= quiz.getMaxAttempts()) {
            throw new RuntimeException("Maximum attempts reached for this quiz");
        }

        // 获取下一个尝试编号
        Integer maxAttemptNumber = quizAttemptRepository.getMaxAttemptNumberByUserIdAndQuizId(userId, quizId);
        int nextAttemptNumber = (maxAttemptNumber != null ? maxAttemptNumber : 0) + 1;

        QuizAttempt attempt = new QuizAttempt();
        attempt.setUser(user);
        attempt.setQuiz(quiz);
        attempt.setAttemptNumber(nextAttemptNumber);
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setCreatedAt(LocalDateTime.now());
        attempt.setUpdatedAt(LocalDateTime.now());

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        return savedAttempt;
    }

    @Transactional
    public QuizAttempt submitQuizAttempt(Long attemptId, List<StudentAnswer> answers) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Quiz attempt not found"));

        if (attempt.getCompletedAt() != null) {
            throw new RuntimeException("Quiz attempt already completed");
        }

        // 保存学生答案
        for (StudentAnswer answer : answers) {
            answer.setQuizAttempt(attempt);
            answer.setAnsweredAt(LocalDateTime.now());
            answer.setCreatedAt(LocalDateTime.now());
            answer.setUpdatedAt(LocalDateTime.now());
            
            // 评分
            evaluateAnswer(answer);
            
            studentAnswerRepository.save(answer);
        }

        // 计算总分和结果
        calculateAttemptScore(attempt);
        
        attempt.setCompletedAt(LocalDateTime.now());
        attempt.setUpdatedAt(LocalDateTime.now());
        
        // 计算用时
        if (attempt.getStartedAt() != null) {
            long minutes = java.time.Duration.between(attempt.getStartedAt(), attempt.getCompletedAt()).toMinutes();
            attempt.setTimeSpentMinutes((int) minutes);
        }

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        
        return savedAttempt;
    }

    public List<StudentAnswer> getAnswersByAttempt(Long attemptId) {
        return studentAnswerRepository.findByQuizAttemptId(attemptId);
    }

    public Optional<StudentAnswer> getAnswerByAttemptAndQuestion(Long attemptId, Long questionId) {
        return studentAnswerRepository.findByAttemptIdAndQuestionId(attemptId, questionId);
    }

    public List<QuizAttempt> getPassedAttempts(Long userId, Long quizId) {
        return quizAttemptRepository.findPassedAttemptsByUserIdAndQuizId(userId, quizId);
    }

    public List<QuizAttempt> getAttemptsByCourse(Long courseId) {
        return quizAttemptRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }

    public boolean canUserAttemptQuiz(Long userId, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        if (quiz.getMaxAttempts() == null) {
            return true; // 无限制
        }

        Long attemptCount = quizAttemptRepository.countByUserIdAndQuizId(userId, quizId);
        return attemptCount < quiz.getMaxAttempts();
    }

    public boolean hasUserPassedQuiz(Long userId, Long quizId) {
        List<QuizAttempt> passedAttempts = quizAttemptRepository.findPassedAttemptsByUserIdAndQuizId(userId, quizId);
        return !passedAttempts.isEmpty();
    }

    private void evaluateAnswer(StudentAnswer answer) {
        Question question = answer.getQuestion();
        List<QuestionOption> correctOptions = questionOptionRepository.findCorrectOptionsByQuestionId(question.getId());
        
        // 获取学生选择的选项ID
        List<Long> selectedOptionIds = answer.getSelectedOptions().stream()
                .map(QuestionOption::getId)
                .toList();
        
        List<Long> correctOptionIds = correctOptions.stream()
                .map(QuestionOption::getId)
                .toList();

        // 判断答案是否正确
        boolean isCorrect = selectedOptionIds.size() == correctOptionIds.size() && 
                           selectedOptionIds.containsAll(correctOptionIds);
        
        answer.setIsCorrect(isCorrect);
        answer.setPointsEarned(isCorrect ? question.getPoints() : 0);
    }

    private void calculateAttemptScore(QuizAttempt attempt) {
        List<StudentAnswer> answers = studentAnswerRepository.findByQuizAttemptId(attempt.getId());
        
        int totalScore = answers.stream()
                .mapToInt(answer -> answer.getPointsEarned() != null ? answer.getPointsEarned() : 0)
                .sum();
        
        Quiz quiz = attempt.getQuiz();
        int totalPoints = quiz.getTotalPoints() != null ? quiz.getTotalPoints() : 0;
        
        attempt.setScore(totalScore);
        attempt.setTotalPoints(totalPoints);
        
        if (totalPoints > 0) {
            double percentage = (double) totalScore / totalPoints * 100;
            attempt.setPercentage(percentage);
            
            // 判断是否通过
            if (quiz.getPassingScore() != null) {
                attempt.setIsPassed(percentage >= quiz.getPassingScore());
            } else {
                attempt.setIsPassed(percentage >= 60.0); // 默认60%通过
            }
        } else {
            attempt.setPercentage(0.0);
            attempt.setIsPassed(false);
        }
    }
}