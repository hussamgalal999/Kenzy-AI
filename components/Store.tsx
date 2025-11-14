import React, { useState, useContext } from 'react';
import { useI18n } from '../i18n';
import ViewWrapper from './ViewWrapper';
import { AuthContext } from '../contexts/AuthContext';
import { STORE_ITEMS } from '../constants';
import { StoreItem } from '../types';
import { userService } from '../services/userService';
import { GemIcon } from './icons';

const Store: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useI18n();
    const { user, userProfile, refreshUserProfile } = useContext(AuthContext);
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState<StoreItem | null>(null);

    const handlePurchase = async (item: StoreItem) => {
        if (!user || !userProfile || isPurchasing) return;
        
        setIsPurchasing(item.id);
        const result = await userService.purchaseStoreItem(user.uid, item);
        if (result.success) {
            await refreshUserProfile();
        } else {
            const messageKey = result.message.replace(/[\s.]/g, '').toLowerCase();
            alert(t(messageKey) || result.message);
        }
        setIsPurchasing(null);
        setShowConfirmModal(null);
    };
    
    const ownedAvatars = userProfile?.purchasedAvatars || [];

    return (
        <ViewWrapper title={t('store')} onBack={onBack}>
            <div className="flex flex-col">
                <div className="flex items-center justify-end gap-2 p-4 mb-4 bg-light-gray dark:bg-brand-blue/20 rounded-xl">
                    <p className="font-bold text-brand-purple dark:text-white/80">{t('yourGems')}:</p>
                    <div className="flex items-center gap-2 bg-white dark:bg-brand-blue/30 px-4 py-2 rounded-full">
                        <GemIcon className="w-6 h-6 text-cyan-500" />
                        <span className="text-xl font-bold text-brand-blue dark:text-white">{userProfile?.gems ?? 0}</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-brand-blue dark:text-white mb-4">{t('newAvatars')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {STORE_ITEMS.map(item => {
                        const isOwned = ownedAvatars.includes(item.imageUrl);
                        const canAfford = (userProfile?.gems ?? 0) >= item.cost;
                        return (
                            <div key={item.id} className="bg-white dark:bg-brand-blue/20 p-4 rounded-xl text-center shadow-sm">
                                <img src={item.imageUrl} alt={item.name} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-light-gray dark:border-brand-blue/30 mb-3" />
                                <h3 className="font-bold text-brand-blue dark:text-white">{item.name}</h3>
                                {isOwned ? (
                                    <p className="font-bold text-green-500 mt-2">{t('owned')}</p>
                                ) : (
                                    <button 
                                        onClick={() => setShowConfirmModal(item)}
                                        disabled={!canAfford || !!isPurchasing}
                                        className="w-full mt-2 bg-primary text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <GemIcon className="w-4 h-4" />
                                        <span>{item.cost}</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {showConfirmModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowConfirmModal(null)}>
                        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl max-w-sm w-11/12 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-2xl font-bold mb-2 text-brand-blue dark:text-white">{t('confirmPurchase')}</h3>
                            <img src={showConfirmModal.imageUrl} alt={showConfirmModal.name} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white dark:border-brand-blue/30 my-4" />
                            <p className="text-brand-purple dark:text-white/70 mb-4">{t('purchaseItem', { name: showConfirmModal.name, cost: showConfirmModal.cost.toString() })}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setShowConfirmModal(null)} className="flex-1 bg-light-gray dark:bg-brand-blue/30 text-brand-purple dark:text-white/80 font-bold py-3 rounded-lg">{t('cancel')}</button>
                                <button onClick={() => handlePurchase(showConfirmModal)} disabled={isPurchasing === showConfirmModal.id} className="flex-1 bg-primary text-white font-bold py-3 rounded-lg disabled:bg-gray-500">
                                    {isPurchasing === showConfirmModal.id ? t('purchasing') : t('buy')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ViewWrapper>
    );
};

export default Store;
