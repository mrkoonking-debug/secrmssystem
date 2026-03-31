
import { RMA, RMAStatus, DashboardStats, Team, TimelineEvent, Brand, Distributor } from '../types';
import { db, auth, isConfigured, firebaseConfig } from './firebaseConfig';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, limit, serverTimestamp, startAfter, QueryDocumentSnapshot,
  getCountFromServer, runTransaction
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, getAuth
} from 'firebase/auth';
import { BRAND_OPTIONS, DISTRIBUTOR_OPTIONS } from '../constants/options';

import { SEED_CLAIMS } from './seedData';

let currentUser: any = null;
let OFFLINE_STORAGE: RMA[] = SEED_CLAIMS as any;
// In-memory stats cache (30 second TTL)
let _statsCache: { key: string; data: any; ts: number } | null = null;
// Login rate limiter
let _loginAttempts = 0;
let _loginLockUntil = 0;
// Nav counts cache (30 second TTL)
let _navCountsCache: { data: { unassigned: number; overdue: number }; ts: number } | null = null;
let OFFLINE_USERS: any[] = [
  {
    uid: 'offline-admin',
    name: 'SEC Admin',
    email: 'support@sectechnology.co.th',
    role: 'admin',
    team: 'ALL'
  }
];

let OFFLINE_BRANDS: any[] = BRAND_OPTIONS.filter(b => b.value !== 'Other').map((b, i) => ({ id: `brand-${i}`, value: b.value, label: b.label }));
let OFFLINE_DISTRIBUTORS: any[] = DISTRIBUTOR_OPTIONS.filter(d => d.value !== 'Other').map((d, i) => ({ id: `dist-${i}`, value: d.value, label: d.label }));

let OFFLINE_SETTINGS = {
  nameTh: 'บริษัท เอสอีซี เทคโนโลยี จำกัด',
  nameEn: 'SEC Technology Co., Ltd.',
  address: '123 Tech Park, Silicon Avenue, Bangkok 10110',
  taxId: '012555XXXXXXX',
  tel: '02-999-8888',
  logoUrl: '/logo.png',
  website: 'www.sec-technology.com',
  performanceMode: false
};

// Auth ready promise — resolves once onAuthStateChanged fires for the first time
let _authReadyResolve: () => void;
const authReadyPromise = new Promise<void>((resolve) => { _authReadyResolve = resolve; });

if (isConfigured && auth) {
  // Helper: resolve role from Firestore user document
  const resolveUserRole = (email: string | null | undefined, userData: any): string => {
    // Super admins always get 'admin'
    if (email === 'support@sectechnology.co.th' || email === 'admin@sec-claim.com') return 'admin';
    // Everyone else: use Firestore role (but only 'admin' if explicitly set, default to 'staff')
    return userData?.role || 'staff';
  };

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      currentUser = {
        uid: user.uid,
        name: userData.name || user.email?.split('@')[0],
        email: user.email,
        role: resolveUserRole(user.email, userData),
        team: userData.team || 'ALL'
      };
    } else {
      currentUser = null;
    }
    _authReadyResolve();
  });
} else {
  // If Firebase is not configured, resolve immediately
  _authReadyResolve!();
}

const mapDocToRMA = (d: any): RMA => {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
    history: (data.history || []).map((h: any) => ({
      ...h,
      date: h.date?.toDate ? h.date.toDate().toISOString() : h.date
    }))
  } as RMA;
};

