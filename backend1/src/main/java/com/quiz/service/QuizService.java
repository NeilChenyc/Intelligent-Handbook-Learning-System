package com.quiz.service;

import com.quiz.dto.QuizCreateRequest;
import com.quiz.entity.Course;
import com.quiz.entity.Quiz;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;

    public List<Quiz> getAllActiveQuizzes() {
        return quizRepository.findAll().stream()
                .filter(Quiz::getIsActive)
                .toList();
    }

    public Optional<Quiz> getQuizById(Long id) {
        return quizRepository.findById(id);
    }

    public List<Quiz> getQuizzesByCourse(Long courseId) {
        return quizRepository.findByCourseIdAndIsActiveTrue(courseId);
    }

    public List<Quiz> getQuizzesByTeacher(Long teacherId) {
        return quizRepository.findActiveQuizzesByTeacherId(teacherId);
    }

    public List<Quiz> searchQuizzesByTitle(String title) {
        return quizRepository.findByTitleContainingAndIsActiveTrue(title);
    }

    public Quiz createQuiz(QuizCreateRequest request) {
        // 验证课程是否存在
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        quiz.setTotalPoints(request.getTotalPoints() != null ? request.getTotalPoints() : 0);
        quiz.setPassingScore(request.getPassingScore() != null ? request.getPassingScore() : 60);
        quiz.setMaxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 1);
        quiz.setCourse(course);
        quiz.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        quiz.setCreatedAt(LocalDateTime.now());
        quiz.setUpdatedAt(LocalDateTime.now());

        return quizRepository.save(quiz);
    }

    public Quiz updateQuiz(Long id, QuizCreateRequest request) {
        Quiz existingQuiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        // 更新基本信息
        existingQuiz.setTitle(request.getTitle());
        existingQuiz.setDescription(request.getDescription());
        existingQuiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        existingQuiz.setTotalPoints(request.getTotalPoints() != null ? request.getTotalPoints() : existingQuiz.getTotalPoints());
        existingQuiz.setPassingScore(request.getPassingScore() != null ? request.getPassingScore() : existingQuiz.getPassingScore());
        existingQuiz.setMaxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : existingQuiz.getMaxAttempts());
        existingQuiz.setIsActive(request.getIsActive() != null ? request.getIsActive() : existingQuiz.getIsActive());
        existingQuiz.setUpdatedAt(LocalDateTime.now());

        return quizRepository.save(existingQuiz);
    }

    public void deleteQuiz(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        
        // 软删除
        quiz.setIsActive(false);
        quiz.setUpdatedAt(LocalDateTime.now());
        quizRepository.save(quiz);
        
        log.info("Quiz with id {} has been deactivated", id);
    }

    public void activateQuiz(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        
        quiz.setIsActive(true);
        quiz.setUpdatedAt(LocalDateTime.now());
        quizRepository.save(quiz);
        
        log.info("Quiz with id {} has been activated", id);
    }

    public Long getQuizCountByCourse(Long courseId) {
        return quizRepository.countActiveByCourseId(courseId);
    }

    public List<Quiz> getQuizzesByIds(List<Long> quizIds) {
        return quizRepository.findAllById(quizIds);
    }

    public boolean isQuizOwnedByTeacher(Long quizId, Long teacherId) {
        Optional<Quiz> quiz = quizRepository.findById(quizId);
        return quiz.isPresent() && quiz.get().getCourse().getTeacher().getId().equals(teacherId);
    }
}