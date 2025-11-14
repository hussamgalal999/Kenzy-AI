import React, { useContext } from 'react';
import { Book, User } from '../types';
import { useI18n } from '../i18n';
import { DEFAULT_AVATAR_URL, ACHIEVEMENTS_LIST } from '../constants';
import { AuthContext } from '../contexts/AuthContext';
import { FireIcon, GemIcon } from './icons';

interface ParentDashboardProps {
  books: Book[];
  user: User | null;
  onNavigateToReport: () => void;
  onNavigateToSettings: () => void;
  onNavigateToLearningPath: () => void;
  onSelectBook: (book: Book) => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ books, user, onNavigateToReport, onNavigateToSettings, onNavigateToLearningPath, onSelectBook }) => {
  const { t } = useI18n();
  const { userProfile } = useContext(AuthContext);
  const booksFinishedCount = books.filter(b => b.progress === 100).length;
  const minutesRead = booksFinishedCount * 15 + books.filter(b => b.progress && b.progress < 100).length * 5;
  const recentlyReadBooks = books.filter(b => b.progress && b.progress > 0).slice(0, 5);
  const booksWithQuizzesTaken = books.filter(b => b.quizAttempts && b.quizAttempts.length > 0);

  return (
    <div className="flex flex-col">
      <header className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 gap-2">
        <h1 className="text-brand-blue dark:text-white text-3xl font-bold leading-tight tracking-tighter">{t('myProgress')}</h1>
        <div className="flex-grow"></div>
        <div className="flex items-center gap-2 shrink-0">
            {userProfile && (
                <>
                    <div className="flex items-center gap-2 bg-light-gray dark:bg-surface-dark px-3 py-1.5 rounded-full">
                        <FireIcon className="w-5 h-5 text-orange-500" />
                        <span className="font-bold text-sm text-brand-blue dark:text-white">{userProfile.streak}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-light-gray dark:bg-surface-dark px-3 py-1.5 rounded-full">
                        <GemIcon className="w-5 h-5 text-cyan-500" />
                        <span className="font-bold text-sm text-brand-blue dark:text-white">{userProfile.gems}</span>
                    </div>
                </>
            )}
            <button onClick={onNavigateToSettings} className="flex size-12 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <span className="material-symbols-outlined text-3xl text-brand-blue dark:text-white">settings</span>
            </button>
        </div>
      </header>
      <div className="p-4 flex flex-col w-full flex-grow gap-6">
        <div className="flex items-center justify-between rounded-2xl bg-brand-blue p-5 text-white">
          <div>
            <p className="text-lg font-medium">{t('helloParent')}</p>
            <h2 className="text-2xl font-bold">{t('userProgress', { name: user?.displayName?.split(' ')[0] || t('yourChild') })}</h2>
          </div>
          <div className="flex -space-x-4 rtl:space-x-reverse">
            <img alt="Child's profile picture" className="h-14 w-14 rounded-full border-2 border-white object-cover" src={user?.photoURL || DEFAULT_AVATAR_URL}/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 rounded-2xl bg-white dark:bg-brand-blue/20 p-4">
            <span className="material-symbols-outlined text-brand-teal text-3xl">timer</span>
            <p className="text-brand-purple dark:text-white/70 text-sm font-medium">{t('readingTime')}</p>
            <p className="text-brand-blue dark:text-white text-2xl font-bold">{minutesRead} <span className="text-base font-medium">{t('min')}</span></p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-white dark:bg-brand-blue/20 p-4">
            <span className="material-symbols-outlined text-brand-yellow text-3xl">menu_book</span>
            <p className="text-brand-purple dark:text-white/70 text-sm font-medium">{t('booksFinished')}</p>
            <p className="text-brand-blue dark:text-white text-2xl font-bold">{booksFinishedCount}</p>
          </div>
        </div>
        <div onClick={onNavigateToLearningPath} className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-brand-blue/20 p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-brand-blue/30 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-brand-blue dark:text-white text-xl font-bold">{t('learningPath')}</h3>
            <div className="text-brand-teal text-sm font-bold flex items-center gap-1">
              {t('viewDetails')}
              <span className="material-symbols-outlined text-base transform rtl:rotate-180">arrow_forward_ios</span>
            </div>
          </div>
          <p className="text-brand-purple dark:text-white/70 text-sm">{t('learningPathDesc')}</p>
          <div className="w-full bg-light-gray dark:bg-brand-blue/30 rounded-full h-3">
            <div className="bg-brand-teal h-3 rounded-full" style={{width: "60%"}}></div>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center justify-center rounded-full bg-brand-teal/20 h-12 w-12">
              <span className="material-symbols-outlined text-brand-teal text-3xl">footprint</span>
            </div>
            <div>
              <p className="text-brand-blue dark:text-white font-bold">{t('nextUp')}</p>
              <p className="text-brand-purple dark:text-white/70 text-sm">{t('nextUpDesc')}</p>
            </div>
          </div>
        </div>

        {recentlyReadBooks.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-brand-blue dark:text-white text-xl font-bold">{t('myReads')}</h3>
            <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex items-stretch px-1 gap-4">
                {recentlyReadBooks.map(book => (
                  <BookCard key={book.id} book={book} onSelect={() => onSelectBook(book)} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-brand-blue/20 p-5">
            <h3 className="text-brand-blue dark:text-white text-xl font-bold">{t('recentQuizzes')}</h3>
            <p className="text-sm text-brand-purple dark:text-white/70 -mt-3">{t('recentQuizzesDesc')}</p>
            <div className="space-y-3">
                {booksWithQuizzesTaken.slice(0, 3).map(book => (
                    <RecentQuizItem key={book.id} book={book} />
                ))}
                {booksWithQuizzesTaken.length === 0 && (
                    <p className="text-center text-brand-purple dark:text-white/60 py-4">{t('noQuizzesTaken')}</p>
                )}
            </div>
        </div>

        <div className="flex flex-col gap-4">
            <h3 className="text-brand-blue dark:text-white text-xl font-bold">{t('achievements')}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-center">
                {ACHIEVEMENTS_LIST.map(ach => {
                    const isUnlocked = userProfile?.achievements.includes(ach.id);
                    return (
                        <div key={ach.id} title={ach.description} className={`flex flex-col items-center p-3 rounded-2xl ${isUnlocked ? 'bg-brand-yellow/20' : 'bg-light-gray dark:bg-brand-blue/20 opacity-60'}`}>
                            <div className={`flex items-center justify-center h-16 w-16 rounded-full ${isUnlocked ? 'bg-brand-yellow text-white' : 'bg-gray-300 dark:bg-brand-blue/30 text-brand-purple/50'}`}>
                                <span className="material-symbols-outlined text-4xl">{ach.icon}</span>
                            </div>
                            <p className={`mt-2 font-bold text-sm ${isUnlocked ? 'text-yellow-700 dark:text-brand-yellow' : 'text-brand-purple dark:text-white/70'}`}>{ach.name}</p>
                        </div>
                    )
                })}
            </div>
        </div>

      </div>
    </div>
  );
};

const BookCard: React.FC<{ book: Book, onSelect: () => void }> = ({ book, onSelect }) => (
  <div onClick={onSelect} className="flex h-full flex-1 flex-col gap-2 rounded-lg w-32 shrink-0 cursor-pointer group">
    <div 
        className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl flex flex-col shadow-md group-hover:shadow-xl transition-shadow" 
        style={{backgroundImage: `url("${book.coverUrl}")`}}>
    </div>
    <p className="text-brand-blue dark:text-white text-sm font-bold leading-normal truncate">{book.title}</p>
  </div>
);

const RecentQuizItem: React.FC<{ book: Book }> = ({ book }) => {
    const { t } = useI18n();
    const lastAttempt = book.quizAttempts![book.quizAttempts!.length - 1];
    const scorePercentage = Math.round((lastAttempt.score / book.quiz!.questions.length) * 100);
    const scoreColor = scorePercentage >= 80 ? 'bg-primary/20 text-green-600 dark:text-primary' : (scorePercentage >= 60 ? 'bg-brand-yellow/20 text-yellow-600 dark:text-brand-yellow' : 'bg-brand-red/20 text-brand-red');
    
    return (
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 dark:bg-brand-purple/20">
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover rounded-lg" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-brand-blue dark:text-white">{book.title}</p>
                <p className="text-sm text-brand-blue/60 dark:text-white/60">{t('quizType1')}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-bold ${scoreColor}`}>
                {scorePercentage}%
            </div>
        </div>
    );
};


export default ParentDashboard;
