import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import Loader from './Loader';
import { 
    SpeakerIcon, StopIcon, ZoomInIcon, ZoomOutIcon, BackArrowIcon,
    BookmarkIconOutline, BookmarkIconSolid, TuneIcon, SearchIcon,
    FullscreenOpenIcon, PrintIcon, OutlineIcon, ThumbnailsIcon,
    SummarizeIcon, QuestionIcon, PanToolIcon
} from './icons';
import { geminiService } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy, TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';
import { useI18n } from '../i18n';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

// --- Types ---
type PageTextContent = { page: number; text: string; items: TextItem[] };
type OutlineNode = { title: string; bold: boolean; italic: boolean; color: Uint8ClampedArray; dest: any; items: OutlineNode[] };
type SearchResult = { page: number; context: string };

// FIX: Add helper functions for audio decoding.
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


// --- Main Component ---
const PDFReader: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useI18n();
    const [file, setFile] = useState<File | null>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [pagesText, setPagesText] = useState<PageTextContent[]>([]);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // View & Interaction State
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
    const [isPanMode, setIsPanMode] = useState(false);
    const [transform, setTransform] = useState({ scale: 1.5, x: 0, y: 0 });
    
    // Refs
    const viewerRef = useRef<HTMLDivElement>(null);
    const pageContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Audio & Highlight State
    const [isReadingAloud, setIsReadingAloud] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const isNarrationCancelledRef = useRef(false);
    const [highlightedSentence, setHighlightedSentence] = useState<string | null>(null);

    // Stop audio narration and clean up resources
    const stopNarration = useCallback(() => {
        isNarrationCancelledRef.current = true;
        try {
            currentSourceRef.current?.stop();
        } catch(e) { /* Ignore error if already stopped */ }
        currentSourceRef.current?.disconnect();
        currentSourceRef.current = null;
        if (audioContextRef.current?.state === 'running') {
            audioContextRef.current.close().catch(console.error);
        }
        audioContextRef.current = null;
        setIsReadingAloud(false);
        setHighlightedSentence(null);
    }, []);
    
    useEffect(() => {
        return () => stopNarration(); // Cleanup on unmount
    }, [stopNarration]);

    // Load and process the PDF file
    const loadPdf = async (fileToLoad: File) => {
        setIsLoading(true);
        setLoadingMessage(t('loadingMessageStory'));
        setError(null);
        setPdfDoc(null);
        setPagesText([]);

        try {
            const typedarray = new Uint8Array(await fileToLoad.arrayBuffer());
            const doc = await pdfjsLib.getDocument(typedarray).promise;
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            pageRefs.current = Array(doc.numPages).fill(null);

            setLoadingMessage(t('loadingMessagePage', { page: '' }));
            const textPromises = Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1).then(page => page.getTextContent()));
            const textContents = await Promise.all(textPromises);
            
            const extractedPagesText = textContents.map((content, i) => ({
                page: i + 1,
                text: content.items.map(item => ('str' in item ? item.str : '')).join(''),
                items: content.items.filter((item): item is TextItem => 'str' in item),
            }));
            setPagesText(extractedPagesText);
        } catch (err) {
            console.error("Failed to load PDF:", err);
            setError(t('pdfLoadError'));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    // Handle file selection from dropzone
    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            setFile(files[0]);
            loadPdf(files[0]);
        }
    };
    
    // Update current page number based on scroll position
    useEffect(() => {
        if (isPanMode) return; // Don't track page number when panning
        const observer = new IntersectionObserver(
            (entries) => {
                const intersecting = entries.find(e => e.isIntersecting);
                if (intersecting) {
                    const pageNum = parseInt(intersecting.target.getAttribute('data-page-number') || '0', 10);
                    if (pageNum) setCurrentPage(pageNum);
                }
            }, { root: viewerRef.current, threshold: 0.5 }
        );
        const refs = pageRefs.current;
        refs.forEach(ref => { if (ref) observer.observe(ref); });
        return () => { refs.forEach(ref => { if (ref) observer.unobserve(ref); }); };
    }, [pdfDoc, isPanMode]);

    // Handle the "Read Aloud" feature with sentence-by-sentence generation and playback
    const handleReadAloud = async () => {
        if (isReadingAloud) {
            stopNarration();
            return;
        }
        setIsReadingAloud(true);
        isNarrationCancelledRef.current = false;
    
        const fullText = pagesText.slice(currentPage - 1).map(p => p.text).join(' ').replace(/\s+/g, ' ').trim();
        const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length === 0) {
            setIsReadingAloud(false);
            return;
        }
    
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        let nextStartTime = audioContextRef.current.currentTime;
    
        const audioBufferQueue: { buffer: AudioBuffer, sentence: string }[] = [];
        let isPlayingFromQueue = false;
        let prefetchIndex = 0;
    
        const playFromQueue = async () => {
            if (isPlayingFromQueue || audioBufferQueue.length === 0 || isNarrationCancelledRef.current) {
                if (!isPlayingFromQueue && prefetchIndex >= sentences.length && audioBufferQueue.length === 0) {
                    stopNarration();
                }
                return;
            }
            isPlayingFromQueue = true;
    
            while (audioBufferQueue.length > 0 && !isNarrationCancelledRef.current) {
                const { buffer, sentence } = audioBufferQueue.shift()!;
                setHighlightedSentence(sentence);
    
                await new Promise<void>((resolve) => {
                    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                        resolve(); return;
                    }
                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContextRef.current.destination);
                    const startTime = Math.max(nextStartTime, audioContextRef.current.currentTime);
                    source.start(startTime);
                    nextStartTime = startTime + buffer.duration;
                    currentSourceRef.current = source;
                    source.onended = () => {
                        if (currentSourceRef.current === source) currentSourceRef.current = null;
                        resolve();
                    };
                });
            }
    
            isPlayingFromQueue = false;
            // Check again if we should stop or if more items have been queued
            if (prefetchIndex >= sentences.length && audioBufferQueue.length === 0) {
                stopNarration();
            } else {
                playFromQueue();
            }
        };
    
        const prefetchAndQueueAudio = async () => {
            while (prefetchIndex < sentences.length && audioBufferQueue.length < 3 && !isNarrationCancelledRef.current) {
                const sentenceToFetch = sentences[prefetchIndex].trim();
                prefetchIndex++;
                if (!sentenceToFetch) continue;
    
                try {
                    const base64Audio = await geminiService.generateSpeech(sentenceToFetch);
                    if (isNarrationCancelledRef.current || !audioContextRef.current) break;
                    
                    const pcmData = decode(base64Audio);
                    const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current, 24000, 1);
                    
                    if (isNarrationCancelledRef.current) break;
                    
                    audioBufferQueue.push({ buffer: audioBuffer, sentence: sentenceToFetch });
                    playFromQueue();
                } catch (err) {
                    console.error("Error prefetching audio:", err);
                    break; 
                }
            }
        };
    
        prefetchAndQueueAudio();
    };

    const handleZoom = (newScale: number) => setTransform(t => ({...t, scale: newScale}));

    const handleJumpToPage = (pageNumber: number) => {
        const pageElement = pageRefs.current[pageNumber - 1];
        pageElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Render states: Initial, Loading, Error, Success
    if (!file) return <div className="flex flex-col h-screen bg-[#222831]"><Toolbar onBack={onBack} /><div className="flex-grow flex items-center justify-center p-4"><FileDropzone onFileChange={handleFileChange} /></div></div>;
    if (isLoading) return <div className="flex items-center justify-center h-screen bg-[#222831] text-white"><Loader message={loadingMessage} /></div>;
    if (error) return <div className="flex flex-col items-center justify-center h-screen bg-[#222831] text-white p-4"><p className="text-red-500">{error}</p><button onClick={() => setFile(null)} className="mt-4 px-4 py-2 bg-primary text-white rounded">{t('tryAgain')}</button></div>;

    return (
        <div className="pdf-reader-container flex flex-col h-screen w-full bg-[#393E46] text-white overflow-hidden">
            <Toolbar fileName={file.name} currentPage={currentPage} numPages={numPages} onBack={onBack} onToggleTools={() => setIsToolsPanelOpen(p => !p)} />
            
            <div className="flex-1 flex relative overflow-hidden">
                <Viewer
                    pdfDoc={pdfDoc}
                    numPages={numPages}
                    pageRefs={pageRefs}
                    highlightedSentence={highlightedSentence}
                    isPanMode={isPanMode}
                    transform={transform}
                    setTransform={setTransform}
                    viewerRef={viewerRef}
                    pageContainerRef={pageContainerRef}
                />

                <ToolsPanel
                    isOpen={isToolsPanelOpen}
                    onClose={() => setIsToolsPanelOpen(false)}
                    pdfDoc={pdfDoc}
                    pagesText={pagesText}
                    isPanMode={isPanMode}
                    setIsPanMode={setIsPanMode}
                    onJumpToPage={handleJumpToPage}
                />
            </div>
            
            <Controls
                isReadingAloud={isReadingAloud}
                onReadAloud={handleReadAloud}
                scale={transform.scale}
                onZoom={handleZoom}
                isBookmarked={isBookmarked}
                onToggleBookmark={() => setIsBookmarked(p => !p)}
            />
        </div>
    );
};

