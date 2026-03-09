# 🚀 คู่มือ Deployment (นำขึ้นเว็บจริง)

คู่มือนี้อธิบายวิธีนำโค้ดที่แก้ไขเสร็จแล้ว ขึ้นไปยังเว็บจริงที่ Firebase Hosting

🔗 **URL เว็บจริง:** [https://secrmssystem.web.app](https://secrmssystem.web.app)

---

## 🔄 ขั้นตอน Deploy (ทำทุกครั้งหลังแก้โค้ด)

### คำสั่งสั้น (รันทีเดียวจบ)

```bash
npm run build && npx firebase deploy
```

> คำสั่งนี้จะ: **Build** ไฟล์เว็บก่อน → แล้ว **Deploy** ขึ้น Firebase อัตโนมัติ

---

### คำอธิบายทีละขั้นตอน

**ขั้นตอนที่ 1: Login Firebase (ครั้งแรก หรือเมื่อ Session หมดอายุ)**
```bash
npx firebase login --reauth
```
- เบราว์เซอร์จะเปิดมาให้ Login ด้วย Google Account
- Login สำเร็จแล้วกลับมาที่ Terminal

**ขั้นตอนที่ 2: Build ไฟล์เว็บ**
```bash
npm run build
```
- สร้างโฟลเดอร์ `dist/` ที่มีไฟล์ HTML/CSS/JS พร้อม deploy
- รอจนขึ้นว่า `✓ built in X.XXs`

**ขั้นตอนที่ 3: Deploy ขึ้น Firebase**
```bash
npx firebase deploy
```
- หรือถ้าต้องการ deploy แค่ส่วน Hosting (เร็วกว่า):
  ```bash
  npx firebase deploy --only hosting
  ```
- รอจนขึ้นว่า `✔ Deploy complete!`

---

## ⚙️ ติดตั้ง Firebase CLI (ครั้งแรกเท่านั้น)

ปกติระบบนี้ใช้ `npx firebase` ดังนั้น **ไม่ต้องติดตั้งอะไรเพิ่ม** แต่ถ้าอยากใช้ `firebase` โดยตรง (ไม่ผ่าน npx):

```bash
npm install -g firebase-tools
```

จากนั้นสามารถใช้ `firebase deploy` แทน `npx firebase deploy` ได้เลย

---

## 🔧 คำสั่งที่ใช้บ่อย

| คำสั่ง | หน้าที่ |
| :--- | :--- |
| `npm run dev` | รันเว็บทดสอบในเครื่อง (localhost) |
| `npm run build` | สร้างไฟล์พร้อม deploy (สร้างโฟลเดอร์ `dist/`) |
| `npx firebase deploy` | Deploy ขึ้น Firebase ทั้งหมด (Hosting + Rules) |
| `npx firebase deploy --only hosting` | Deploy แค่ไฟล์เว็บ (เร็วกว่า) |
| `npx firebase login --reauth` | Login เข้า Firebase ใหม่ |
| `npx firebase logout` | Logout ออกจาก Firebase |

---

## 🖥️ การตั้งค่าเครื่องใหม่ (ย้ายเครื่อง)

หากต้องย้ายมาทำงานในเครื่องใหม่ ให้ทำตามนี้:

1. **ลง Node.js** (v18+): [nodejs.org](https://nodejs.org) → เลือกตัว LTS
2. **ลง VS Code**: [code.visualstudio.com](https://code.visualstudio.com)
3. **Copy โฟลเดอร์โปรเจกต์** มาใส่เครื่องใหม่ (หรือดึงจาก Git)
4. **ตรวจสอบไฟล์ `.env`** — ต้องมีค่า Firebase ครบ (ดูที่ [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
5. เปิด Terminal แล้วรัน:
   ```bash
   npm install
   npm run dev
   ```

> 💡 **เคล็ดลับ:** ถ้าใช้ Git ให้ทำ `git pull` ก่อนเสมอ เพื่อดึงโค้ดล่าสุด

---

## ❓ แก้ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
| :--- | :--- |
| `firebase: command not found` | ใช้ `npx firebase` แทน |
| Deploy แล้วเว็บยังเหมือนเดิม | กด `Ctrl+Shift+R` (Hard Refresh) ในเบราว์เซอร์ |
| Build Error | อ่าน error message แล้วแก้ไขโค้ดตามที่บอก |
| Login Firebase หมดอายุ | รัน `npx firebase login --reauth` |
| `npm run build` ผ่าน แต่ deploy ไม่ได้ | ตรวจสอบ `firebase.json` ว่ามี `"public": "dist"` อยู่ |

---

*อัปเดตล่าสุด มีนาคม 2026*
