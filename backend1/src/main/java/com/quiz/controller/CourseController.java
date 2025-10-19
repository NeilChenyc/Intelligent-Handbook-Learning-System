package com.quiz.controller;

import com.quiz.dto.CourseCreateRequest;
import com.quiz.entity.Course;
import com.quiz.service.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        List<Course> courses = courseService.getAllActiveCourses();
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        return courseService.getCourseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Course>> getCoursesByTeacher(@PathVariable Long teacherId) {
        try {
            List<Course> courses = courseService.getCoursesByTeacher(teacherId);
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            log.error("Error getting courses by teacher", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody CourseCreateRequest request) {
        try {
            Course course = courseService.createCourse(request);
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            log.error("Error creating course", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<Course> createCourseWithPdf(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("teacherId") Long teacherId,
            @RequestParam("handbookFile") MultipartFile handbookFile) {
        try {
            CourseCreateRequest request = new CourseCreateRequest();
            request.setTitle(title);
            request.setDescription(description);
            request.setTeacherId(teacherId);
            
            Course course = courseService.createCourseWithPdf(request, handbookFile);
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            log.error("Error creating course with PDF", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody CourseCreateRequest request) {
        try {
            Course course = courseService.updateCourse(id, request);
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            log.error("Error updating course", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting course", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Course>> searchCourses(@RequestParam String title) {
        List<Course> courses = courseService.searchCourses(title);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}/handbook")
    public ResponseEntity<byte[]> downloadCourseHandbook(@PathVariable Long id) {
        try {
            log.info("Attempting to download handbook for course id: {}", id);
            
            Course course = courseService.getCourseById(id)
                    .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
            
            log.info("Found course: {}, handbook file name: {}", course.getTitle(), course.getHandbookFileName());
            
            if (course.getHandbookFilePath() == null || course.getHandbookFilePath().length == 0) {
                log.warn("No handbook file found for course id: {}", id);
                return ResponseEntity.notFound().build();
            }

            log.info("Handbook file size: {} bytes", course.getHandbookFilePath().length);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentLength(course.getHandbookFilePath().length);
            headers.add(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=\"" + (course.getHandbookFileName() != null ? course.getHandbookFileName() : "handbook.pdf") + "\"");
            
            log.info("Successfully returning handbook file for course id: {} with {} bytes", id, course.getHandbookFilePath().length);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(course.getHandbookFilePath());
        } catch (Exception e) {
            log.error("Error downloading course handbook for id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}