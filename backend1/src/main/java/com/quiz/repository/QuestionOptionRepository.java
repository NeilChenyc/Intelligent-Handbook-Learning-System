package com.quiz.repository;

import com.quiz.entity.Question;
import com.quiz.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    
    List<QuestionOption> findByQuestion(Question question);
    
    List<QuestionOption> findByQuestionOrderByOrderIndexAsc(Question question);
    
    List<QuestionOption> findByQuestionIdOrderByOrderIndexAsc(Long questionId);
    
    @Query("SELECT qo FROM QuestionOption qo WHERE qo.question.id = :questionId AND qo.isCorrect = true")
    List<QuestionOption> findCorrectOptionsByQuestionId(@Param("questionId") Long questionId);
    
    @Query("SELECT COUNT(qo) FROM QuestionOption qo WHERE qo.question.id = :questionId AND qo.isCorrect = true")
    Long countCorrectOptionsByQuestionId(@Param("questionId") Long questionId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM QuestionOption qo WHERE qo.question.id = :questionId")
    void deleteByQuestionId(@Param("questionId") Long questionId);
    
    @Query("SELECT qo FROM QuestionOption qo WHERE qo.question.id IN :questionIds ORDER BY qo.question.id ASC, qo.orderIndex ASC")
    List<QuestionOption> findByQuestionIdsOrderByQuestionAndOrder(@Param("questionIds") List<Long> questionIds);
}