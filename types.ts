export enum View {
  Bookshelf,
  ReadBook,
  CreateStory,
  PDFReader,
  MyProgress,
  Profile,
  FullReport,
  Settings,
  AccountInfo,
  Subscription,
  Notifications,
  Privacy,
  Help,
  TrustCenter,
  // Add new views for the AI Playground and its features
  AiPlayground,
  ImageStudio,
  VideoLab,
  ConversationHub,
  WorldExplorer,
  DeepThinker,
  LearningPath,
  BookComplete,
  TakeQuiz,
  Store,
}

export type Page = {
  text: string;
  imageUrl: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export type Quiz = {
  questions: QuizQuestion[];
};


export type Book = {
  id: string;
  title: string;
  coverUrl: string;
  pages: Page[];
  isPublished?: boolean;
  progress?: number;
  lastReadPage?: number;
  isBookmarked?: boolean;
  rating?: number;
  createdBy?: 'user' | 'system';
  quiz?: Quiz;
  quizAttempts?: { score: number; date: string }[];
};

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

// Fix: Added GroundingSource type for WorldExplorer feature.
export type GroundingSource = {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
};

// Fix: Use scoped package import for firebase User type for consistency.
export type User = import('@firebase/auth').User;

export type UserProfile = {
  gems: number;
  streak: number;
  lastActivityDate: string; // ISO string 'YYYY-MM-DD'
  achievements: string[]; // array of achievement IDs
  purchasedAvatars?: string[];
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string; // material symbol name
};

export type StoreItem = {
  id: string;
  name: string;
  cost: number;
  imageUrl: string;
  type: 'avatar';
};