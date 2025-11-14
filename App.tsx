import React, { useState, useEffect, useContext } from 'react';
import { View, Book, User } from './types';
import { SAMPLE_BOOKS, NAVIGATION_ITEMS, REWARD_AMOUNTS, ACHIEVEMENTS_LIST } from './constants';
import Bookshelf from './components/Bookshelf';
import ReadBook from './components/ReadBook';
import CreateStory from './components/CreateStory';
import Settings from './components/Settings';
import BottomNavBar from './components/BottomNavBar';
import ParentDashboard from './components/ParentDashboard';
import FullReport from './components/FullReport';
import { db, isFirebaseConfigured } from './services/firebase';
import { collection, getDocs, addDoc, doc, updateDoc } from '@firebase/firestore';
import Loader from './components/Loader';
import { useI18n } from './i18n';
import AccountInfo from './components/settings/AccountInfo';
import Subscription from './components/settings/Subscription';
import Notifications from './components/settings/Notifications';
import Privacy from './components/settings/Privacy';
import Help from './components/settings/Help';
import { AuthContext } from './contexts/AuthContext';
import Login from './components/Login';
import AiPlayground from './components/AiPlayground';
import ImageStudio from './components/features/ImageStudio';
import VideoLab from './components/features/VideoLab';
import ConversationHub from './components/features/ConversationHub';
import WorldExplorer from './components/features/WorldExplorer';
import DeepThinker from './components/features/DeepThinker';
import PDFReader from './components/PDFReader';
import { CreateIcon, SparklesIcon } from './components/icons';
import { geminiService } from './services/geminiService';
import { userService } from './services/userService';
import LearningPath from './components/LearningPath';
import BookCompletionScreen from './components/BookCompletionScreen';
import TakeQuiz from './components/TakeQuiz';
import TrustCenter from './components/settings/TrustCenter';
import Store from './components/Store';
import Profile from './components/Profile';

