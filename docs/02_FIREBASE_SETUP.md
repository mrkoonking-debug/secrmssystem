# 🔥 วิธีเชื่อมต่อ Firebase (คู่มือครบจบในไฟล์เดียว)

คู่มือนี้ช่วยให้คุณตั้งค่า Firebase ตั้งแต่ต้น เพื่อให้ระบบเก็บข้อมูลบน Cloud และใช้งานร่วมกันหลายเครื่องได้แบบ Real-time

---

## 📌 ทำไมต้องใช้ Firebase?

หากไม่มีการเชื่อมต่อ Firebase:
- ข้อมูลจะหายทันทีเมื่อปิดเบราว์เซอร์
- ไม่สามารถใช้งานร่วมกันหลายเครื่องได้
- ระบบ Login ไม่ทำงาน

หลังจากเชื่อมต่อแล้ว:
- ข้อมูลอยู่ถาวรบน Google Cloud
- ทุกเครื่องที่เปิดเว็บเห็นข้อมูลเดียวกัน Real-time
- Login ด้วย Email/Password ได้

---

## ขั้นตอนที่ 1: สร้างโปรเจกต์ Firebase

1. เปิด [Firebase Console](https://console.firebase.google.com/) แล้ว Login ด้วย Gmail
2. กด **"Create a project"** (หรือ "Add project")
3. ตั้งชื่อโปรเจกต์ (เช่น `my-sec-claim-system`)
4. กด **Continue** จนสร้างเสร็จ (เรื่อง Google Analytics จะเปิดหรือไม่ก็ได้)

---

## ขั้นตอนที่ 2: เปิดใช้งาน Firestore Database

1. ที่เมนูซ้าย กด **Build → Firestore Database**
2. กด **"Create database"**
3. เลือก Server location: **`asia-southeast1 (Singapore)`** ← สำคัญ ใกล้ไทย โหลดเร็วกว่า
4. เลือก **"Start in test mode"** (ทดสอบก่อน) → กด **Create**

> ⚠️ หากต้องการใช้งานจริงในระยะยาว ให้ไปแก้ Firestore Rules ทีหลังตามที่อยู่ใน `firestore.rules`

---

## ขั้นตอนที่ 3: เปิดใช้งาน Authentication (ระบบ Login)

1. เมนูซ้าย กด **Build → Authentication**
2. กด **"Get started"**
3. เลือก Provider: **Email/Password**
4. กด **Enable** → กด **Save**

---

## ขั้นตอนที่ 4: รับ API Key มาใส่ในโค้ด

1. กดรูปเฟือง ⚙️ ข้างชื่อโปรเจกต์ (มุมบนซ้าย) → **Project settings**
2. เลื่อนลงมาส่วน **"Your apps"** → กดไอคอน **Web** (`</>`)
3. ตั้งชื่อแอพ (เช่น `Web App`) → กด **Register app**
4. ระบบจะแสดงโค้ด config ให้ดูค่าดังนี้:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "my-project.firebaseapp.com",
  projectId: "my-project",
  storageBucket: "my-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxx"
};
```

5. จดหรือ copy ค่าเหล่านี้ไว้

---

## ขั้นตอนที่ 5: ใส่ค่าในไฟล์ `.env`

เปิดไฟล์ `.env` ในโฟลเดอร์โปรเจกต์ แล้วใส่ค่าที่ได้จากขั้นตอนที่ 4:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-project
VITE_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxx
```

> 🔒 **สำคัญ:** ไฟล์ `.env` อยู่ใน `.gitignore` อยู่แล้ว จะไม่ถูก push ขึ้น GitHub โดยอัตโนมัติ ดีแล้วครับ รักษาความลับ!

---

## ขั้นตอนที่ 6: ทดสอบการเชื่อมต่อ

1. บันทึกไฟล์ `.env`
2. กลับที่ Terminal กด `Ctrl+C` เพื่อหยุด server เดิม
3. รัน `npm run dev` ใหม่
4. เปิด Developer Tools (F12) → แท็บ **Console** จะเห็น:

```
🚀 SEC-CLAIM: Connected to Firebase Cloud
```

หากขึ้นข้อความนี้ = เชื่อมต่อสำเร็จ! ✅

---

## 🔐 ขั้นตอนที่ 7: สร้าง Admin คนแรก

หลังเชื่อมต่อ Firebase ใหม่ จะยังไม่มี User ใดๆ ในระบบ

**วิธีสร้าง Admin ผ่าน Firebase Console:**
1. ไปที่ Firebase Console → **Authentication → Users**
2. กด **"Add user"**
3. ใส่ Email: `support@sectechnology.co.th` และตั้ง Password
4. กด **Add user**

> 💡 Email `support@sectechnology.co.th` จะได้สิทธิ์ Super Admin อัตโนมัติ (กำหนดไว้ในโค้ด `services/mockDb.ts`)

---

## ❓ แก้ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
| :--- | :--- |
| เชื่อมต่อไม่ได้ ขึ้น Error | ตรวจสอบค่าในไฟล์ `.env` ให้ตรงกับ Firebase ทุกตัว |
| Login ไม่ได้ | ตรวจสอบว่าเปิด Authentication + Email/Password แล้ว |
| ข้อมูลไม่แสดง | ตรวจสอบว่า Firestore Database ถูกสร้างแล้ว |
| โหลดช้า | ตรวจสอบ Server location ให้เป็น `asia-southeast1` |

---

*หากติดขัดขั้นตอนไหน แจ้งผมได้ทันทีครับ*
