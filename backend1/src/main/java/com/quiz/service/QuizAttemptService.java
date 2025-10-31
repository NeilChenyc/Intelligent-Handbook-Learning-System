package com.quiz.service;

import com.quiz.dto.SubmitAnswerRequest;
import com.quiz.dto.QuizSubmissionResult;
import com.quiz.entity.*;
import com.quiz.repository.*;
import com.quiz.service.CertificateService;
import com.quiz.util.AnswerValidationUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class QuizAttemptService {

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private StudentAnswerRepository studentAnswerRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionOptionRepository questionOptionRepository;

    @Autowired
    private WrongQuestionService wrongQuestionService;

    @Autowired
    private CertificateService certificateService;

    public List<QuizAttempt> getAttemptsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return quizAttemptRepository.findByUser(user);
    }

    public List<QuizAttempt> getAttemptsByQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        return quizAttemptRepository.findByQuiz(quiz);
    }

    public List<QuizAttempt> getAttemptsByUserAndQuiz(Long userId, Long quizId) {
        return quizAttemptRepository.findByUserIdAndQuizIdOrderByAttemptNumberDesc(userId, quizId);
    }

    public Optional<QuizAttempt> getAttemptById(Long id) {
        return quizAttemptRepository.findById(id);
    }

    public QuizAttempt startQuizAttempt(Long userId, Long quizId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        // TODO: Translate - Remove maximum attempt limit check, allow unlimited attempts
        // Long attemptCount = quizAttemptRepository.countByUserIdAndQuizId(userId, quizId);
        // if (quiz.getMaxAttempts() != null && attemptCount >= quiz.getMaxAttempts()) {
        //     throw new RuntimeException("Maximum attempts reached for this quiz");
        // }

        // Get next attempt number
        Integer maxAttemptNumber = quizAttemptRepository.getMaxAttemptNumberByUserIdAndQuizId(userId, quizId);
        int nextAttemptNumber = (maxAttemptNumber != null ? maxAttemptNumber : 0) + 1;

        QuizAttempt attempt = new QuizAttempt();
        attempt.setUser(user);
        attempt.setQuiz(quiz);
        attempt.setAttemptNumber(nextAttemptNumber);
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setCreatedAt(LocalDateTime.now());
        attempt.setUpdatedAt(LocalDateTime.now());

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        return savedAttempt;
    }

    @Transactional
    public QuizSubmissionResult submitQuizAttempt(Long attemptId, List<SubmitAnswerRequest> answerRequests) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Quiz attempt not found"));

        // Real-time scoring, don't save StudentAnswer
        int totalScore = 0;
        int maxPossibleScore = 0;
        List<QuizSubmissionResult.QuestionResult> questionResults = new ArrayList<>();
        List<QuizSubmissionResult.WrongQuestionInfo> wrongQuestions = new ArrayList<>();
        
        for (SubmitAnswerRequest answerRequest : answerRequests) {
            Question question = questionRepository.findById(answerRequest.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found: " + answerRequest.getQuestionId()));
            
            // Get all options for the question (in order)
            List<QuestionOption> questionOptions = questionOptionRepository.findByQuestionIdOrderByOrderIndexAsc(question.getId());
            
            // Find corresponding QuestionOption entity based on option identifier
            List<QuestionOption> selectedOptions = new ArrayList<>();
            List<String> selectedOptionIdentifiers = new ArrayList<>();
            for (String optionIdentifier : answerRequest.getSelectedOptions()) {
                // Convert option identifiers (like "a", "b") to indices
                int optionIndex = optionIdentifier.toLowerCase().charAt(0) - 'a';
                
                if (optionIndex >= 0 && optionIndex < questionOptions.size()) {
                    selectedOptions.add(questionOptions.get(optionIndex));
                    selectedOptionIdentifiers.add(optionIdentifier.toLowerCase());
                }
            }
            
            // Get correct answer
            List<QuestionOption> correctOptions = questionOptions.stream()
                    .filter(QuestionOption::getIsCorrect)
                    .toList();
            
            List<String> correctOptionIdentifiers = new ArrayList<>();
            for (int i = 0; i < questionOptions.size(); i++) {
                if (questionOptions.get(i).getIsCorrect()) {
                    correctOptionIdentifiers.add(String.valueOf((char)('a' + i)));
                }
            }
            
            // Scoring logic
             boolean isCorrect = AnswerValidationUtil.isAnswerCorrect(selectedOptions, correctOptions, question.getType());
             int pointsEarned = isCorrect ? question.getPoints() : 0;
            
            totalScore += pointsEarned;
            maxPossibleScore += question.getPoints();
            
            // Create question result
            QuizSubmissionResult.QuestionResult questionResult = new QuizSubmissionResult.QuestionResult(
                question.getId(),
                question.getQuestionText(),
                isCorrect,
                pointsEarned,
                question.getPoints(),
                selectedOptionIdentifiers,
                correctOptionIdentifiers,
                question.getExplanation()
            );
            questionResults.add(questionResult);
            
            // If answered incorrectly, record to wrong question table and list
            if (!isCorrect) {
                // Create wrong question record to database
                wrongQuestionService.createWrongQuestion(attempt.getUser().getId(), question.getId(), attempt.getId());
                
                // Add to returned wrong question list
                QuizSubmissionResult.WrongQuestionInfo wrongQuestionInfo = new QuizSubmissionResult.WrongQuestionInfo(
                    question.getId(),
                    question.getQuestionText(),
                    selectedOptionIdentifiers,
                    correctOptionIdentifiers,
                    question.getExplanation(),
                    question.getPoints()
                );
                wrongQuestions.add(wrongQuestionInfo);
            }
        }
        
        // Update QuizAttempt score info and persist pass status
        attempt.setScore(totalScore);
        attempt.setCompletedAt(LocalDateTime.now());
        // Pass rule: total score/full score >= 80%
        boolean isPassed = maxPossibleScore > 0 && ((double) totalScore / (double) maxPossibleScore) >= 0.8;
        attempt.setIsPassed(isPassed);
        quizAttemptRepository.save(attempt);

        // If this submission causes user to pass all quizzes under the course, automatically issue certificate
        try {
            Long userId = attempt.getUser().getId();
            Long courseId = attempt.getQuiz().getCourse().getId();

            // Total number of active quizzes under course
            Long totalActiveQuizzes = quizRepository.countActiveByCourseId(courseId);
            // Number of quizzes user has passed under this course (deduplicated)
            List<Long> passedQuizIds = quizAttemptRepository.findPassedQuizIdsByUserIdAndCourseId(userId, courseId);
            int passedCount = passedQuizIds != null ? passedQuizIds.size() : 0;

            int completionPercentage = (totalActiveQuizzes != null && totalActiveQuizzes > 0)
                    ? (int) Math.round((double) passedCount * 100.0 / (double) totalActiveQuizzes)
                    : 0;

            // Automatically issue certificate when all active quizzes are passed
            if (totalActiveQuizzes != null && totalActiveQuizzes > 0 && passedCount >= totalActiveQuizzes) {
                // Here treat final score as course completion score (100) to meet certificate pass threshold
                int finalScoreForCertificate = 100;
                try {
                    log.info("Auto-award certificate: userId={}, courseId={}, completion={}%, totalQuizzes={}, passedCount={}",
                            userId, courseId, completionPercentage, totalActiveQuizzes, passedCount);
                    certificateService.awardCertificateToUser(userId, courseId, finalScoreForCertificate, completionPercentage);
                } catch (Exception awardEx) {
                    // Possible cases: certificate already exists or threshold not met, log here but don't affect submission result return
                    log.warn("Auto-award certificate failed: {}", awardEx.getMessage());
                }
            }
        } catch (Exception ex) {
            log.warn("Post-submit auto-award check failed: {}", ex.getMessage());
        }
        
        // Return submission result
        return new QuizSubmissionResult(
            attempt.getId(),
            totalScore,
            maxPossibleScore,
            attempt.getIsPassed(),
            attempt.getQuiz().getPassingScore(),
            attempt.getCompletedAt(),
            questionResults,
            wrongQuestions
        );
    }

     /* * * 判断Answer是否正确
      * @param selectedOptions UserSelect的Option
      * @param correctOptions 正确的Option
      * @param questionType QuestionClass型
      * @return 是否正确 */
     // Remove original isAnswerCorrect method, now use AnswerValidationUtil

     public List<StudentAnswer> getAnswersByAttempt(Long attemptId) {
        return studentAnswerRepository.findByQuizAttemptId(attemptId);
    }

    public Optional<StudentAnswer> getAnswerByAttemptAndQuestion(Long attemptId, Long questionId) {
        return studentAnswerRepository.findByAttemptIdAndQuestionId(attemptId, questionId);
    }

    public List<QuizAttempt> getPassedAttempts(Long userId, Long quizId) {
        return quizAttemptRepository.findPassedAttemptsByUserIdAndQuizId(userId, quizId);
    }

    public List<QuizAttempt> getAttemptsByCourse(Long courseId) {
        return quizAttemptRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }

    public boolean canUserAttemptQuiz(Long userId, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        if (quiz.getMaxAttempts() == null) {
            return true; // No limit
        }

        Long attemptCount = quizAttemptRepository.countByUserIdAndQuizId(userId, quizId);
        return attemptCount < quiz.getMaxAttempts();
    }

    public boolean hasUserPassedQuiz(Long userId, Long quizId) {
        List<QuizAttempt> passedAttempts = quizAttemptRepository.findPassedAttemptsByUserIdAndQuizId(userId, quizId);
        return !passedAttempts.isEmpty();
    }

    /* * * GetUser在某Course中已通过的QuizIDList */
    public List<Long> getUserPassedQuizzesInCourse(Long userId, Long courseId) {
        return quizAttemptRepository.findPassedQuizIdsByUserIdAndCourseId(userId, courseId);
    }

    private void evaluateAnswer(StudentAnswer answer) {
        Question question = answer.getQuestion();
        List<QuestionOption> correctOptions = questionOptionRepository.findCorrectOptionsByQuestionId(question.getId());
        
        // Get student selected option IDs
        List<Long> selectedOptionIds = answer.getSelectedOptions().stream()
                .map(QuestionOption::getId)
                .toList();
        
        List<Long> correctOptionIds = correctOptions.stream()
                .map(QuestionOption::getId)
                .toList();

        // Judge if answer is correct
        boolean isCorrect = selectedOptionIds.size() == correctOptionIds.size() && 
                           selectedOptionIds.containsAll(correctOptionIds);
        
        answer.setIsCorrect(isCorrect);
        answer.setPointsEarned(isCorrect ? question.getPoints() : 0);
    }

    private void calculateAttemptScore(QuizAttempt attempt) {
        List<StudentAnswer> answers = studentAnswerRepository.findByQuizAttemptId(attempt.getId());
        
        int totalScore = answers.stream()
                .mapToInt(answer -> answer.getPointsEarned() != null ? answer.getPointsEarned() : 0)
                .sum();
        
        Quiz quiz = attempt.getQuiz();
        int totalPoints = quiz.getTotalPoints() != null ? quiz.getTotalPoints() : 0;
        
        attempt.setScore(totalScore);
        attempt.setTotalPoints(totalPoints);
        
        if (totalPoints > 0) {
            double percentage = (double) totalScore / totalPoints * 100;
            attempt.setPercentage(percentage);
            
            // Judge if passed
            if (quiz.getPassingScore() != null) {
                attempt.setIsPassed(percentage >= quiz.getPassingScore());
            } else {
                attempt.setIsPassed(percentage >= 60.0); // Default 60% pass
            }
        } else {
            attempt.setPercentage(0.0);
            attempt.setIsPassed(false);
        }
    }
}