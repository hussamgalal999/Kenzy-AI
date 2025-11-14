import React, { useState } from 'react';
import ViewWrapper from './ViewWrapper';
import { ChevronRightIcon, LanguageIcon, DisplayIcon } from './icons';
import { useI18n } from '../i18n';
import { View, User } from '../types';
import { logout } from '../services/firebase';
import SearchBox from './SearchBox';
import { DEFAULT_AVATAR_URL } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsProps {
  onBack: () => void;
  navigate: (view: View) => void;
  user: User | null;
}

const Settings: React.FC<SettingsProps> = ({ onBack, navigate, user }) => {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { view: View.AccountInfo, icon: 'person', label: t('accountInformation') },
    { view: View.Subscription, icon: 'credit_card', label: t('subscription') },
    { view: View.Notifications, icon: 'notifications', label: t('notifications') },
    { view: View.Privacy, icon: 'security', label: t('privacyAndSecurity') },
    { view: View.TrustCenter, icon: 'verified_user', label: t('trustCenter') },
    { view: View.Help, icon: 'help', label: t('helpAndSupport') },
  ];
  
  const filteredMenuItems = menuItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    try {
        await logout();
        // The AuthProvider will automatically handle redirecting to the Login screen.
    } catch (error) {
        console.error("Logout failed:", error);
    }
  };

  return (
    <ViewWrapper title={t('settings')} onBack={onBack}>
      <div className="flex flex-col items-center w-full">
        <SearchBox
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('searchPlaceholderSettings')}
        />
        
        <div className="relative mb-4">
          <img 
            className="h-28 w-28 rounded-full object-cover shadow-lg border-4 border-white dark:border-brand-blue/20" 
            src={user?.photoURL || DEFAULT_AVATAR_URL}
            alt="User avatar"
          />
        </div>
        
        <h2 className="text-2xl font-bold text-brand-blue dark:text-white">{user?.displayName || 'Hossam Galal'}</h2>
        <p className="text-brand-purple dark:text-white/70 mb-8">{user?.email || 'App is in offline mode.'}</p>
        
        <div className="w-full bg-white dark:bg-brand-blue/20 rounded-xl shadow-sm">
          {filteredMenuItems.map((item, index) => (
            <button key={item.label} onClick={() => navigate(item.view)} className={`w-full text-start p-4 flex items-center gap-4 transition-colors hover:bg-light-gray dark:hover:bg-brand-blue/30 ${index !== filteredMenuItems.length - 1 ? 'border-b border-background-light dark:border-background-dark' : ''}`}>
              <span className="material-symbols-outlined text-brand-purple/60 dark:text-white/60">{item.icon}</span>
              <span className="flex-1 text-brand-blue dark:text-white font-medium">{item.label}</span>
              <ChevronRightIcon className="w-5 h-5 text-brand-purple/40 dark:text-white/40 transform rtl:rotate-180" />
            </button>
          ))}
        </div>

        <div className="w-full mt-6 bg-white dark:bg-brand-blue/20 rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <DisplayIcon className="w-6 h-6 text-brand-purple/60 dark:text-white/60" />
                <span className="text-brand-blue dark:text-white font-medium">{t('appearance')}</span>
            </div>
            <div className="flex items-center gap-1 bg-light-gray dark:bg-brand-blue/30 p-1 rounded-lg">
                <button onClick={() => setTheme('light')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${theme === 'light' ? 'bg-white dark:bg-brand-blue/50 text-primary shadow' : 'text-brand-purple dark:text-white/70'}`}>{t('light')}</button>
                <button onClick={() => setTheme('dark')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${theme === 'dark' ? 'bg-white dark:bg-brand-blue/50 text-primary shadow' : 'text-brand-purple dark:text-white/70'}`}>{t('dark')}</button>
                <button onClick={() => setTheme('system')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-brand-blue/50 text-primary shadow' : 'text-brand-purple dark:text-white/70'}`}>{t('system')}</button>
            </div>
        </div>

        <div className="w-full mt-6 bg-white dark:bg-brand-blue/20 rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <LanguageIcon className="w-6 h-6 text-brand-purple/60 dark:text-white/60" />
                <span className="text-brand-blue dark:text-white font-medium">{t('language')}</span>
            </div>
            <div className="flex items-center gap-1 bg-light-gray dark:bg-brand-blue/30 p-1 rounded-lg">
                <button onClick={() => setLanguage('en')} className={`px-4 py-1 text-sm font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white dark:bg-brand-blue/50 text-primary shadow' : 'text-brand-purple dark:text-white/70'}`}>EN</button>
                <button onClick={() => setLanguage('ar')} className={`px-4 py-1 text-sm font-bold rounded-md transition-colors ${language === 'ar' ? 'bg-white dark:bg-brand-blue/50 text-primary shadow' : 'text-brand-purple dark:text-white/70'}`}>AR</button>
            </div>
        </div>

        {user && (
          <button onClick={handleLogout} className="w-full mt-6 bg-red-500/10 text-red-500 font-bold py-3 px-4 rounded-lg transition-colors hover:bg-red-500/20 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">logout</span>
              {t('logout')}
          </button>
        )}
      </div>
    </ViewWrapper>
  );
};

export default Settings;