export const MockDb = {
  login: async (u: string, p: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured || !auth) {
      return { success: false, error: "Firebase Authentication not configured" };
    }
    // Rate limit: block after 5 failed attempts for 30 seconds
    if (_loginLockUntil > Date.now()) {
      const waitSec = Math.ceil((_loginLockUntil - Date.now()) / 1000);
      return { success: false, error: `ลองใหม่อีกครั้งในอีก ${waitSec} วินาที` };
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, u, p);
      const email = cred.user.email;

      // Read role from Firestore user document (same logic as onAuthStateChanged)
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const role = (email === 'support@sectechnology.co.th' || email === 'admin@sec-claim.com') ? 'admin' : (userData?.role || 'staff');

      currentUser = {
        uid: cred.user.uid,
        name: userData?.name || email?.split('@')[0],
        email: email,
        role: role,
        team: userData?.team || 'ALL'
      };
      _loginAttempts = 0; // Reset on success
      return { success: true };
    } catch (e: unknown) {
      _loginAttempts++;
      if (_loginAttempts >= 5) {
        _loginLockUntil = Date.now() + 30000; // Lock for 30 seconds
        _loginAttempts = 0;
      }
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
  },

  // registerAdmin removed — create admin accounts via Firebase Console only


  logout: async () => {
    if (isConfigured && auth) await signOut(auth);
    currentUser = null;
  },

  isAuthenticated: () => !!currentUser,
  getCurrentUser: () => currentUser,
  waitForAuth: () => authReadyPromise,

  // --- Dynamic Brands Management ---
  getBrands: async (): Promise<Brand[]> => {
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    try {
      const snap = await getDocs(collection(db, 'brands'));
      // Only use fallback if collection is truly empty AND we want initial seed, 
      // but for "Force Firebase", we should arguably just return empty or seed it. 
      // Let's return empty if empty.
      return snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() } as Brand));
    } catch (e) {
      console.error("Error fetching brands:", e);
      throw e;
    }
  },
  addBrand: async (brand: any) => {
    const id = `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    if (currentUser?.role !== 'admin') throw new Error('Unauthorized: admin access required');
    await setDoc(doc(db, 'brands', id), brand);
  },
  updateBrand: async (id: string, updates: any) => {
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    if (currentUser?.role !== 'admin') throw new Error('Unauthorized: admin access required');
    await updateDoc(doc(db, 'brands', id), updates);
  },
  deleteBrand: async (id: string) => {
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    if (currentUser?.role !== 'admin') throw new Error('Unauthorized: admin access required');
    await deleteDoc(doc(db, 'brands', id));
  },

  // --- Dynamic Distributors Management ---
  getDistributors: async (): Promise<Distributor[]> => {
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    try {
      const snap = await getDocs(collection(db, 'distributors'));
      return snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() } as Distributor));
    } catch (e) {
      console.error("Error fetching distributors:", e);
      throw e;
    }
  },
  addDistributor: async (dist: any) => {
    const id = `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    if (currentUser?.role !== 'admin') throw new Error('Unauthorized: admin access required');
    await setDoc(doc(db, 'distributors', id), dist);
  },
  updateDistributor: async (id: string, updates: any) => {
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    if (currentUser?.role !== 'admin') throw new Error('Unauthorized: admin access required');
    await updateDoc(doc(db, 'distributors', id), updates);
  },
  deleteDistributor: async (id: string) => {
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    if (currentUser?.role !== 'admin') throw new Error('Unauthorized: admin access required');
    await deleteDoc(doc(db, 'distributors', id));
  },

  // --- Settings ---
  getSettings: async () => {
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    try {
      const snap = await getDoc(doc(db, 'settings', 'config'));
      return snap.exists() ? snap.data() : OFFLINE_SETTINGS; // Keep default settings if DB doc missing, but from memory/const not offline mode per se
    } catch (e) {
      console.error("getSettings failed:", e);
      throw e;
    }
  },
  updateSettings: async (s: any) => {
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    try { await setDoc(doc(db, 'settings', 'config'), s); } catch (e) { console.error("updateSettings failed", e); throw e; }
  },

  // --- Seed Data (Admin Only) ---
  seedDatabase: async () => {
    if (!isConfigured || !db) return;
    // Safety: admin-only operation
    if (currentUser?.role !== 'admin') {
      console.error('seedDatabase: requires admin role');
      throw new Error('Unauthorized: admin access required');
    }
    try {
      // Seed Settings
      await setDoc(doc(db, 'settings', 'config'), OFFLINE_SETTINGS);

      // Seed Users
      for (const u of OFFLINE_USERS) {
        await setDoc(doc(db, 'users', u.uid), { name: u.name, email: u.email, role: u.role, team: u.team, createdAt: serverTimestamp() });
      }

      // Seed RMAs
      for (const c of OFFLINE_STORAGE) {
        // Updated to use rmas collection
        await setDoc(doc(db, 'rmas', c.id), {
          ...c,
          createdAt: c.createdAt ? Timestamp.fromDate(new Date(c.createdAt)) : serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      for (const b of OFFLINE_BRANDS) {
        await setDoc(doc(db, 'brands', b.id), b);
      }
      for (const d of OFFLINE_DISTRIBUTORS) {
        await setDoc(doc(db, 'distributors', d.id), d);
      }

      console.log("Database Seeded Successfully");
    } catch (e) {
      console.error("Seeding failed", e);
      throw e;
    }
  },

  // --- Staff Management ---
  getAllUsers: async () => {
    if (!isConfigured || !db) return OFFLINE_USERS;
    try {
      const snap: any = await Promise.race([
        getDocs(collection(db, 'users')),
        new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 3000))
      ]);
      return snap.docs.map((d: any) => ({ uid: d.id, ...d.data() }));
    } catch (e) {
      console.warn("getAllUsers failed/timedout, using offline:", e);
      return OFFLINE_USERS;
    }
  },
  createStaffAccount: async (data: any) => {
    if (!isConfigured) throw new Error("Firebase Not Configured");
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'users', uid), { name: data.name, email: data.email, role: data.role, team: data.team, createdAt: serverTimestamp() });
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      return true;
    } catch (e) {
      await deleteApp(secondaryApp);
      throw e;
    }
  },
  deleteStaffAccount: async (uid: string) => {
    if (!isConfigured || !db) throw new Error("Firebase Not Configured");
    if (currentUser?.role !== 'admin') throw new Error('Unauthorized: admin access required');
    // WARNING: This only deletes the Firestore user document.
    // The Firebase Auth account is NOT deleted (requires Firebase Admin SDK on a server).
    // The user can still log in but will get default 'staff' role with no Firestore profile.
    // To fully delete: use Firebase Console > Authentication > Users, or set up a Cloud Function.
    await deleteDoc(doc(db, 'users', uid));
  },

  // --- RMA Management ---
  getRMAs: async (): Promise<RMA[]> => {
    if (!isConfigured || !db) {
      console.error("Firebase not configured!");
      throw new Error("Firebase not configured");
    }
    try {
      const q = query(collection(db, 'rmas'), orderBy('createdAt', 'desc'), limit(500));
      const snap = await getDocs(q);
      return snap.docs.map(mapDocToRMA);
    } catch (e) {
      console.error("getRMAs failed:", e);
      throw e;
    }
  },

  // Paginated version — returns { rmas, lastDoc, hasMore }
  getRMAsPaginated: async (pageSize: number = 50, lastDocSnapshot?: any): Promise<{ rmas: RMA[], lastDoc: any, hasMore: boolean }> => {
    if (!isConfigured || !db) throw new Error('Firebase Not Configured');
    try {
      let q;
      if (lastDocSnapshot) {
        q = query(collection(db, 'rmas'), orderBy('createdAt', 'desc'), startAfter(lastDocSnapshot), limit(pageSize));
      } else {
        q = query(collection(db, 'rmas'), orderBy('createdAt', 'desc'), limit(pageSize));
      }
      const snap = await getDocs(q);
      const rmas = snap.docs.map(mapDocToRMA);
      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return { rmas, lastDoc, hasMore: snap.docs.length === pageSize };
    } catch (e) {
      console.error('getRMAsPaginated failed:', e);
      throw e;
    }
  },

  // Get Unassigned RMAs (Self-registered)
  getUnassignedRMAs: async (): Promise<RMA[]> => {
    const all = await MockDb.getRMAs();
    return all.filter(c => !c.team || (c.team as any) === 'UNASSIGNED');
  },

  // Get overdue RMAs (open for more than 7 days, not closed/shipped)
  getOverdueRMAs: async (): Promise<RMA[]> => {
    const all = await MockDb.getRMAs();
    const now = Date.now();
    return all.filter(c => {
      if ([RMAStatus.CLOSED].includes(c.status)) return false;
      const daysOpen = Math.floor((now - new Date(c.createdAt).getTime()) / 86400000);
      return daysOpen > 7;
    });
  },

  // Combined Navbar counts — single Firestore read for both badges (cached 30s)
  getNavCounts: async (): Promise<{ unassigned: number; overdue: number }> => {
    const cacheNow = Date.now();
    if (_navCountsCache && cacheNow - _navCountsCache.ts < 30000) {
      return _navCountsCache.data;
    }
    const all = await MockDb.getRMAs();
    const now = Date.now();
    let unassigned = 0;
    let overdue = 0;
    for (const c of all) {
      if (!c.team || (c.team as any) === 'UNASSIGNED') unassigned++;
      if (![RMAStatus.CLOSED].includes(c.status)) {
        const daysOpen = Math.floor((now - new Date(c.createdAt).getTime()) / 86400000);
        if (daysOpen > 15) overdue++;
      }
    }
    const data = { unassigned, overdue };
    _navCountsCache = { data, ts: cacheNow };
    return data;
  },

  // NEW: Get All Logs from all RMAs for Admin
  getAllLogs: async (): Promise<any[]> => {
    const rmas = await MockDb.getRMAs();
    const allLogs: any[] = [];

    rmas.forEach(rma => {
      if (rma.history) {
        rma.history.forEach(evt => {
          allLogs.push({
            ...evt,
            claimId: rma.id, // Keep this key for UI consistency if needed, or rename to rmaId later
            jobId: rma.quotationNumber || rma.groupRequestId || rma.id, // Derived Job ID
            claimRef: rma.quotationNumber || rma.id,
            productModel: rma.productModel,
            serialNumber: rma.serialNumber,
            brand: rma.brand
          });
        });
      }
    });

    // Sort by date descending (Newest first)
    return allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getRMAById: async (id: string): Promise<RMA | undefined> => {
    if (!isConfigured || !db) return undefined;
    try {
      const snap = await getDoc(doc(db, 'rmas', id));
      if (snap.exists()) return mapDocToRMA(snap);
      const q = query(collection(db, 'rmas'), where('quotationNumber', '==', id));
      const qSnap = await getDocs(q);
      return !qSnap.empty ? mapDocToRMA(qSnap.docs[0]) : undefined;
    } catch (e) {
      console.error("getRMAById failed:", e);
      throw e;
    }
  },
  searchRMAsPublic: async (text: string): Promise<RMA[]> => {
    if (!isConfigured || !db) return [];
    const searchString = text.toLowerCase().trim();
    if (!searchString) return [];

    const resultsMap = new Map<string, RMA>();

    try {
      // 1. Try direct document get by RMA ID (e.g. "RMA-261234")
      const directSnap = await getDoc(doc(db, 'rmas', text.trim()));
      if (directSnap.exists()) {
        resultsMap.set(directSnap.id, mapDocToRMA(directSnap));
      }

      // 2. Try exact match on quotationNumber (e.g. "SEC073880")
      const quoteSnap = await getDocs(query(
        collection(db, 'rmas'),
        where('quotationNumber', '==', text.trim()),
        limit(5)
      ));
      quoteSnap.docs.forEach(d => resultsMap.set(d.id, mapDocToRMA(d)));

      // 3. Try exact match on groupRequestId (e.g. "SECRMA-2026-0003")
      const groupSnap = await getDocs(query(
        collection(db, 'rmas'),
        where('groupRequestId', '==', text.trim()),
        limit(5)
      ));
      groupSnap.docs.forEach(d => resultsMap.set(d.id, mapDocToRMA(d)));

      // 4. Try case-insensitive match on serialNumber (get requires auth, skip for public)
      // Serial numbers are handled: direct doc GET by ID covers RMA id searches,
      // and serial numbers must be entered exactly as text
      const snSnap = await getDocs(query(
        collection(db, 'rmas'),
        where('serialNumber', '==', text.trim()),
        limit(5)
      ));
      snSnap.docs.forEach(d => resultsMap.set(d.id, mapDocToRMA(d)));

    } catch (e) {
      console.error('searchRMAsPublic error:', e);
    }

    return Array.from(resultsMap.values());
  },
  addRMA: async (c: Partial<RMA>): Promise<RMA> => {
    const year = new Date().getFullYear().toString().slice(-2);
    // [FIXED] ID Format: RMA-26XXXXXX (6 digits = 900K unique IDs/year)
    const generateId = () => `RMA-${year}${Math.floor(100000 + Math.random() * 900000)}`;
    let id = generateId();

    if (!isConfigured || !db) throw new Error("Firebase Disconnected");

    // Retry up to 5 times if ID collision occurs
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const snap = await getDoc(doc(db, 'rmas', id));
        if (!snap.exists()) break; // ID is unique, proceed
        if (attempt === MAX_RETRIES - 1) {
          throw new Error(`RMA ID collision: failed to generate unique ID after ${MAX_RETRIES} attempts`);
        }
        id = generateId(); // Generate new ID and retry
      } catch (e: unknown) {
        if (e instanceof Error && e.message?.includes('RMA ID collision')) throw e;
        console.warn("ID Check fail", e);
        break; // On network error, proceed with current ID
      }
    }

    const now = new Date().toISOString();
    const newRMAData = {
      ...c,
      status: RMAStatus.PENDING,
      history: [{ id: `evt-${Date.now()}`, date: Timestamp.now(), type: 'SYSTEM', description: c.createdBy?.includes('Web') ? 'ลูกค้าลงทะเบียนล่วงหน้าผ่านหน้าเว็บ' : 'รับสินค้าเข้าเข้าระบบ', user: currentUser?.name || 'System' }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'rmas', id), newRMAData);
      // Return with ID but use local time for immediate UI update since serverTimestamp is async
      return { ...newRMAData, id, createdAt: now, updatedAt: now } as any;
    } catch (e) {
      console.error("Write RMA failed", e);
      throw e;
    }
  },
  updateRMA: async (id: string, updates: Partial<RMA>) => {
    if (!isConfigured || !db) throw new Error("Firebase Disconnected");
    try {
      await updateDoc(doc(db, 'rmas', id), { ...updates, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error("updateRMA failed", e);
      throw e;
    }
  },
  addTimelineEvent: async (id: string, evt: any) => {
    if (!isConfigured || !db) throw new Error("Firebase Disconnected");
    try {
      const snap = await getDoc(doc(db, 'rmas', id));
      if (snap.exists()) {
        const currentHistory = snap.data().history || [];
        await updateDoc(doc(db, 'rmas', id), {
          history: [...currentHistory, { id: `evt-${Date.now()}`, date: Timestamp.now(), ...evt }],
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("addTimelineEvent failed", e);
      throw e;
    }
  },

  // --- Dynamic Sequential Job ID ---
  generateNextGroupRequestId: async (): Promise<string> => {
    const now = new Date();
    const year = String(now.getFullYear()); // e.g., "2026"

    if (!isConfigured || !db) {
      // Offline fallback: use timestamp to keep rough order
      const ts = Date.now().toString().slice(-4);
      return `SECRMA-${year}-${ts}`;
    }

    const counterRef = doc(db, 'counters', 'jobCounter');

    try {
      const newSeq = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);
        let currentSequence = 1;

        if (snap.exists()) {
          const data = snap.data();
          if (data.currentYear === year) {
            // Same year, increment
            currentSequence = (data.sequence || 0) + 1;
          } else {
            // New year, reset counter
            currentSequence = 1;
          }
        }

        // Atomic update
        transaction.set(counterRef, {
          currentYear: year,
          sequence: currentSequence
        }, { merge: true });

        return currentSequence;
      });

      const formattedSeq = String(newSeq).padStart(4, '0');
      return `SECRMA-${year}-${formattedSeq}`;

    } catch (e) {
      console.error("Failed to generate sequence ID, falling back:", e);
      // Fallback: timestamp-based to keep rough order
      const ts = Date.now().toString().slice(-4);
      return `SECRMA-${year}-${ts}`;
    }
  },

  // --- Delete Functions ---
  deleteRMA: async (id: string) => {
    if (!isConfigured || !db) throw new Error("Firebase Disconnected");
    try {
      // Get the RMA first to potentially revert the Job ID counter
      const snap = await getDoc(doc(db, 'rmas', id));
      if (snap.exists()) {
        const rmaData = snap.data() as RMA;
        const groupReqId = rmaData.groupRequestId;

        // If it looks like SECRMA-YYYY-XXXX
        if (groupReqId && groupReqId.startsWith('SECRMA-')) {
          const parts = groupReqId.split('-');
          if (parts.length === 3) {
            const year = parts[1];
            const seqStr = parts[2];
            const seqNum = parseInt(seqStr, 10);

            // Check the counter
            const counterRef = doc(db, 'counters', 'jobCounter');
            const counterSnap = await getDoc(counterRef);

            if (counterSnap.exists()) {
              const counterData = counterSnap.data();
              // If this deleted job was the absolute latest one generated for this year
              if (counterData.currentYear === year && counterData.sequence === seqNum) {
                // Decrement so the next one reuses this ID
                await setDoc(counterRef, {
                  currentYear: year,
                  sequence: Math.max(0, seqNum - 1)
                }, { merge: true });
                console.log(`Reverted job counter for ${year} from ${seqNum} to ${seqNum - 1}`);
              }
            }
          }
        }
      }

      // Finally delete the document
      await deleteDoc(doc(db, 'rmas', id));
    }
    catch (e) {
      console.error("deleteRMA failed", e);
      throw e;
    }
  },

  clearDatabase: async () => {
    if (!isConfigured || !db) return;
    // Safety: admin-only + confirmation required
    if (currentUser?.role !== 'admin') {
      console.error('clearDatabase: requires admin role');
      throw new Error('Unauthorized: admin access required');
    }
    if (!confirm('⚠️ WARNING: This will permanently delete ALL RMA data. Are you sure?')) {
      return;
    }
    try {
      const snap = await getDocs(collection(db, 'rmas'));
      // Batch delete: 500 docs per batch to avoid timeout
      const BATCH_SIZE = 500;
      for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
        const batch = snap.docs.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(d => deleteDoc(d.ref)));
      }
      console.log("Database Cleared");
    } catch (e) { console.error("Clear DB Failed", e); }
  },

  getStats: async (teamFilter?: Team | 'GROUP_C'): Promise<DashboardStats> => {
    const cacheKey = teamFilter || 'ALL';
    const cacheNow = Date.now();
    if (_statsCache && _statsCache.key === cacheKey && cacheNow - _statsCache.ts < 30000) {
      return _statsCache.data;
    }
    if (!isConfigured || !db) throw new Error('Firebase Not Configured');

    const rmasRef = collection(db, 'rmas');

    // Strategy: use single-field query (no composite index needed)
    // then count statuses client-side from loaded docs
    let teamDocs: RMA[] = [];

    try {
      if (teamFilter === 'GROUP_C') {
        const snap = await getDocs(query(rmasRef, where('team', 'in', [Team.TEAM_C, Team.TEAM_E, Team.TEAM_G])));
        teamDocs = snap.docs.map(mapDocToRMA);
        // @ts-ignore
      } else if (teamFilter && teamFilter !== 'ALL') {
        const snap = await getDocs(query(rmasRef, where('team', '==', teamFilter)));
        teamDocs = snap.docs.map(mapDocToRMA);
      } else {
        // Load all RMAs if no specific team is filtered, bypassing complex where clauses 
        // that could cause missing index errors or hang operations without composite indexes
        const snap = await getDocs(rmasRef);
        teamDocs = snap.docs.map(mapDocToRMA);
      }
    } catch (dbErr) {
      console.error("getStats query failed:", dbErr);
      throw new Error("Cannot fetch Dashboard stats. Please check your internet connection or reload the page.");
    }

    // Client-side counting from loaded docs (no composite index needed)
    const now = new Date();
    const activeDocs = teamDocs.filter(c => ![RMAStatus.CLOSED].includes(c.status));
    const aging = { bucket0_7: 0, bucket8_15: 0, bucket15plus: 0 };
    activeDocs.forEach(c => {
      const diff = Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / 86400000);
      if (diff <= 7) aging.bucket0_7++; else if (diff <= 15) aging.bucket8_15++; else aging.bucket15plus++;
    });

    const urgentRMAs = activeDocs
      .filter(c => Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / 86400000) > 15)
      .slice(0, 10);

    // Filter CLOSED RMAs that were resolved THIS month only
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const resolvedThisMonth = teamDocs.filter(c => {
      if (c.status !== RMAStatus.CLOSED) return false;
      const updatedDate = new Date(c.updatedAt);
      return updatedDate >= thisMonthStart;
    }).length;

    const result: DashboardStats = {
      totalRMAs: teamDocs.length,
      pendingRMAs: activeDocs.length,
      resolvedThisMonth,
      criticalIssues: aging.bucket15plus,
      revenuePipeline: teamDocs.filter(c => c.status === RMAStatus.WAITING_PARTS).length, // Count of RMAs waiting for parts
      avgTurnaroundHours: (() => {
        const closedDocs = teamDocs.filter(c => c.status === RMAStatus.CLOSED && c.createdAt && c.updatedAt);
        if (closedDocs.length === 0) return 0;
        const totalHours = closedDocs.reduce((sum, c) => {
          const created = new Date(c.createdAt).getTime();
          const updated = new Date(c.updatedAt).getTime();
          return sum + Math.max(0, (updated - created) / 3600000);
        }, 0);
        return Math.round(totalHours / closedDocs.length);
      })(),
      overdueCount: aging.bucket15plus,
      agingBuckets: aging,
      statusCounts: {
        pending: teamDocs.filter(c => c.status === RMAStatus.PENDING).length,
        diagnosing: teamDocs.filter(c => c.status === RMAStatus.DIAGNOSING).length,
        waitingParts: teamDocs.filter(c => c.status === RMAStatus.WAITING_PARTS).length,
        repaired: teamDocs.filter(c => c.status === RMAStatus.REPAIRED).length,
        closed: teamDocs.filter(c => c.status === RMAStatus.CLOSED).length,
      },
      urgentRMAs
    };
    _statsCache = { key: cacheKey, data: result, ts: cacheNow };
    return result;
  }
};