// --- Child Components (Memoized) ---
const Toolbar = memo((props: { fileName?: string; currentPage?: number; numPages?: number; onBack: () => void; onToggleTools?: () => void; }) => {
    const { fileName, currentPage, numPages, onBack, onToggleTools } = props;
    const { t } = useI18n();
    return (
        <header className="flex items-center justify-between p-2 h-16 bg-[#1A1D24] border-b border-gray-700/50 flex-shrink-0 z-20 text-white">
            <button title={t('back')} onClick={onBack} className="p-2 rounded-full hover:bg-gray-700"><BackArrowIcon className="w-6 h-6"/></button>
            <div className="flex flex-col items-center text-center">
                <h2 className="font-semibold text-sm truncate max-w-[150px] sm:max-w-xs">{fileName || t('pdfReaderTitle')}</h2>
                {currentPage && numPages && <p className="text-xs text-gray-400">{currentPage} / {numPages}</p>}
            </div>
            <button title={t('tools')} onClick={onToggleTools} className="p-2 rounded-full hover:bg-gray-700"><TuneIcon className="w-6 h-6"/></button>
        </header>
    );
});

const Controls = memo((props: { isReadingAloud: boolean; onReadAloud: () => void; scale: number; onZoom: (s: number) => void; isBookmarked: boolean; onToggleBookmark: () => void; }) => {
    const { isReadingAloud, onReadAloud, scale, onZoom, isBookmarked, onToggleBookmark } = props;
    const { t } = useI18n();
    return (
        <footer className="flex items-center justify-center p-3 bg-[#1A1D24]/80 backdrop-blur-sm flex-shrink-0 z-20">
            <div className="flex items-center gap-4 bg-[#222831] p-2 rounded-full shadow-lg">
                <button title={t('zoomOut')} onClick={() => onZoom(Math.max(0.5, scale - 0.2))} className="p-3 rounded-full hover:bg-gray-700"><ZoomOutIcon className="w-6 h-6"/></button>
                <button title={isReadingAloud ? t('stopReading') : t('readAloud')} onClick={onReadAloud} className="p-4 rounded-full bg-primary text-white shadow-md hover:bg-green-500">
                    {isReadingAloud ? <StopIcon className="w-8 h-8"/> : <SpeakerIcon className="w-8 h-8"/>}
                </button>
                <button title={t('zoomIn')} onClick={() => onZoom(Math.min(5, scale + 0.2))} className="p-3 rounded-full hover:bg-gray-700"><ZoomInIcon className="w-6 h-6"/></button>
                <button title={t('bookmark')} onClick={onToggleBookmark} className="p-3 rounded-full hover:bg-gray-700">
                    {isBookmarked ? <BookmarkIconSolid className="w-6 h-6 text-primary"/> : <BookmarkIconOutline className="w-6 h-6"/>}
                </button>
            </div>
        </footer>
    );
});

