package com.quiz.controller;

import com.quiz.entity.Certificate;
import com.quiz.entity.UserCertificate;
import com.quiz.service.CertificateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/certificates")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class CertificateController {

    private final CertificateService certificateService;

    /**
     * Get all certificates (with department visibility logic)
     */
    @GetMapping
    public ResponseEntity<List<Certificate>> getAllCertificates(@RequestParam(value = "userId", required = false) Long userId) {
        try {
            List<Certificate> certificates;
            if (userId != null) {
                // Get certificates visible to specific user based on department
                certificates = certificateService.getCertificatesVisibleToUser(userId);
            } else {
                // Get all active certificates (for admin)
                certificates = certificateService.getAllActiveCertificates();
            }
            return ResponseEntity.ok(certificates);
        } catch (Exception e) {
            log.error("Error fetching certificates", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get certificate by course ID
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<Certificate> getCertificateByCourseId(@PathVariable("courseId") Long courseId) {
        try {
            Optional<Certificate> certificate = certificateService.getCertificateByCourseId(courseId);
            return certificate.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching certificate for course {}", courseId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Create certificate for course (called when course is uploaded)
     */
    @PostMapping("/course/{courseId}")
    public ResponseEntity<Certificate> createCertificateForCourse(
            @PathVariable("courseId") Long courseId,
            @RequestBody Map<String, Object> request) {
        try {
            String certificateName = (String) request.get("certificateName");
            String issuer = (String) request.get("issuer");
            String description = (String) request.get("description");
            String level = (String) request.get("level");
            Integer validityMonths = (Integer) request.get("validityMonths");
            Integer passingScore = (Integer) request.get("passingScore");

            Certificate certificate = certificateService.createCertificateForCourse(
                    courseId, certificateName, issuer, description, 
                    level, validityMonths, passingScore);
            
            return ResponseEntity.ok(certificate);
        } catch (Exception e) {
            log.error("Error creating certificate for course {}", courseId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update certificate metadata
     */
    @PutMapping("/{certificateId}")
    public ResponseEntity<Certificate> updateCertificate(
            @PathVariable("certificateId") Long certificateId,
            @RequestBody Map<String, Object> request) {
        try {
            String certificateName = (String) request.get("certificateName");
            String issuer = (String) request.get("issuer");
            String description = (String) request.get("description");
            String level = (String) request.get("level");
            Integer validityMonths = (Integer) request.get("validityMonths");
            Integer passingScore = (Integer) request.get("passingScore");

            Certificate certificate = certificateService.updateCertificate(
                    certificateId, certificateName, issuer, description,
                    level, validityMonths, passingScore);
            
            return ResponseEntity.ok(certificate);
        } catch (Exception e) {
            log.error("Error updating certificate {}", certificateId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get user's certificates
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserCertificate>> getUserCertificates(@PathVariable("userId") Long userId) {
        try {
            List<UserCertificate> certificates = certificateService.getUserCertificates(userId);
            return ResponseEntity.ok(certificates);
        } catch (Exception e) {
            log.error("Error fetching certificates for user {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get user's active certificates
     */
    @GetMapping("/user/{userId}/active")
    public ResponseEntity<List<UserCertificate>> getUserActiveCertificates(@PathVariable("userId") Long userId) {
        try {
            List<UserCertificate> certificates = certificateService.getUserActiveCertificates(userId);
            return ResponseEntity.ok(certificates);
        } catch (Exception e) {
            log.error("Error fetching active certificates for user {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Award certificate to user (called when course is completed)
     */
    @PostMapping("/award")
    public ResponseEntity<UserCertificate> awardCertificate(
            @RequestParam("userId") Long userId,
            @RequestParam("courseId") Long courseId,
            @RequestParam("finalScore") Integer finalScore,
            @RequestParam("completionPercentage") Integer completionPercentage) {
        try {
            UserCertificate userCertificate = certificateService.awardCertificateToUser(
                    userId, courseId, finalScore, completionPercentage);
            return ResponseEntity.ok(userCertificate);
        } catch (Exception e) {
            log.error("Error awarding certificate", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get certificate by certificate number
     */
    @GetMapping("/number/{certificateNumber}")
    public ResponseEntity<UserCertificate> getCertificateByCertificateNumber(@PathVariable("certificateNumber") String certificateNumber) {
        try {
            Optional<UserCertificate> certificate = certificateService.getCertificateByCertificateNumber(certificateNumber);
            return certificate.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching certificate with number {}", certificateNumber, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Download certificate as HTML
     */
    @GetMapping("/{userCertificateId}/download")
    public ResponseEntity<String> downloadCertificate(@PathVariable("userCertificateId") Long userCertificateId) {
        try {
            // Get user certificate by ID
            Optional<UserCertificate> userCertificateOpt = certificateService.getUserCertificateById(userCertificateId);
            
            if (userCertificateOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            UserCertificate userCertificate = userCertificateOpt.get();
            
            // Always regenerate HTML to apply latest template & formatting
            String htmlContent = certificateService.generateCertificateHtml(userCertificate);
            
            // Update download count
            certificateService.updateDownloadCount(userCertificateId);
            
            // Return HTML content
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_HTML);
            headers.setContentDispositionFormData("attachment", 
                    "certificate_" + userCertificate.getCertificateNumber() + ".html");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(htmlContent);
        } catch (Exception e) {
            log.error("Error downloading certificate {}", userCertificateId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Check if user is eligible for certificate
     */
    @GetMapping("/eligible")
    public ResponseEntity<Boolean> checkEligibility(
            @RequestParam("userId") Long userId,
            @RequestParam("courseId") Long courseId,
            @RequestParam("userScore") Integer userScore) {
        try {
            boolean eligible = certificateService.isUserEligibleForCertificate(userId, courseId, userScore);
            return ResponseEntity.ok(eligible);
        } catch (Exception e) {
            log.error("Error checking certificate eligibility", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update expired certificates (admin endpoint)
     */
    @PostMapping("/update-expired")
    public ResponseEntity<String> updateExpiredCertificates() {
        try {
            certificateService.updateExpiredCertificates();
            return ResponseEntity.ok("Expired certificates updated successfully");
        } catch (Exception e) {
            log.error("Error updating expired certificates", e);
            return ResponseEntity.badRequest().build();
        }
    }
}