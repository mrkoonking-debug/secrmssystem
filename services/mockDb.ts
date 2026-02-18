
import { RMA, RMAStatus, DashboardStats, Team, TimelineEvent } from '../types';
import { db, auth, isConfigured, firebaseConfig } from './firebaseConfig';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, limit, serverTimestamp
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, getAuth
} from 'firebase/auth';
import { BRAND_OPTIONS, DISTRIBUTOR_OPTIONS } from '../constants/options';

import { SEED_CLAIMS } from './seedData';

let currentUser: any = null;
let OFFLINE_STORAGE: RMA[] = SEED_CLAIMS as any; // Cast for now, should update seedData too
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
  website: 'www.sec-technology.com'
};

// ... (Auth/LocalStorage logic remains the same)

try {
  const savedUser = localStorage.getItem('mock_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }
} catch (e) {
  console.error("Failed to restore session", e);
}

if (isConfigured && auth) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      currentUser = {
        uid: user.uid,
        name: userData.name || user.email?.split('@')[0],
        email: user.email,
        role: (user.email === 'support@sectechnology.co.th' || user.email === 'admin@sec-claim.com') ? 'admin' : (userData.role || 'staff'),
        team: userData.team || 'ALL'
      };
      // Also sync to local storage just in case mixed mode is used
      localStorage.setItem('mock_user', JSON.stringify(currentUser));
    } else {
      currentUser = null;
      localStorage.removeItem('mock_user');
    }
  });
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
  login: async (u: string, p: string) => {
    if (!isConfigured || !auth) {
      const user = OFFLINE_USERS.find(x => x.email === u && p === 'Sec@1065152');
      if (user) {
        currentUser = user;
        localStorage.setItem('mock_user', JSON.stringify(user));
        return { success: true };
      }
      return { success: false, error: "Invalid offline credentials" };
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, u, p);
      const email = cred.user.email;

      // Force Admin Role for Super Admin
      const role = (email === 'support@sectechnology.co.th' || email === 'admin@sec-claim.com') ? 'admin' : 'staff';

      currentUser = {
        uid: cred.user.uid,
        name: email?.split('@')[0],
        email: email,
        role: role,
        team: 'ALL'
      };
      return { success: true };
    } catch (e: any) {
      console.error("Login Error:", e);
      return { success: false, error: e.message || "Unknown error" };
    }
  },

  registerAdmin: async () => {
    if (!isConfigured || !auth) return { success: false, error: "Firebase not configured" };
    try {
      await createUserWithEmailAndPassword(auth, 'admin@sec-claim.com', 'Sec@1065152');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  logout: async () => {
    if (isConfigured && auth) await signOut(auth);
    currentUser = null;
    localStorage.removeItem('mock_user');
  },

  isAuthenticated: () => !!currentUser,
  getCurrentUser: () => currentUser,

  // --- Dynamic Brands Management ---
  getBrands: async () => {
    if (!isConfigured || !db) return OFFLINE_BRANDS;
    try {
      const snap = await getDocs(collection(db, 'brands'));
      return snap.empty ? OFFLINE_BRANDS : snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Error fetching brands (falling back to offline):", e);
      return OFFLINE_BRANDS;
    }
  },
  addBrand: async (brand: any) => {
    const id = `b-${Date.now()}`;
    if (!isConfigured || !db) { OFFLINE_BRANDS.push({ id, ...brand }); return; }
    await setDoc(doc(db, 'brands', id), brand);
  },
  updateBrand: async (id: string, updates: any) => {
    if (!isConfigured || !db) {
      const idx = OFFLINE_BRANDS.findIndex(b => b.id === id);
      if (idx !== -1) OFFLINE_BRANDS[idx] = { ...OFFLINE_BRANDS[idx], ...updates };
      return;
    }
    await updateDoc(doc(db, 'brands', id), updates);
  },
  deleteBrand: async (id: string) => {
    if (!isConfigured || !db) { OFFLINE_BRANDS = OFFLINE_BRANDS.filter(b => b.id !== id); return; }
    await deleteDoc(doc(db, 'brands', id));
  },

  // --- Dynamic Distributors Management ---
  getDistributors: async () => {
    if (!isConfigured || !db) return OFFLINE_DISTRIBUTORS;
    try {
      const snap = await getDocs(collection(db, 'distributors'));
      return snap.empty ? OFFLINE_DISTRIBUTORS : snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Error fetching distributors (falling back to offline):", e);
      return OFFLINE_DISTRIBUTORS;
    }
  },
  addDistributor: async (dist: any) => {
    const id = `d-${Date.now()}`;
    if (!isConfigured || !db) { OFFLINE_DISTRIBUTORS.push({ id, ...dist }); return; }
    await setDoc(doc(db, 'distributors', id), dist);
  },
  updateDistributor: async (id: string, updates: any) => {
    if (!isConfigured || !db) {
      const idx = OFFLINE_DISTRIBUTORS.findIndex(d => d.id === id);
      if (idx !== -1) OFFLINE_DISTRIBUTORS[idx] = { ...OFFLINE_DISTRIBUTORS[idx], ...updates };
      return;
    }
    await updateDoc(doc(db, 'distributors', id), updates);
  },
  deleteDistributor: async (id: string) => {
    if (!isConfigured || !db) { OFFLINE_DISTRIBUTORS = OFFLINE_DISTRIBUTORS.filter(d => d.id !== id); return; }
    await deleteDoc(doc(db, 'distributors', id));
  },

  // --- Settings ---
  getSettings: async () => {
    if (!isConfigured || !db) return OFFLINE_SETTINGS;
    try {
      // Race against 3s timeout
      const snap: any = await Promise.race([
        getDoc(doc(db, 'settings', 'config')),
        new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 3000))
      ]);
      return snap.exists() ? snap.data() : OFFLINE_SETTINGS;
    } catch (e) {
      console.warn("getSettings failed/timedout, using offline:", e);
      return OFFLINE_SETTINGS;
    }
  },
  updateSettings: async (s: any) => {
    if (!isConfigured || !db) { OFFLINE_SETTINGS = { ...OFFLINE_SETTINGS, ...s }; return; }
    try { await setDoc(doc(db, 'settings', 'config'), s); } catch (e) { console.error("updateSettings failed", e); }
  },

  // --- Seed Data (Admin Only) ---
  seedDatabase: async () => {
    if (!isConfigured || !db) return;
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
    if (!isConfigured) { OFFLINE_USERS.push({ uid: `u-${Date.now()}`, ...data }); return true; }
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
    if (!isConfigured || !db) { OFFLINE_USERS = OFFLINE_USERS.filter(u => u.uid !== uid); return; }
    await deleteDoc(doc(db, 'users', uid));
  },

  // --- RMA Management ---
  getRMAs: async (): Promise<RMA[]> => {
    if (!isConfigured || !db) return OFFLINE_STORAGE;
    try {
      const q = query(collection(db, 'rmas'), orderBy('createdAt', 'desc'), limit(500));
      const snap: any = await Promise.race([
        getDocs(q),
        new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 3000))
      ]);
      return snap.docs.map(mapDocToRMA);
    } catch (e) {
      console.warn("getRMAs failed/timedout, using offline:", e);
      return OFFLINE_STORAGE;
    }
  },

  // NEW: Get Unassigned RMAs (Self-registered)
  getUnassignedRMAs: async (): Promise<RMA[]> => {
    const all = await MockDb.getRMAs();
    return all.filter(c => !c.team || (c.team as any) === 'UNASSIGNED');
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
    if (!isConfigured || !db) return OFFLINE_STORAGE.find(c => c.id === id || c.quotationNumber === id);
    try {
      const snap = await getDoc(doc(db, 'rmas', id));
      if (snap.exists()) return mapDocToRMA(snap);
      const q = query(collection(db, 'rmas'), where('quotationNumber', '==', id));
      const qSnap = await getDocs(q);
      return !qSnap.empty ? mapDocToRMA(qSnap.docs[0]) : undefined;
    } catch (e) {
      console.warn("getRMAById failed, using offline:", e);
      return OFFLINE_STORAGE.find(c => c.id === id || c.quotationNumber === id);
    }
  },
  searchRMAsPublic: async (text: string): Promise<RMA[]> => {
    const all = await MockDb.getRMAs();
    const lower = text.toLowerCase().trim();
    return all.filter(c => c.serialNumber.toLowerCase().includes(lower) || c.id.toLowerCase().includes(lower) || (c.quotationNumber && c.quotationNumber.toLowerCase().includes(lower)) || (c.groupRequestId && c.groupRequestId.toLowerCase().includes(lower)));
  },
  addRMA: async (c: Partial<RMA>): Promise<RMA> => {
    const year = new Date().getFullYear().toString().slice(-2);
    // [NEW] ID Format: RMA-26XXXX
    let id = `RMA-${year}${Math.floor(1000 + Math.random() * 9000)}`;

    // Ensure Unique ID
    if (isConfigured && db) {
      try {
        const checkExists = async () => {
          const snap = await getDoc(doc(db, 'rmas', id));
          return snap.exists();
        };

        let exists = await Promise.race([
          checkExists(),
          new Promise((_, r) => setTimeout(() => r(false), 2000))
        ]);

        if (exists) {
          id = `RMA-${year}${Math.floor(1000 + Math.random() * 9000)}`;
        }
      } catch (e) { console.warn("ID Check timeout/fail", e); }
    } else {
      while (OFFLINE_STORAGE.some(x => x.id === id)) {
        id = `RMA-${year}${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    const now = new Date().toISOString();
    const newRMAData = {
      ...c,
      status: RMAStatus.PENDING,
      history: [{ id: `evt-${Date.now()}`, date: now, type: 'SYSTEM', description: c.createdBy?.includes('Web') ? 'ลูกค้าลงทะเบียนล่วงหน้าผ่านหน้าเว็บ' : 'รับสินค้าเข้าเข้าระบบ', user: currentUser?.name || 'System' }],
      createdAt: isConfigured ? serverTimestamp() : now,
      updatedAt: isConfigured ? serverTimestamp() : now
    };
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'rmas', id), newRMAData);
        return { ...newRMAData, id, createdAt: now, updatedAt: now } as any;
      } catch (e) {
        console.warn("Write RMA failed, fallback offline", e);
      }
    }
    const offlineRMA = { ...newRMAData, id, createdAt: now, updatedAt: now } as RMA;
    OFFLINE_STORAGE.unshift(offlineRMA);
    return offlineRMA;
  },
  updateRMA: async (id: string, updates: Partial<RMA>) => {
    if (isConfigured && db) {
      try { await updateDoc(doc(db, 'rmas', id), { ...updates, updatedAt: serverTimestamp() }); }
      catch (e) { console.error("updateRMA failed", e); }
    }
    else { const idx = OFFLINE_STORAGE.findIndex(c => c.id === id); if (idx !== -1) OFFLINE_STORAGE[idx] = { ...OFFLINE_STORAGE[idx], ...updates, updatedAt: new Date().toISOString() }; }
  },
  addTimelineEvent: async (id: string, evt: any) => {
    if (isConfigured && db) {
      try {
        const snap: any = await Promise.race([
          getDoc(doc(db, 'rmas', id)),
          new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 3000))
        ]);
        if (snap.exists()) await updateDoc(doc(db, 'rmas', id), { history: [...snap.data().history, { id: `evt-${Date.now()}`, date: Timestamp.now(), ...evt }], updatedAt: serverTimestamp() });
      } catch (e) {
        console.warn("addTimelineEvent failed/timedout", e);
      }
    } else { const c = OFFLINE_STORAGE.find(x => x.id === id); if (c) c.history.push({ id: `evt-${Date.now()}`, date: new Date().toISOString(), ...evt } as any); }
  },

  // --- Delete Functions ---
  deleteRMA: async (id: string) => {
    if (isConfigured && db) {
      try { await deleteDoc(doc(db, 'rmas', id)); }
      catch (e) { console.error("deleteRMA failed", e); }
    } else {
      OFFLINE_STORAGE = OFFLINE_STORAGE.filter(c => c.id !== id);
    }
  },

  clearDatabase: async () => {
    if (!isConfigured || !db) return;
    try {
      const snap = await getDocs(collection(db, 'rmas'));
      const promises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(promises);
      console.log("Database Cleared");
    } catch (e) { console.error("Clear DB Failed", e); }
  },

  getStats: async (teamFilter?: Team | 'GROUP_C'): Promise<DashboardStats> => {
    const all = await MockDb.getRMAs();
    let filtered = all.filter(c => !!c.team); // Filter out unassigned from main stats
    if (teamFilter) filtered = teamFilter === 'GROUP_C' ? all.filter(c => [Team.TEAM_C, Team.TEAM_E, Team.TEAM_G].includes(c.team)) : all.filter(c => c.team === teamFilter);
    const now = new Date();
    const aging = { bucket0_3: 0, bucket4_7: 0, bucket7plus: 0 };
    filtered.forEach(c => {
      if (![RMAStatus.CLOSED, RMAStatus.SHIPPED].includes(c.status)) {
        const diff = Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / 86400000);
        if (diff <= 3) aging.bucket0_3++; else if (diff <= 7) aging.bucket4_7++; else aging.bucket7plus++;
      }
    });
    return {
      totalClaims: filtered.length,
      pendingClaims: filtered.filter(c => ![RMAStatus.CLOSED, RMAStatus.SHIPPED].includes(c.status)).length,
      resolvedThisMonth: filtered.filter(c => c.status === RMAStatus.CLOSED).length,
      criticalIssues: aging.bucket7plus,
      revenuePipeline: filtered.filter(c => c.status === RMAStatus.WAITING_PARTS).length,
      avgTurnaroundHours: 48, overdueCount: aging.bucket7plus, agingBuckets: aging,
      urgentClaims: filtered.filter(c => ![RMAStatus.CLOSED, RMAStatus.SHIPPED].includes(c.status)).slice(0, 5)
    };
  }
};
