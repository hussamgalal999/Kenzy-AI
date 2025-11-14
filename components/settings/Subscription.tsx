import React from 'react';
import ViewWrapper from '../ViewWrapper';
import { useI18n } from '../../i18n';

interface SubscriptionProps {
  onBack: () => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ onBack }) => {
    const { t } = useI18n();
    return (
        <ViewWrapper title={t('subscriptionDetails')} onBack={onBack}>
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-brand-teal to-primary text-white p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm opacity-80">{t('currentPlan')}</p>
                            <h2 className="text-2xl font-bold">{t('kenzyPremium')}</h2>
                        </div>
                        <span className="material-symbols-outlined text-4xl opacity-50">workspace_premium</span>
                    </div>
                    <div className="mt-6 text-sm opacity-80">
                        <p>{t('renewsOn')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button className="w-full text-start p-4 flex items-center gap-4 transition-colors bg-white dark:bg-brand-blue/20 rounded-lg hover:bg-light-gray dark:hover:bg-brand-blue/30">
                        <span className="material-symbols-outlined text-brand-purple/80 dark:text-white/80">settings</span>
                        <span className="flex-1 font-medium">{t('manageSubscription')}</span>
                    </button>
                     <button className="w-full text-start p-4 flex items-center gap-4 transition-colors bg-white dark:bg-brand-blue/20 rounded-lg hover:bg-light-gray dark:hover:bg-brand-blue/30">
                        <span className="material-symbols-outlined text-brand-purple/80 dark:text-white/80">arrow_upward</span>
                        <span className="flex-1 font-medium">{t('upgradePlan')}</span>
                    </button>
                </div>
            </div>
        </ViewWrapper>
    );
};

export default Subscription;
