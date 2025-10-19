package com.quiz.repository;

import com.quiz.entity.Question;
import com.quiz.entity.QuizAttempt;
import com.quiz.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {
    
    List<StudentAnswer> findByQuizAttempt(QuizAttempt quizAttempt);
    
    List<StudentAnswer> findByQuizAttemptId(Long quizAttemptId);
    
    Optional<StudentAnswer> findByQuizAttemptAndQuestion(QuizAttempt quizAttempt, Question question);
    
    @Query("SELECT sa FROM StudentAnswer sa WHERE sa.quizAttempt.id = :attemptId AND sa.question.id = :questionId")
    Optional<StudentAnswer> findByAttemptIdAndQuestionId(@Param("attemptId") Long attemptId, @Param("questionId") Long questionId);
    
    @Query("SELECT sa FROM StudentAnswer sa WHERE sa.question.id = :questionId")
    List<StudentAnswer> findByQuestionId(@Param("questionId") Long questionId);
    
    @Query("SELECT COUNT(sa) FROM StudentAnswer sa WHERE sa.quizAttempt.id = :attemptId AND sa.isCorrect = true")
    Long countCorrectAnswersByAttemptId(@Param("attemptId") Long attemptId);
    
    @Query("SELECT SUM(sa.pointsEarned) FROM StudentAnswer sa WHERE sa.quizAttempt.id = :attemptId")
    Integer getTotalPointsEarnedByAttemptId(@Param("attemptId") Long attemptId);
}