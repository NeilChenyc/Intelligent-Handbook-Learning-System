package com.quiz.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"quizzes", "handbookFilePath", "teacher"})
    private Course course;

    @Column(name = "certificate_name", nullable = false, length = 200)
    private String certificateName;

    @Column(name = "issuer", nullable = false, length = 100)
    private String issuer;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "certificate_level", length = 50)
    private String certificateLevel; // e.g., "Beginner", "Intermediate", "Advanced"

    @Column(name = "validity_period_months")
    private Integer validityPeriodMonths; // Certificate validity in months, null means permanent

    @Column(name = "passing_score_threshold")
    private Integer passingScoreThreshold; // Minimum score required to earn certificate

    @Column(name = "template_name", length = 100)
    private String templateName; // HTML template file name

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}