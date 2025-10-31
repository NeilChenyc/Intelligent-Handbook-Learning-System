package com.quiz.service;

import com.quiz.entity.User;
import com.quiz.entity.UserCertificate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateTemplateService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM dd, yyyy", Locale.ENGLISH);

    /**
     * Generate HTML certificate content from template
     */
    public String generateCertificateHtml(UserCertificate userCertificate, User user) {
        try {
            // Load template from resources
            String templateContent = loadTemplate(userCertificate.getCertificate().getTemplateName());
            
            // Replace placeholders with actual data
            String htmlContent = replacePlaceholders(templateContent, userCertificate, user);
            
            log.info("Generated certificate HTML for user {} and certificate {}", 
                    user.getId(), userCertificate.getCertificateNumber());
            
            return htmlContent;
        } catch (Exception e) {
            log.error("Error generating certificate HTML", e);
            throw new RuntimeException("Failed to generate certificate HTML", e);
        }
    }

    /**
     * Load HTML template from resources
     */
    private String loadTemplate(String templateName) throws IOException {
        String templatePath = "templates/" + (templateName != null ? templateName : "default_certificate_template.html");
        
        try {
            ClassPathResource resource = new ClassPathResource(templatePath);
            byte[] bytes = resource.getInputStream().readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.warn("Template {} not found, using default template", templateName);
            // Fallback to default template
            ClassPathResource defaultResource = new ClassPathResource("templates/default_certificate_template.html");
            byte[] bytes = defaultResource.getInputStream().readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        }
    }

    /**
     * Replace template placeholders with actual data
     */
    private String replacePlaceholders(String template, UserCertificate userCertificate, User user) {
        String result = template;
        
        // User information
        result = result.replace("{{USER_FULL_NAME}}", user.getFullName() != null ? user.getFullName() : user.getUsername());
        result = result.replace("{{USER_NAME}}", user.getUsername());
        result = result.replace("{{USER_EMAIL}}", user.getEmail() != null ? user.getEmail() : "");
        
        // Certificate information
        result = result.replace("{{CERTIFICATE_NAME}}", userCertificate.getCertificate().getCertificateName());
        result = result.replace("{{CERTIFICATE_NUMBER}}", userCertificate.getCertificateNumber());
        result = result.replace("{{ISSUER}}", userCertificate.getCertificate().getIssuer());
        result = result.replace("{{DESCRIPTION}}", 
                userCertificate.getCertificate().getDescription() != null ? 
                userCertificate.getCertificate().getDescription() : "");
        result = result.replace("{{CERTIFICATE_LEVEL}}", 
                userCertificate.getCertificate().getCertificateLevel() != null ? 
                userCertificate.getCertificate().getCertificateLevel() : "Intermediate");
        
        // Course information
        result = result.replace("{{COURSE_TITLE}}", userCertificate.getCertificate().getCourse().getTitle());
        result = result.replace("{{DEPARTMENT}}", 
                userCertificate.getCertificate().getCourse().getDepartment() != null ? 
                userCertificate.getCertificate().getCourse().getDepartment() : "General");
        
        // Score and completion information
        result = result.replace("{{FINAL_SCORE}}", userCertificate.getFinalScore().toString());
        result = result.replace("{{COMPLETION_PERCENTAGE}}", userCertificate.getCompletionPercentage().toString());
        
        // Dates
        result = result.replace("{{EARNED_DATE}}", userCertificate.getEarnedDate().format(DATE_FORMATTER));
        String validityText;
        if (userCertificate.getExpiryDate() != null) {
            String expiry = userCertificate.getExpiryDate().format(DATE_FORMATTER);
            result = result.replace("{{EXPIRY_DATE}}", expiry);
            validityText = " | Valid Until: " + expiry;
        } else {
            validityText = " | Valid Permanently";
        }
        result = result.replace("{{VALIDITY_TEXT}}", validityText);
        
        // Skills handling (current certificate entity doesn't include skills field, skip this section rendering)
        String skills = null;
        if (skills != null && !skills.trim().isEmpty()) {
            // Handle skills as comma-separated values
            String[] skillsArray = skills.split(",");
            StringBuilder skillsHtml = new StringBuilder();
            
            for (String skill : skillsArray) {
                skillsHtml.append("<span class=\"skill-tag\">")
                         .append(skill.trim())
                         .append("</span>");
            }
            
            // Replace skills section
            result = result.replace("{{#if SKILLS}}", "");
            result = result.replace("{{/if}}", "");
            result = result.replace("{{#each SKILLS_ARRAY}}", "");
            result = result.replace("{{this}}", "");
            result = result.replace("{{/each}}", skillsHtml.toString());
        } else {
            // Remove skills section if no skills
            result = removeConditionalSection(result, "{{#if SKILLS}}", "{{/if}}");
        }
        
        return result;
    }

    /**
     * Remove conditional sections from template
     */
    private String removeConditionalSection(String content, String startTag, String endTag) {
        int startIndex = content.indexOf(startTag);
        int endIndex = content.indexOf(endTag);
        
        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            return content.substring(0, startIndex) + content.substring(endIndex + endTag.length());
        }
        
        return content;
    }

    /**
     * Generate simple certificate HTML without template (fallback)
     */
    public String generateSimpleCertificateHtml(UserCertificate userCertificate, User user) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Certificate of Completion</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                    .certificate { border: 3px solid #333; padding: 40px; max-width: 600px; margin: 0 auto; }
                    .title { font-size: 36px; margin-bottom: 20px; }
                    .recipient { font-size: 24px; font-weight: bold; margin: 20px 0; }
                    .course { font-size: 20px; font-style: italic; margin: 20px 0; }
                    .details { margin: 20px 0; }
                    .footer { margin-top: 40px; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <h1 class="title">Certificate of Completion</h1>
                    <p>This is to certify that</p>
                    <div class="recipient">%s</div>
                    <p>has successfully completed the course</p>
                    <div class="course">%s</div>
                    <div class="details">
                        <p>Final Score: %d%% | Completion: %d%%</p>
                        <p>Issued by: %s</p>
                        <p>Date: %s</p>
                    </div>
                    <div class="footer">
                        <p>Certificate Number: %s</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            user.getFullName() != null ? user.getFullName() : user.getUsername(),
            userCertificate.getCertificate().getCertificateName(),
            userCertificate.getFinalScore(),
            userCertificate.getCompletionPercentage(),
            userCertificate.getCertificate().getIssuer(),
            userCertificate.getEarnedDate().format(DATE_FORMATTER),
            userCertificate.getCertificateNumber()
        );
    }
}