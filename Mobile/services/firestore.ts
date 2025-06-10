import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  deleteDoc,
  getDocs,
  query,
  where,
  addDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { deleteUser } from 'firebase/auth';

export const createUserProfile = async (user: any) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      createdAt: serverTimestamp(),
      watchlist: [],
      portfolio: [],
      preferences: {
        darkMode: false,
        emailNotifications: false
      },
      sessions: [],
      lastLogout: null
    });
  }

  return userSnap.data();
};

export const getUserProfile = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

export const updateUserProfile = async (userId: string, data: any) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data);
};

export const addToWatchlist = async (userId: string, symbol: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    watchlist: arrayUnion(symbol)
  });
};

export const removeFromWatchlist = async (userId: string, symbol: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    watchlist: arrayRemove(symbol)
  });
};

export const subscribeToWatchlist = (userId: string, callback: (data: string[]) => void) => {
  const userRef = doc(db, 'users', userId);
  
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data()?.watchlist || []);
    } else {
      callback([]);
    }
  });
};

export interface PortfolioPosition {
  id: string;
  symbol: string;
  name: string | null;
  shares: number;
  purchasePrice: number;
  addedAt: string;
}

// Ensure user doc exists with portfolio array
async function ensureUserDoc(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      portfolio: [],
      watchlist: [],
      preferences: { darkMode: false, emailNotifications: false },
      sessions: [],
      lastLogout: null
    });
  }
}

export const addToPortfolio = async (userId: string, position: PortfolioPosition) => {
  await ensureUserDoc(userId);
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    portfolio: arrayUnion({
      id: position.id,
      symbol: String(position.symbol),
      name: position.name ?? null,
      shares: Number(position.shares),
      purchasePrice: Number(position.purchasePrice),
      addedAt: position.addedAt
    })
  });
};

export const subscribeToPortfolio = (userId: string, callback: (data: PortfolioPosition[]) => void) => {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().portfolio || []);
    } else {
      callback([]);
    }
  });
};

export const removeFromPortfolio = async (userId: string, positionId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const portfolio = userSnap.data().portfolio || [];
    const toRemove = portfolio.find((p: any) => p.id === positionId);
    if (toRemove) {
      await updateDoc(userRef, {
        portfolio: arrayRemove(toRemove)
      });
    }
  }
};

export const logoutAllDevices = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  
  try {
    // Update the lastLogout timestamp
    await updateDoc(userRef, {
      lastLogout: serverTimestamp(),
      sessions: [] // Clear all active sessions
    });

    // Force re-authentication by revoking the current session
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }

    return true;
  } catch (error) {
    console.error('Error logging out all devices:', error);
    throw error;
  }
};

export const deleteUserAccount = async (userId: string) => {
  try {
    // Delete user data from Firestore
    const userRef = doc(db, 'users', userId);
    
    // Delete watchlist and portfolio data
    await updateDoc(userRef, {
      watchlist: [],
      portfolio: []
    });

    // Delete the user document
    await deleteDoc(userRef);

    // Delete user authentication account
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}; 