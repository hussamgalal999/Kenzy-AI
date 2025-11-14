import React, { useState, useEffect } from 'react';
import { Book, QuizQuestion } from '../types';
import { useI18n } from '../i18n';
import ViewWrapper from './ViewWrapper';

interface TakeQuizProps {
  book: Book;
  onQuizComplete: (bookId: string, score: number) => void;
  onBack: () => void;
  triggerReward: (type: 'quiz_complete', data: { score: number; total: number }) => void;
}

const TakeQuiz: React.FC<TakeQuizProps> = ({ book, onQuizComplete, onBack, triggerReward }) => {
  const { t } = useI18n();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  if (!book.quiz || book.quiz.questions.length === 0) {
    return (
      <ViewWrapper title="Quiz" onBack={onBack}>
        <p>This book does not have a quiz available.</p>
      </ViewWrapper>
    );
  }

  const questions = book.quiz.questions;
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (isFinished) {
        triggerReward('quiz_complete', { score, total: questions.length });
    }
  }, [isFinished]);

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer) return; // Prevent changing answer

    setSelectedAnswer(option);
    if (option === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const getButtonClass = (option: string) => {
    if (!selectedAnswer) {
      return 'bg-white dark:bg-brand-blue/20 hover:bg-light-gray dark:hover:bg-brand-blue/30 border-transparent';
    }
    if (option === currentQuestion.correctAnswer) {
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500';
    }
    if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
      return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500';
    }
    return 'bg-white dark:bg-brand-blue/20 opacity-60 border-transparent';
  };

  if (isFinished) {
    const scorePercentage = Math.round((score / questions.length) * 100);
    let feedbackTextKey = '';
    if (scorePercentage === 100) feedbackTextKey = 'quizFeedbackPerfect';
    else if (scorePercentage >= 75) feedbackTextKey = 'quizFeedbackExcellent';
    else if (scorePercentage >= 50) feedbackTextKey = 'quizFeedbackGood';
    else feedbackTextKey = 'quizFeedbackTryAgain';
    
    return (
      <ViewWrapper title={t('quizResult')} onBack={onBack}>
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <div className="w-28 h-28 bg-brand-yellow/20 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-6xl text-brand-yellow">military_tech</span>
          </div>
          <h2 className="text-3xl font-extrabold text-brand-blue dark:text-white">{t('greatJob')}</h2>
          <p className="text-lg text-brand-purple dark:text-white/70 mt-2 mb-6">{t(feedbackTextKey)}</p>

          <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-200 dark:text-brand-blue/30" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-primary" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray={`${scorePercentage}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute flex flex-col">
                  <span className="text-4xl font-bold text-brand-blue dark:text-white">{score} / {questions.length}</span>
                  <span className="text-sm text-brand-purple dark:text-white/70">{t('correct')}</span>
              </div>
          </div>
          
          <button 
            onClick={() => onQuizComplete(book.id, score)}
            className="w-full max-w-sm bg-primary text-white font-bold py-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            {t('finish')}
          </button>
        </div>
      </ViewWrapper>
    );
  }

  const progressPercentage = (currentQuestionIndex / questions.length) * 100;

  return (
    <ViewWrapper title={t('comprehensionQuiz')} onBack={onBack}>
      <div className="flex flex-col h-full p-2 sm:p-4">
        <div className="flex-shrink-0 mb-4">
            <div className="w-full bg-light-gray dark:bg-brand-blue/30 rounded-full h-2.5 mb-2">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <p className="text-sm text-center text-brand-purple dark:text-white/70">{t('quizProgress', { current: currentQuestionIndex + 1, total: questions.length })}</p>
            <h2 className="text-2xl font-bold text-brand-blue dark:text-white mt-4 text-center">{currentQuestion.question}</h2>
        </div>
        
        <div className="flex-grow space-y-4 py-4">
            {currentQuestion.options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={!!selectedAnswer}
                    className={`w-full text-start p-4 rounded-lg border-2 transition-all duration-300 font-semibold text-lg flex justify-between items-center ${getButtonClass(option)}`}
                >
                    <span>{option}</span>
                    {selectedAnswer && option === currentQuestion.correctAnswer && <span className="material-symbols-outlined text-green-600">check_circle</span>}
                    {selectedAnswer && option === selectedAnswer && option !== currentQuestion.correctAnswer && <span className="material-symbols-outlined text-red-600">cancel</span>}
                </button>
            ))}
        </div>

        {selectedAnswer && (
            <div className="flex-shrink-0 mt-4 animate-fade-in">
                <button 
                    onClick={handleNext}
                    className="w-full bg-primary text-white font-bold py-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
                >
                    {currentQuestionIndex < questions.length - 1 ? t('nextQuestion') : t('quizResult')}
                </button>
            </div>
        )}
      </div>
    </ViewWrapper>
  );
};

export default TakeQuiz;