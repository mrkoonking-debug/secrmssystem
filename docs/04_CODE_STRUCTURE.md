# 🗺️ คู่มือนักพัฒนา (Developer Guide)

คู่มือนี้ช่วยให้คุณเข้าใจโครงสร้างโค้ด และรู้ว่า "ถ้าอยากแก้อะไร ต้องไปที่ไฟล์ไหน"

---

## 🏗️ โครงสร้างโค้ดทั้งหมด

```
sec-claim-system/
│
├── 📄 App.tsx               # Router หลัก — กำหนดว่าแต่ละ URL ไปหน้าไหน
├── 📄 types.ts              # TypeScript Types ทั้งหมด (RMA, Team, RMAStatus ฯลฯ)
├── 📄 index.tsx             # Entry point ของแอพ
├── 📄 lineConfig.ts         # ค่าตั้งค่าสำหรับ LINE Notification
│
├── 📁 pages/                # หน้าเว็บหลักแต่ละหน้า
├── 📁 components/           # ชิ้นส่วน UI ที่ใช้ซ้ำ
├── 📁 services/             # ระบบ Backend (Firebase, Print)
├── 📁 contexts/             # State ที่ใช้ร่วมกันทั้งแอพ
├── 📁 i18n/                 # คำแปล ไทย/อังกฤษ
├── 📁 constants/            # ค่าคงที่ (รายชื่อยี่ห้อ, ตัวเลือก)
└── 📁 public/               # ไฟล์ Static (โลโก้, favicon)
```

---

## 🔍 ถ้าอยากแก้ไข... ต้องไปที่ไหน? (Cheat Sheet)

| ถ้าอยากแก้... | ไปที่ไฟล์นี้ |
| :--- | :--- |
| **ข้อความ / คำพูด** บนหน้าเว็บ | `i18n/translations.ts` |
| **โลโก้** ของบริษัท | ไฟล์ `public/logo.png` (ต้องตั้งชื่อเดิมเป๊ะ) |
| **หน้ารับงานเคลม** (Admin) | `pages/SubmitClaim.tsx` |
| **หน้าลงทะเบียน** ของลูกค้า | `pages/CustomerSubmit.tsx` |
| **หน้าติดตามสถานะ** ของลูกค้า | `pages/CustomerStatus.tsx` |
| **Dashboard กราฟสถิติ** | `pages/Dashboard.tsx` |
| **รายงาน** | `pages/ReportsPage.tsx` |
| **แก้ไขงาน / Drawer ด้านข้าง** | `components/EditRMADrawer.tsx` |
| **ฟอร์มกรอกข้อมูลสินค้า** | `components/ProductEntryForm.tsx` |
| **ใบพิมพ์เอกสาร** | `services/printService.ts` |
| **การบันทึก/แก้ไข/ลบข้อมูล** | `services/mockDb.ts` |
| **เชื่อมต่อ Firebase** | บรรทัดตัวแปร `.env` + `services/firebaseConfig.ts` |
| **เมนู Navbar** (Admin) | `components/Navbar.tsx` |
| **Route / หน้าไหน URL ไหน** | `App.tsx` |
| **เพิ่ม Field ข้อมูลใหม่** | `types.ts` → แล้วค่อยแก้ไฟล์อื่น |
| **รายชื่อยี่ห้อสินค้า** | `constants/options.ts` |
| **สีของเว็บ / Dark Mode** | `contexts/ThemeContext.tsx` + `index.css` |
| **ภาษา ไทย/อังกฤษ** | `contexts/LanguageContext.tsx` |

---

## 📁 รายละเอียดแต่ละโฟลเดอร์

### `pages/` — หน้าเว็บหลัก

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `CustomerSearch.tsx` | หน้าแรก (ค้นหาสถานะ) — ลูกค้าเห็น |
| `CustomerStatus.tsx` | ผลการค้นหาสถานะงาน — ลูกค้าเห็น |
| `CustomerSubmit.tsx` | ฟอร์มลงทะเบียนเคลมด้วยตัวเอง — ลูกค้าเห็น |
| `Login.tsx` | หน้า Login สำหรับ Staff/Admin |
| `Dashboard.tsx` | Dashboard สถิติ — Admin เห็น |
| `ClaimsList.tsx` | รายการงานทั้งหมด — Admin เห็น |
| `IncomingClaims.tsx` | งานที่ลูกค้าลงทะเบียนเองรอรับ — Admin เห็น |
| `JobDetail.tsx` | รายละเอียดงานแต่ละ Job — Admin เห็น |
| `SubmitClaim.tsx` | ฟอร์มรับงานเคลมโดย Admin |
| `EditRMA.tsx` | หน้าแก้ไข RMA — wrapper ของ EditRMADrawer |
| `DocumentPreview.tsx` | preview เอกสารก่อนพิมพ์ |
| `UserManagement.tsx` | จัดการ Staff Account |
| `BrandManagement.tsx` | จัดการรายชื่อยี่ห้อสินค้า |
| `DistributorManagement.tsx` | จัดการรายชื่อ Distributor |
| `LogsManagement.tsx` | ดู Activity Log ทั้งหมด |
| `ReportsPage.tsx` | รายงานสรุปประจำเดือน |
| `SettingsPage.tsx` | ตั้งค่าบริษัท (โลโก้, ชื่อ, ที่อยู่) |

