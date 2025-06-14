import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { UserProfile, UserLocation } from '../types';

const USERS_COLLECTION = 'users';
const USER_LOCATIONS_COLLECTION = 'userLocations';

// User Profile Management
export const createUserProfile = async (userData: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userData.uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Avatar Upload
export const uploadAvatar = async (uid: string, file: File): Promise<string> => {
  try {
    const avatarRef = ref(storage, `avatars/${uid}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(avatarRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Firebase StorageのURLかどうかを判定
const isFirebaseStorageUrl = (url: string): boolean => {
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('storage.googleapis.com');
};

export const deleteAvatar = async (avatarUrl: string): Promise<void> => {
  try {
    // Firebase StorageのURLでない場合（Google アカウントの画像など）は削除しない
    if (!isFirebaseStorageUrl(avatarUrl)) {
      console.log('External avatar URL, skipping deletion:', avatarUrl);
      return;
    }
    
    const avatarRef = ref(storage, avatarUrl);
    await deleteObject(avatarRef);
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
};

// User Location Management
export const addUserLocation = async (locationData: Omit<UserLocation, 'id' | 'timestamp'>): Promise<string> => {
  try {
    // If adding a current location, deactivate all previous current locations
    // Scheduled locations can have multiple active entries
    if (locationData.locationType === 'current') {
      await deactivateUserLocationsByType(locationData.userId, 'current');
    }
    // For scheduled locations, we allow multiple active entries
    
    const docRef = await addDoc(collection(db, USER_LOCATIONS_COLLECTION), {
      ...locationData,
      timestamp: Timestamp.now(),
      isActive: true
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding user location:', error);
    throw error;
  }
};

export const updateUserLocation = async (locationId: string, updates: Partial<UserLocation>): Promise<void> => {
  try {
    const locationRef = doc(db, USER_LOCATIONS_COLLECTION, locationId);
    await updateDoc(locationRef, {
      ...updates,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user location:', error);
    throw error;
  }
};

export const getUserLocations = async (userId?: string): Promise<UserLocation[]> => {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, USER_LOCATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
    } else {
      q = query(
        collection(db, USER_LOCATIONS_COLLECTION),
        orderBy('timestamp', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as UserLocation[];
  } catch (error) {
    console.error('Error getting user locations:', error);
    throw error;
  }
};

export const getActiveUserLocations = async (): Promise<UserLocation[]> => {
  try {
    const q = query(
      collection(db, USER_LOCATIONS_COLLECTION),
      where('isActive', '==', true),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as UserLocation[];
  } catch (error) {
    console.error('Error getting active user locations:', error);
    throw error;
  }
};

export const deactivateUserLocations = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, USER_LOCATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { isActive: false })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error deactivating user locations:', error);
    throw error;
  }
};

export const deactivateUserLocationsByType = async (userId: string, locationType: 'current' | 'scheduled'): Promise<void> => {
  try {
    const q = query(
      collection(db, USER_LOCATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true),
      where('locationType', '==', locationType)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { isActive: false })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error deactivating user locations by type:', error);
    throw error;
  }
};

export const deleteUserLocation = async (locationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, USER_LOCATIONS_COLLECTION, locationId));
  } catch (error) {
    console.error('Error deleting user location:', error);
    throw error;
  }
};