import { db } from './firebase';
// Fix: Use scoped package to prevent module resolution errors.
import { doc, getDoc, setDoc, updateDoc, increment, runTransaction, arrayUnion } from '@firebase/firestore';
import { StoreItem, UserProfile } from '../types';

class UserService {
    private getTodayDateString(): string {
        return new Date().toISOString().split('T')[0];
    }

    async getUserProfile(uid: string): Promise<UserProfile | null> {
        if (!db) return null;
        try {
            const userDocRef = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                return userDocSnap.data() as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    }
    
    async createUserProfile(uid: string): Promise<UserProfile> {
        if (!db) throw new Error("Firebase not configured");
        const newUserProfile: UserProfile = {
            gems: 0,
            streak: 0,
            lastActivityDate: '',
            achievements: [],
            purchasedAvatars: [],
        };
        try {
            const userDocRef = doc(db, 'users', uid);
            await setDoc(userDocRef, newUserProfile);
            return newUserProfile;
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error;
        }
    }

    async getOrCreateUserProfile(uid: string): Promise<UserProfile> {
        const profile = await this.getUserProfile(uid);
        if (profile) {
            return profile;
        }
        return await this.createUserProfile(uid);
    }

    async addGems(uid: string, amount: number): Promise<void> {
        if (!db || amount <= 0) return;
        try {
            const userDocRef = doc(db, 'users', uid);
            await updateDoc(userDocRef, {
                gems: increment(amount)
            });
        } catch (error) {
            console.error("Error adding gems:", error);
        }
    }

    async addAchievement(uid: string, achievementId: string): Promise<boolean> {
        if (!db) return false;
        const userDocRef = doc(db, 'users', uid);
        try {
            const userDocBefore = await getDoc(userDocRef);
            const hadAchievement = (userDocBefore.data() as UserProfile)?.achievements.includes(achievementId);
            
            if (!hadAchievement) {
                await updateDoc(userDocRef, { achievements: arrayUnion(achievementId) });
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error adding achievement:", error);
            return false;
        }
    }

    async purchaseStoreItem(uid: string, item: StoreItem): Promise<{ success: boolean; message: string }> {
        if (!db) return { success: false, message: "Firebase not configured." };
        const userDocRef = doc(db, 'users', uid);
    
        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) {
                    throw new Error("User profile does not exist.");
                }
    
                const profile = userDoc.data() as UserProfile;
    
                if (profile.gems < item.cost) {
                    throw new Error("Not enough gems.");
                }
    
                const ownedAvatars = profile.purchasedAvatars || [];
                if (ownedAvatars.includes(item.imageUrl)) {
                    throw new Error("Item already owned.");
                }
    
                transaction.update(userDocRef, {
                    gems: increment(-item.cost),
                    purchasedAvatars: arrayUnion(item.imageUrl)
                });
            });
            return { success: true, message: "Purchase successful!" };
        } catch (error: any) {
            console.error("Purchase transaction failed:", error);
            return { success: false, message: error.message || "An unknown error occurred." };
        }
    }

    async updateStreak(uid: string): Promise<{ newStreak: number, isStreakExtended: boolean }> {
        if (!db) return { newStreak: 0, isStreakExtended: false };
        const userDocRef = doc(db, 'users', uid);
        const today = this.getTodayDateString();
        let newStreak = 0;
        let isStreakExtended = false;

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) {
                    return;
                }
                const profile = userDoc.data() as UserProfile;
                
                if (profile.lastActivityDate === today) {
                    newStreak = profile.streak;
                    isStreakExtended = false;
                    return;
                }

                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (profile.lastActivityDate === yesterdayStr) {
                    newStreak = profile.streak + 1;
                } else {
                    newStreak = 1;
                }
                
                isStreakExtended = true;
                transaction.update(userDocRef, { 
                    streak: newStreak, 
                    lastActivityDate: today 
                });
            });
            
            return { newStreak, isStreakExtended };

        } catch (error) {
            console.error("Error updating streak in transaction:", error);
            return { newStreak: 0, isStreakExtended: false };
        }
    }
}

export const userService = new UserService();