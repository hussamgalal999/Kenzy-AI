import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { useI18n } from '../i18n';
import ViewWrapper from './ViewWrapper';

interface BookCompletionScreenProps {
  book: Book;
  onStartQuiz: (book: Book) => void;
  onBackToLibrary: () => void;
  updateBookState: (bookId: string, updates: Partial<Omit<Book, 'id'>>) => void;
  triggerReward: (type: 'book_read') => void;
}

const StarRating: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => {
  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onRate(star)}>
          <span
            className="material-symbols-outlined text-5xl transition-colors"
            style={{
              fontVariationSettings: "'FILL' 1, 'wght' 400",
              color: star <= rating ? '#FFD15C' : '#E0E0E0'
            }}
          >
            star
          </span>
        </button>
      ))}
    </div>
  );
};


/**
 * Renders the book completion screen with options to rate the book and start a quiz.
 *
 * This component displays the book's title, cover, and a congratulatory message upon completion.
 * It allows users to rate the book and view their last quiz attempt score if available.
 * Additionally, it provides buttons to retake the quiz or return to the library.
 * The reward is triggered only when the book's progress reaches 100%.
 *
 * @param {BookCompletionScreenProps} props - The properties for the BookCompletionScreen component.
 */
const BookCompletionScreen: React.FC<BookCompletionScreenProps> = ({ book, onStartQuiz, onBackToLibrary, updateBookState, triggerReward }) => {
  const { t } = useI18n();
  const [rating, setRating] = useState(book.rating || 0);

  useEffect(() => {
    // Only trigger the reward if the book progress is 100%. This prevents re-triggering on re-visit.
    if (book.progress === 100) {
      triggerReward('book_read');
    }
  }, [book.id]);

  /**
   * Updates the rating of a book.
   */
  const handleRate = (newRating: number) => {
    setRating(newRating);
    updateBookState(book.id, { rating: newRating });
  };
  
  const lastAttempt = book.quizAttempts && book.quizAttempts.length > 0 ? book.quizAttempts[book.quizAttempts.length - 1] : null;


  return (
    <ViewWrapper title={book.title} onBack={onBackToLibrary}>
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="w-28 h-28 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-6xl text-primary">emoji_events</span>
        </div>
        <h2 className="text-3xl font-extrabold text-brand-blue dark:text-white">{t('bookFinished')}</h2>
        <p className="text-xl text-brand-purple dark:text-white/70 mb-8">{t('greatJob')}</p>

        <div className="w-52 aspect-[3/4] rounded-lg overflow-hidden shadow-2xl mb-8">
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        </div>
        
        <div className="w-full max-w-sm space-y-6">
            <div>
                <h3 className="text-lg font-bold mb-3">{t('rateTheStory')}</h3>
                <StarRating rating={rating} onRate={handleRate} />
            </div>
            
            <div className="space-y-3">
              {book.quiz && (
                <div>
                  {lastAttempt && (
                      <div className="mb-4 text-center p-3 bg-light-gray dark:bg-brand-blue/20 rounded-lg">
                          <p className="text-sm font-bold text-brand-purple dark:text-white/80">{t('yourScore')}</p>
                          <p className="text-3xl font-bold text-primary">{lastAttempt.score} / {book.quiz.questions.length}</p>
                      </div>
                  )}
                  <button 
                    onClick={() => onStartQuiz(book)} 
                    className="w-full bg-primary text-white font-bold py-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
                  >
                    {lastAttempt ? t('retakeQuiz') : t('takeAQuiz')}
                  </button>
                </div>
              )}
              <button 
                onClick={onBackToLibrary}
                className="w-full bg-light-gray dark:bg-brand-blue/30 text-brand-purple dark:text-white/80 font-bold py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-brand-blue/40"
              >
                {t('backToLibrary')}
              </button>
            </div>
        </div>
      </div>
    </ViewWrapper>
  );
};

export default BookCompletionScreen;