package com.quiz.repository;

import com.quiz.entity.UserCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserCertificateRepository extends JpaRepository<UserCertificate, Long> {
    
    // Find all certificates for a user
    List<UserCertificate> findByUserIdOrderByEarnedDateDesc(Long userId);
    
    // Find active certificates for a user
    List<UserCertificate> findByUserIdAndStatusOrderByEarnedDateDesc(Long userId, String status);
    
    // Find certificate by user and certificate
    Optional<UserCertificate> findByUserIdAndCertificateId(Long userId, Long certificateId);
    
    // Find certificate by certificate number
    Optional<UserCertificate> findByCertificateNumber(String certificateNumber);
    
    // Check if user has earned a specific certificate
    boolean existsByUserIdAndCertificateId(Long userId, Long certificateId);
    
    // Find certificates earned within a date range
    List<UserCertificate> findByUserIdAndEarnedDateBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find expired certificates
    @Query("SELECT uc FROM UserCertificate uc WHERE uc.expiryDate IS NOT NULL AND uc.expiryDate < :currentDate AND uc.status = 'ACTIVE'")
    List<UserCertificate> findExpiredCertificates(@Param("currentDate") LocalDateTime currentDate);
    
    // Count certificates by user
    long countByUserId(Long userId);
    
    // Count active certificates by user
    long countByUserIdAndStatus(Long userId, String status);
    
    // Find certificates by course (through certificate relationship)
    @Query("SELECT uc FROM UserCertificate uc WHERE uc.certificate.course.id = :courseId")
    List<UserCertificate> findByCourseId(@Param("courseId") Long courseId);
    
    // Find user certificates with high scores
    @Query("SELECT uc FROM UserCertificate uc WHERE uc.user.id = :userId AND uc.finalScore >= :minScore ORDER BY uc.finalScore DESC")
    List<UserCertificate> findByUserIdAndFinalScoreGreaterThanEqual(@Param("userId") Long userId, @Param("minScore") Integer minScore);
}