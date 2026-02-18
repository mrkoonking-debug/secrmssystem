# วิธีเชื่อมต่อฐานข้อมูล Firebase (เพื่อให้ใช้งานร่วมกันได้หลายคน)

ระบบนี้รองรับ **Firebase Cloud Firestore** (ฐานข้อมูลออนไลน์ของ Google) อยู่แล้ว 
เมื่อเชื่อมต่อเสร็จ ข้อมูลจะถูกเก็บไว้บน Cloud ทำให้พนักงานทุกคนที่เปิดเว็บนี้ จะเห็นข้อมูลชุดเดียวกันแบบ Real-time

---

## ขั้นตอนที่ 1: สร้างโปรเจกต์ Firebase
1. เข้าไปที่เว็บ [Firebase Console](https://console.firebase.google.com/)
2. ล็อกอินด้วย Gmail ของบริษัท (หรือของ admin)
3. กดปุ่ม **"Create a project"** (หรือ "Add project")
4. ตั้งชื่อโปรเจกต์ (เช่น `my-sec-claim-system`)
5. กด Continue จนสร้างเสร็จ (เรื่อง Google Analytics จะเปิดหรือไม่ก็ได้)

## ขั้นตอนที่ 2: สร้างแอพและรับ Key
1. เมื่อสร้างเสร็จ จะเข้ามาหน้า Dashboard 
2. ให้กดไอคอน **Web** (รูป `</>`) เพื่อเพิ่มแอพ
3. ตั้งชื่อแอพ (เช่น `Web App`) แล้วกด **Register app**
4. คุณจะเห็นโค้ดภาษาอังกฤษเยอะๆ (Firebase SDK) อย่าเพิ่งปิด
5. ให้มองหาบรรทัดที่มี **`const firebaseConfig = { ... }`**
6. ค่าที่คุณต้องใช้คือค่าที่อยู่ในปีกกา:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

## ขั้นตอนที่ 3: เปิดใช้งาน Database และ Login
1. ที่เมนูด้านซ้าย เลือก **Build** -> **Firestore Database**
2. กด **Create database**
3. เลือก Server location ที่ใกล้ไทย (เช่น `asia-southeast1` สิงคโปร์)
4. เลือกโหมด **Start in test mode** (เพื่อทดสอบก่อน) แล้วกด Create
5. ไปที่เมนู **Build** -> **Authentication**
6. กด **Get started**
7. เลือก **Email/Password** -> กด **Enable** -> กด Save

## ขั้นตอนที่ 4: ใส่ค่าลงในโปรแกรม
1. กลับมาที่โฟลเดอร์โปรเจกต์นี้
2. เปิดไฟล์ชื่อ `.env` (ผมได้สร้างไฟล์เปล่าๆ ไว้ให้แล้ว)
3. นำค่าจาก **ขั้นตอนที่ 2** มาวางต่อท้ายเครื่องหมาย `=` ให้ครบทุกช่อง ดังตัวอย่าง:

```env
VITE_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-project
VITE_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxx
```

## ขั้นตอนที่ 5: เริ่มใช้งาน
1. บันทึกไฟล์ `.env`
2. ที่หน้าจอดำ (Terminal) ให้กด `Ctrl+C` เพื่อหยุดเซิร์ฟเวอร์เดิม (ถ้าเปิดอยู่)
3. พิมพ์คำสั่ง `npm run dev` ใหม่
4. สังเกตในหน้าจอ Console ของเว็บ (กด F12) จะต้องขึ้นคำว่า: 
   `🚀 SEC-CLAIM: Connected to Firebase Cloud`
5. **สำคัญ:** เมื่อต่อ Database จริงแล้ว User เก่า (support@sec...) จะหายไป 
   - ให้คุณไปที่หน้าเว็บ เลือกเมนู **Register** (ลงทะเบียนลูกค้า) 
   - หรือถ้าต้องการสร้าง Admin คนแรก ให้ใช้ฟังก์ชันในโค้ดเพื่อสร้าง (หรือเพิ่ม User เองในหน้า Firebase Authentication)

---
*หากติดขัดขั้นตอนไหน แจ้งผมได้ทันทีครับ*
