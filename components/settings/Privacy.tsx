import React from 'react';
import ViewWrapper from '../ViewWrapper';
import { useI18n } from '../../i18n';
import { ChevronRightIcon } from '../icons';

interface PrivacyProps {
  onBack: () => void;
}

const Privacy: React.FC<PrivacyProps> = ({ onBack }) => {
    const { t } = useI18n();

    const ListItem: React.FC<{ label: string }> = ({ label }) => (
         <button className="w-full text-start p-4 flex items-center justify-between transition-colors bg-white dark:bg-brand-blue/20 rounded-lg hover:bg-light-gray dark:hover:bg-brand-blue/30">
            <span className="font-medium">{label}</span>
            <ChevronRightIcon className="w-5 h-5 text-brand-purple/40 dark:text-white/40 transform rtl:rotate-180" />
        </button>
    );

    return (
        <ViewWrapper title={t('privacyAndSecurity')} onBack={onBack}>
             <div className="space-y-4">
                <ListItem label={t('privacyPolicy')} />
                <ListItem label={t('termsOfService')} />
                <ListItem label={t('dataManagement')} />
             </div>
        </ViewWrapper>
    );
};

export default Privacy;
