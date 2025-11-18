// This service is now configured to use the REAL Firebase SDK.
// To connect to your project, replace the placeholder firebaseConfig object below with the one from your Firebase project console.

import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged as firebaseOnAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseAuthUser,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc as firestoreGetDoc, 
    getDocs, 
    addDoc as firestoreAddDoc,
    setDoc,
    updateDoc as firestoreUpdateDoc,
    deleteDoc as firestoreDeleteDoc,
    query,
    where,
    QueryConstraint,
    onSnapshot,
    Unsubscribe,
    enableIndexedDbPersistence,
    writeBatch,
    runTransaction,
    increment
} from "firebase/firestore";
import { User, BrandProfile, HistoryItem, Agent, AgentTask, AgentLog, CampaignHistoryItem } from '../types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAP-tTuElnPtcuDgxChlKs3C0cVOdJ7iiQ",
  authDomain: "synapse-ai-88811.firebaseapp.com",
  projectId: "synapse-ai-88811",
  storageBucket: "synapse-ai-88811.appspot.com",
  messagingSenderId: "260377666533",
  appId: "1:260377666533:web:5c12380245e7f9307ec50c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // This can happen if multiple tabs are open.
      console.warn("Firestore persistence failed, possibly due to multiple tabs open.");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required for persistence.
      console.warn("Firestore persistence is not supported in this browser.");
    }
  });


export const FREEMIUM_CREDIT_LIMIT = 50;
export const PRO_CREDIT_LIMIT = 2500;
export const FREEMIUM_AGENT_LIMIT = 1;


// --- Authentication ---

const mapFirebaseUserToAppUser = async (firebaseUser: FirebaseAuthUser): Promise<User> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await firestoreGetDoc(userDocRef);

    if (userDocSnap.exists()) {
        const dbData = userDocSnap.data();
        const appUserFromDb = { uid: firebaseUser.uid, ...(dbData as Omit<User, 'uid'>) };

        // Ensure credit-related fields exist for older user documents that might not have them.
        if (!appUserFromDb.plan) {
            appUserFromDb.plan = 'freemium';
        }
        if (typeof appUserFromDb.credits !== 'number') {
            // Assign credits based on plan, defaulting to freemium limit.
            appUserFromDb.credits = appUserFromDb.plan === 'pro' ? PRO_CREDIT_LIMIT : FREEMIUM_CREDIT_LIMIT;
        }
        if (typeof appUserFromDb.planCreditLimit !== 'number') {
            // Assign credit limit based on plan.
            appUserFromDb.planCreditLimit = appUserFromDb.plan === 'pro' ? PRO_CREDIT_LIMIT : FREEMIUM_CREDIT_LIMIT;
        }
        if (typeof appUserFromDb.brandProfileBonusClaimed !== 'boolean') {
            appUserFromDb.brandProfileBonusClaimed = false;
        }


        // Sync photoURL from Auth provider to our DB if it has changed.
        if (firebaseUser.photoURL && appUserFromDb.photoURL !== firebaseUser.photoURL) {
            await firestoreUpdateDoc(userDocRef, { photoURL: firebaseUser.photoURL });
            appUserFromDb.photoURL = firebaseUser.photoURL;
        }
        
        return appUserFromDb as User;
    }
    
    // Document doesn't exist. This can happen due to a race condition on signup
    // or if the user was created in Auth but Firestore creation failed.
    // We will create it now to ensure data consistency.
    console.warn(`User document for UID ${firebaseUser.uid} not found. Creating one now.`);

    const newUser: Omit<User, 'uid'> = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        photoURL: firebaseUser.photoURL || null,
        plan: 'freemium',
        credits: FREEMIUM_CREDIT_LIMIT,
        planCreditLimit: FREEMIUM_CREDIT_LIMIT,
        theme: 'Twilight',
        onboardingCompleted: false,
        brandProfileBonusClaimed: false,
    };
    
    // Also need to create the brand profile if it's missing.
    const brandProfileRef = doc(db, 'brand_profiles', firebaseUser.uid);
    const brandProfileSnap = await firestoreGetDoc(brandProfileRef);
    if (!brandProfileSnap.exists()) {
         const newBrandProfile: Omit<BrandProfile, 'id'> = {
            userId: firebaseUser.uid,
            brandName: `${newUser.displayName}'s Brand`,
            targetAudience: '',
            messagingPillars: '',
            toneOfVoice: 'Professional',
            productDescription: '',
            keywords: '',
            socialMediaHandles: { twitter: '', linkedin: '', facebook: '' },
            socialConnections: { twitter: false, linkedin: false, facebook: false, email: false },
        };
        await setDoc(brandProfileRef, newBrandProfile);
    }
    
    await setDoc(userDocRef, newUser);
    
    return { uid: firebaseUser.uid, ...newUser };
};


export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                const appUser = await mapFirebaseUserToAppUser(firebaseUser);
                callback(appUser);
            } catch (error) {
                console.error("Critical error during auth state change, user state is inconsistent.", error);
                await signOut(auth);
                callback(null);
            }
        } else {
            callback(null);
        }
    });
};

