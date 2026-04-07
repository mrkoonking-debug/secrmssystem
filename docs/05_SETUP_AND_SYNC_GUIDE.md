---
description: วิธี setup โปรเจค SEC RMS System บนเครื่องใหม่ หรือ sync กับ GitHub
---

# 🚀 Setup & Sync โปรเจค SEC RMS System

## กรณีที่ 1: เครื่องใหม่ (ยังไม่เคย clone)

### ขั้นตอน:

1. เปิด Terminal (PowerShell / CMD) แล้ว clone repo
// turbo
```bash
git clone https://github.com/mrkoonking-debug/secrmssystem.git
```

2. เข้าไปในโฟลเดอร์โปรเจค
// turbo
```bash
cd secrmssystem
```

3. ติดตั้ง dependencies
// turbo
```bash
npm install
```

4. สร้างไฟล์ `.env` (สำคัญมาก! ไม่ได้อยู่ใน GitHub)
```
VITE_FIREBASE_API_KEY=AIzaSyDf6mMnM2i3hFCTJznufEDCd6tvzUXaKdc
VITE_FIREBASE_AUTH_DOMAIN=my-sec-claim-system.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-sec-claim-system
VITE_FIREBASE_STORAGE_BUCKET=my-sec-claim-system.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=988616933794
VITE_FIREBASE_APP_ID=1:988616933794:web:4f8267e73e3269cb05f2fb
```

5. ทดสอบรัน
// turbo
```bash
npm run dev
```

6. เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`

---

## กรณีที่ 2: เครื่องเดิม แต่มีการเปลี่ยนแปลงจากเครื่องอื่น (pull update)

### ขั้นตอน:

1. ดึงโค้ดล่าสุดจาก GitHub
// turbo
```bash
git pull origin main
```

2. ติดตั้ง dependencies ใหม่ (กรณีมีการเพิ่ม package)
// turbo
```bash
npm install
```

3. รันโปรเจค
// turbo
```bash
npm run dev
```

---

## กรณีที่ 3: Push โค้ดขึ้น GitHub (หลังแก้ไขเสร็จ)

### ขั้นตอน:

1. เช็คไฟล์ที่เปลี่ยนแปลง
// turbo
```bash
git status
```

2. เพิ่มไฟล์ทั้งหมดที่เปลี่ยน
```bash
git add .
```

3. Commit พร้อมข้อความ
```bash
git commit -m "อธิบายสิ่งที่แก้ไข"
```

4. Push ขึ้น GitHub
```bash
git push origin main
```

---

## กรณีที่ 4: Deploy ขึ้นเว็บจริง (Firebase Hosting)

### ขั้นตอน:

1. Build โปรเจค
```bash
npm run build
```

2. Deploy ขึ้น Firebase
```bash
npx firebase deploy --only hosting
```

> หมายเหตุ: ต้อง login Firebase ก่อน ถ้ายังไม่เคย:
> ```bash
> npx firebase login
> ```

---

## ⚠️ สิ่งสำคัญที่ต้องจำ

| รายการ | รายละเอียด |
|:-------|:-----------|
| **ไฟล์ `.env`** | ไม่ได้อยู่ใน GitHub (อยู่ใน `.gitignore`) ต้องสร้างเองทุกเครื่อง |
| **`node_modules/`** | ไม่ได้อยู่ใน GitHub ต้องรัน `npm install` ทุกครั้งที่ clone ใหม่ |
| **`dist/`** | โฟลเดอร์ build สำหรับ deploy ไม่ต้อง push ขึ้น GitHub |
| **Firebase Config** | ใช้ project เดียวกันทุกเครื่อง (`my-sec-claim-system`) |
