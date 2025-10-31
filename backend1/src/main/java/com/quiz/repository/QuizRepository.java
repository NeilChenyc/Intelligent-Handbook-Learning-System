package com.quiz.repository;

import com.quiz.entity.Course;
import com.quiz.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    
    List<Quiz> findByCourse(Course course);
    
    List<Quiz> findByCourseAndIsActiveTrue(Course course);
    
    List<Quiz> findByCourseIdAndIsActiveTrue(Long courseId);

    // New: Pre-fetch associations for quiz list under course to avoid lazy loading
    @Query("SELECT DISTINCT q FROM Quiz q JOIN FETCH q.course LEFT JOIN FETCH q.questions WHERE q.course.id = :courseId AND q.isActive = true")
    List<Quiz> findActiveByCourseIdFetchCourseAndQuestions(@Param("courseId") Long courseId);
    
    // Optimize: Only get quiz basic info, don't preload questions, for quiz list display
    @Query("SELECT q FROM Quiz q WHERE q.course.id = :courseId AND q.isActive = true ORDER BY q.id")
    List<Quiz> findActiveByCourseIdWithoutQuestions(@Param("courseId") Long courseId);
    
    // Projection: Only select necessary fields, avoid loading irrelevant Course columns
    @Query("SELECT new com.quiz.dto.QuizSummaryDto(q.id, q.title, q.description, q.timeLimitMinutes, q.totalPoints, q.passingScore, q.maxAttempts, q.isActive, q.createdAt, q.updatedAt, q.course.id, q.course.title, 0) " +
           "FROM Quiz q WHERE q.course.id = :courseId AND q.isActive = true ORDER BY q.id")
    List<com.quiz.dto.QuizSummaryDto> findSummaryDtosByCourseId(@Param("courseId") Long courseId);
    
    // Get quiz question count, avoid loading complete question data
    @Query("SELECT q.id, COUNT(qu) FROM Quiz q LEFT JOIN q.questions qu WHERE q.course.id = :courseId AND q.isActive = true GROUP BY q.id")
    List<Object[]> findQuizQuestionCountsByCourseId(@Param("courseId") Long courseId);
    
    @Query("SELECT q FROM Quiz q WHERE q.course.teacher.id = :teacherId AND q.isActive = true")
    List<Quiz> findActiveQuizzesByTeacherId(@Param("teacherId") Long teacherId);
    
    @Query("SELECT q FROM Quiz q WHERE q.title LIKE %:title% AND q.isActive = true")
    List<Quiz> findByTitleContainingAndIsActiveTrue(@Param("title") String title);
    
    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.course.id = :courseId AND q.isActive = true")
    Long countActiveByCourseId(@Param("courseId") Long courseId);
}