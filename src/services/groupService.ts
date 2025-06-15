import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { Group } from '../types';

const GROUPS_COLLECTION = 'groups';

// ランダムな6桁のグループコードを生成
const generateGroupCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// グループコードの重複チェック
const isCodeUnique = async (code: string): Promise<boolean> => {
  const q = query(collection(db, GROUPS_COLLECTION), where('code', '==', code));
  const snapshot = await getDocs(q);
  return snapshot.empty;
};

// ユニークなグループコードを生成
const generateUniqueCode = async (): Promise<string> => {
  let code: string;
  let isUnique = false;
  
  do {
    code = generateGroupCode();
    isUnique = await isCodeUnique(code);
  } while (!isUnique);
  
  return code;
};

// グループ作成
export const createGroup = async (name: string, createdBy: string): Promise<Group> => {
  try {
    const code = await generateUniqueCode();
    const groupData = {
      name: name.trim(),
      code,
      createdBy,
      memberCount: 1, // 作成者が最初のメンバー
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, GROUPS_COLLECTION), groupData);
    
    return {
      id: docRef.id,
      name: groupData.name,
      code: groupData.code,
      createdBy: groupData.createdBy,
      memberCount: groupData.memberCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

// コードでグループを検索
export const findGroupByCode = async (code: string): Promise<Group | null> => {
  try {
    const q = query(collection(db, GROUPS_COLLECTION), where('code', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      name: data.name,
      code: data.code,
      createdBy: data.createdBy,
      memberCount: data.memberCount,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error finding group by code:', error);
    throw error;
  }
};

// グループ情報を取得
export const getGroup = async (groupId: string): Promise<Group | null> => {
  try {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      code: data.code,
      createdBy: data.createdBy,
      memberCount: data.memberCount,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting group:', error);
    throw error;
  }
};

// グループ参加（メンバー数を増加）
export const joinGroup = async (groupId: string): Promise<void> => {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

// 複数グループから脱退（指定したグループのみ）
export const leaveSpecificGroup = async (groupId: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      const groupDoc = await transaction.get(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const currentCount = groupDoc.data().memberCount || 0;
      
      if (currentCount <= 1) {
        // 最後のメンバーが脱退する場合、グループを削除
        transaction.delete(groupRef);
      } else {
        // メンバー数を減少
        transaction.update(groupRef, {
          memberCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    console.error('Error leaving specific group:', error);
    throw error;
  }
};

// グループ脱退（メンバー数を減少）
export const leaveGroup = async (groupId: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      const groupDoc = await transaction.get(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const currentCount = groupDoc.data().memberCount || 0;
      
      if (currentCount <= 1) {
        // 最後のメンバーが脱退する場合、グループを削除
        transaction.delete(groupRef);
      } else {
        // メンバー数を減少
        transaction.update(groupRef, {
          memberCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    throw error;
  }
};