export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;
    
    // Create the brand profile in a top-level collection with the user's UID as the document ID.
    const brandProfileRef = doc(db, 'brand_profiles', uid);
    const newBrandProfile: Omit<BrandProfile, 'id'> = {
        userId: uid,
        brandName: `${email.split('@')[0]}'s Brand`,
        targetAudience: '',
        messagingPillars: '',
        toneOfVoice: 'Professional',
        productDescription: '',
        keywords: '',
        socialMediaHandles: { twitter: '', linkedin: '', facebook: '' },
        socialConnections: { twitter: false, linkedin: false, facebook: false, email: false },
    };
    await setDoc(brandProfileRef, newBrandProfile);

    // Create a corresponding user document in Firestore
    const userDocRef = doc(db, 'users', uid);
    const newUser: Omit<User, 'uid'> = {
        email,
        displayName: email.split('@')[0],
        photoURL: null,
        plan: 'freemium',
        credits: FREEMIUM_CREDIT_LIMIT,
        planCreditLimit: FREEMIUM_CREDIT_LIMIT,
        theme: 'Twilight',
        onboardingCompleted: false,
        brandProfileBonusClaimed: false,
    };
    await setDoc(userDocRef, newUser);

    return { uid, ...newUser };
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const appUser = await mapFirebaseUserToAppUser(userCredential.user);
    return appUser;
};

export const signOutUser = async (): Promise<void> => {
    await signOut(auth);
};

export const signInWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        // mapFirebaseUserToAppUser will handle creating the user doc if it's the first time
        const appUser = await mapFirebaseUserToAppUser(firebaseUser);
        return appUser;
    } catch (error: any) {
        // Handle specific popup errors
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign-in cancelled. Please try again.');
        }
        if (error.code === 'auth/account-exists-with-different-credential') {
            throw new Error('An account already exists with this email address. Please sign in with the original method.');
        }
        console.error("Google Sign-In Error:", error);
        throw new Error(error.message || 'An unexpected error occurred during Google sign-in.');
    }
};


export const updateUserDoc = async (userId: string, data: Partial<Omit<User, 'uid'>>): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    await firestoreUpdateDoc(userDocRef, data);
};

// --- Atomic Credit Operations ---

/**
 * Atomically deducts credits from a user's account.
 * Uses a Firestore Transaction to ensure the balance doesn't go below zero.
 * @param userId The ID of the user.
 * @param amount The amount of credits to deduct.
 * @returns The new credit balance.
 * @throws Error if user doesn't exist or has insufficient credits.
 */
export const deductCredits = async (userId: string, amount: number): Promise<number> => {
    const userRef = doc(db, 'users', userId);

    return await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User does not exist!");
        }

        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;

        if (currentCredits < amount) {
            throw new Error("Insufficient credits");
        }

        const newCredits = currentCredits - amount;
        transaction.update(userRef, { credits: newCredits });
        return newCredits;
    });
};

/**
 * Atomically adds credits to a user's account.
 * @param userId The ID of the user.
 * @param amount The amount of credits to add.
 * @param newPlan (Optional) If provided, updates the user's plan field as well.
 * @param newLimit (Optional) If provided, updates the planCreditLimit.
 */
export const addCredits = async (userId: string, amount: number, newPlan?: 'freemium' | 'pro', newLimit?: number): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const updateData: any = {
        credits: increment(amount)
    };
    
    if (newPlan) updateData.plan = newPlan;
    if (newLimit !== undefined) updateData.planCreditLimit = newLimit;

    await firestoreUpdateDoc(userRef, updateData);
};


// --- Brand Profile ---
export const getBrandProfile = async (userId: string): Promise<BrandProfile | null> => {
    const docRef = doc(db, 'brand_profiles', userId);
    const docSnap = await firestoreGetDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const profileData = docSnap.data();
    // Ensure socialConnections exists and has all keys for backward compatibility
    const defaultConnections = { twitter: false, linkedin: false, facebook: false, email: false };
    profileData.socialConnections = { ...defaultConnections, ...profileData.socialConnections };
    
    return { id: docSnap.id, ...profileData } as BrandProfile;
};

export const updateBrandProfile = async (userId: string, data: Partial<Omit<BrandProfile, 'id' | 'userId'>>): Promise<void> => {
    const docRef = doc(db, 'brand_profiles', userId);
    await firestoreUpdateDoc(docRef, data);
};


// --- History ---
export const getHistoryCollection = async (userId: string): Promise<HistoryItem[]> => {
    const q = query(collection(db, 'history'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryItem));
};

export const onHistorySnapshot = (userId: string, callback: (data: HistoryItem[]) => void): Unsubscribe => {
    const q = query(collection(db, 'history'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryItem));
        callback(data);
    });
};

export const addHistoryDoc = async (userId: string, data: Omit<HistoryItem, 'id'>): Promise<HistoryItem> => {
    const historyColRef = collection(db, 'history');
    const docRef = await firestoreAddDoc(historyColRef, data);
    return { id: docRef.id, ...data };
};

