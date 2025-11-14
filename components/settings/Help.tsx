import React from 'react';
import ViewWrapper from '../ViewWrapper';
import { useI18n } from '../../i18n';

interface HelpProps {
  onBack: () => void;
}

const Help: React.FC<HelpProps> = ({ onBack }) => {
    const { t } = useI18n();

    return (
        <ViewWrapper title={t('helpCenter')} onBack={onBack}>
             <div className="space-y-6">
                <div className="bg-white dark:bg-brand-blue/20 p-6 rounded-2xl shadow-sm text-center">
                    <span className="material-symbols-outlined text-5xl text-brand-teal">quiz</span>
                    <h3 className="text-xl font-bold mt-2">{t('faq')}</h3>
                    <button className="mt-4 w-full bg-primary/10 text-primary font-bold py-3 rounded-lg hover:bg-primary/20 transition-colors">
                        {t('helpCenter')}
                    </button>
                </div>
                 <div className="bg-white dark:bg-brand-blue/20 p-6 rounded-2xl shadow-sm text-center">
                    <span className="material-symbols-outlined text-5xl text-brand-yellow">support_agent</span>
                    <h3 className="text-xl font-bold mt-2">{t('contactSupport')}</h3>
                    <p className="text-sm text-brand-purple dark:text-white/60 mt-1">{t('contactUsVia')}</p>
                    <a href="mailto:support@kenzy.ai" className="mt-4 block w-full bg-primary/10 text-primary font-bold py-3 rounded-lg hover:bg-primary/20 transition-colors">
                        {t('sendEmail')}
                    </a>
                </div>
             </div>
        </ViewWrapper>
    );
};

export default Help;
