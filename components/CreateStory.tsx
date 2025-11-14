import React, { useState, useRef, useEffect } from 'react';
import { geminiService, StoryData } from '../services/geminiService';
import ViewWrapper from './ViewWrapper';
import Loader from './Loader';
import { Book, Page } from '../types';
import { SparklesIcon, PublishIcon, MicrophoneIcon } from './icons';
import { useI18n } from '../i18n';

// Fix: Add type definitions for Web Speech API to resolve 'Cannot find name SpeechRecognition' error.
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

interface CreateStoryProps {
  onBack: () => void;
  onStoryCreated: (book: Book) => void;
}

const CreateStory: React.FC<CreateStoryProps> = ({ onBack, onStoryCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [draftBook, setDraftBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState<number>(10);
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-US');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { t } = useI18n();


  useEffect(() => {
    // Cleanup recognition on component unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);


  const handleCreateStory = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setDraftBook(null);

    try {
      setLoadingMessage(t('loadingMessageStory'));
      const storyData = await geminiService.generateStoryPages(prompt, numPages, storyLength);
      
      const newBook: Book = {
        id: `draft-${Date.now()}`,
        title: storyData.title,
        coverUrl: '', // Will be the first page's image
        pages: [],
        isPublished: false,
        createdBy: 'user',
      };

      for (let i = 0; i < storyData.pages.length; i++) {
        setLoadingMessage(`${t('loadingMessagePage')} ${i + 1}...`);
        const imageUrl = await geminiService.generateStoryImage(storyData.pages[i].imagePrompt);
        
        const newPage: Page = {
          text: storyData.pages[i].text,
          imageUrl: imageUrl,
        };
        newBook.pages.push(newPage);
        
        if (i === 0) {
            newBook.coverUrl = imageUrl;
        }
      }

      setLoadingMessage(t('loadingMessageQuiz'));
      const quiz = await geminiService.generateQuiz(newBook.title, newBook.pages);
      newBook.quiz = quiz;
      
      setDraftBook(newBook);

    } catch (error) {
      console.error("Story creation failed:", error);
      alert(t('storyCreationError'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePublish = () => {
    if (draftBook) {
        onStoryCreated(draftBook);
    }
  }

  const handleToggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert(t('speechRecognitionNotSupported'));
        return;
    }

    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLang;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
    };
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        if (finalTranscript) {
            setPrompt(prevPrompt => prevPrompt.trim() + ' ' + finalTranscript);
        }
    };
    recognition.start();
  };

  return (
    <ViewWrapper title={t('createStoryTitle')} onBack={onBack}>
      <div className="w-full flex flex-col items-center text-center">
        
        {!isLoading && !draftBook && (
            <>
              <div className="w-24 h-24 bg-brand-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <SparklesIcon className="w-12 h-12 text-brand-yellow" />
              </div>
              <h2 className="text-2xl font-bold text-brand-blue dark:text-white">{t('createStoryHeader')}</h2>
              <p className="text-brand-purple dark:text-white/70 mb-6">{t('createStorySubheader')}</p>
              
              <div className="relative w-full">
                <textarea
                    className="w-full p-4 pe-28 bg-white dark:bg-brand-blue/20 border-2 border-light-gray dark:border-brand-blue/30 rounded-lg focus:ring-2 focus:ring-brand-teal focus:outline-none transition shadow-sm text-brand-blue dark:text-white"
                    rows={3}
                    placeholder={t('createStoryPlaceholder')}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <div className="absolute top-1/2 -translate-y-1/2 end-3 flex items-center gap-2">
                  <select
                    value={speechLang}
                    onChange={(e) => setSpeechLang(e.target.value)}
                    className="bg-light-gray dark:bg-brand-blue/50 text-brand-purple dark:text-white text-sm rounded-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  >
                    <option value="en-US">EN</option>
                    <option value="ar-SA">AR</option>
                  </select>
                  <button
                      onClick={handleToggleListening}
                      className={`p-2 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-light-gray dark:bg-brand-blue/50 text-brand-purple dark:text-white hover:bg-gray-200'}`}
                      aria-label={isListening ? t('stopListening') : t('startListening')}
                  >
                      <MicrophoneIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="w-full text-start my-6 space-y-4">
                <div>
                  <label className="font-semibold text-brand-blue dark:text-white">{t('numPages')}:</label>
                  <div className="flex gap-2 mt-2">
                    {[10, 25, 50].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setNumPages(p)}
                        className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm flex-1 ${numPages === p ? 'bg-primary text-white shadow' : 'bg-light-gray dark:bg-brand-blue/30 hover:bg-gray-200 text-brand-purple dark:text-white'}`}
                      >{p} {t('pages')}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-brand-blue dark:text-white">{t('storyLength')}:</label>
                  <div className="flex gap-2 mt-2">
                    {(['short', 'medium', 'long'] as const).map(len => (
                      <button 
                        key={len}
                        onClick={() => setStoryLength(len)}
                        className={`px-5 py-2 rounded-lg font-medium transition-colors capitalize text-sm flex-1 ${storyLength === len ? 'bg-primary text-white shadow' : 'bg-light-gray dark:bg-brand-blue/30 hover:bg-gray-200 text-brand-purple dark:text-white'}`}
                      >{t(len)}</button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleCreateStory} disabled={!prompt} className="w-full bg-primary hover:opacity-90 text-white font-bold py-4 px-4 rounded-lg transition-colors text-lg shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <SparklesIcon className="w-5 h-5"/>
                {t('createMyStory')}
              </button>
            </>
        )}

        {isLoading && <Loader message={loadingMessage} />}

        {!isLoading && draftBook && (
            <div className="w-full animate-fade-in flex flex-col items-center">
                <h2 className="text-3xl font-extrabold text-brand-blue dark:text-white mb-2">{t('storyReadyTitle')}</h2>
                <p className="text-brand-purple dark:text-white/70 mb-6">{t('storyReadySubtitle', { title: draftBook.title })}</p>
                
                <div className="w-64 aspect-[3/4] rounded-lg overflow-hidden shadow-2xl mb-6">
                    <img src={draftBook.coverUrl} alt={draftBook.title} className="w-full h-full object-cover" />
                </div>

                <button onClick={handlePublish} className="w-full max-w-md bg-primary hover:opacity-90 text-white font-bold py-4 px-4 rounded-lg transition-colors text-lg shadow-lg flex items-center justify-center gap-2">
                    <PublishIcon className="w-6 h-6" />
                    {t('addToMyBooks')}
                </button>
            </div>
        )}

      </div>
    </ViewWrapper>
  );
};

export default CreateStory;