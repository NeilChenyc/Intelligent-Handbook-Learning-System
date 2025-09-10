import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, XCircle, FileText, Shield } from 'lucide-react';

const QuizPage = () => {
  // 模拟公司制度考核数据
  const [questions] = useState([
    {
      id: 1,
      question: '根据《员工行为准则》，员工在工作时间内不得从事以下哪项活动？',
      type: 'single',
      options: [
        { id: 'a', text: '与同事讨论工作相关问题' },
        { id: 'b', text: '处理个人私事或进行与工作无关的活动' },
        { id: 'c', text: '参加公司组织的培训' },
        { id: 'd', text: '向上级汇报工作进展' }
      ],
      correctAnswer: 'b',
      explanation: '根据员工行为准则，工作时间应专注于工作任务，不得处理个人私事或从事与工作无关的活动。'
    },
    {
      id: 2,
      question: '《考勤管理制度》规定，以下哪些情况需要提前申请？（多选）',
      type: 'multiple',
      options: [
        { id: 'a', text: '病假超过3天' },
        { id: 'b', text: '事假' },
        { id: 'c', text: '年假' },
        { id: 'd', text: '加班' }
      ],
      correctAnswer: ['b', 'c'],
      explanation: '根据考勤管理制度，事假和年假需要提前申请，病假可事后补办手续，加班需要部门主管批准。'
    },
    {
      id: 3,
      question: '实验室安全操作规程要求，进入实验室必须佩戴什么防护用品？',
      type: 'single',
      options: [
        { id: 'a', text: '只需要佩戴手套' },
        { id: 'b', text: '只需要穿实验服' },
        { id: 'c', text: '必须佩戴护目镜、手套并穿实验服' },
        { id: 'd', text: '根据个人喜好选择' }
      ],
      correctAnswer: 'c',
      explanation: '实验室安全操作规程明确要求进入实验室必须佩戴完整的防护用品：护目镜、手套和实验服。'
    },
    {
      id: 4,
      question: '根据《信息安全管理制度》，员工离职时应如何处理公司信息？',
      type: 'single',
      options: [
        { id: 'a', text: '可以保留部分工作资料作纪念' },
        { id: 'b', text: '必须删除或归还所有公司信息和资料' },
        { id: 'c', text: '只需要删除机密信息' },
        { id: 'd', text: '可以继续使用公司邮箱' }
      ],
      correctAnswer: 'b',
      explanation: '信息安全管理制度要求员工离职时必须删除或归还所有公司信息和资料，不得保留任何公司数据。'
    },
    {
      id: 5,
      question: '《质量管理体系》中，以下哪些是质量控制的关键环节？（多选）',
      type: 'multiple',
      options: [
        { id: 'a', text: '原材料检验' },
        { id: 'b', text: '生产过程监控' },
        { id: 'c', text: '成品检测' },
        { id: 'd', text: '客户满意度调查' }
      ],
      correctAnswer: ['a', 'b', 'c', 'd'],
      explanation: '质量管理体系涵盖从原材料到客户反馈的全过程，所有选项都是质量控制的关键环节。'
    }
  ]);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerChange = (questionId, optionId, isMultiple = false) => {
    if (submitted) return;

    setAnswers(prev => {
      if (isMultiple) {
        const currentAnswers = prev[questionId] || [];
        const newAnswers = currentAnswers.includes(optionId)
          ? currentAnswers.filter(id => id !== optionId)
          : [...currentAnswers, optionId];
        return { ...prev, [questionId]: newAnswers };
      } else {
        return { ...prev, [questionId]: optionId };
      }
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const isCorrectAnswer = (question, userAnswer) => {
    if (question.type === 'multiple') {
      const correctSet = new Set(question.correctAnswer);
      const userSet = new Set(userAnswer || []);
      return correctSet.size === userSet.size && 
             [...correctSet].every(x => userSet.has(x));
    } else {
      return question.correctAnswer === userAnswer;
    }
  };

  const getScore = () => {
    let correct = 0;
    questions.forEach(question => {
      if (isCorrectAnswer(question, answers[question.id])) {
        correct++;
      }
    });
    return { correct, total: questions.length };
  };

  const score = submitted ? getScore() : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">员工手册合规考核</h2>
        </div>
        <p className="text-gray-600">请仔细阅读题目并选择正确答案，测试您对公司规章制度的掌握程度</p>
      </div>

      {submitted && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="font-medium">
                合规考核完成！得分：{score.correct}/{score.total} ({Math.round(score.correct / score.total * 100)}%)
                {score.correct / score.total >= 0.8 ? ' - 考核通过' : ' - 需要重新学习'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = answers[question.id];
          const isCorrect = submitted ? isCorrectAnswer(question, userAnswer) : null;

          return (
            <Card key={question.id} className={submitted ? (isCorrect ? 'border-green-200' : 'border-red-200') : ''}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    第 {index + 1} 题
                  </span>
                  {submitted && (
                    isCorrect ? 
                      <CheckCircle className="w-5 h-5 text-green-500" /> : 
                      <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </CardTitle>
                <p className="text-lg text-gray-800 mt-2">{question.question}</p>
                {question.type === 'multiple' && (
                  <p className="text-sm text-gray-500">（多选题）</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {question.options.map((option) => {
                    const isSelected = question.type === 'multiple' 
                      ? (userAnswer || []).includes(option.id)
                      : userAnswer === option.id;
                    
                    const isCorrectOption = question.type === 'multiple'
                      ? question.correctAnswer.includes(option.id)
                      : question.correctAnswer === option.id;

                    let optionClass = 'p-3 border rounded-lg cursor-pointer transition-colors ';
                    
                    if (submitted) {
                      if (isCorrectOption) {
                        optionClass += 'bg-green-100 border-green-300 text-green-800';
                      } else if (isSelected && !isCorrectOption) {
                        optionClass += 'bg-red-100 border-red-300 text-red-800';
                      } else {
                        optionClass += 'bg-gray-50 border-gray-200 text-gray-600';
                      }
                    } else {
                      optionClass += isSelected 
                        ? 'bg-blue-100 border-blue-300 text-blue-800' 
                        : 'bg-white border-gray-200 hover:bg-gray-50';
                    }

                    return (
                      <div
                        key={option.id}
                        className={optionClass}
                        onClick={() => handleAnswerChange(question.id, option.id, question.type === 'multiple')}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${question.type === 'multiple' ? 'rounded-sm' : 'rounded-full'} border-2 flex items-center justify-center`}>
                            {isSelected && (
                              <div className={`w-2 h-2 bg-current ${question.type === 'multiple' ? 'rounded-sm' : 'rounded-full'}`} />
                            )}
                          </div>
                          <span className="font-medium">{option.id.toUpperCase()}.</span>
                          <span>{option.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">解析：</h4>
                    <p className="text-yellow-700">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={handleSubmit}
            size="lg"
            className="px-8"
            disabled={Object.keys(answers).length === 0}
          >
            提交考核
          </Button>
        </div>
      )}

      {submitted && (
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
            variant="outline"
            size="lg"
            className="px-8"
          >
            重新考核
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuizPage;