package com.quiz.repository;

import com.quiz.entity.Course;
import com.quiz.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    List<Course> findByTeacher(User teacher);
    
    List<Course> findByTeacherAndIsActiveTrue(User teacher);
    
    List<Course> findByIsActiveTrue();
    
    @Query("SELECT c FROM Course c WHERE c.title LIKE %:title% AND c.isActive = true")
    List<Course> findByTitleContainingAndIsActiveTrue(@Param("title") String title);
    
    @Query("SELECT c FROM Course c WHERE c.teacher.id = :teacherId AND c.isActive = true")
    List<Course> findActiveByTeacherId(@Param("teacherId") Long teacherId);
    
    @Query("SELECT COUNT(c) FROM Course c WHERE c.teacher.id = :teacherId AND c.isActive = true")
    Long countActiveByTeacherId(@Param("teacherId") Long teacherId);
}