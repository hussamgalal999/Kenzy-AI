import React, { useState, useEffect, useRef } from 'react';
import { Book, View } from '../types';
import { ShareIcon, DownloadIcon } from './icons';
import jsPDF from 'jspdf';
import * as QRCode from 'qrcode';
import Loader from './Loader';
import { useI18n } from '../i18n';
import { geminiService } from '../services/geminiService';

// Helper function to decode base64 string to bytes
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper function to write a string to a DataView
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
  
// Helper function to convert raw PCM audio data into a playable WAV blob
function pcmToWav(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const pcmAsUint8 = new Uint8Array(pcmData.buffer);
    for (let i = 0; i < dataSize; i++) {
        view.setUint8(44 + i, pcmAsUint8[i]);
    }

    return new Blob([view], { type: 'audio/wav' });
}


interface ReadBookProps {
  book: Book;
  onBack: () => void;
  isDirectLink: boolean;
  initialAction?: 'share' | 'pdf' | null;
  navigate: (view: View) => void;
  updateBookState: (bookId: string, updates: Partial<Omit<Book, 'id'>>) => void;
  onBookComplete: (book: Book) => void;
}


const ReadBook: React.FC<ReadBookProps> = ({ book, onBack, isDirectLink, initialAction, updateBookState, onBookComplete }) => {
  const [currentPage, setCurrentPage] = useState(book.lastReadPage || 0);
  const [isBookmarked, setIsBookmarked] = useState(book.isBookmarked || false);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Continuous play state
  const [isContinuousPlay, setIsContinuousPlay] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const pageAudioCache = useRef<{[key: number]: string}>({});
  const autoPlayNextPage = useRef(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}?bookId=${book.id}`;
  const { t } = useI18n();

  const page = book.pages[currentPage];
  
  // Save progress when component unmounts
  useEffect(() => {
    // A ref to hold the currentPage value for cleanup, avoiding stale closures.
    const currentPageRef = { current: currentPage };
    currentPageRef.current = currentPage;
  
    return () => {
        const progress = ((currentPageRef.current + 1) / book.pages.length) * 100;
        updateBookState(book.id, { lastReadPage: currentPageRef.current, progress: Math.min(progress, 100) });
    };
  }, [book.id, book.pages.length, updateBookState]);

  // Handle one-time actions like sharing or PDF export on load
  useEffect(() => {
    const handleInitialAction = async () => {
        if (initialAction === 'share') setShowShareModal(true);
        else if (initialAction === 'pdf') await handleExportToPdf();
    }
    handleInitialAction();
  }, [initialAction]);

  // Generate QR Code for sharing
  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 256, margin: 2 })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error("Failed to generate QR code:", err));
  }, [shareUrl]);

  const prefetchAudio = async (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= book.pages.length) return;
    if (pageAudioCache.current[pageIndex]) return;

    try {
        const text = book.pages[pageIndex].text;
        const base64Audio = await geminiService.generateExpressiveSpeech(text);
        const pcmData = decode(base64Audio);
        const audioBlob = pcmToWav(pcmData, 24000, 1, 16);
        const url = URL.createObjectURL(audioBlob);
        pageAudioCache.current[pageIndex] = url;
    } catch (e) {
        console.error(`Failed to prefetch audio for page ${pageIndex}`, e);
    }
  };

  // Pre-fetch audio for current and next page to make playback instant
  useEffect(() => {
    prefetchAudio(currentPage);
    prefetchAudio(currentPage + 1);
  }, [currentPage, book.id]);


  // Handle page changes
  useEffect(() => {
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      // Do not clear the src, just the state to allow re-triggering play
    }
    setAudioUrl(null);
    setIsPlaying(false);

    // If continuous play triggered this, start playing the new page
    if (autoPlayNextPage.current) {
      autoPlayNextPage.current = false;
      handlePlayPause();
    }
  }, [currentPage]);

  // Apply playback speed changes
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);


  // Audio Functions
  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (isContinuousPlay) {
      if (currentPage < book.pages.length - 1) {
          autoPlayNextPage.current = true;
          setCurrentPage(p => p + 1);
      } else {
          onBookComplete(book);
      }
    }
  };


  const handlePlayPause = async () => {
    if (isPlaying) {
        audioRef.current?.pause();
    } else {
        const cachedUrl = pageAudioCache.current[currentPage];
        if (cachedUrl) {
            if (audioUrl === cachedUrl) {
                audioRef.current?.play();
            } else {
                setAudioUrl(cachedUrl);
            }
        } else {
            setIsAudioLoading(true);
            try {
                let urlToPlay = pageAudioCache.current[currentPage];
                if (!urlToPlay) {
                    const text = book.pages[currentPage].text;
                    const base64Audio = await geminiService.generateExpressiveSpeech(text);
                    const pcmData = decode(base64Audio);
                    const audioBlob = pcmToWav(pcmData, 24000, 1, 16);
                    urlToPlay = URL.createObjectURL(audioBlob);
                    pageAudioCache.current[currentPage] = urlToPlay;
                }
                setAudioUrl(urlToPlay);
            } catch (e) {
                console.error("Failed to play audio", e);
                alert("Could not play audio for this page.");
                setIsPlaying(false);
            } finally {
                setIsAudioLoading(false);
            }
        }
    }
  };

  useEffect(() => {
      // This effect triggers play when the audioUrl is set
      if (audioUrl && audioRef.current) {
          audioRef.current.play();
      }
  }, [audioUrl]);


  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1.0, 1.25, 1.5, 0.75];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const handleToggleAutoplay = () => {
    setIsContinuousPlay(prev => {
        const newAutoplayState = !prev;
        // Ensure the ref that triggers next page play is reset if autoplay is turned off.
        if (!newAutoplayState) {
          autoPlayNextPage.current = false;
        }
        return newAutoplayState;
    });
  };


  const goToPrevPage = () => {
    if (currentPage > 0) {
        if (isContinuousPlay) {
            autoPlayNextPage.current = true;
        }
        setCurrentPage(p => p - 1);
    }
  };
  const goToNextPage = () => {
    if (currentPage < book.pages.length - 1) {
        if (isContinuousPlay) {
            autoPlayNextPage.current = true;
        }
        setCurrentPage(p => p + 1);
    } else {
        onBookComplete(book);
    }
  };

  const handleToggleBookmark = () => {
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);
    updateBookState(book.id, { isBookmarked: newBookmarkState });
  };

  const handleExportToPdf = async () => {
    setIsGeneratingPdf(true);
    try {
        const doc = new jsPDF('landscape', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const pageContentWidth = (pageWidth / 2) - (margin * 1.5);
        const pageContentHeight = pageHeight - (margin * 2);

        const toBase64 = (url: string): Promise<string> => new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext('2d')?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.onerror = reject;
            img.src = url;
        });

        for (let i = 0; i < book.pages.length; i++) {
            const page = book.pages[i];
            const imgBase64 = await toBase64(page.imageUrl);
            
            // Left page (Image)
            const imgRatio = 1; // Assuming square images
            const imgHeight = Math.min(pageContentHeight - 40, pageContentWidth / imgRatio);
            const imgWidth = imgHeight * imgRatio;
            const xOffset = margin + (pageContentWidth - imgWidth) / 2;
            const yOffset = margin + (pageContentHeight - imgHeight) / 2;
            doc.addImage(imgBase64, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);
            
            // Right page (Text)
            doc.setFontSize(12);
            const textLines = doc.splitTextToSize(page.text, pageContentWidth);
            doc.text(textLines, pageWidth / 2 + margin, margin + (pageContentHeight / 2) - (textLines.length * 6), { baseline: 'top' });
            
            if (i < book.pages.length - 1) doc.addPage();
        }
        doc.save(`${book.title.replace(/\s/g, '-')}.pdf`);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Could not generate PDF. The images might be protected. Please try again.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const progress = ((currentPage + 1) / book.pages.length) * 100;

  return (
    <div className="relative flex h-screen min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-text-color dark:text-white overflow-hidden">
      <audio 
        ref={audioRef} 
        src={audioUrl || ''}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleAudioEnded}
        hidden 
      />
      <header className="flex items-center p-4 pb-2 justify-between shrink-0 z-10">
        <button onClick={onBack} className="flex items-center justify-center rounded-xl h-12 w-12 bg-surface-light/50 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-3xl">close</span>
        </button>
        <div className="flex-1 px-4">
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <p className="text-text-color dark:text-gray-200 text-sm font-bold truncate pr-2">{book.title}</p>
                    <p className="text-text-color/80 dark:text-gray-300 text-sm font-bold">{currentPage + 1}/{book.pages.length}</p>
                </div>
                <div className="rounded-full bg-surface-light/50 dark:bg-black/20 h-2.5">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleToggleBookmark} className="flex items-center justify-center rounded-xl h-12 w-12 bg-surface-light/50 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0"}}>{isBookmarked ? 'bookmark' : 'bookmark_border'}</span>
            </button>
            <button onClick={() => setShowShareModal(true)} className="flex items-center justify-center rounded-xl h-12 w-12 bg-surface-light/50 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><ShareIcon className="w-6 h-6"/></button>
            <button onClick={handleExportToPdf} disabled={isGeneratingPdf} className="flex items-center justify-center rounded-xl h-12 w-12 bg-surface-light/50 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"><DownloadIcon className="w-6 h-6"/></button>
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center items-center px-4 py-2">
        <div className="w-full max-w-4xl aspect-[8/5] bg-book-page dark:bg-surface-dark rounded-xl lg:rounded-2xl shadow-2xl flex relative p-4 lg:p-6 gap-4 lg:gap-6">
            <div className="w-1/2 bg-center bg-no-repeat bg-cover rounded-lg" style={{backgroundImage: `url("${page.imageUrl}")`}}></div>
            <div className="w-1/2 flex flex-col justify-center">
                <p className="text-text-color dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-normal leading-relaxed">
                   {page.text}
                </p>
            </div>
            <button onClick={goToPrevPage} disabled={currentPage === 0} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 p-2 rounded-full bg-book-page/80 dark:bg-slate-700/80 shadow-lg text-text-color dark:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <button onClick={goToNextPage} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-2 rounded-full bg-book-page/80 dark:bg-slate-700/80 shadow-lg text-text-color dark:text-white">
                <span className="material-symbols-outlined">arrow_forward_ios</span>
            </button>
        </div>
      </main>

      <footer className="flex justify-center items-center gap-2 sm:gap-4 px-4 py-3 shrink-0">
        <button onClick={handleRewind} className="flex items-center justify-center rounded-xl h-16 w-16 bg-surface-light/50 dark:bg-black/20 text-text-color dark:text-white">
            <span className="material-symbols-outlined text-4xl">replay_10</span>
        </button>
        <button onClick={handlePlayPause} disabled={isAudioLoading} className="flex items-center justify-center rounded-2xl h-20 w-20 text-white bg-primary shadow-lg disabled:bg-gray-500">
            {isAudioLoading ? <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div> : <span className="material-symbols-outlined text-6xl">{isPlaying ? 'pause' : 'play_arrow'}</span>}
        </button>
        <button onClick={handleSpeedChange} className="relative flex items-center justify-center rounded-xl h-16 w-16 bg-surface-light/50 dark:bg-black/20 text-text-color dark:text-white">
            <span className="material-symbols-outlined text-4xl">speed</span>
            <span className="absolute bottom-1 right-1 text-xs font-bold bg-black/20 text-white rounded-full px-1">{playbackSpeed}x</span>
        </button>
        <button
          onClick={handleToggleAutoplay}
          className={`relative flex items-center justify-center rounded-xl h-16 w-16 transition-all duration-300 overflow-hidden ${isContinuousPlay ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-surface-light/50 dark:bg-black/20 text-text-color dark:text-white'}`}
          aria-label={t('autoplay')}
          aria-pressed={isContinuousPlay}
        >
            <span className="material-symbols-outlined text-4xl relative">autoplay</span>
        </button>
      </footer>

      {showShareModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowShareModal(false)}>
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl max-w-sm w-11/12 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-2 text-brand-blue dark:text-white">{t('shareTitle')}</h3>
                <p className="text-brand-purple dark:text-white/70 mb-4">{t('shareSubtitle')}</p>
                {qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto rounded-lg border-4 border-white dark:border-brand-blue/30 shadow-md"/> : <Loader />}
                <div className="flex w-full mt-4 rounded-lg bg-light-gray dark:bg-brand-blue/20 p-1">
                    <input type="text" readOnly value={shareUrl} className="flex-grow bg-transparent text-sm p-2 text-brand-blue dark:text-white/80 focus:outline-none" />
                    <button onClick={() => { navigator.clipboard.writeText(shareUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);}} className="bg-primary text-white font-bold py-2 px-4 rounded-md text-sm transition-colors hover:opacity-90">{linkCopied ? t('copied') : t('copy')}</button>
                </div>
                <button onClick={() => setShowShareModal(false)} className="mt-4 w-full bg-light-gray dark:bg-brand-blue/30 text-brand-purple dark:text-white/80 font-bold py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-brand-blue/40">{t('close')}</button>
            </div>
        </div>
      )}

       {isGeneratingPdf && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
                <Loader message={t('generatingPdf')} />
            </div>
       )}
    </div>
  );
};

export default ReadBook;