package com.quiz.repository;

import com.quiz.entity.WrongQuestion;
import com.quiz.entity.User;
import com.quiz.entity.Question;
import com.quiz.entity.QuizAttempt;
import com.quiz.dto.WrongQuestionLiteDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

@Repository
public interface WrongQuestionRepository extends JpaRepository<WrongQuestion, Long> {
    
    // 查找用户所有未重做的错题
    List<WrongQuestion> findByUserAndIsRedoneFalse(User user);
    
    // 根据用户ID查找未重做的错题（包含必要的关联以避免懒加载）
    @EntityGraph(attributePaths = {"user", "question", "question.quiz", "question.quiz.course", "quizAttempt"})
    @Query("SELECT new com.quiz.dto.WrongQuestionLiteDto(\n    wq.wrongQuestionId,\n    wq.user.id,\n    wq.user.username,\n    wq.quizAttempt.id,\n    wq.createdAt,\n    wq.isRedone,\n    wq.redoneAt,\n    wq.updatedAt,\n    q.id,\n    q.questionText,\n    q.type,\n    q.explanation,\n    quiz.id,\n    quiz.title,\n    course.id,\n    course.title\n)\nFROM WrongQuestion wq\nJOIN wq.question q\nJOIN q.quiz quiz\nJOIN quiz.course course\nJOIN wq.quizAttempt attempt\nWHERE wq.user.id = :userId AND wq.isRedone = false\nORDER BY wq.createdAt DESC")
    List<WrongQuestionLiteDto> findLiteByUserIdAndIsRedoneFalse(@Param("userId") Long userId);
    
    // 查找特定用户和题目的错题记录
    Optional<WrongQuestion> findByUserAndQuestionAndIsRedoneFalse(User user, Question question);
    
    // 根据小测提交记录查找错题
    List<WrongQuestion> findByQuizAttempt(QuizAttempt quizAttempt);
    
    // 统计用户未重做的错题数量
    @Query("SELECT COUNT(wq) FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.isRedone = false")
    Long countByUserIdAndIsRedoneFalse(@Param("userId") Long userId);
    
    // 查找用户在特定课程下的错题（预抓取所有必要关联）
    @EntityGraph(attributePaths = {"user", "question", "question.quiz", "question.quiz.course", "quizAttempt"})
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.isRedone = false AND wq.question.quiz.course.id = :courseId ORDER BY wq.createdAt DESC")
    List<WrongQuestion> findByUserIdAndCourseIdAndIsRedoneFalse(@Param("userId") Long userId, @Param("courseId") Long courseId);
    
    // 查找用户在特定小测下的错题（预抓取所有必要关联）
    @EntityGraph(attributePaths = {"user", "question", "question.quiz", "question.quiz.course", "quizAttempt"})
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.isRedone = false AND wq.question.quiz.id = :quizId ORDER BY wq.createdAt DESC")
    List<WrongQuestion> findByUserIdAndQuizIdAndIsRedoneFalse(@Param("userId") Long userId, @Param("quizId") Long quizId);
    
    // 检查是否已存在相同的错题记录
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.question.id = :questionId AND wq.quizAttempt.id = :attemptId")
    Optional<WrongQuestion> findByUserIdAndQuestionIdAndAttemptId(@Param("userId") Long userId, @Param("questionId") Long questionId, @Param("attemptId") Long attemptId);
    
    // 查找所有已重做的错题（用于清理）
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.isRedone = true")
    List<WrongQuestion> findByIsRedoneTrue();

    // 新增：按课程ID删除所有错题（涉及课程下的题目或测验提交）
    @Modifying
    @Transactional
    @Query("DELETE FROM WrongQuestion wq WHERE wq.question.quiz.course.id = :courseId OR wq.quizAttempt.quiz.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);
}