# รายงานโครงการระบบติดตามและจัดการงานเคลม (SEC RMA System)
เอกสารประกอบการส่งงานวิชาโครงงาน

## 1. บทนำ (Introduction)
ระบบ SEC RMA System เป็นเว็บแอปพลิเคชันสำหรับบริหารจัดการกระบวนการรับเคลมสินค้า (RMA Management) โดยรองรับการทำงานตั้งแต่ลูกค้าส่งของ, การตรวจสอบสินค้า, การส่งต่อผู้นำเข้า (Distributor), ไปจนถึงการส่งคืนสินค้าให้ลูกค้า พร้อมระบบติดตามสถานะแบบ Real-time

## 2. เทคโนโลยีที่ใช้ (Tech Stack)
*   **Frontend Library:** React (เวอร์ชัน 18)
*   **Language:** TypeScript (เพื่อความถูกต้องของข้อมูล)
*   **Build Tool:** Vite (ทำงานเร็วและเบา)
*   **Styling:** Tailwind CSS (ตกแต่งหน้าตาให้ทันสมัยและ Responsive)
*   **Database & Backend:** Google Firebase (Firestore & Authentication)
*   **Hosting:** Firebase Hosting

## 3. สถาปัตยกรรมระบบ (System Architecture)
ระบบถูกออกแบบเป็น **Single Page Application (SPA)** ที่ทำงานบนฝั่ง Client-side โดยเชื่อมต่อกับบริการ Firebase โดยตรง (Serverless Architecture) ทำให้ไม่ต้องดูแล Server เอง และประหยัดค่าใช้จ่าย

### โครงสร้างฐานข้อมูล (Database Schema - NoSQL)
ข้อมูลถูกเก็บใน Google Cloud Firestore ในรูปแบบ Document ดังนี้:
1.  **`claims` (Collection):** เก็บข้อมูลใบเคลมแต่ละใบ
    *   `id`: รหัสใบเคลม (เช่น CLM-67xxxx)
    *   `customerName`, `customerPhone`: ข้อมูลลูกค้า
    *    `productModel`, `serialNumber`: ข้อมูลสินค้า
    *    `status`: สถานะงาน (PENDING, REPAIRED, etc.)
    *    `history`: อาเรย์เก็บประวัติ Timeline
2.  **`users` (Collection):** เก็บข้อมูลพนักงานและสิทธิ์การเข้าถึง
3.  **`settings` (Collection):** เก็บการตั้งค่าบริษัทและโลโก้

## 4. ฟีเจอร์หลัก (Key Features)
1.  **ระบบรับงานเคลม (Claim Entry):**
    *   หน้าฟอร์มสำหรับ Admin บันทึกงาน
    *   รองรับการค้นหาประวัติลูกค้าเก่า
2.  **ระบบติดตามงาน (Queue & Tracking):**
    *   Dashboard สรุปยอดงาน
    *   รายการงานแยกตามสถานะ (รอซ่อม, รออะไหล่, เสร็จสิ้น)
3.  **ระบบพิมพ์เอกสารอัตโนมัติ (Document Generation):**
    *   **ใบส่งคืนลูกค้า (Customer Return Note):** มีเลข S/N เก่า/ใหม่
    *   **ใบส่งเคลมผู้นำเข้า (Distributor RMA):** มีข้อมูลอ้างอิง End User
    *   สามารถ **Generate เป็นรูปภาพ (JPG)** หรือสั่งพิมพ์ (PDF) ได้ทันที
4.  **ระบบการตั้งค่า (Settings):**
    *   สามารถเปลี่ยน Logo บริษัท, ชื่อที่อยู่, เลขภาษี ได้เองผ่านหน้าเว็บ
    *   ข้อมูลจะไปปรากฏในเอกสารที่พิมพ์ออกมาอัตโนมัติ

## 5. วิธีการติดตั้งและใช้งาน (Installation)
1.  **การรันในเครื่อง (Development):**
    *   ติดตั้ง Node.js
    *   รันคำสั่ง `npm install` เพื่อลง Library
    *   รันคำสั่ง `npm run dev` เพื่อเปิดเว็บทดสอบ
2.  **การนำขึ้นออนไลน์ (Deployment):**
    *   กรณีที่เครื่องไม่ได้ติดตั้ง firebase-tools แบบ Global ไว้ ให้ใช้คำสั่งผ่าน npx แทนครับ: 
        `npx firebase login --reauth`
    *   ใช้คำสั่ง `npm run build` เพื่อสร้างไฟล์เว็บ
    *   ใช้คำสั่ง `firebase deploy` เพื่ออัปโหลดขึ้น Google Cloud
    *   ใช้เครื่องหมาย && เพื่อเชื่อมคำสั่งเข้าด้วยกัน `npm run build && npx firebase deploy`


## 6. ข้อดีของการใช้ Firebase (Why Firebase?)
*   **Real-time:** ข้อมูลอัปเดตทันทีเมื่อมีการแก้ไข
*   **Reliability:** ระบบมีความเสถียรสูงเพราะใช้ Infrastructure ของ Google
*   **Scalability:** รองรับข้อมูลจำนวนมากได้โดยไม่ต้องแก้โค้ด
*   **Cost:** ใช้งานฟรีในระดับเริ่มต้น (Spark Plan) เหมาะสำหรับโครงงานและ SME

## 7. การแก้ไขและดูแลรักษา (Maintenance)
เนื่องจากใช้ **NoSQL Database** การเพิ่มฟิลด์ข้อมูลใหม่ (เช่น เพิ่มเบอร์โทรสำรอง) สามารถทำได้ทันทีในโค้ดฝั่งหน้าบ้าน (Frontend) โดยไม่ต้องแก้โครงสร้าง Database เดิม ทำให้ระบบมีความยืดหยุ่นสูงต่อการเปลี่ยนแปลง Requirement ในอนาคต
