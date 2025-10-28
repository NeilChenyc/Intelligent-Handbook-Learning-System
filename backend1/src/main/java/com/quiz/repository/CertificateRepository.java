package com.quiz.repository;

import com.quiz.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    
    // Find certificate by course ID
    Optional<Certificate> findByCourseId(Long courseId);
    
    // Find all active certificates
    List<Certificate> findByIsActiveTrue();
    
    // Find certificates by issuer
    List<Certificate> findByIssuerAndIsActiveTrue(String issuer);
    
    // Find certificates by level
    List<Certificate> findByCertificateLevelAndIsActiveTrue(String level);
    
    // Check if certificate exists for a course
    boolean existsByCourseId(Long courseId);
    
    // Find certificates with specific passing score threshold
    @Query("SELECT c FROM Certificate c WHERE c.passingScoreThreshold <= :score AND c.isActive = true")
    List<Certificate> findByPassingScoreThresholdLessThanEqual(@Param("score") Integer score);
}