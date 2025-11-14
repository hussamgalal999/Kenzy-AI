import React from 'react';
import { View } from '../types';
import { NAVIGATION_ITEMS } from '../constants';
import { useI18n } from '../i18n';

interface BottomNavBarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, setCurrentView }) => {
  const { t } = useI18n();

  const getTitleKey = (title: string) => {
    switch (title) {
      case 'Library': return 'library';
      case 'Playground': return 'playground';
      case 'Create Story': return 'createStory';
      case 'PDF Reader': return 'pdfReader';
      case 'My Progress': return 'myProgress';
      case 'Store': return 'store';
      default: return title.toLowerCase();
    }
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-lg border-t border-light-gray dark:border-brand-blue/30">
      <div className="flex justify-around items-center h-full px-4">
        {NAVIGATION_ITEMS.map(({ view, title, icon }) => {
          const isActive = currentView === view;
          return (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-brand-purple dark:text-white/70'
              }`}
            >
              <div className="icon-md">
                <span className="material-symbols-outlined" style={{fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
              </div>
              <p className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>{t(getTitleKey(title))}</p>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
