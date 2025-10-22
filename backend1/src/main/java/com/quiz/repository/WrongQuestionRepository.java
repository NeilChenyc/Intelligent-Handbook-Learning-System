package com.quiz.repository;

import com.quiz.entity.WrongQuestion;
import com.quiz.entity.User;
import com.quiz.entity.Question;
import com.quiz.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WrongQuestionRepository extends JpaRepository<WrongQuestion, Long> {
    
    // 查找用户所有未重做的错题
    List<WrongQuestion> findByUserAndIsRedoneFalse(User user);
    
    // 根据用户ID查找未重做的错题（包含必要的关联以避免懒加载）
    @Query("SELECT DISTINCT wq FROM WrongQuestion wq " +
           "LEFT JOIN FETCH wq.user " +
           "LEFT JOIN FETCH wq.question q " +
           "LEFT JOIN FETCH q.options " +
           "LEFT JOIN FETCH q.quiz quiz " +
           "LEFT JOIN FETCH quiz.course " +
           "LEFT JOIN FETCH wq.quizAttempt " +
           "WHERE wq.user.id = :userId AND wq.isRedone = false " +
           "ORDER BY wq.createdAt DESC")
    List<WrongQuestion> findByUserIdAndIsRedoneFalse(@Param("userId") Long userId);
    
    // 查找特定用户和题目的错题记录
    Optional<WrongQuestion> findByUserAndQuestionAndIsRedoneFalse(User user, Question question);
    
    // 根据小测提交记录查找错题
    List<WrongQuestion> findByQuizAttempt(QuizAttempt quizAttempt);
    
    // 统计用户未重做的错题数量
    @Query("SELECT COUNT(wq) FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.isRedone = false")
    Long countByUserIdAndIsRedoneFalse(@Param("userId") Long userId);
    
    // 查找用户在特定课程下的错题（预抓取所有必要关联）
    @Query("SELECT DISTINCT wq FROM WrongQuestion wq " +
           "LEFT JOIN FETCH wq.user " +
           "LEFT JOIN FETCH wq.question q " +
           "LEFT JOIN FETCH q.options " +
           "LEFT JOIN FETCH q.quiz quiz " +
           "LEFT JOIN FETCH quiz.course " +
           "LEFT JOIN FETCH wq.quizAttempt " +
           "WHERE wq.user.id = :userId AND quiz.course.id = :courseId AND wq.isRedone = false " +
           "ORDER BY wq.createdAt DESC")
    List<WrongQuestion> findByUserIdAndCourseIdAndIsRedoneFalse(@Param("userId") Long userId, @Param("courseId") Long courseId);
    
    // 查找用户在特定小测下的错题（预抓取所有必要关联）
    @Query("SELECT DISTINCT wq FROM WrongQuestion wq " +
           "LEFT JOIN FETCH wq.user " +
           "LEFT JOIN FETCH wq.question q " +
           "LEFT JOIN FETCH q.options " +
           "LEFT JOIN FETCH q.quiz quiz " +
           "LEFT JOIN FETCH quiz.course " +
           "LEFT JOIN FETCH wq.quizAttempt " +
           "WHERE wq.user.id = :userId AND quiz.id = :quizId AND wq.isRedone = false " +
           "ORDER BY wq.createdAt DESC")
    List<WrongQuestion> findByUserIdAndQuizIdAndIsRedoneFalse(@Param("userId") Long userId, @Param("quizId") Long quizId);
    
    // 检查是否已存在相同的错题记录
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.question.id = :questionId AND wq.quizAttempt.id = :attemptId")
    Optional<WrongQuestion> findByUserIdAndQuestionIdAndAttemptId(@Param("userId") Long userId, @Param("questionId") Long questionId, @Param("attemptId") Long attemptId);
    
    // 查找所有已重做的错题（用于清理）
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.isRedone = true")
    List<WrongQuestion> findByIsRedoneTrue();
}