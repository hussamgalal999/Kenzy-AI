import React, { useState, useContext } from 'react';
import { useI18n } from '../i18n';
import ViewWrapper from './ViewWrapper';
import { AuthContext } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { GemIcon } from './icons';

interface LearningPathProps {
  onBack: () => void;
}

const LearningPath: React.FC<LearningPathProps> = ({ onBack }) => {
  const { t } = useI18n();
  const { user, refreshUserProfile } = useContext(AuthContext);
  // In a real app, this would be stored in the user's profile
  const [claimedUnits, setClaimedUnits] = useState<string[]>([]);

  const units = [
    { id: 'unit1', name: t('unit1Title'), description: t('unit1Desc'), completed: true, progress: 100, reward: 50 },
    { id: 'unit2', name: t('unit2Title'), description: t('unit2Desc'), completed: true, progress: 100, reward: 50 },
    { id: 'unit3', name: t('unit3Title'), description: t('unit3Desc'), completed: false, progress: 60, reward: 75 },
    { id: 'unit4', name: t('unit4Title'), description: t('unit4Desc'), completed: false, progress: 0, reward: 100 },
    { id: t('unit5Title'), name:t('unit5Title'), description: t('unit5Desc'), completed: false, progress: 0, reward: 100 },
  ];

  const handleClaimReward = async (unitId: string, amount: number) => {
    if (!user || claimedUnits.includes(unitId)) return;
    
    // Optimistically update UI
    setClaimedUnits(prev => [...prev, unitId]);
    
    try {
        await userService.addGems(user.uid, amount);
        await refreshUserProfile();
    } catch (error) {
        // Revert UI change on failure
        setClaimedUnits(prev => prev.filter(id => id !== unitId));
        alert("Failed to claim reward. Please try again.");
    }
  };

  return (
    <ViewWrapper title={t('learningPath')} onBack={onBack} description={t('learningPathPageDesc')}>
      <div className="space-y-6">
        {units.map((unit) => {
          const isClaimed = claimedUnits.includes(unit.id);
          return (
            <div key={unit.id} className={`p-5 rounded-2xl transition-all ${unit.completed ? 'bg-brand-teal/10 dark:bg-brand-teal/20' : ''} bg-white dark:bg-brand-blue/20`}>
                <div className="flex items-center justify-between">
                <div>
                    <h3 className={`font-bold text-lg ${unit.completed ? 'text-brand-teal' : 'text-brand-blue dark:text-white'}`}>{unit.name}</h3>
                    <p className="text-sm text-brand-purple dark:text-white/70">{unit.description}</p>
                </div>
                {unit.completed && (
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-teal text-white flex-shrink-0">
                        <span className="material-symbols-outlined">check</span>
                    </div>
                )}
                {unit.progress > 0 && !unit.completed && (
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-teal/20 text-brand-teal flex-shrink-0">
                        <span className="material-symbols-outlined">school</span>
                    </div>
                )}
                {unit.progress === 0 && !unit.completed && (
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-light-gray dark:bg-brand-blue/30 text-brand-purple/50 dark:text-white/50 flex-shrink-0">
                        <span className="material-symbols-outlined">lock</span>
                    </div>
                )}
                </div>
                <div className="w-full bg-light-gray dark:bg-brand-blue/30 rounded-full h-2.5 mt-3">
                    <div className="bg-brand-teal h-2.5 rounded-full" style={{ width: `${unit.progress}%` }}></div>
                </div>
                {unit.completed && (
                    <div className="mt-4">
                        {isClaimed ? (
                            <button disabled className="w-full bg-light-gray dark:bg-brand-blue/30 text-brand-purple dark:text-white/70 font-bold py-2 rounded-lg cursor-not-allowed">{t('rewardClaimed')}</button>
                        ) : (
                            <button onClick={() => handleClaimReward(unit.id, unit.reward)} className="w-full bg-brand-yellow text-yellow-900 font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                                <GemIcon className="w-5 h-5"/>
                                {t('claimReward', { amount: unit.reward })}
                            </button>
                        )}
                    </div>
                )}
            </div>
        )})}
      </div>
    </ViewWrapper>
  );
};

export default LearningPath;
