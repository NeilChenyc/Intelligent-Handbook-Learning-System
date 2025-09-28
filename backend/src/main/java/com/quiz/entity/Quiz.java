package com.quiz.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "quizzes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuizType type;
    
    @Column(name = "options", columnDefinition = "TEXT")
    private String options; // JSON格式存储选项
    
    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer; // JSON格式存储正确答案
    
    @Column(columnDefinition = "TEXT")
    private String explanation;
    
    @Column(name = "points")
    private Integer points = 10;
    
    @Column(name = "order_index")
    private Integer orderIndex;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UserQuizAnswer> userAnswers;
    
    public enum QuizType {
        SINGLE_CHOICE("单选题"),
        MULTIPLE_CHOICE("多选题"),
        TRUE_FALSE("判断题"),
        ESSAY("问答题"),
        FILL_BLANK("填空题");
        
        private final String displayName;
        
        QuizType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}