export const deleteHistoryDoc = async (historyItemId: string): Promise<void> => {
    const docRef = doc(db, 'history', historyItemId);
    await firestoreDeleteDoc(docRef);
};

export const clearUserHistory = async (userId: string): Promise<void> => {
    const historyQuery = query(collection(db, 'history'), where('userId', '==', userId));
    const snapshot = await getDocs(historyQuery);

    if (snapshot.empty) {
        return;
    }

    // Firestore batches are limited to 500 operations. Chunk deletions for large histories.
    const BATCH_SIZE = 499; // Use a slightly smaller size for safety
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + BATCH_SIZE);
        
        chunk.forEach(docSnapshot => {
            batch.delete(docSnapshot.ref);
        });

        await batch.commit();
    }
};


// --- Campaign History ---
export const onCampaignsSnapshot = (userId: string, callback: (data: CampaignHistoryItem[]) => void): Unsubscribe => {
    const q = query(collection(db, 'campaigns'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CampaignHistoryItem));
        callback(data);
    });
};

export const addCampaignDoc = async (userId: string, data: Omit<CampaignHistoryItem, 'id' | 'userId'>): Promise<CampaignHistoryItem> => {
    const campaignData = { ...data, userId };
    const campaignsColRef = collection(db, 'campaigns');
    const docRef = await firestoreAddDoc(campaignsColRef, campaignData);
    return { id: docRef.id, ...campaignData };
};

export const deleteCampaignDoc = async (campaignId: string): Promise<void> => {
    const docRef = doc(db, 'campaigns', campaignId);
    await firestoreDeleteDoc(docRef);
};


// --- Agents ---
export const getAgentsCollection = async (userId: string): Promise<Agent[]> => {
    const q = query(collection(db, 'agents'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
};

export const onAgentsSnapshot = (userId: string, callback: (data: Agent[]) => void): Unsubscribe => {
    const q = query(collection(db, 'agents'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
        callback(data);
    });
};

export const addAgentDoc = async (userId: string, data: Omit<Agent, 'id'>): Promise<Agent> => {
    const agentsColRef = collection(db, 'agents');
    const docRef = await firestoreAddDoc(agentsColRef, data);
    return { id: docRef.id, ...data };
};

export const updateAgentDoc = async (userId: string, agentId: string, data: Partial<Agent>): Promise<void> => {
    const docRef = doc(db, 'agents', agentId);
    await firestoreUpdateDoc(docRef, data);
};

export const deleteAgentAndSubcollections = async (userId: string, agentId: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Delete the main agent document
    const agentRef = doc(db, 'agents', agentId);
    batch.delete(agentRef);

    // 2. Query and delete all associated tasks
    const tasksQuery = query(collection(db, 'agent_tasks'), where('userId', '==', userId), where('agentId', '==', agentId));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach(doc => batch.delete(doc.ref));

    // 3. Query and delete all associated logs
    const logsQuery = query(collection(db, 'agent_logs'), where('userId', '==', userId), where('agentId', '==', agentId));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(doc => batch.delete(doc.ref));

    // 4. Commit the batch operation atomically
    await batch.commit();
};

// --- Agent Tasks ---
export const onAgentTasksSnapshot = (userId: string, agentId: string, callback: (data: AgentTask[]) => void): Unsubscribe => {
    const q = query(collection(db, 'agent_tasks'), where('userId', '==', userId), where('agentId', '==', agentId));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentTask));
        callback(data);
    });
};

export const addAgentTaskDoc = async (userId: string, agentId: string, data: Omit<AgentTask, 'id'>): Promise<AgentTask> => {
    const tasksColRef = collection(db, 'agent_tasks');
    const docRef = await firestoreAddDoc(tasksColRef, data);
    return { id: docRef.id, ...data };
};

export const updateAgentTaskDoc = async (userId: string, agentId: string, taskId: string, data: Partial<AgentTask>): Promise<void> => {
    const docRef = doc(db, 'agent_tasks', taskId);
    await firestoreUpdateDoc(docRef, data);
};

// --- Agent Logs ---
export const onAgentLogsSnapshot = (userId: string, agentId: string, callback: (data: AgentLog[]) => void): Unsubscribe => {
    const q = query(collection(db, 'agent_logs'), where('userId', '==', userId), where('agentId', '==', agentId));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentLog));
        callback(data);
    });
};

export const addAgentLogDoc = async (userId: string, agentId: string, data: Omit<AgentLog, 'id'>): Promise<AgentLog> => {
    const logsColRef = collection(db, 'agent_logs');
    const docRef = await firestoreAddDoc(logsColRef, data);
    return { id: docRef.id, ...data };
};

export const isBrandProfileComplete = (profile: BrandProfile | null): boolean => {
    if (!profile) return false;
    
    // Key fields that must be filled for quality generation
    const requiredFields: (keyof BrandProfile)[] = [
        'productDescription',
        'targetAudience',
        'toneOfVoice',
        'brandName',
    ];

    for (const field of requiredFields) {
        const value = profile[field as keyof typeof profile];
        if (typeof value !== 'string' || value.trim() === '' || value.endsWith("'s Brand")) {
            return false;
        }
    }

    return true;
};