# 🔄 คู่มือ Setup & Sync โปรเจค (ย้ายเครื่อง / สลับเครื่อง / Git)

คู่มือรวมทุกอย่างเกี่ยวกับ Git, GitHub และการย้ายเครื่อง ไว้ในไฟล์เดียว

---

## กรณีที่ 1: เครื่องใหม่ (ยังไม่เคย clone)

### สิ่งที่ต้องลงก่อน:
- **Git**: โหลดที่ [git-scm.com](https://git-scm.com) (Next จนจบ)
- **Node.js**: โหลดที่ [nodejs.org](https://nodejs.org) (เลือก LTS)
- **VS Code**: โหลดที่ [code.visualstudio.com](https://code.visualstudio.com)

### ขั้นตอน:

1. เปิด VS Code → Terminal → New Terminal
2. Clone repo:
   ```bash
   git clone https://github.com/mrkoonking-debug/secrmssystem.git
   ```
3. เข้าโฟลเดอร์:
   ```bash
   cd secrmssystem
   ```
4. ติดตั้ง dependencies:
   ```bash
   npm install
   ```
5. **สร้างไฟล์ `.env`** (สำคัญมาก! ไม่ได้อยู่ใน GitHub):
   ```
   VITE_FIREBASE_API_KEY=AIzaSyDf6mMnM2i3hFCTJznufEDCd6tvzUXaKdc
   VITE_FIREBASE_AUTH_DOMAIN=my-sec-claim-system.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=my-sec-claim-system
   VITE_FIREBASE_STORAGE_BUCKET=my-sec-claim-system.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=988616933794
   VITE_FIREBASE_APP_ID=1:988616933794:web:4f8267e73e3269cb05f2fb
   ```
6. ทดสอบรัน:
   ```bash
   npm run dev
   ```
7. เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`

---

## กรณีที่ 2: เครื่องเดิม แต่มีการเปลี่ยนแปลงจากเครื่องอื่น

```bash
git pull origin main
npm install
npm run dev
```

---

## กฎทอง: "ดึงก่อนเริ่ม ดันก่อนเลิก"

### 🟢 ก่อนเริ่มงาน — ดึงโค้ดล่าสุด
```bash
git pull
```

### 🔴 เลิกงาน — เซฟและดันขึ้น
```bash
git add .
git commit -m "อัปเดต: [สิ่งที่ทำ]"
git push
```

### 💡 วัฏจักร
```
เปิดคอม → git pull → ทำงาน → git add . && git commit -m "..." && git push → ปิดคอม
```

---

## Deploy ขึ้นเว็บจริง

```bash
npm run build && npx firebase deploy --only hosting
```

> ถ้ายังไม่เคย login Firebase:
> ```bash
> npx firebase login
> ```

---

## คำสั่ง Git ที่ใช้บ่อย

| คำสั่ง | หน้าที่ |
|:-------|:--------|
| `git status` | ดูไฟล์ที่เปลี่ยนแปลง |
| `git log --oneline` | ดูประวัติ Checkpoint |
| `git add .` | เพิ่มทุกไฟล์เข้า Staging |
| `git commit -m "..."` | บันทึก Checkpoint |
| `git push` | ดันขึ้น GitHub |
| `git pull` | ดึงล่าสุดจาก GitHub |
| `git restore .` | ยกเลิกการแก้ไข (ก่อน commit) |
| `git reset --hard ID` | ย้อนทั้งโปรเจกต์ (อันตราย!) |

---

## ⚠️ สิ่งสำคัญที่ต้องจำ

| รายการ | รายละเอียด |
|:-------|:-----------|
| **ไฟล์ `.env`** | ไม่ได้อยู่ใน GitHub — ต้องสร้างเองทุกเครื่อง |
| **`node_modules/`** | ไม่ได้อยู่ใน GitHub — ต้องรัน `npm install` ทุกครั้ง |
| **`dist/`** | โฟลเดอร์ build — ไม่ต้อง push |
| **Firebase Config** | ใช้ project เดียวกันทุกเครื่อง (`my-sec-claim-system`) |

---

*อัปเดตล่าสุด เมษายน 2569*
