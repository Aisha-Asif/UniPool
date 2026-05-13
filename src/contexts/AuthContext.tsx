import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  runTransaction, 
  onSnapshot,
  getDocs,
  updateDoc,
  collection 
} from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (email: string, password: string, additionalData: Partial<UserProfile> & { universityId: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STUDENT_DOMAINS = [
  'khi.iba.edu.pk',
  'nust.edu.pk',
  'uok.edu.pk',
  'nu.edu.pk',
  'neduet.edu.pk',
  'fast.edu.pk',
  'edu.pk'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const restoreSession = async () => {
      const savedUid = localStorage.getItem('unipool_session_uid');
      if (savedUid) {
        try {
          unsubscribe = onSnapshot(doc(db, 'users', savedUid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              setUser({ uid: savedUid, email: data.email });
              setProfile({ uid: savedUid, ...data });
            } else {
              localStorage.removeItem('unipool_session_uid');
              setUser(null);
              setProfile(null);
            }
            setLoading(false);
          }, (err) => {
            console.error("Profile sync error:", err);
            setLoading(false);
          });
        } catch (error) {
          console.error("Session restoration failed:", error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    restoreSession();
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    const autoSeed = async () => {
      try {
        const seededRef = doc(db, 'system', 'status');
        const snap = await getDoc(seededRef);
        if (!snap.exists() || !snap.data().seeded_v8) {
          if (!profile) {
            console.log("Bootstrap: Initializing migration v8...");
            await seedTestUsers();
            
            // Migration: Add universityId to ANY existing rides/requests that might be missing it
            const mapDomainToId = (domain: string) => {
              if (domain.includes('iba')) return 'iba';
              if (domain.includes('nust')) return 'nust';
              if (domain.includes('uok')) return 'uok';
              if (domain.includes('nu.edu.pk') || domain.includes('fast')) return 'nu';
              if (domain.includes('neduet')) return 'neduet';
              if (domain.includes('lums')) return 'lums';
              if (domain.includes('szabist')) return 'szabist';
              return 'other';
            };

            const ridesSnap = await getDocs(collection(db, 'rides'));
            for (const d of ridesSnap.docs) {
              const data = d.data();
              if (data.universityDomain) {
                await updateDoc(d.ref, { universityId: mapDomainToId(data.universityDomain) });
              }
            }

            const reqSnap = await getDocs(collection(db, 'passenger_requests'));
            for (const d of reqSnap.docs) {
              const data = d.data();
              if (data.universityDomain) {
                await updateDoc(d.ref, { universityId: mapDomainToId(data.universityDomain) });
              }
            }

            await setDoc(seededRef, { seeded_v8: true, updatedAt: serverTimestamp() }, { merge: true });
            console.log("Bootstrap: Migration v8 complete.");
          }
        }
      } catch (e) {
        console.warn("Bootstrap check deferred:", e);
      }
    };
    if (!loading) {
      autoSeed();
    }
  }, [loading, profile]);

  const seedTestUsers = async () => {
    const users = [
      { username: 'dua_fast', name: 'Dua Malik', email: 'dua.malik@nu.edu.pk', password: 'student123' },
      { username: 'hamza_fast', name: 'Hamza Ahmed', email: 'hamza.ahmed@nu.edu.pk', password: 'student123' },
      { username: 'zain_fast', name: 'Zain Ali', email: 'zain.ali@nu.edu.pk', password: 'student123' },
      { username: 'ayesha_fast', name: 'Ayesha Khan', email: 'ayesha.k@nu.edu.pk', password: 'student123' },
      { username: 'bilal_fast', name: 'Bilal Siddiqui', email: 'bilal.s@nu.edu.pk', password: 'student123' }
    ];

    for (const u of users) {
      try {
        const snap = await getDoc(doc(db, 'usernames', u.username));
        if (snap.exists()) {
          // Update existing seed users to have universityId if missing or incorrect
          const uid = snap.data().uid;
          await setDoc(doc(db, 'users', uid), { universityId: 'nu' }, { merge: true });
        } else {
          const uid = `mock_${u.username}`;
          await runTransaction(db, async (transaction) => {
            transaction.set(doc(db, 'usernames', u.username), { uid });
            transaction.set(doc(db, 'users', uid), {
              uid,
              email: u.email,
              password: u.password,
              username: u.username,
              name: u.name,
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
              universityId: 'nu',
              universityDomain: u.email.split('@')[1].toLowerCase(),
              isVerified: true,
              rideCount: Math.floor(Math.random() * 10),
              createdAt: serverTimestamp(),
            });
          });
        }

        const uid = (await getDoc(doc(db, 'usernames', u.username))).data()?.uid;

        if (u.username === 'dua_fast' && uid) {
          await setDoc(doc(db, 'rides', `ride_${u.username}`), {
            driverId: uid,
            universityId: 'nu',
            universityDomain: u.email.split('@')[1].toLowerCase(),
            origin: 'FAST Main Campus',
            destination: 'IBA University Road',
            departureTime: new Date(Date.now() + 3600000 * 5).toISOString(),
            price: 150,
            seats: 4,
            availableSeats: 4,
            vehicle: 'Civic White',
            status: 'active',
            passengerIds: [],
            isDriverVerified: true,
            requestedPassengerIds: [],
            createdAt: serverTimestamp()
          });

          await setDoc(doc(db, 'passenger_requests', `req_${u.username}`), {
            ownerId: uid,
            universityId: 'nu',
            universityDomain: u.email.split('@')[1].toLowerCase(),
            origin: 'Fast University - Shah Latif',
            destination: 'Gulshan-e-Iqbal',
            preferredTime: new Date(Date.now() + 3600000 * 2).toISOString(),
            joinerIds: [],
            acceptedIds: [],
            isOwnerVerified: true,
            status: 'seeking',
            createdAt: serverTimestamp()
          });
        }
      } catch (err: any) {
        console.error(`Seed failed for ${u.email}:`, err);
      }
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      let uid = '';
      const input = identifier.trim().toLowerCase();
      
      const usernameDoc = await getDoc(doc(db, 'usernames', input.startsWith('@') ? input.substring(1) : input));
      if (usernameDoc.exists()) {
        uid = usernameDoc.data().uid;
      } else {
        if (input.includes('@')) {
          throw new Error("Handle not found. Note: Handle login is required for existing accounts.");
        } else {
          throw new Error("Handle not found.");
        }
      }

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) throw new Error("Profile not found.");
      
      const userData = userDoc.data();
      if (userData.password !== password) {
        throw new Error("Incorrect password.");
      }

      // Mock Sign In
      localStorage.setItem('unipool_session_uid', uid);
      setUser({ uid, email: userData.email });
      setProfile({ uid, ...userData } as UserProfile);

    } catch (error: any) {
      throw new Error(error.message || "Authentication failed");
    }
  };

  const register = async (email: string, password: string, additionalData: Partial<UserProfile> & { universityId: string }) => {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    const isVerified = STUDENT_DOMAINS.some(d => domain.endsWith(d));

    if (!additionalData.username) throw new Error("Unique handle required");
    if (!additionalData.universityId) throw new Error("Please select your university");

    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', additionalData.username.toLowerCase()));
      if (usernameDoc.exists()) {
        throw new Error("Handle already in use. Please choose another.");
      }

      const uid = `mock_user_${Date.now()}`;

      await runTransaction(db, async (transaction) => {
        const usernameRef = doc(db, 'usernames', additionalData.username!.toLowerCase());
        const userRef = doc(db, 'users', uid);

        transaction.set(usernameRef, { uid });
        transaction.set(userRef, {
          uid,
          email,
          password,
          username: additionalData.username,
          name: additionalData.name || '',
          avatarUrl: additionalData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${additionalData.username}`,
          universityId: additionalData.universityId,
          universityDomain: domain,
          isVerified: isVerified,
          rideCount: 0,
          createdAt: serverTimestamp(),
        });
      });

      // Account created successfully. Registration no longer auto-logs in as per user request.
    } catch (error: any) {
       throw new Error(error.message || "Registration failed");
    }
  };

  const logout = async () => {
    localStorage.removeItem('unipool_session_uid');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
