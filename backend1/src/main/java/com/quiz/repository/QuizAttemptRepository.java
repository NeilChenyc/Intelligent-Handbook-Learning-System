package com.quiz.repository;

import com.quiz.entity.Quiz;
import com.quiz.entity.QuizAttempt;
import com.quiz.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    
    List<QuizAttempt> findByUser(User user);
    
    List<QuizAttempt> findByQuiz(Quiz quiz);
    
    List<QuizAttempt> findByUserAndQuiz(User user, Quiz quiz);
    
    List<QuizAttempt> findByUserAndQuizOrderByAttemptNumberDesc(User user, Quiz quiz);
    
    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.user.id = :userId AND qa.quiz.id = :quizId ORDER BY qa.attemptNumber DESC")
    List<QuizAttempt> findByUserIdAndQuizIdOrderByAttemptNumberDesc(@Param("userId") Long userId, @Param("quizId") Long quizId);
    
    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.user.id = :userId AND qa.quiz.id = :quizId AND qa.attemptNumber = :attemptNumber")
    Optional<QuizAttempt> findByUserIdAndQuizIdAndAttemptNumber(@Param("userId") Long userId, @Param("quizId") Long quizId, @Param("attemptNumber") Integer attemptNumber);
    
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.user.id = :userId AND qa.quiz.id = :quizId")
    Long countByUserIdAndQuizId(@Param("userId") Long userId, @Param("quizId") Long quizId);
    
    @Query("SELECT MAX(qa.attemptNumber) FROM QuizAttempt qa WHERE qa.user.id = :userId AND qa.quiz.id = :quizId")
    Integer getMaxAttemptNumberByUserIdAndQuizId(@Param("userId") Long userId, @Param("quizId") Long quizId);
    
    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.user.id = :userId AND qa.quiz.id = :quizId AND qa.isPassed = true")
    List<QuizAttempt> findPassedAttemptsByUserIdAndQuizId(@Param("userId") Long userId, @Param("quizId") Long quizId);
    
    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.quiz.course.id = :courseId ORDER BY qa.createdAt DESC")
    List<QuizAttempt> findByCourseIdOrderByCreatedAtDesc(@Param("courseId") Long courseId);
    
    @Query("SELECT DISTINCT qa.quiz.id FROM QuizAttempt qa WHERE qa.user.id = :userId AND qa.quiz.course.id = :courseId AND qa.isPassed = true")
    List<Long> findPassedQuizIdsByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
    
    // New: Delete all quiz submissions by course ID (will cascade delete student answers)
    @Modifying
    @Transactional
    @Query("DELETE FROM QuizAttempt qa WHERE qa.quiz.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);
}