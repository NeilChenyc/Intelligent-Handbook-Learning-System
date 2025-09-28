package com.quiz.repository;

import com.quiz.entity.User;
import com.quiz.entity.Quiz;
import com.quiz.entity.UserQuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserQuizAnswerRepository extends JpaRepository<UserQuizAnswer, Long> {
    
    /**
     * 根据用户ID查找答题记录
     */
    List<UserQuizAnswer> findByUserId(Long userId);
    
    /**
     * 根据小测ID查找答题记录
     */
    List<UserQuizAnswer> findByQuizId(Long quizId);
    
    /**
     * 根据用户ID和小测ID查找答题记录
     */
    List<UserQuizAnswer> findByUserIdAndQuizId(Long userId, Long quizId);
    
    /**
     * 查找用户的最新答题记录
     */
    Optional<UserQuizAnswer> findTopByUserIdAndQuizIdOrderByAnsweredAtDesc(Long userId, Long quizId);
    
    /**
     * 查找用户的错题
     */
    @Query("SELECT uqa FROM UserQuizAnswer uqa WHERE uqa.userId = :userId AND uqa.isCorrect = false")
    List<UserQuizAnswer> findWrongAnswersByUserId(@Param("userId") Long userId);
    
    /**
     * 查找用户的正确答题
     */
    @Query("SELECT uqa FROM UserQuizAnswer uqa WHERE uqa.userId = :userId AND uqa.isCorrect = true")
    List<UserQuizAnswer> findCorrectAnswersByUserId(@Param("userId") Long userId);
    
    /**
     * 统计用户的答题次数
     */
    @Query("SELECT COUNT(uqa) FROM UserQuizAnswer uqa WHERE uqa.userId = :userId")
    Long countByUserId(@Param("userId") Long userId);
    
    /**
     * 统计用户的正确答题数
     */
    @Query("SELECT COUNT(uqa) FROM UserQuizAnswer uqa WHERE uqa.userId = :userId AND uqa.isCorrect = true")
    Long countCorrectAnswersByUserId(@Param("userId") Long userId);
    
    /**
     * 计算用户的平均分数
     */
    @Query("SELECT AVG(uqa.score) FROM UserQuizAnswer uqa WHERE uqa.userId = :userId")
    Double calculateAverageScoreByUserId(@Param("userId") Long userId);
    
    /**
     * 查找指定时间范围内的答题记录
     */
    @Query("SELECT uqa FROM UserQuizAnswer uqa WHERE uqa.userId = :userId AND uqa.answeredAt BETWEEN :startDate AND :endDate")
    List<UserQuizAnswer> findByUserIdAndDateRange(@Param("userId") Long userId, 
                                                  @Param("startDate") LocalDateTime startDate, 
                                                  @Param("endDate") LocalDateTime endDate);
    
    /**
     * 查找用户在特定课程中的答题记录
     */
    @Query("SELECT uqa FROM UserQuizAnswer uqa JOIN Quiz q ON uqa.quizId = q.id WHERE uqa.userId = :userId AND q.courseId = :courseId")
    List<UserQuizAnswer> findByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
    
    /**
     * 统计用户在特定课程中的正确答题数
     */
    @Query("SELECT COUNT(uqa) FROM UserQuizAnswer uqa JOIN Quiz q ON uqa.quizId = q.id WHERE uqa.userId = :userId AND q.courseId = :courseId AND uqa.isCorrect = true")
    Long countCorrectAnswersByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
    
    /**
     * 查找用户的答题统计（按日期分组）
     */
    @Query("SELECT DATE(uqa.answeredAt), COUNT(uqa), SUM(CASE WHEN uqa.isCorrect = true THEN 1 ELSE 0 END) FROM UserQuizAnswer uqa WHERE uqa.userId = :userId GROUP BY DATE(uqa.answeredAt) ORDER BY DATE(uqa.answeredAt)")
    List<Object[]> findDailyStatsByUserId(@Param("userId") Long userId);
    
    /**
     * 统计用户对特定小测的答题次数
     */
    @Query("SELECT COUNT(uqa) FROM UserQuizAnswer uqa WHERE uqa.user = :user AND uqa.quiz = :quiz")
    Long countByUserAndQuiz(@Param("user") User user, @Param("quiz") Quiz quiz);
    
    /**
     * 根据用户ID和正确性查找答题记录
     */
    @Query("SELECT uqa FROM UserQuizAnswer uqa WHERE uqa.user.id = :userId AND uqa.isCorrect = :isCorrect")
    List<UserQuizAnswer> findByUserIdAndIsCorrect(@Param("userId") Long userId, @Param("isCorrect") Boolean isCorrect);
}