import React, { useState, useContext } from 'react';
import ViewWrapper from './ViewWrapper';
import { useI18n } from '../i18n';
import { View, User } from '../types';
import { DEFAULT_AVATAR_URL, ACHIEVEMENTS_LIST } from '../constants';
import { updateUserProfile } from '../services/firebase';
import { AuthContext } from '../contexts/AuthContext';
import { FireIcon, GemIcon } from './icons';
import Loader from './Loader';

interface ProfileProps {
  onBack: () => void;
  navigate: (view: View) => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack, navigate }) => {
    const { t } = useI18n();
    const { user, userProfile, setUser, refreshUserProfile, loading } = useContext(AuthContext);
    const [isSaving, setIsSaving] = useState(false);
    
    const handleAvatarSelect = async (newAvatarUrl: string) => {
        if (!user || user.photoURL === newAvatarUrl || isSaving) return;

        setIsSaving(true);
        try {
            const updatedUser = await updateUserProfile({ photoURL: newAvatarUrl });
            setUser(updatedUser as User);
            await refreshUserProfile();
        } catch (error) {
            console.error("Failed to update avatar:", error);
            alert("Could not update your avatar. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !user || !userProfile) {
        return (
            <ViewWrapper title={t('profile')} onBack={onBack}>
                <div className="flex justify-center items-center h-full">
                    <Loader />
                </div>
            </ViewWrapper>
        );
    }

    const ownedAvatars = Array.from(new Set([DEFAULT_AVATAR_URL, ...(userProfile.purchasedAvatars || [])]));

    return (
        <ViewWrapper title={t('profile')} onBack={onBack}>
            <div className="flex flex-col items-center w-full space-y-8">
                {/* Profile Header */}
                <div className="relative">
                    <img
                        className="h-32 w-32 rounded-full object-cover shadow-lg border-4 border-white dark:border-brand-blue/20"
                        src={user.photoURL || DEFAULT_AVATAR_URL}
                        alt="User avatar"
                    />
                    {isSaving && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-brand-blue dark:text-white">{user.displayName}</h2>
                    <button onClick={() => navigate(View.Settings)} className="text-sm font-semibold text-primary hover:underline">
                        {t('editProfile')}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <div className="flex flex-col items-center gap-2 rounded-2xl bg-white dark:bg-brand-blue/20 p-4">
                        <FireIcon className="w-8 h-8 text-orange-500"/>
                        <p className="text-brand-blue dark:text-white text-3xl font-bold">{userProfile.streak}</p>
                        <p className="text-brand-purple dark:text-white/70 text-sm font-medium">Day Streak</p>
                    </div>
                     <div className="flex flex-col items-center gap-2 rounded-2xl bg-white dark:bg-brand-blue/20 p-4">
                        <GemIcon className="w-8 h-8 text-cyan-500"/>
                        <p className="text-brand-blue dark:text-white text-3xl font-bold">{userProfile.gems}</p>
                        <p className="text-brand-purple dark:text-white/70 text-sm font-medium">{t('gems')}</p>
                    </div>
                </div>

                {/* Avatar Selection */}
                <div>
                    <h3 className="text-xl font-bold text-brand-blue dark:text-white mb-4 text-center">{t('chooseAvatar')}</h3>
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 -mx-4 px-4">
                        {ownedAvatars.map(avatar => (
                             <button
                                key={avatar}
                                onClick={() => handleAvatarSelect(avatar)}
                                className="flex-shrink-0 focus:outline-none"
                             >
                                <img
                                    src={avatar}
                                    alt="Avatar option"
                                    className={`w-20 h-20 rounded-full object-cover transition-all duration-300 border-4 ${user.photoURL === avatar ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                                />
                             </button>
                        ))}
                        <button
                            onClick={() => navigate(View.Store)}
                            className="flex-shrink-0 w-20 h-20 rounded-full bg-light-gray dark:bg-brand-blue/30 flex flex-col items-center justify-center text-primary hover:bg-gray-200 dark:hover:bg-brand-blue/40"
                        >
                            <span className="material-symbols-outlined">storefront</span>
                            <span className="text-xs font-bold">{t('store')}</span>
                        </button>
                    </div>
                </div>


                {/* Achievements */}
                <div>
                    <h3 className="text-xl font-bold text-brand-blue dark:text-white mb-4 text-center">{t('achievements')}</h3>
                     <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-center">
                        {ACHIEVEMENTS_LIST.map(ach => {
                            const isUnlocked = userProfile.achievements.includes(ach.id);
                            return (
                                <div key={ach.id} title={ach.description} className={`flex flex-col items-center p-3 rounded-2xl transition-opacity ${isUnlocked ? 'bg-brand-yellow/20' : 'bg-light-gray dark:bg-brand-blue/20 opacity-60'}`}>
                                    <div className={`flex items-center justify-center h-16 w-16 rounded-full ${isUnlocked ? 'bg-brand-yellow text-white' : 'bg-gray-300 dark:bg-brand-blue/30 text-brand-purple/50'}`}>
                                        <span className="material-symbols-outlined text-4xl">{ach.icon}</span>
                                    </div>
                                    <p className={`mt-2 font-bold text-sm ${isUnlocked ? 'text-yellow-700 dark:text-brand-yellow' : 'text-brand-purple dark:text-white/70'}`}>{ach.name}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </ViewWrapper>
    );
};

export default Profile;
