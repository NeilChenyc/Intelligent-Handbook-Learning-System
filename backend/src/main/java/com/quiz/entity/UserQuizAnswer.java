package com.quiz.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_quiz_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserQuizAnswer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
    
    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer; // JSON格式存储用户答案
    
    @Column(name = "is_correct")
    private Boolean isCorrect;
    
    @Column(name = "score")
    private Integer score;
    
    @Column(name = "attempt_count")
    private Integer attemptCount = 1;
    
    @CreationTimestamp
    @Column(name = "answered_at")
    private LocalDateTime answeredAt;
    
    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;
}