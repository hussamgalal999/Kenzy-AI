import React, { useState, useEffect, useRef, useContext } from 'react';
import { Book, User, View } from '../types';
import { CreateIcon, MoreIcon, BookOpenIcon, ShareIcon, DownloadIcon, PDFReaderIcon, FireIcon, GemIcon } from './icons';
import { useI18n } from '../i18n';
import SearchBox from './SearchBox';
import { geminiService } from '../services/geminiService';
import { DEFAULT_AVATAR_URL } from '../constants';
import { AuthContext } from '../contexts/AuthContext';


type SelectBookOptions = {
    initialAction?: 'share' | 'pdf';
};
interface BookshelfProps {
  books: Book[];
  onSelectBook: (book: Book, options?: SelectBookOptions) => void;
  onNavigateToProfile: () => void;
  user: User | null;
  onNavigateToPdfReader: () => void;
}

type Tab = 'discover' | 'mybooks';

const Bookshelf: React.FC<BookshelfProps> = ({ books, onSelectBook, onNavigateToProfile, user, onNavigateToPdfReader }) => {
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const { t } = useI18n();
  const { userProfile } = useContext(AuthContext);

  const [discoverSearch, setDiscoverSearch] = useState('');
  const [myBooksSearch, setMyBooksSearch] = useState('');

  const myBooks = books.filter(b => b.createdBy === 'user');
  const discoverBooks = books.filter(b => b.createdBy !== 'user');

  const filteredDiscover = discoverBooks.filter(b => b.title.toLowerCase().includes(discoverSearch.toLowerCase()));
  const continueReadingBooks = filteredDiscover.filter(b => b.progress && b.progress > 0 && b.progress < 100);
  const recommendedBooks = filteredDiscover.filter(b => (b.rating && b.rating > 0) && (!b.progress || b.progress === 0 || b.progress === 100));
  
  const filteredMyBooks = myBooks.filter(b => b.title.toLowerCase().includes(myBooksSearch.toLowerCase()));


  return (
    <div className="flex flex-col">
      <header className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 gap-2">
        <h1 className="text-brand-blue dark:text-white text-3xl font-bold leading-tight tracking-tighter">{user ? `Hi, ${user.displayName?.split(' ')[0]}!` : t('library')}</h1>
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
             <button onClick={onNavigateToPdfReader} className="flex size-12 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <PDFReaderIcon className="w-7 h-7 text-brand-blue dark:text-white" />
            </button>
            <button onClick={onNavigateToProfile} className="flex size-12 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <img className="h-10 w-10 rounded-full" alt="User avatar" src={user?.photoURL || DEFAULT_AVATAR_URL}/>
            </button>
        </div>
      </header>

      {activeTab === 'discover' && (
        <SearchBox
            value={discoverSearch}
            onChange={setDiscoverSearch}
            placeholder={t('searchPlaceholderBooks')}
        />
      )}
      {activeTab === 'mybooks' && (
        <SearchBox
            value={myBooksSearch}
            onChange={setMyBooksSearch}
            placeholder={t('searchPlaceholderBooks')}
        />
      )}

      <div className="px-4 py-3 border-y border-light-gray dark:border-brand-blue/20">
          <div className="flex w-full rounded-full h-12 bg-light-gray dark:bg-brand-blue/20 p-1">
             <TabButton label={t('discover')} isActive={activeTab === 'discover'} onClick={() => setActiveTab('discover')} />
             <TabButton label={t('myBooks')} isActive={activeTab === 'mybooks'} onClick={() => setActiveTab('mybooks')} />
          </div>
      </div>
      
      {activeTab === 'discover' && (
        <div className="animate-fade-in">
           <h3 className="text-brand-blue dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">{t('continueReading')}</h3>
            <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-stretch px-4 gap-4">
                {continueReadingBooks.map(book => (
                    <ContinueReadingCard key={book.id} book={book} onSelect={() => onSelectBook(book)} />
                ))}
                </div>
            </div>

            <h3 className="text-brand-blue dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-8">{t('recommendedForYou')}</h3>
            <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-stretch px-4 gap-4">
                {recommendedBooks.map(book => (
                    <RecommendedCard key={book.id} book={book} onSelect={() => onSelectBook(book)} />
                ))}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'mybooks' && (
        <div className="animate-fade-in p-4">
            {filteredMyBooks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredMyBooks.map(book => (
                        <UserBookCard key={book.id} book={book} onSelect={onSelectBook} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-light-gray/50 dark:bg-brand-blue/10 rounded-2xl">
                    <div className="w-20 h-20 bg-brand-yellow/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <CreateIcon className="w-10 h-10 text-brand-yellow" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-blue dark:text-white">{t('bookshelfEmptyTitle')}</h3>
                    <p className="text-brand-purple dark:text-white/70 mt-2">{t('bookshelfEmptySubtitle')}</p>
                </div>
            )}
        </div>
      )}

    </div>
  );
};

const TabButton: React.FC<{label: string, isActive: boolean, onClick: () => void}> = ({ label, isActive, onClick}) => (
    <button onClick={onClick} className={`w-1/2 rounded-full text-sm font-bold transition-all duration-300 ${isActive ? 'bg-white dark:bg-brand-blue/50 shadow text-primary' : 'text-brand-purple dark:text-white/70'}`}>
        {label}
    </button>
);


const ContinueReadingCard: React.FC<{ book: Book, onSelect: () => void }> = ({ book, onSelect }) => (
  <div onClick={onSelect} className="flex h-full flex-1 flex-col gap-3 rounded-lg w-40 shrink-0 cursor-pointer group">
    <div className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl flex flex-col shadow-md group-hover:shadow-xl transition-shadow" style={{backgroundImage: `url("${book.coverUrl}")`}}></div>
    <div>
      <p className="text-brand-blue dark:text-white text-base font-bold leading-normal truncate">{book.title}</p>
      <div className="w-full bg-light-gray dark:bg-brand-blue/30 rounded-full h-2 mt-1">
        <div className="bg-brand-teal h-2 rounded-full" style={{width: `${book.progress}%`}}></div>
      </div>
    </div>
  </div>
);

const RecommendedCard: React.FC<{ book: Book, onSelect: () => void }> = ({ book, onSelect }) => (
  <div onClick={onSelect} className="flex h-full flex-1 flex-col gap-3 rounded-lg w-40 shrink-0 cursor-pointer group">
    <div className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl flex flex-col shadow-md group-hover:shadow-xl transition-shadow" style={{backgroundImage: `url("${book.coverUrl}")`}}></div>
    <div>
      <p className="text-brand-blue dark:text-white text-base font-bold leading-normal truncate">{book.title}</p>
      <div className="flex items-center gap-1 text-brand-yellow">
        {[...Array(5)].map((_, i) => (
            <div key={i} className={`icon-sm ${i < (book.rating || 0) ? '' : 'opacity-30'}`}><span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1, 'wght' 500"}}>star</span></div>
        ))}
      </div>
    </div>
  </div>
);

const UserBookCard: React.FC<{ book: Book, onSelect: (book: Book, options?: SelectBookOptions) => void }> = ({ book, onSelect }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useI18n();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    return (
        <div className="flex flex-col gap-2 relative">
            <div onClick={() => onSelect(book)} className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl flex flex-col shadow-md hover:shadow-xl transition-shadow cursor-pointer" style={{backgroundImage: `url("${book.coverUrl}")`}}></div>
            <div className="flex items-start justify-between">
                <p className="text-brand-blue dark:text-white text-sm font-bold leading-normal flex-1 pe-2">{book.title}</p>
                <button onClick={() => setMenuOpen(prev => !prev)} className="w-8 h-8 flex items-center justify-center rounded-full text-brand-purple/80 dark:text-white/80 hover:bg-light-gray dark:hover:bg-brand-blue/30">
                    <MoreIcon className="w-5 h-5" />
                </button>
            </div>
            {menuOpen && (
                <div ref={menuRef} className="absolute top-full end-0 mt-2 w-48 bg-white dark:bg-surface-dark rounded-lg shadow-2xl z-20 animate-fade-in-fast origin-top-right ring-1 ring-black/5">
                    <MenuItem icon={<BookOpenIcon className="w-5 h-5"/>} label={t('read')} onClick={() => { onSelect(book); setMenuOpen(false); }}/>
                    <MenuItem icon={<ShareIcon className="w-5 h-5"/>} label={t('share')} onClick={() => { onSelect(book, { initialAction: 'share' }); setMenuOpen(false); }}/>
                    <MenuItem icon={<DownloadIcon className="w-5 h-5"/>} label={t('exportPdf')} onClick={() => { onSelect(book, { initialAction: 'pdf' }); setMenuOpen(false); }}/>
                </div>
            )}
        </div>
    );
};

const MenuItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-blue dark:text-white/90 hover:bg-light-gray dark:hover:bg-brand-blue/30 first:rounded-t-lg last:rounded-b-lg">
        <span className="text-brand-purple dark:text-white/70">{icon}</span>
        <span>{label}</span>
    </button>
);


export default Bookshelf;
