package com.quiz.repository;

import com.quiz.entity.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    
    /**
     * 根据课程ID查找小测
     */
    List<Quiz> findByCourseId(Long courseId);
    
    /**
     * 根据课程ID分页查找小测
     */
    Page<Quiz> findByCourseId(Long courseId, Pageable pageable);
    
    /**
     * 根据题目类型查找小测
     */
    @Query("SELECT q FROM Quiz q WHERE q.questionType = :questionType")
    List<Quiz> findByQuestionType(@Param("questionType") String questionType);
    
    /**
     * 根据难度查找小测
     */
    @Query("SELECT q FROM Quiz q WHERE q.difficulty = :difficulty")
    List<Quiz> findByDifficulty(@Param("difficulty") String difficulty);
    
    /**
     * 根据课程ID和难度查找小测
     */
    @Query("SELECT q FROM Quiz q WHERE q.courseId = :courseId AND q.difficulty = :difficulty")
    List<Quiz> findByCourseIdAndDifficulty(@Param("courseId") Long courseId, @Param("difficulty") String difficulty);
    
    /**
     * 根据课程ID和题目类型查找小测
     */
    @Query("SELECT q FROM Quiz q WHERE q.courseId = :courseId AND q.questionType = :questionType")
    List<Quiz> findByCourseIdAndQuestionType(@Param("courseId") Long courseId, @Param("questionType") String questionType);
    
    /**
     * 根据题目内容模糊查询
     */
    @Query("SELECT q FROM Quiz q WHERE q.question LIKE %:keyword%")
    List<Quiz> findByQuestionContaining(@Param("keyword") String keyword);
    
    /**
     * 统计课程的小测数量
     */
    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.courseId = :courseId")
    Long countByCourseId(@Param("courseId") Long courseId);
    
    /**
     * 根据分数范围查找小测
     */
    @Query("SELECT q FROM Quiz q WHERE q.points BETWEEN :minPoints AND :maxPoints")
    List<Quiz> findByPointsRange(@Param("minPoints") Integer minPoints, @Param("maxPoints") Integer maxPoints);
    
    /**
     * 随机获取指定数量的小测
     */
    @Query(value = "SELECT * FROM quiz WHERE course_id = :courseId ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Quiz> findRandomQuizzesByCourse(@Param("courseId") Long courseId, @Param("limit") Integer limit);
    
    /**
     * 统计各难度的题目数量
     */
    @Query("SELECT q.difficulty, COUNT(q) FROM Quiz q GROUP BY q.difficulty")
    List<Object[]> countByDifficulty();
    
    /**
     * 统计各题型的数量
     */
    @Query("SELECT q.questionType, COUNT(q) FROM Quiz q GROUP BY q.questionType")
    List<Object[]> countByQuestionType();
}