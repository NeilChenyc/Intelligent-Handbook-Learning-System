package com.quiz.service;

import com.quiz.dto.SubmitAnswerRequest;
import com.quiz.dto.QuizSubmissionResult;
import com.quiz.entity.*;
import com.quiz.repository.*;
import com.quiz.util.AnswerValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
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

        // 移除最大尝试次数检查，允许无限次尝试
        // Long attemptCount = quizAttemptRepository.countByUserIdAndQuizId(userId, quizId);
        // if (quiz.getMaxAttempts() != null && attemptCount >= quiz.getMaxAttempts()) {
        //     throw new RuntimeException("Maximum attempts reached for this quiz");
        // }

        // 获取下一个尝试编号
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

        // 实时评分，不保存StudentAnswer
        int totalScore = 0;
        int maxPossibleScore = 0;
        List<QuizSubmissionResult.QuestionResult> questionResults = new ArrayList<>();
        List<QuizSubmissionResult.WrongQuestionInfo> wrongQuestions = new ArrayList<>();
        
        for (SubmitAnswerRequest answerRequest : answerRequests) {
            Question question = questionRepository.findById(answerRequest.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found: " + answerRequest.getQuestionId()));
            
            // 获取题目的所有选项（按顺序）
            List<QuestionOption> questionOptions = questionOptionRepository.findByQuestionIdOrderByOrderIndexAsc(question.getId());
            
            // 根据选项标识符找到对应的QuestionOption实体
            List<QuestionOption> selectedOptions = new ArrayList<>();
            List<String> selectedOptionIdentifiers = new ArrayList<>();
            for (String optionIdentifier : answerRequest.getSelectedOptions()) {
                // 将选项标识符（如"a", "b"）转换为索引
                int optionIndex = optionIdentifier.toLowerCase().charAt(0) - 'a';
                
                if (optionIndex >= 0 && optionIndex < questionOptions.size()) {
                    selectedOptions.add(questionOptions.get(optionIndex));
                    selectedOptionIdentifiers.add(optionIdentifier.toLowerCase());
                }
            }
            
            // 获取正确答案
            List<QuestionOption> correctOptions = questionOptions.stream()
                    .filter(QuestionOption::getIsCorrect)
                    .toList();
            
            List<String> correctOptionIdentifiers = new ArrayList<>();
            for (int i = 0; i < questionOptions.size(); i++) {
                if (questionOptions.get(i).getIsCorrect()) {
                    correctOptionIdentifiers.add(String.valueOf((char)('a' + i)));
                }
            }
            
            // 评分逻辑
             boolean isCorrect = AnswerValidationUtil.isAnswerCorrect(selectedOptions, correctOptions, question.getType());
             int pointsEarned = isCorrect ? question.getPoints() : 0;
            
            totalScore += pointsEarned;
            maxPossibleScore += question.getPoints();
            
            // 创建题目结果
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
            
            // 如果答错，记录到错题表和错题列表
            if (!isCorrect) {
                // 创建错题记录到数据库
                wrongQuestionService.createWrongQuestion(attempt.getUser().getId(), question.getId(), attempt.getId());
                
                // 添加到返回的错题列表
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
        
        // 更新QuizAttempt的分数信息
         attempt.setScore(totalScore);
         attempt.setCompletedAt(LocalDateTime.now());
         attempt.setIsPassed(totalScore >= attempt.getQuiz().getPassingScore());
         quizAttemptRepository.save(attempt);
         
         // 返回提交结果
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

     /**
      * 判断答案是否正确
      * @param selectedOptions 用户选择的选项
      * @param correctOptions 正确的选项
      * @param questionType 题目类型
      * @return 是否正确
      */
     // 移除原有的isAnswerCorrect方法，现在使用AnswerValidationUtil

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
            return true; // 无限制
        }

        Long attemptCount = quizAttemptRepository.countByUserIdAndQuizId(userId, quizId);
        return attemptCount < quiz.getMaxAttempts();
    }

    public boolean hasUserPassedQuiz(Long userId, Long quizId) {
        List<QuizAttempt> passedAttempts = quizAttemptRepository.findPassedAttemptsByUserIdAndQuizId(userId, quizId);
        return !passedAttempts.isEmpty();
    }

    /**
     * 获取用户在某课程中已通过的小测ID列表
     */
    public List<Long> getUserPassedQuizzesInCourse(Long userId, Long courseId) {
        return quizAttemptRepository.findPassedQuizIdsByUserIdAndCourseId(userId, courseId);
    }

    private void evaluateAnswer(StudentAnswer answer) {
        Question question = answer.getQuestion();
        List<QuestionOption> correctOptions = questionOptionRepository.findCorrectOptionsByQuestionId(question.getId());
        
        // 获取学生选择的选项ID
        List<Long> selectedOptionIds = answer.getSelectedOptions().stream()
                .map(QuestionOption::getId)
                .toList();
        
        List<Long> correctOptionIds = correctOptions.stream()
                .map(QuestionOption::getId)
                .toList();

        // 判断答案是否正确
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
            
            // 判断是否通过
            if (quiz.getPassingScore() != null) {
                attempt.setIsPassed(percentage >= quiz.getPassingScore());
            } else {
                attempt.setIsPassed(percentage >= 60.0); // 默认60%通过
            }
        } else {
            attempt.setPercentage(0.0);
            attempt.setIsPassed(false);
        }
    }
}