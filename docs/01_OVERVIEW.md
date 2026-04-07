# 📚 SEC RMA System — ภาพรวมระบบ (Overview)

## ระบบทำอะไร?

**SEC RMA System** คือเว็บแอปพลิเคชันสำหรับบริหารจัดการกระบวนการรับเคลมสินค้า (RMA = Return Merchandise Authorization) ของ **บริษัท เอสอีซี เทคโนโลยี จำกัด**

ระบบรองรับกระบวนการตั้งแต่ต้นจนจบ:
> **ลูกค้าส่งสินค้ามาเคลม → เจ้าหน้าที่รับงาน → ทีมตรวจสอบ → ส่งต่อผู้นำเข้า → ส่งคืนลูกค้า**

---

## เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วน             |     เทคโนโลยี |
| :---          |       :--- |
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **Database** | Google Firebase Firestore |
| **Authentication** | Firebase Authentication |
| **Hosting** | Firebase Hosting |
| **PWA** | vite-plugin-pwa (ติดตั้งบนมือถือได้) |

**URL เว็บจริง:** [https://secrmssystem.web.app](https://secrmssystem.web.app)

---

## ฟีเจอร์ทั้งหมด

### ฝั่งลูกค้า (ไม่ต้อง Login)
- **ค้นหาสถานะงาน** — กรอกเลขที่อ้างอิงหรือ Serial Number แบบตรงทุกตัว
- **ลงทะเบียนเคลมเอง** — กรอกข้อมูลสินค้าและอาการที่พบ

### ฝั่งแอดมิน/เจ้าหน้าที่ (ต้อง Login)
- **Dashboard** — กราฟสถิติยอดงาน Real-time, งานค้างเกิน 7 วัน
- **รับงานเคลม** — ฟอร์มบันทึกข้อมูลสินค้า (รองรับหลายชิ้นใน Job เดียว)
- **งานขาเข้า** — รายการที่ลูกค้าลงทะเบียนเองรอรับเข้าระบบ
- **รายการงาน** — แยกตามทีม: Hikvision, Dahua, Network, UPS, Online
- **แก้ไขงาน** — เปลี่ยนสถานะ, บันทึกผลการซ่อม, S/N เครื่องใหม่
- **พิมพ์เอกสาร** — ใบส่งเคลมผู้นำเข้า + ใบรับคืนสินค้าลูกค้า (PDF/ภาพ)
- **รายงาน** — สรุปยอดงานรายเดือน
- **จัดการ** — Staff, ยี่ห้อสินค้า, Distributor, ตั้งค่าบริษัท

---

## สถานะงาน (RMA Status)

| สถานะ | ความหมาย |
| :--- | :--- |
| `PENDING` | รอดำเนินการ |
| `DIAGNOSING` | อยู่ระหว่างตรวจสอบ |
| `WAITING_PARTS` | รออะไหล่ |
| `REPAIRED` | ดำเนินการเสร็จสิ้น / พร้อมส่งคืน |
| `CLOSED` | ปิดงานสมบูรณ์ |
| `REJECTED` | ส่งคืนโดยไม่ซ่อม |

---

## โครงสร้างทีมในระบบ

| ชื่อทีมในระบบ | ดูแลสินค้าประเภท |
| :--- | :--- |
| `HIKVISION` | กล้อง Hikvision |
| `DAHUA` | กล้อง Dahua |
| `TEAM_C` | Network / อุปกรณ์เครือข่าย |
| `TEAM_E` | UPS |
| `TEAM_G` | Online / สินค้าทั่วไป |

---

## เอกสารต่างๆ (ดูเพิ่มเติม)

| เลข | ไฟล์ | เนื้อหา |
| :--- | :--- | :--- |
| 01 | [OVERVIEW.md](./01_OVERVIEW.md) | ภาพรวมระบบ (ไฟล์นี้) |
| 02 | [FIREBASE_SETUP.md](./02_FIREBASE_SETUP.md) | วิธีสร้างและเชื่อมต่อ Firebase |
| 03 | [DEPLOYMENT.md](./03_DEPLOYMENT.md) | วิธี Deploy ขึ้นเว็บจริง |
| 04 | [CODE_STRUCTURE.md](./04_CODE_STRUCTURE.md) | โครงสร้างโค้ด + แผนที่ไฟล์ |
| 05 | [HOW_TO_EDIT.md](./05_HOW_TO_EDIT.md) | คู่มือแก้ไขทีละเรื่อง (ครอบคลุม) |
| 06 | [OWNER_GUIDE.md](./06_OWNER_GUIDE.md) | คู่มือเจ้าของ (ไม่ต้องรู้โปรแกรม) |
| 07 | [GIT_GUIDE.md](./07_GIT_GUIDE.md) | Git & GitHub (บันทึก ย้อนกลับ สำรองโค้ด) |
| 08 | [USER_MANUAL.md](./08_USER_MANUAL.md) | คู่มือการใช้งานฟังก์ชันทั้งหมด |
| 09 | [CHAPTER2.md](./09_CHAPTER2.md) | บทที่ 2 — แนวคิดและทฤษฎีที่เกี่ยวข้อง |
| 10 | [FIREBASE_COST_ANALYSIS.md](./10_FIREBASE_COST_ANALYSIS.md) | วิเคราะห์ค่าใช้จ่าย Firebase + ราคา Blaze |
| 11 | [SETUP_AND_SYNC_GUIDE.md](./11_SETUP_AND_SYNC_GUIDE.md) | คู่มือ Setup เครื่องใหม่ + Sync + Deploy |

---

*อัปเดตล่าสุด เมษายน 2569*

