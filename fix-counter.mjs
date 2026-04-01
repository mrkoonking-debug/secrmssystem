/**
 * One-time fix script: Rename 2 wrong groupRequestIds and reset counter
 * 
 * SECRMA-2026-0324 → SECRMA-2026-0006
 * SECRMA-2026-1607 → SECRMA-2026-0007
 * Counter → set to 7
 * 
 * Usage: node fix-counter.mjs <email> <password>
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, updateDoc, doc, setDoc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDf6mMnM2i3hFCTJznufEDCd6tvzUXaKdc",
  authDomain: "my-sec-claim-system.firebaseapp.com",
  projectId: "my-sec-claim-system",
  storageBucket: "my-sec-claim-system.firebasestorage.app",
  messagingSenderId: "988616933794",
  appId: "1:988616933794:web:4f8267e73e3269cb05f2fb"
};

const app = initializeApp(firebaseConfig);
const authInstance = getAuth(app);
const db = getFirestore(app);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node fix-counter.mjs <email> <password>');
  process.exit(1);
}

async function fix() {
  // 1. Login
  console.log('🔐 Logging in...');
  await signInWithEmailAndPassword(authInstance, email, password);
  console.log('✅ Logged in successfully');

  // 2. Find & fix SECRMA-2026-0324 → SECRMA-2026-0006
  console.log('\n🔍 Looking for SECRMA-2026-0324...');
  const q1 = query(collection(db, 'rmas'), where('groupRequestId', '==', 'SECRMA-2026-0324'));
  const snap1 = await getDocs(q1);
  if (snap1.empty) {
    console.log('⚠️  Not found! Skipping.');
  } else {
    for (const d of snap1.docs) {
      console.log(`   Found doc: ${d.id} → Updating to SECRMA-2026-0006`);
      await updateDoc(doc(db, 'rmas', d.id), { groupRequestId: 'SECRMA-2026-0006' });
      console.log('   ✅ Updated!');
    }
  }

  // 3. Find & fix SECRMA-2026-1607 → SECRMA-2026-0007
  console.log('\n🔍 Looking for SECRMA-2026-1607...');
  const q2 = query(collection(db, 'rmas'), where('groupRequestId', '==', 'SECRMA-2026-1607'));
  const snap2 = await getDocs(q2);
  if (snap2.empty) {
    console.log('⚠️  Not found! Skipping.');
  } else {
    for (const d of snap2.docs) {
      console.log(`   Found doc: ${d.id} → Updating to SECRMA-2026-0007`);
      await updateDoc(doc(db, 'rmas', d.id), { groupRequestId: 'SECRMA-2026-0007' });
      console.log('   ✅ Updated!');
    }
  }

  // 4. Reset counter to 7
  console.log('\n🔧 Setting counter to 7...');
  await setDoc(doc(db, 'counters', 'jobCounter'), {
    currentYear: '2026',
    sequence: 7
  }, { merge: true });
  console.log('✅ Counter reset to 7');

  console.log('\n🎉 All done! ตัวถัดไปจะเป็น SECRMA-2026-0008');
  process.exit(0);
}

fix().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
