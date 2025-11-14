import React from 'react';
import { View } from '../types';
import { useI18n } from '../i18n';
import ViewWrapper from './ViewWrapper';

interface AiPlaygroundProps {
  navigate: (view: View) => void;
  onBack: () => void;
}

const AiPlayground: React.FC<AiPlaygroundProps> = ({ navigate, onBack }) => {
  const { t } = useI18n();

  const features = [
    { view: View.ImageStudio, title: t('imageStudio'), description: t('imageStudioDesc'), icon: 'image', color: 'purple' },
    { view: View.VideoLab, title: t('videoLab'), description: t('videoLabDesc'), icon: 'movie', color: 'blue' },
    { view: View.ConversationHub, title: t('conversationHub'), description: t('conversationHubDesc'), icon: 'chat', color: 'green' },
    { view: View.WorldExplorer, title: t('worldExplorer'), description: t('worldExplorerDesc'), icon: 'travel_explore', color: 'yellow' },
    { view: View.DeepThinker, title: t('deepThinker'), description: t('deepThinkerDesc'), icon: 'psychology', color: 'rose' },
  ];

  const colors: { [key: string]: string } = {
    purple: 'bg-purple-500/10 text-purple-400',
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    rose: 'bg-rose-500/10 text-rose-400',
  };

  return (
    <ViewWrapper title={t('aiPlaygroundTitle')} onBack={onBack} description={t('aiPlaygroundSubtitle')}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => (
          <button
            key={feature.view}
            onClick={() => navigate(feature.view)}
            className="p-6 bg-white dark:bg-surface-dark rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all text-left space-y-3"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[feature.color]}`}>
              <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
            </div>
            <h3 className="text-lg font-bold">{feature.title}</h3>
            <p className="text-sm text-brand-purple dark:text-white/60">{feature.description}</p>
          </button>
        ))}
      </div>
    </ViewWrapper>
  );
};

export default AiPlayground;