interface RewardNotification {
    id: number;
    type: 'gem' | 'achievement';
    text: string;
    icon: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Bookshelf);
  const [viewStack, setViewStack] = useState<View[]>([View.Bookshelf]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [quizBook, setQuizBook] = useState<Book | null>(null);
  const [initialBookAction, setInitialBookAction] = useState<'share' | 'pdf' | null>(null);
  
  const { language, direction, t } = useI18n();
  const { user, userProfile, refreshUserProfile, loading: authLoading } = useContext(AuthContext);
  const [rewardNotifications, setRewardNotifications] = useState<RewardNotification[]>([]);


  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  useEffect(() => {
    const loadBooks = async (currentUser: User) => {
      setIsLoading(true);
      if (!isFirebaseConfigured || !db) {
        setBooks(SAMPLE_BOOKS);
        setIsLoading(false);
        return;
      }

      try {
        const booksCollection = collection(db, 'users', currentUser.uid, 'books');
        const snapshot = await getDocs(booksCollection);
        
        const userBooks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Book));
        setBooks([...SAMPLE_BOOKS, ...userBooks]);
      } catch (error) {
        console.error("Error fetching user books from Firestore:", error);
        setBooks(SAMPLE_BOOKS);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadBooks(user);
    } else if (!authLoading) {
      // User is logged out and auth state is confirmed
      setBooks(SAMPLE_BOOKS);
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const showRewardNotification = (notification: Omit<RewardNotification, 'id'>) => {
      const newNotification = { ...notification, id: Date.now() };
      setRewardNotifications(prev => [...prev, newNotification]);
      setTimeout(() => {
          setRewardNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 4000);
  };

  const triggerReward = async (type: 'book_read' | 'quiz_complete' | 'story_created', data?: any) => {
      if (!user || !userProfile) return;

      let gemsEarned = 0;
      const newAchievements: string[] = [];
      const currentAchievements = userProfile.achievements || [];

      // 1. Update Streak & Check Streak Achievements
      const { newStreak, isStreakExtended } = await userService.updateStreak(user.uid);
      if (isStreakExtended) {
          if (newStreak >= 3 && !currentAchievements.includes('streak_3')) newAchievements.push('streak_3');
          if (newStreak >= 7 && !currentAchievements.includes('streak_7')) newAchievements.push('streak_7');
      }

      // 2. Calculate Gems & Activity-specific Achievements
      switch(type) {
          case 'book_read':
              gemsEarned = REWARD_AMOUNTS.BOOK_READ;
              if (!currentAchievements.includes('first_book')) newAchievements.push('first_book');
              
              const finishedBookCount = books.filter(b => b.progress === 100).length;
              if (finishedBookCount + 1 >= 5 && !currentAchievements.includes('bookworm_5')) {
                  newAchievements.push('bookworm_5');
              }
              break;
          case 'quiz_complete':
              const { score, total } = data;
              const percentage = (score / total) * 100;
              if (percentage === 100) {
                  gemsEarned = REWARD_AMOUNTS.QUIZ_PERFECT;
                  if (!currentAchievements.includes('quiz_master')) newAchievements.push('quiz_master');
              } else if (percentage >= 80) {
                  gemsEarned = REWARD_AMOUNTS.QUIZ_GOOD;
              } else if (percentage >= 60) {
                  gemsEarned = REWARD_AMOUNTS.QUIZ_PASS;
              }
              break;
          case 'story_created':
              gemsEarned = REWARD_AMOUNTS.STORY_CREATED;
              if (!currentAchievements.includes('creator')) newAchievements.push('creator');
              break;
      }

      // 3. Update Database
      if (gemsEarned > 0) {
          await userService.addGems(user.uid, gemsEarned);
      }
      for (const achievementId of newAchievements) {
          const wasAdded = await userService.addAchievement(user.uid, achievementId);
          if (wasAdded) {
              const achievement = ACHIEVEMENTS_LIST.find(a => a.id === achievementId);
              if (achievement) {
                  showRewardNotification({ type: 'achievement', text: `${t('achievementUnlocked')}: ${achievement.name}!`, icon: achievement.icon });
              }
          }
      }
      
      if (gemsEarned > 0) {
          showRewardNotification({ type: 'gem', text: `${t('youEarned')} ${gemsEarned} ${t('gems')}!`, icon: 'diamond' });
      }
      
      await refreshUserProfile();
  };

  const updateBookState = async (bookId: string, updates: Partial<Omit<Book, 'id'>>) => {
    setBooks(prevBooks =>
        prevBooks.map(b => (b.id === bookId ? { ...b, ...updates } : b))
    );

    const bookToUpdate = books.find(b => b.id === bookId);
    if (user && db && isFirebaseConfigured && bookToUpdate?.createdBy === 'user') {
        try {
            const bookRef = doc(db, 'users', user.uid, 'books', bookId);
            await updateDoc(bookRef, updates);
        } catch (error) {
            console.error("Failed to update book in Firestore:", error);
            // Optionally revert state change or show an error to the user
        }
    }
  };

  const navigate = (view: View) => {
    setViewStack(prev => [...prev, view]);
    setCurrentView(view);
  };

  const handleBack = () => {
    const newStack = [...viewStack];
    newStack.pop();
    const previousView = newStack[newStack.length - 1] || View.Bookshelf;

    const isExitingBookFlow =
      [View.ReadBook, View.BookComplete].includes(currentView) &&
      ![View.ReadBook, View.BookComplete, View.TakeQuiz].includes(previousView);

    if (isExitingBookFlow) {
      setSelectedBook(null);
      setInitialBookAction(null);
    }

    // Always clear the quiz book when navigating away from the quiz view.
    if (currentView === View.TakeQuiz) {
      setQuizBook(null);
    }
    
    setViewStack(newStack);
    setCurrentView(previousView);
  };

  // Fix: Add a dedicated function to return to the library, resetting the view stack.
  const handleReturnToLibrary = () => {
    setSelectedBook(null);
    setInitialBookAction(null);
    setQuizBook(null);
    setViewStack([View.Bookshelf]);
    setCurrentView(View.Bookshelf);
  };


  const handleSelectBook = (book: Book, options?: { initialAction?: 'share' | 'pdf' }) => {
    setSelectedBook(book);
    setInitialBookAction(options?.initialAction || null);
    navigate(View.ReadBook);
  };

  const handleStoryCreated = async (newBook: Book) => {
    let bookWithId = { ...newBook, id: `local-${Date.now()}` };
    if (user && isFirebaseConfigured && db) {
      try {
        const { id, ...bookData } = newBook;
        const userBooksCollection = collection(db, 'users', user.uid, 'books');
        const docRef = await addDoc(userBooksCollection, bookData);
        bookWithId = { ...newBook, id: docRef.id };
      } catch (error) {
        console.error("Error saving new book to Firestore:", error);
        alert("Could not save your new story. Please try again.");
        return; // Exit if save fails
      }
    }
    
    setBooks(prevBooks => [bookWithId, ...prevBooks]);
    await triggerReward('story_created');
    setViewStack([View.Bookshelf]);
    setCurrentView(View.Bookshelf);
  };

  const handleBookComplete = (book: Book) => {
    setSelectedBook(book);
    navigate(View.BookComplete);
  };

  const handleStartQuiz = (book: Book) => {
    setQuizBook(book);
    navigate(View.TakeQuiz);
  };

  const handleQuizComplete = (bookId: string, score: number) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      const newAttempt = { score, date: new Date().toISOString() };
      const updatedAttempts = [...(book.quizAttempts || []), newAttempt];
      updateBookState(bookId, { quizAttempts: updatedAttempts });
    }
    // Go back to the book completion screen to see the updated state.
    handleBack(); 
  };

  // Views that should take up the full screen width (e.g., for immersive experiences).
  const isWideLayout = [
    View.ReadBook,
  ].includes(currentView);

  // Determine which views should hide the main bottom navigation bar.
  // Generally, any view that isn't one of the main tabs.
  const isFullScreenView = [
    View.ReadBook, 
    View.CreateStory,
    View.Settings, 
    View.AccountInfo, 
    View.Subscription, 
    View.Notifications, 
    View.Privacy, 
    View.Help,
    View.TrustCenter,
    View.ImageStudio,
    View.VideoLab,
    View.ConversationHub,
    View.WorldExplorer,
    View.DeepThinker,
    View.FullReport,
    View.LearningPath,
    View.BookComplete,
    View.TakeQuiz,
    View.PDFReader,
    View.Store,
    View.Profile,
  ].includes(currentView);
  
  const showNavBar = !isFullScreenView;
  
  const renderLoadingScreen = () => (
      <div className="flex justify-center items-center h-screen bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4 p-8 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg">
            <div className="w-16 h-16 border-4 border-t-primary border-light-gray dark:border-brand-blue/30 rounded-full animate-spin"></div>
            <p className="text-brand-blue dark:text-white/80 font-semibold">{authLoading ? "Authenticating..." : "Loading library..."}</p>
        </div>
      </div>
  );

  const renderView = () => {
    switch (currentView) {
      case View.CreateStory:
        return <CreateStory onBack={handleBack} onStoryCreated={handleStoryCreated} />;
      case View.ReadBook:
        if (selectedBook) {
          const freshBook = books.find(b => b.id === selectedBook.id) || selectedBook;
          return <ReadBook book={freshBook} onBack={handleBack} isDirectLink={false} initialAction={initialBookAction} navigate={navigate} updateBookState={updateBookState} onBookComplete={handleBookComplete}/>;
        }
        return null;
      case View.BookComplete:
        if (selectedBook) {
            const freshBook = books.find(b => b.id === selectedBook.id) || selectedBook;
            return <BookCompletionScreen book={freshBook} onStartQuiz={handleStartQuiz} onBackToLibrary={handleReturnToLibrary} updateBookState={updateBookState} triggerReward={triggerReward} />;
        }
        return null;
      case View.TakeQuiz:
        if (quizBook) {
            const freshBook = books.find(b => b.id === quizBook.id) || quizBook;
            return <TakeQuiz book={freshBook} onQuizComplete={handleQuizComplete} onBack={handleBack} triggerReward={triggerReward} />;
        }
        return null;
      case View.Settings:
        return <Settings onBack={handleBack} navigate={navigate} user={user} />;
      case View.AccountInfo:
        return <AccountInfo onBack={handleBack} user={user} />;
      case View.Subscription:
        return <Subscription onBack={handleBack} />;
      case View.Notifications:
        return <Notifications onBack={handleBack} />;
      case View.Privacy:
        return <Privacy onBack={handleBack} />;
      case View.Help:
        return <Help onBack={handleBack} />;
      case View.TrustCenter:
        return <TrustCenter onBack={handleBack} />;
      case View.MyProgress:
        return <ParentDashboard books={books} user={user} onNavigateToReport={() => navigate(View.FullReport)} onNavigateToSettings={() => navigate(View.Settings)} onNavigateToLearningPath={() => navigate(View.LearningPath)} onSelectBook={handleSelectBook} />;
      case View.FullReport:
        return <FullReport onBack={handleBack} user={user} />;
      case View.LearningPath:
        return <LearningPath onBack={handleBack} />;
      case View.AiPlayground:
        return <AiPlayground navigate={navigate} onBack={handleBack} />;
      case View.ImageStudio:
        return <ImageStudio onBack={handleBack} />;
      case View.VideoLab:
        return <VideoLab onBack={handleBack} />;
      case View.ConversationHub:
        return <ConversationHub onBack={handleBack} />;
      case View.WorldExplorer:
        return <WorldExplorer onBack={handleBack} />;
      case View.DeepThinker:
        return <DeepThinker onBack={handleBack} />;
      case View.PDFReader:
        return <PDFReader onBack={handleBack} />;
      case View.Store:
        return <Store onBack={handleBack} />;
      case View.Profile:
        return <Profile onBack={handleBack} navigate={navigate} />;
      case View.Bookshelf:
      default:
        return <Bookshelf 
            books={books} 
            onSelectBook={handleSelectBook} 
            onNavigateToProfile={() => navigate(View.Profile)} 
            user={user} 
            onNavigateToPdfReader={() => navigate(View.PDFReader)}
        />;
    }
  };
  
  if (authLoading || (isFirebaseConfigured && user && isLoading)) {
    return renderLoadingScreen();
  }

  if (isFirebaseConfigured && !user) {
    return <Login />;
  }

  return (
    <div className={`relative flex min-h-screen w-full flex-col font-display ${isWideLayout ? '' : 'max-w-md mx-auto'}`}>
      <main className={`flex-grow ${showNavBar ? 'pb-24' : ''}`}>
        {renderView()}
      </main>

      {currentView === View.Bookshelf && (
        <div className="fixed bottom-0 inset-x-0 z-20 max-w-md mx-auto pointer-events-none">
          <div className="absolute bottom-24 left-4 pointer-events-auto">
            <button
              onClick={() => navigate(View.CreateStory)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/80 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
              aria-label={t('createStory')}
            >
              <CreateIcon className="h-7 w-7" />
            </button>
          </div>
          <div className="absolute bottom-24 right-4 pointer-events-auto">
            <button
              onClick={() => navigate(View.AiPlayground)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple/20 text-brand-purple shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
              aria-label={t('aiPlaygroundTitle')}
            >
              <SparklesIcon className="h-8 w-8" />
            </button>
          </div>
        </div>
      )}
      
      {/* Reward Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
          {rewardNotifications.map(notif => (
              <div key={notif.id} className="animate-fade-in-down flex items-center gap-3 bg-brand-blue text-white p-3 rounded-lg shadow-lg">
                  <span className="material-symbols-outlined text-brand-yellow">{notif.icon}</span>
                  <span className="font-semibold text-sm">{notif.text}</span>
              </div>
          ))}
      </div>

      <div className="group relative w-full text-center py-4 cursor-pointer">
        <span className="material-symbols-outlined text-sm align-middle text-gray-400 dark:text-gray-500 transition-colors group-hover:text-brand-yellow group-hover:animate-flash">bolt</span>
        <span className="text-xs uppercase font-semibold text-gray-400 dark:text-gray-500 ml-1 tracking-wider">
          Powered by QudSystem | Made in Egypt
        </span>
      </div>

      {showNavBar && (
          <BottomNavBar currentView={currentView} setCurrentView={(view) => { setViewStack([view]); setCurrentView(view); }} />
      )}
    </div>
  );
};

export default App;