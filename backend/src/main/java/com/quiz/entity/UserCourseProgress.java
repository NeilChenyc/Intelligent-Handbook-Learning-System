package com.quiz.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_course_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCourseProgress {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Column(name = "progress_percentage")
    private Integer progressPercentage = 0;
    
    @Column(name = "completed_quizzes")
    private Integer completedQuizzes = 0;
    
    @Column(name = "total_quizzes")
    private Integer totalQuizzes = 0;
    
    @Column(name = "total_score")
    private Integer totalScore = 0;
    
    @Column(name = "max_possible_score")
    private Integer maxPossibleScore = 0;
    
    @Column(name = "study_time_minutes")
    private Integer studyTimeMinutes = 0;
    
    @Column(name = "is_completed")
    private Boolean isCompleted = false;
    
    @Column(name = "completion_date")
    private LocalDateTime completionDate;
    
    @CreationTimestamp
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}