package com.quiz.service;

import com.quiz.entity.Certificate;
import com.quiz.entity.Course;
import com.quiz.entity.User;
import com.quiz.entity.UserCertificate;
import com.quiz.repository.CertificateRepository;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.UserCertificateRepository;
import com.quiz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final UserCertificateRepository userCertificateRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CertificateTemplateService certificateTemplateService;

    /**
     * Create certificate metadata when course is uploaded
     */
    @Transactional
    public Certificate createCertificateForCourse(Long courseId, String certificateName, String issuer, 
                                                 String description, String level, 
                                                 Integer validityMonths, Integer passingScore) {
        log.info("Creating certificate for course ID: {}", courseId);
        
        // Check if certificate already exists for this course
        if (certificateRepository.existsByCourseId(courseId)) {
            throw new RuntimeException("Certificate already exists for this course");
        }
        
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found with ID: " + courseId));
        
        Certificate certificate = new Certificate();
        certificate.setCourse(course);
        certificate.setCertificateName(certificateName != null ? certificateName : course.getTitle() + " Certificate");
        certificate.setIssuer(issuer != null ? issuer : "Internal Learning System");
        certificate.setDescription(description);
        certificate.setCertificateLevel(level != null ? level : "Intermediate");
        certificate.setValidityPeriodMonths(validityMonths);
        certificate.setPassingScoreThreshold(passingScore != null ? passingScore : 80);
        certificate.setTemplateName("default_certificate_template.html");
        certificate.setIsActive(true);
        
        Certificate savedCertificate = certificateRepository.save(certificate);
        log.info("Certificate created successfully with ID: {}", savedCertificate.getId());
        
        return savedCertificate;
    }

    /**
     * Get all active certificates
     */
    @Transactional(readOnly = true)
    public List<Certificate> getAllActiveCertificates() {
        return certificateRepository.findByIsActiveTrue();
    }

    /**
     * Get certificates visible to user based on department rules
     */
    @Transactional(readOnly = true)
    public List<Certificate> getCertificatesVisibleToUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        List<Certificate> allCertificates = certificateRepository.findByIsActiveTrue();

        return allCertificates.stream()
                .filter(certificate -> {
                    String courseDepartment = certificate.getCourse().getDepartment();

                    // Visible to all if department not set
                    if (courseDepartment == null) {
                        return true;
                    }

                    // Normalize and handle common synonyms like "everyone"
                    String normalized = courseDepartment.replaceAll("\\s+", "").toLowerCase();
                    if (normalized.equals("everyone")) {
                        return true;
                    }

                    // Match user's department (case-insensitive)
                    String userDept = user.getDepartment();
                    return userDept != null && courseDepartment.equalsIgnoreCase(userDept);
                })
                .toList();
    }

    /**
     * Get certificate by course ID
     */
    @Transactional(readOnly = true)
    public Optional<Certificate> getCertificateByCourseId(Long courseId) {
        return certificateRepository.findByCourseId(courseId);
    }

    /**
     * Update certificate metadata
     */
    @Transactional
    public Certificate updateCertificate(Long certificateId, String certificateName, String issuer,
                                       String description, String level,
                                       Integer validityMonths, Integer passingScore) {
        Certificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificate not found with ID: " + certificateId));
        
        if (certificateName != null) certificate.setCertificateName(certificateName);
        if (issuer != null) certificate.setIssuer(issuer);
        if (description != null) certificate.setDescription(description);
        if (level != null) certificate.setCertificateLevel(level);
        if (validityMonths != null) certificate.setValidityPeriodMonths(validityMonths);
        if (passingScore != null) certificate.setPassingScoreThreshold(passingScore);
        
        return certificateRepository.save(certificate);
    }

    /**
     * Generate certificate number
     */
    private String generateCertificateNumber(Long userId, Long certificateId) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uniqueId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return String.format("CERT-%s-%d-%d-%s", timestamp, userId, certificateId, uniqueId);
    }

    /**
     * Award certificate to user when course is completed
     */
    @Transactional
    public UserCertificate awardCertificateToUser(Long userId, Long courseId, Integer finalScore, 
                                                 Integer completionPercentage) {
        log.info("Awarding certificate to user {} for course {}", userId, courseId);
        
        // Get user and certificate for the course
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        Certificate certificate = certificateRepository.findByCourseId(courseId)
            .orElseThrow(() -> new RuntimeException("No certificate found for course ID: " + courseId));
        
        // Check if user already has this certificate
        if (userCertificateRepository.existsByUserIdAndCertificateId(userId, certificate.getId())) {
            throw new RuntimeException("User already has this certificate");
        }
        
        // Check if user meets the passing score threshold
        if (finalScore < certificate.getPassingScoreThreshold()) {
            throw new RuntimeException("User score does not meet certificate requirements");
        }
        
        UserCertificate userCertificate = new UserCertificate();
        userCertificate.setUser(user);
        userCertificate.setCertificate(certificate);
        userCertificate.setCertificateNumber(generateCertificateNumber(userId, certificate.getId()));
        userCertificate.setEarnedDate(LocalDateTime.now());
        
        // Calculate expiry date if certificate has validity period
        if (certificate.getValidityPeriodMonths() != null) {
            userCertificate.setExpiryDate(LocalDateTime.now().plusMonths(certificate.getValidityPeriodMonths()));
        }
        
        userCertificate.setFinalScore(finalScore);
        userCertificate.setCompletionPercentage(completionPercentage);
        userCertificate.setStatus("ACTIVE");
        
        // HTML content not persisted to database (PostgreSQL column is OID), dynamically generated on download
        
        UserCertificate savedCertificate = userCertificateRepository.save(userCertificate);
        log.info("Certificate awarded successfully with number: {}", savedCertificate.getCertificateNumber());
        
        return savedCertificate;
    }

    /**
     * Get user certificate by ID
     */
    @Transactional(readOnly = true)
    public Optional<UserCertificate> getUserCertificateById(Long userCertificateId) {
        return userCertificateRepository.findById(userCertificateId);
    }

    /**
     * Get user's certificates
     */
    @Transactional(readOnly = true)
    public List<UserCertificate> getUserCertificates(Long userId) {
        return userCertificateRepository.findByUserIdOrderByEarnedDateDesc(userId);
    }

    /**
     * Get user's active certificates
     */
    @Transactional(readOnly = true)
    public List<UserCertificate> getUserActiveCertificates(Long userId) {
        return userCertificateRepository.findByUserIdAndStatusOrderByEarnedDateDesc(userId, "ACTIVE");
    }

    /**
     * Get certificate by certificate number
     */
    @Transactional(readOnly = true)
    public Optional<UserCertificate> getCertificateByCertificateNumber(String certificateNumber) {
        return userCertificateRepository.findByCertificateNumber(certificateNumber);
    }

    /**
     * Generate certificate HTML (regenerate on demand for download)
     */
    @Transactional(readOnly = true)
    public String generateCertificateHtml(UserCertificate userCertificate) {
        User user = userCertificate.getUser();
        if (user == null || user.getId() == null) {
            try {
                Long uid = userCertificate.getUser() != null ? userCertificate.getUser().getId() : null;
                if (uid != null) {
                    user = userRepository.findById(uid).orElse(null);
                }
            } catch (Exception ignored) {}
        }

        if (user != null) {
            return certificateTemplateService.generateCertificateHtml(userCertificate, user);
        }
        return certificateTemplateService.generateSimpleCertificateHtml(userCertificate, new User());
    }

    /**
     * Update certificate download count
     */
    @Transactional
    public void updateDownloadCount(Long userCertificateId) {
        UserCertificate userCertificate = userCertificateRepository.findById(userCertificateId)
            .orElseThrow(() -> new RuntimeException("User certificate not found"));
        
        userCertificate.setDownloadCount(userCertificate.getDownloadCount() + 1);
        userCertificate.setLastDownloadedAt(LocalDateTime.now());
        userCertificateRepository.save(userCertificate);
    }

    /**
     * Check if user is eligible for certificate
     */
    @Transactional(readOnly = true)
    public boolean isUserEligibleForCertificate(Long userId, Long courseId, Integer userScore) {
        Optional<Certificate> certificate = certificateRepository.findByCourseId(courseId);
        if (certificate.isEmpty()) {
            return false;
        }
        
        // Check if user already has the certificate
        if (userCertificateRepository.existsByUserIdAndCertificateId(userId, certificate.get().getId())) {
            return false;
        }
        
        // Check if user meets the passing score
        return userScore >= certificate.get().getPassingScoreThreshold();
    }

    /**
     * Update expired certificates status
     */
    @Transactional
    public void updateExpiredCertificates() {
        List<UserCertificate> expiredCertificates = userCertificateRepository.findExpiredCertificates(LocalDateTime.now());
        for (UserCertificate cert : expiredCertificates) {
            cert.setStatus("EXPIRED");
        }
        userCertificateRepository.saveAll(expiredCertificates);
        log.info("Updated {} expired certificates", expiredCertificates.size());
    }
}