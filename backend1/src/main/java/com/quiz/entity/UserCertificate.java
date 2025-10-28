package com.quiz.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class UserCertificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "certificate_id", nullable = false)
    @JsonIgnoreProperties({"course"})
    private Certificate certificate;

    @Column(name = "certificate_number", nullable = false, unique = true, length = 100)
    private String certificateNumber; // Unique certificate ID for each user

    @Column(name = "earned_date", nullable = false)
    private LocalDateTime earnedDate;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate; // Calculated based on certificate validity period

    @Column(name = "final_score", nullable = false)
    private Integer finalScore; // User's final score when earning the certificate

    @Column(name = "completion_percentage", nullable = false)
    private Integer completionPercentage; // Course completion percentage

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, EXPIRED, REVOKED

    @Column(name = "html_content", columnDefinition = "LONGTEXT")
    private String htmlContent; // Generated HTML certificate content

    @Column(name = "download_count")
    private Integer downloadCount = 0;

    @Column(name = "last_downloaded_at")
    private LocalDateTime lastDownloadedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper method to check if certificate is expired
    @Transient
    public boolean isExpired() {
        return expiryDate != null && LocalDateTime.now().isAfter(expiryDate);
    }

    // Helper method to check if certificate is valid
    @Transient
    public boolean isValid() {
        return "ACTIVE".equals(status) && !isExpired();
    }
}