### `components/` — ชิ้นส่วน UI

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `Navbar.tsx` | เมนูด้านซ้าย (Admin) |
| `EditRMADrawer.tsx` | ช่องแก้ไขงานแบบ Drawer ด้านข้าง |
| `ProductEntryForm.tsx` | ฟอร์มกรอกข้อมูลสินค้าแต่ละชิ้น |
| `HddBulkModal.tsx` | Modal เพิ่ม HDD หลายลูกพร้อมกัน |
| `ScannerModal.tsx` | Modal สแกน Barcode/QR Code |
| `ShipmentTagModal.tsx` | Modal พิมพ์ป้ายสินค้า |
| `GlassSelect.tsx` | Dropdown component สไตล์ Glassmorphism |
| `StatusBadge.tsx` | Badge แสดงสถานะงาน (สีต่างๆ) |
| `ProtectedRoute.tsx` | Guard ป้องกันหน้า Admin (ต้อง Login ก่อน) |
| `ErrorBoundary.tsx` | จับ Error ทั้งหมดของแอพ แสดงหน้า Fallback |
| `ThemeToggle.tsx` | ปุ่มเปลี่ยน Dark/Light Mode |
| `LanguageToggle.tsx` | ปุ่มเปลี่ยน ไทย/อังกฤษ |

### `services/` — Backend Logic

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `mockDb.ts` | **หัวใจหลัก** — CRUD ทั้งหมด (getRMAs, addRMA, updateRMA ฯลฯ) |
| `printService.ts` | สร้าง HTML เอกสารพิมพ์ (ใบเคลม, ใบรับคืน) |
| `firebaseConfig.ts` | เชื่อมต่อ Firebase ด้วยค่าจากไฟล์ `.env` |
| `seedData.ts` | ข้อมูลตัวอย่างสำหรับทดสอบ (offline mode) |

---

## 🔧 วิธีเพิ่มฟีเจอร์ใหม่ (แนวทาง)

### เพิ่ม Field ข้อมูลใหม่ใน RMA

1. เปิด `types.ts` → หา `interface RMA` → เพิ่ม field ใหม่
2. เปิด `components/ProductEntryForm.tsx` → เพิ่ม input ในฟอร์ม
3. เปิด `services/mockDb.ts` → ตรวจสอบฟังก์ชัน `addRMA` และ `updateRMA`
4. เปิด `pages/JobDetail.tsx` → เพิ่มการแสดงผล field ใหม่

### เพิ่มยี่ห้อสินค้าใหม่

- ไปที่ Firebase Console → **BrandManagement** → เพิ่มได้เลยผ่านหน้าเว็บ
- หรือแก้ไข `constants/options.ts` ถ้าต้องการใส่ค่า default

### เพิ่มคำแปลใหม่

1. เปิด `i18n/translations.ts`
2. เพิ่ม key/value ทั้งใน `th` และ `en` object
3. ใช้ `const { t } = useLanguage()` แล้วเรียก `t('your.key')`

---

## 🚨 ไฟล์สำคัญที่ระวังไว้

| ไฟล์ | ความสำคัญ | ระวัง |
| :--- | :--- | :--- |
| `.env` | 🔑 กุญแจ Firebase | ห้าม push ขึ้น Git |
| `types.ts` | 📋 แบบแปลนข้อมูล | เปลี่ยนแล้วอาจ break หลายไฟล์ |
| `services/mockDb.ts` | 🧠 สมองระบบ | แก้ระวัง — ทุกอย่างผ่านตรงนี้ |
| `App.tsx` | 🗺️ แผนที่ Route | ถ้าเพิ่มหน้าใหม่ต้อง register ที่นี่ |

---

*อัปเดตล่าสุด มีนาคม 2026*
