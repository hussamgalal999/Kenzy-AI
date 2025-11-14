import React, { useState, useContext } from 'react';
import ViewWrapper from '../ViewWrapper';
import { useI18n } from '../../i18n';
import { User } from '../../types';
import { DEFAULT_AVATAR_URL } from '../../constants';
import { updateUserProfile } from '../../services/firebase';
import { AuthContext } from '../../contexts/AuthContext';

interface AccountInfoProps {
  onBack: () => void;
  user: User | null;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ onBack, user }) => {
    const { t } = useI18n();
    const { userProfile, setUser } = useContext(AuthContext);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL || DEFAULT_AVATAR_URL);

    const handleSaveChanges = async () => {
        if (!user) return;

        const nameChanged = displayName.trim() !== user.displayName;
        const avatarChanged = selectedAvatar !== user.photoURL;

        if (!nameChanged && !avatarChanged) return;

        setIsSaving(true);
        setError(null);
        try {
            const updates = {
                ...(nameChanged && { displayName: displayName.trim() }),
                ...(avatarChanged && { photoURL: selectedAvatar }),
            };
            const updatedUser = await updateUserProfile(updates);
            setUser(updatedUser as User); // Update context state
            alert('Profile updated successfully!');
        } catch (e) {
            console.error(e);
            setError('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Create a unique list of owned avatars including the default one.
    const ownedAvatars = Array.from(new Set([DEFAULT_AVATAR_URL, ...(userProfile?.purchasedAvatars || [])]));

    return (
        <ViewWrapper title={t('accountInfo')} onBack={onBack}>
            <div className="space-y-8">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <img src={selectedAvatar} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-surface-dark shadow-lg" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-brand-purple dark:text-white/70">{t('chooseAvatar')}</label>
                        <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {ownedAvatars.map(avatarUrl => (
                                <button key={avatarUrl} onClick={() => setSelectedAvatar(avatarUrl)}>
                                    <img 
                                        src={avatarUrl} 
                                        alt="Avatar" 
                                        className={`w-16 h-16 rounded-full object-cover transition-all ${selectedAvatar === avatarUrl ? 'ring-4 ring-primary' : 'ring-2 ring-transparent hover:ring-primary/50'}`} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-brand-purple dark:text-white/70">{t('name')}</label>
                        <input 
                            type="text" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="mt-1 w-full p-3 bg-light-gray dark:bg-brand-blue/20 rounded-lg border-2 border-transparent focus:border-primary focus:ring-0 focus:outline-none" 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-brand-purple dark:text-white/70">{t('email')}</label>
                        <input 
                            type="email" 
                            value={email}
                            readOnly
                            className="mt-1 w-full p-3 bg-light-gray dark:bg-brand-blue/20 rounded-lg border-2 border-transparent focus:border-primary focus:ring-0 focus:outline-none opacity-70 cursor-not-allowed" 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-brand-purple dark:text-white/70">{t('password')}</label>
                         <button className="mt-1 w-full text-start p-3 bg-light-gray dark:bg-brand-blue/20 rounded-lg text-primary font-semibold hover:bg-gray-200 dark:hover:bg-brand-blue/30">
                            {t('changePassword')}
                        </button>
                    </div>
                </div>

                {error && <p className="text-center text-red-500">{error}</p>}

                <button 
                    onClick={handleSaveChanges}
                    disabled={isSaving || (displayName === user?.displayName && selectedAvatar === user?.photoURL)}
                    className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Saving...' : t('saveChanges')}
                </button>
            </div>
        </ViewWrapper>
    );
};

export default AccountInfo;