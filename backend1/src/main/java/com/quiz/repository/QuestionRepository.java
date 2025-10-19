package com.quiz.repository;

import com.quiz.entity.Question;
import com.quiz.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    
    List<Question> findByQuiz(Quiz quiz);
    
    List<Question> findByQuizAndIsActiveTrue(Quiz quiz);
    
    List<Question> findByQuizIdAndIsActiveTrue(Long quizId);
    
    @Query("SELECT q FROM Question q WHERE q.quiz.id = :quizId AND q.isActive = true ORDER BY q.orderIndex ASC")
    List<Question> findActiveByQuizIdOrderByOrderIndex(@Param("quizId") Long quizId);
    
    @Query("SELECT q FROM Question q WHERE q.quiz.course.id = :courseId AND q.isActive = true ORDER BY q.quiz.id, q.orderIndex ASC")
    List<Question> findByCourseIdAndIsActiveTrue(@Param("courseId") Long courseId);
    
    @Query("SELECT COUNT(q) FROM Question q WHERE q.quiz.id = :quizId AND q.isActive = true")
    Long countActiveByQuizId(@Param("quizId") Long quizId);
    
    @Query("SELECT SUM(q.points) FROM Question q WHERE q.quiz.id = :quizId AND q.isActive = true")
    Integer getTotalPointsByQuizId(@Param("quizId") Long quizId);
    
    @Query("SELECT MAX(q.orderIndex) FROM Question q WHERE q.quiz.id = :quizId")
    Integer getMaxOrderIndexByQuizId(@Param("quizId") Long quizId);
}