const Viewer = memo((props: { pdfDoc: PDFDocumentProxy | null, numPages: number, pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>, highlightedSentence: string | null, isPanMode: boolean, transform: { scale: number, x: number, y: number }, setTransform: React.Dispatch<React.SetStateAction<{ scale: number, x: number, y: number }>>, viewerRef: React.RefObject<HTMLDivElement>, pageContainerRef: React.RefObject<HTMLDivElement> }) => {
    const { pdfDoc, numPages, pageRefs, highlightedSentence, isPanMode, transform, setTransform, viewerRef, pageContainerRef } = props;
    const [isDragging, setIsDragging] = useState(false);
    const panState = useRef({ isPanning: false, startX: 0, startY: 0 });
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        panState.current = { isPanning: true, startX: e.clientX - transform.x, startY: e.clientY - transform.y };
        setIsDragging(true);
        if (viewerRef.current) viewerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!panState.current.isPanning) return;
        setTransform(t => ({ ...t, x: e.clientX - panState.current.startX, y: e.clientY - panState.current.startY }));
    };

    const handleMouseUp = () => {
        panState.current.isPanning = false;
        setIsDragging(false);
        if (viewerRef.current) viewerRef.current.style.cursor = 'grab';
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.5, Math.min(5, transform.scale + scaleAmount));
        setTransform(t => ({...t, scale: newScale}));
    };
    
    return (
        <main
            ref={viewerRef}
            onMouseDown={isPanMode ? handleMouseDown : undefined}
            onMouseMove={isPanMode ? handleMouseMove : undefined}
            onMouseUp={isPanMode ? handleMouseUp : undefined}
            onMouseLeave={isPanMode ? handleMouseUp : undefined}
            onWheel={isPanMode ? handleWheel : undefined}
            className={`flex-1 overflow-hidden flex justify-center ${isPanMode ? 'cursor-grab' : 'overflow-auto'}`}
        >
            <div
                ref={pageContainerRef}
                className="space-y-6 p-4 sm:p-8"
                style={{
                    ...(isPanMode && { 
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    })
                }}
            >
                {pdfDoc && Array.from({ length: numPages }, (_, i) => (
                    <div key={i} className="flex justify-center">
                         <PdfPage 
                            pageNumber={i + 1}
                            pdfPagePromise={pdfDoc.getPage(i+1)} 
                            scale={isPanMode ? 1.5 : transform.scale}
                            pageRef={el => { pageRefs.current[i] = el; }}
                            highlightedSentence={highlightedSentence}
                        />
                    </div>
                ))}
            </div>
        </main>
    );
});


