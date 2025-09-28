package com.quiz.repository;

import com.quiz.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    /**
     * 根据状态查找课程
     */
    List<Course> findByStatus(Course.Status status);
    
    /**
     * 根据状态分页查找课程
     */
    Page<Course> findByStatus(Course.Status status, Pageable pageable);
    
    /**
     * 根据分类查找课程
     */
    List<Course> findByCategory(String category);
    
    /**
     * 根据分类和状态查找课程
     */
    List<Course> findByCategoryAndStatus(String category, Course.Status status);
    
    /**
     * 根据标题模糊查询
     */
    @Query("SELECT c FROM Course c WHERE c.title LIKE %:keyword% OR c.description LIKE %:keyword%")
    List<Course> findByTitleOrDescriptionContaining(@Param("keyword") String keyword);
    
    /**
     * 查找已发布的课程
     */
    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' ORDER BY c.createdAt DESC")
    List<Course> findPublishedCourses();
    
    /**
     * 查找已发布的课程（分页）
     */
    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' ORDER BY c.createdAt DESC")
    Page<Course> findPublishedCourses(Pageable pageable);
    
    /**
     * 根据创建者查找课程
     */
    List<Course> findByCreatedBy(String createdBy);
    
    /**
     * 统计各状态的课程数量
     */
    @Query("SELECT c.status, COUNT(c) FROM Course c GROUP BY c.status")
    List<Object[]> countByStatus();
    
    /**
     * 统计各分类的课程数量
     */
    @Query("SELECT c.category, COUNT(c) FROM Course c GROUP BY c.category")
    List<Object[]> countByCategory();
}