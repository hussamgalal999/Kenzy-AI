import React from 'react';
import { BackArrowIcon } from './icons';
import { useI18n } from '../i18n';

interface ViewWrapperProps {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
  description?: string;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ title, children, onBack, description }) => {
  const { t } = useI18n();
  return (
    <div className="p-4 sm:p-6 md:p-8 animate-fade-in h-full flex flex-col text-brand-blue dark:text-white">
      <div className="mb-6 flex-shrink-0">
        <div className="relative flex h-10 items-center justify-center">
          <button
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm font-semibold text-brand-purple transition-colors hover:text-primary dark:text-white/70 rtl:left-auto rtl:right-0"
          >
            <BackArrowIcon className="h-5 w-5 transform rtl:rotate-180" />
            {t('back')}
          </button>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        {description && <p className="text-brand-purple dark:text-white/70 mt-2">{description}</p>}
      </div>
      <div className="flex-grow overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default ViewWrapper;