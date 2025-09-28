package com.quiz.repository;

import com.quiz.entity.UserCourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCourseProgressRepository extends JpaRepository<UserCourseProgress, Long> {
    
    /**
     * 根据用户ID查找课程进度
     */
    List<UserCourseProgress> findByUserId(Long userId);
    
    /**
     * 根据课程ID查找进度记录
     */
    List<UserCourseProgress> findByCourseId(Long courseId);
    
    /**
     * 根据用户ID和课程ID查找进度
     */
    Optional<UserCourseProgress> findByUserIdAndCourseId(Long userId, Long courseId);
    
    /**
     * 查找用户已完成的课程
     */
    @Query("SELECT ucp FROM UserCourseProgress ucp WHERE ucp.userId = :userId AND ucp.isCompleted = true")
    List<UserCourseProgress> findCompletedCoursesByUserId(@Param("userId") Long userId);
    
    /**
     * 查找用户进行中的课程
     */
    @Query("SELECT ucp FROM UserCourseProgress ucp WHERE ucp.userId = :userId AND ucp.isCompleted = false AND ucp.completedQuizzes > 0")
    List<UserCourseProgress> findInProgressCoursesByUserId(@Param("userId") Long userId);
    
    /**
     * 统计用户完成的课程数量
     */
    @Query("SELECT COUNT(ucp) FROM UserCourseProgress ucp WHERE ucp.userId = :userId AND ucp.isCompleted = true")
    Long countCompletedCoursesByUserId(@Param("userId") Long userId);
    
    /**
     * 计算用户的总学习时长
     */
    @Query("SELECT SUM(ucp.studyTimeMinutes) FROM UserCourseProgress ucp WHERE ucp.userId = :userId")
    Long calculateTotalStudyTimeByUserId(@Param("userId") Long userId);
    
    /**
     * 计算用户的总分数
     */
    @Query("SELECT SUM(ucp.totalScore) FROM UserCourseProgress ucp WHERE ucp.userId = :userId")
    Long calculateTotalScoreByUserId(@Param("userId") Long userId);
    
    /**
     * 查找特定课程的所有学习者进度
     */
    @Query("SELECT ucp FROM UserCourseProgress ucp WHERE ucp.courseId = :courseId ORDER BY ucp.totalScore DESC")
    List<UserCourseProgress> findProgressByCourseIdOrderByScore(@Param("courseId") Long courseId);
    
    /**
     * 统计课程的完成人数
     */
    @Query("SELECT COUNT(ucp) FROM UserCourseProgress ucp WHERE ucp.courseId = :courseId AND ucp.isCompleted = true")
    Long countCompletedUsersByCourseId(@Param("courseId") Long courseId);
    
    /**
     * 计算课程的平均完成率
     */
    @Query("SELECT AVG(CAST(ucp.completedQuizzes AS DOUBLE) / NULLIF(ucp.totalQuizzes, 0) * 100) FROM UserCourseProgress ucp WHERE ucp.courseId = :courseId")
    Double calculateAverageCompletionRateByCourseId(@Param("courseId") Long courseId);
    
    /**
     * 查找学习时长最长的用户
     */
    @Query("SELECT ucp FROM UserCourseProgress ucp WHERE ucp.courseId = :courseId ORDER BY ucp.studyTimeMinutes DESC")
    List<UserCourseProgress> findTopStudentsByCourseIdOrderByStudyTime(@Param("courseId") Long courseId);
    
    /**
     * 根据部门统计课程完成情况
     */
    @Query("SELECT u.department, COUNT(ucp), SUM(CASE WHEN ucp.isCompleted = true THEN 1 ELSE 0 END) " +
           "FROM UserCourseProgress ucp JOIN User u ON ucp.userId = u.id " +
           "WHERE ucp.courseId = :courseId GROUP BY u.department")
    List<Object[]> findCompletionStatsByCourseIdAndDepartment(@Param("courseId") Long courseId);
}