const PdfPage = memo<{ pageNumber: number, pdfPagePromise: Promise<PDFPageProxy>, scale: number, pageRef: (el: HTMLDivElement | null) => void, highlightedSentence: string | null }>(({ pageNumber, pdfPagePromise, scale, pageRef, highlightedSentence }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        pdfPagePromise.then(async (page) => {
            if (!isMounted || !canvasRef.current || !textLayerRef.current || !containerRef.current) return;
            const viewport = page.getViewport({ scale });
            containerRef.current.style.width = `${viewport.width}px`;
            containerRef.current.style.height = `${viewport.height}px`;
            canvasRef.current.height = viewport.height;
            canvasRef.current.width = viewport.width;
            
            const context = canvasRef.current.getContext('2d');
            if(context) page.render({ canvasContext: context, viewport }).promise;

            const textContent = await page.getTextContent();
            textLayerRef.current.innerHTML = '';
            pdfjsLib.renderTextLayer({ textContentSource: textContent, container: textLayerRef.current, viewport, textDivs: [] });
        });
        return () => { isMounted = false; };
    }, [pdfPagePromise, scale]);

    useEffect(() => {
        const textLayer = textLayerRef.current;
        if (!textLayer) return;

        const spans = Array.from(textLayer.querySelectorAll('span'));
        
        if (!highlightedSentence) {
            spans.forEach(span => span.style.backgroundColor = 'transparent');
            return;
        }

        const pageText = spans.map(span => span.textContent || '').join('');
        const sentenceIndex = pageText.indexOf(highlightedSentence);

        if (sentenceIndex === -1) {
            spans.forEach(span => span.style.backgroundColor = 'transparent');
            return;
        }

        let charCount = 0;
        spans.forEach(span => {
            const spanText = span.textContent || '';
            const spanStart = charCount;
            const spanEnd = spanStart + spanText.length;
            charCount = spanEnd;

            // Check for overlap between the span and the highlighted sentence
            if (spanStart < sentenceIndex + highlightedSentence.length && spanEnd > sentenceIndex) {
                 span.style.backgroundColor = 'rgba(19, 236, 91, 0.4)';
                 span.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            } else {
                span.style.backgroundColor = 'transparent';
            }
        });
    }, [highlightedSentence]);
    
    return (
        <div ref={pageRef} data-page-number={pageNumber} className="shadow-2xl">
            <div ref={containerRef} className="relative bg-white">
                <canvas ref={canvasRef} />
                <div ref={textLayerRef} className="textLayer" />
            </div>
        </div>
    );
});

