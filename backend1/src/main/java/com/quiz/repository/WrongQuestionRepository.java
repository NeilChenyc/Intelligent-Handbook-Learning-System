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
    
    // Find all unredone wrong questions for user
    List<WrongQuestion> findByUserAndIsRedoneFalse(User user);
    
    // Find unredone wrong questions by user ID (including necessary associations to avoid lazy loading)
    @EntityGraph(attributePaths = {"user", "question", "question.quiz", "question.quiz.course", "quizAttempt"})
    @Query("SELECT new com.quiz.dto.WrongQuestionLiteDto(\n    wq.wrongQuestionId,\n    wq.user.id,\n    wq.user.username,\n    wq.quizAttempt.id,\n    wq.createdAt,\n    wq.isRedone,\n    wq.redoneAt,\n    wq.updatedAt,\n    q.id,\n    q.questionText,\n    q.type,\n    q.explanation,\n    quiz.id,\n    quiz.title,\n    course.id,\n    course.title\n)\nFROM WrongQuestion wq\nJOIN wq.question q\nJOIN q.quiz quiz\nJOIN quiz.course course\nJOIN wq.quizAttempt attempt\nWHERE wq.user.id = :userId AND wq.isRedone = false\nORDER BY wq.createdAt DESC")
    List<WrongQuestionLiteDto> findLiteByUserIdAndIsRedoneFalse(@Param("userId") Long userId);
    
    // Find wrong question records for specific user and question
    Optional<WrongQuestion> findByUserAndQuestionAndIsRedoneFalse(User user, Question question);
    
    // Find wrong questions based on quiz submission records
    List<WrongQuestion> findByQuizAttempt(QuizAttempt quizAttempt);
    
    // Count user's unredone wrong questions
    @Query("SELECT COUNT(wq) FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.isRedone = false")
    Long countByUserIdAndIsRedoneFalse(@Param("userId") Long userId);
    
    // Find user's wrong questions under specific course (pre-fetch all necessary associations)
    @EntityGraph(attributePaths = {"user", "question", "question.quiz", "question.quiz.course", "quizAttempt"})
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.isRedone = false AND wq.question.quiz.course.id = :courseId ORDER BY wq.createdAt DESC")
    List<WrongQuestion> findByUserIdAndCourseIdAndIsRedoneFalse(@Param("userId") Long userId, @Param("courseId") Long courseId);
    
    // Find user's wrong questions under specific quiz (pre-fetch all necessary associations)
    @EntityGraph(attributePaths = {"user", "question", "question.quiz", "question.quiz.course", "quizAttempt"})
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.isRedone = false AND wq.question.quiz.id = :quizId ORDER BY wq.createdAt DESC")
    List<WrongQuestion> findByUserIdAndQuizIdAndIsRedoneFalse(@Param("userId") Long userId, @Param("quizId") Long quizId);
    
    // Check if same wrong question record already exists
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.user.id = :userId AND wq.question.id = :questionId AND wq.quizAttempt.id = :attemptId")
    Optional<WrongQuestion> findByUserIdAndQuestionIdAndAttemptId(@Param("userId") Long userId, @Param("questionId") Long questionId, @Param("attemptId") Long attemptId);
    
    // Find all redone wrong questions (for cleanup)
    @Query("SELECT wq FROM WrongQuestion wq WHERE wq.isRedone = true")
    List<WrongQuestion> findByIsRedoneTrue();

    // New: Delete all wrong questions by course ID (involving questions or quiz submissions under course)
    @Modifying
    @Transactional
    @Query("DELETE FROM WrongQuestion wq WHERE wq.question.quiz.course.id = :courseId OR wq.quizAttempt.quiz.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);
}