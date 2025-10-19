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
    
    @Query("SELECT q FROM Quiz q WHERE q.course.teacher.id = :teacherId AND q.isActive = true")
    List<Quiz> findActiveQuizzesByTeacherId(@Param("teacherId") Long teacherId);
    
    @Query("SELECT q FROM Quiz q WHERE q.title LIKE %:title% AND q.isActive = true")
    List<Quiz> findByTitleContainingAndIsActiveTrue(@Param("title") String title);
    
    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.course.id = :courseId AND q.isActive = true")
    Long countActiveByCourseId(@Param("courseId") Long courseId);
}