const FileDropzone = memo<{ onFileChange: (files: FileList | null) => void }>(({ onFileChange }) => {
    const { t } = useI18n();
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
        else if (e.type === "dragleave") setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) onFileChange(e.dataTransfer.files);
    };

    return (
        <div
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`w-full max-w-lg p-12 flex flex-col items-center justify-center rounded-2xl text-center cursor-pointer transition-all duration-300 bg-[#1A1D24] border-2 border-dashed ${isDragging ? 'scale-105 border-primary' : 'border-gray-700 hover:border-gray-600'}`}
        >
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => onFileChange(e.target.files)} />
            <span className="material-symbols-outlined text-6xl text-gray-500">upload_file</span>
            <p className="mt-4 text-xl font-bold text-gray-200">{t('dragAndDropPdf')}</p>
            <p className="text-base text-gray-400">{t('orClickToSelect')}</p>
        </div>
    );
});

// --- Tools Panel and its Sub-components ---
type ToolsPanelProps = { isOpen: boolean; onClose: () => void; pdfDoc: PDFDocumentProxy | null; pagesText: PageTextContent[]; isPanMode: boolean; setIsPanMode: (p: boolean) => void; onJumpToPage: (p: number) => void; };

const ToolsPanel = memo((props: ToolsPanelProps) => {
    const { isOpen, onClose, pdfDoc, pagesText, isPanMode, setIsPanMode, onJumpToPage } = props;
    const { t } = useI18n();
    const [activeTool, setActiveTool] = useState<'search' | 'outline' | 'thumbnails' | 'ai'>('ai');

    const fullText = pagesText.map(p => p.text).join(' ');

    return (
        <div className={`absolute top-0 right-0 h-full w-80 md:w-96 bg-[#222831] shadow-2xl z-10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
                <header className="flex items-center justify-between p-3 border-b border-gray-700/50">
                    <h3 className="font-bold text-lg">{t('tools')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700"><span className="material-symbols-outlined">close</span></button>
                </header>
                <nav className="flex justify-around p-1 bg-[#1A1D24]">
                    <ToolTab icon={<AiToolsIcon />} label="AI" isActive={activeTool === 'ai'} onClick={() => setActiveTool('ai')} />
                    <ToolTab icon={<SearchIcon className="w-6 h-6"/>} label={t('search')} isActive={activeTool === 'search'} onClick={() => setActiveTool('search')} />
                    <ToolTab icon={<OutlineIcon className="w-6 h-6"/>} label={t('outline')} isActive={activeTool === 'outline'} onClick={() => setActiveTool('outline')} />
                    <ToolTab icon={<ThumbnailsIcon className="w-6 h-6"/>} label={t('thumbnails')} isActive={activeTool === 'thumbnails'} onClick={() => setActiveTool('thumbnails')} />
                </nav>
                <div className="flex-1 p-4 overflow-y-auto">
                    {activeTool === 'ai' && <AiTools fullText={fullText} />}
                    {activeTool === 'search' && <SearchTool pagesText={pagesText} onJumpToPage={onJumpToPage}/>}
                    {activeTool === 'outline' && <OutlineTool pdfDoc={pdfDoc} />}
                    {activeTool === 'thumbnails' && <p>Thumbnails coming soon!</p>}
                </div>
                <footer className="p-4 border-t border-gray-700/50">
                    <ViewControls isPanMode={isPanMode} onTogglePanMode={() => setIsPanMode(!isPanMode)} />
                </footer>
            </div>
        </div>
    );
});

const ToolTab = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-md w-full transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-gray-700'}`}>
        {icon}
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const AiTools = ({ fullText }: { fullText: string }) => {
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [question, setQuestion] = useState('');
    const [activeAi, setActiveAi] = useState<'summary' | 'qa'>('summary');

    const handleSummarize = async () => {
        setIsLoading(true); setResult('');
        try {
            const summary = await geminiService.summarizePdfText(fullText);
            setResult(summary);
        } catch (e) { console.error(e); setResult(t('errorOccurred')); }
        setIsLoading(false);
    };
    const handleAsk = async () => {
        if (!question) return;
        setIsLoading(true); setResult('');
        try {
            const answer = await geminiService.answerPdfQuestion(fullText, question);
            setResult(answer);
        } catch (e) { console.error(e); setResult(t('errorOccurred')); }
        setIsLoading(false);
    };

    return (
        <div className="space-y-4">
            <h4 className="font-bold">{t('aiTools')}</h4>
            <div className="flex gap-2">
                <button onClick={() => {setActiveAi('summary'); setResult('');}} className={`flex-1 p-2 rounded ${activeAi === 'summary' ? 'bg-primary' : 'bg-gray-600'}`}>{t('summarize')}</button>
                <button onClick={() => {setActiveAi('qa'); setResult('');}} className={`flex-1 p-2 rounded ${activeAi === 'qa' ? 'bg-primary' : 'bg-gray-600'}`}>{t('askAQuestion')}</button>
            </div>
            {activeAi === 'summary' && <button onClick={handleSummarize} disabled={isLoading} className="w-full p-2 bg-primary rounded disabled:bg-gray-500">{t('getSummary')}</button>}
            {activeAi === 'qa' && (
                <div className="flex gap-2"><input value={question} onChange={e => setQuestion(e.target.value)} placeholder={t('yourQuestionPlaceholder')} className="flex-1 bg-gray-700 p-2 rounded" /><button onClick={handleAsk} disabled={isLoading || !question} className="p-2 bg-primary rounded disabled:bg-gray-500">{t('ask')}</button></div>
            )}
            {isLoading && <Loader message={t('thinking')} />}
            {result && <div className="p-2 bg-gray-800 rounded prose prose-invert max-w-none text-sm whitespace-pre-wrap">{result}</div>}
        </div>
    );
}

const SearchTool = ({ pagesText, onJumpToPage }: { pagesText: PageTextContent[], onJumpToPage: (p:number) => void }) => {
    const { t } = useI18n();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    
    useEffect(() => {
        if (!query || query.length < 3) { setResults([]); return; }
        const newResults: SearchResult[] = [];
        for (const page of pagesText) {
            const matchIndex = page.text.toLowerCase().indexOf(query.toLowerCase());
            if (matchIndex !== -1) {
                const start = Math.max(0, matchIndex - 20);
                const end = Math.min(page.text.length, matchIndex + query.length + 20);
                newResults.push({ page: page.page, context: `...${page.text.slice(start, end)}...`});
            }
        }
        setResults(newResults);
    }, [query, pagesText]);

    return (
        <div className="space-y-2">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('searchDocument')} className="w-full bg-gray-700 p-2 rounded"/>
            <div className="space-y-1 max-h-60 overflow-y-auto">
                {results.map((res, i) => (
                    <button key={i} onClick={() => onJumpToPage(res.page)} className="w-full text-left p-2 bg-gray-800 rounded hover:bg-gray-700">
                        <p className="font-bold text-xs">Page {res.page}</p>
                        <p className="text-xs text-gray-400" dangerouslySetInnerHTML={{__html: res.context.replace(new RegExp(query, "gi"), (match) => `<mark class="bg-primary text-black">${match}</mark>`)}}></p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const OutlineTool = ({ pdfDoc }: { pdfDoc: PDFDocumentProxy | null }) => {
    const { t } = useI18n();
    const [outline, setOutline] = useState<OutlineNode[] | null>(null);
    useEffect(() => {
        pdfDoc?.getOutline().then(setOutline);
    }, [pdfDoc]);

    if (!outline || outline.length === 0) return <p className="text-sm text-gray-400">{t('noOutline')}</p>;
    // Simplified outline render - a full implementation would handle nested items and destinations.
    return (
        <ul className="space-y-1 text-sm">{outline.map((item, i) => <li key={i} className="p-1 rounded hover:bg-gray-700 cursor-pointer">{item.title}</li>)}</ul>
    );
};

const ViewControls = ({ isPanMode, onTogglePanMode }: { isPanMode: boolean, onTogglePanMode: () => void }) => {
    const { t } = useI18n();
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                    <PanToolIcon className="w-5 h-5" />
                    <span className="font-medium text-sm">{t('lockPage')}</span>
                </div>
                <button onClick={onTogglePanMode} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isPanMode ? 'bg-primary' : 'bg-gray-600'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isPanMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
             <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.body.requestFullscreen()} className="w-full flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                <FullscreenOpenIcon className="w-5 h-5" /><span className="text-sm font-medium">{t('toggleFullscreen')}</span>
            </button>
            <button onClick={() => window.print()} className="w-full flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                <PrintIcon className="w-5 h-5" /><span className="text-sm font-medium">{t('printDocument')}</span>
            </button>
        </div>
    );
};

const AiToolsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 01.75.75v.516a8.966 8.966 0 012.32-.052l.206-.013a.75.75 0 01.737.843l-.04 1.23a9.043 9.043 0 012.35 1.488l.745.745a.75.75 0 01-.06 1.054l-1.018.849a9.041 9.041 0 011.239 3.42l.063.483a.75.75 0 01-.632.859l-.953.136a8.966 8.966 0 01-.052 2.32v.516a.75.75 0 01-1.5 0v-.516a8.966 8.966 0 01-2.32.052l-.206.013a.75.75 0 01-.737-.843l.04-1.23a9.043 9.043 0 01-2.35-1.488l-.745-.745a.75.75 0 01.06-1.054l1.018-.849a9.041 9.041 0 01-1.239-3.42l-.063-.483a.75.75 0 01.632-.859l.953-.136a8.966 8.966 0 01.052-2.32V3a.75.75 0 01.75-.75zm0 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>
);


export default PDFReader;