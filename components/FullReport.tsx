import React from 'react';
import { useI18n } from '../i18n';
import { User } from '../types';

interface FullReportProps {
  onBack: () => void;
  user: User | null;
}

const FullReport: React.FC<FullReportProps> = ({ onBack, user }) => {
  const { t } = useI18n();
  return (
    <div className="relative flex w-full flex-col text-brand-blue dark:text-white">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-gray-200/80 bg-background-light/80 px-6 backdrop-blur-sm dark:border-white/10 dark:bg-background-dark/80">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full">
          <span className="material-symbols-outlined transform rtl:rotate-180">arrow_back</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">{t('userReport', { name: user?.displayName?.split(' ')[0] || 'Child' })}</h1>
          <p className="text-sm text-brand-blue/60 dark:text-white/60">{t('updatedJustNow')}</p>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </header>
      <main className="flex flex-col gap-6 p-6">
        <section className="rounded-xl bg-surface-light p-5 dark:bg-surface-dark">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('readingLevel')}</h2>
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-black/20">
              <span>{t('last30Days')}</span>
              <span className="material-symbols-outlined text-base">expand_more</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-brand-blue/60 dark:text-white/60">{t('readingLevelDesc')}</p>
          <div className="mt-4 h-48 w-full">
            <div className="h-full w-full bg-contain bg-center bg-no-repeat" data-alt="A line chart showing a child's reading level progression over time, with points for different levels labeled A, B, and C. The line is trending upwards, indicating improvement." style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC3Y2-H9SyzTaE7xhFw_v1R2243rYaZl3NIi1Vn8fvODkEmXwfw7TgqSpKC6L6nRymeXy_bf7mBWrTEkikmjmLjj1VW5QY1O1WqPnbICLRXnyzHN9NLQnrjjf74-UKqTE59pWEo4TrQI3unXbwlO6mtQeHAgiFvqSuyjzcSoxYquqgr7PA90mI59PTctcimRgAoefx170yKxOsjya6GumfX1UernDPaUXiiaKK4wKdcEyqKkX0PR3QZ3x3ThJY7VQ3RXgh6E2rEJ45D')"}}></div>
          </div>
        </section>
        <section className="rounded-xl bg-surface-light p-5 dark:bg-surface-dark">
          <h2 className="text-lg font-bold">{t('newVocabulary')}</h2>
          <p className="mt-1 text-sm text-brand-blue/60 dark:text-white/60">{t('newVocabularyDesc')}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-black/20">
              <span className="font-semibold">{t('brave')}</span>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-brand-blue/70 dark:text-white/70">
                <span className="material-symbols-outlined text-xl">volume_up</span>
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-black/20">
              <span className="font-semibold">{t('explore')}</span>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-brand-blue/70 dark:text-white/70">
                <span className="material-symbols-outlined text-xl">volume_up</span>
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-black/20">
              <span className="font-semibold">{t('adventure')}</span>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-brand-blue/70 dark:text-white/70">
                <span className="material-symbols-outlined text-xl">volume_up</span>
              </button>
            </div>
          </div>
          <button className="mt-4 w-full rounded-lg bg-brand-teal/10 py-3 text-sm font-bold text-brand-teal dark:bg-brand-teal/20">
            {t('seeAllWords')}
          </button>
        </section>
        <section className="rounded-xl bg-surface-light p-5 dark:bg-surface-dark">
          <h2 className="text-lg font-bold">{t('recentQuizzes')}</h2>
          <p className="mt-1 text-sm text-brand-blue/60 dark:text-white/60">{t('recentQuizzesDesc')}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple dark:bg-brand-purple/20">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <div className="flex-grow">
                <p className="font-semibold">{t('quizTitle1')}</p>
                <p className="text-sm text-brand-blue/60 dark:text-white/60">{t('quizType1')}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-base font-bold text-green-600 dark:text-primary">
                90%
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand-yellow/20 text-brand-yellow dark:bg-brand-yellow/30">
                <span className="material-symbols-outlined">pets</span>
              </div>
              <div className="flex-grow">
                <p className="font-semibold">{t('quizTitle2')}</p>
                <p className="text-sm text-brand-blue/60 dark:text-white/60">{t('quizType2')}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red/20 text-base font-bold text-brand-red">
                65%
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal dark:bg-brand-teal/20">
                <span className="material-symbols-outlined">rocket_launch</span>
              </div>
              <div className="flex-grow">
                <p className="font-semibold">{t('quizTitle3')}</p>
                <p className="text-sm text-brand-blue/60 dark:text-white/60">{t('quizType1')}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-base font-bold text-green-600 dark:text-primary">
                100%
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FullReport;
