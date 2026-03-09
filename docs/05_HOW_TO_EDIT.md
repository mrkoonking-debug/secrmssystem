# ✏️ คู่มือการแก้ไขระบบ (พร้อมความสัมพันธ์ระหว่างไฟล์)

คู่มือนี้อธิบายว่า **"ถ้าอยากแก้อะไร ต้องไปแก้ไฟล์ไหน และมันกระทบอะไรบ้าง"**  
เพราะในระบบนี้ หลายอย่างเชื่อมโยงกันมากกว่าหนึ่งไฟล์

---

## 📝 1. อยากแก้ข้อความ / คำพูด บนหน้าเว็บ

### ไฟล์หลักที่แก้: `i18n/translations.ts`

ระบบรองรับ 2 ภาษา (ไทย/อังกฤษ) คำทุกคำบนหน้าเว็บถูกเก็บในไฟล์นี้

**วิธีแก้:**
1. เปิดไฟล์ `i18n/translations.ts`
2. กด `Ctrl+F` แล้วพิมพ์คำที่อยากหา (เช่น "ลงทะเบียนเคลม")
3. แก้ค่าใน `th: {}` (ภาษาไทย) และ `en: {}` (ภาษาอังกฤษ)

**ตัวอย่าง:**
```ts
// ก่อนแก้
submitBtn: 'ส่งข้อมูล',

// หลังแก้
submitBtn: 'บันทึกและส่ง',
```

> ⚠️ **ระวัง:** ห้ามลบเครื่องหมาย `:` และ `,` ออก จะทำให้ระบบ Error

**ความสัมพันธ์:** ไฟล์นี้ถูก import ใช้ในทุกหน้าผ่าน `useLanguage()` hook ใน `contexts/LanguageContext.tsx`

---

## 🖨️ 2. อยากแก้ใบพิมพ์เอกสาร (ใบเคลม / ใบรับคืนสินค้า)

### ไฟล์หลักที่แก้: `services/printService.ts`

**ฟังก์ชันในไฟล์:**
- `getCustomerFormHTML()` → ใบรับคืนสินค้า (สำหรับลูกค้า)
- `getImporterFormHTML()` → ใบส่งเคลมผู้นำเข้า (สำหรับ Distributor)
- `getCommonStyles()` → CSS สไตล์ของเอกสาร (ฟอนต์, ระยะห่าง)
- `getLogoHTML()` → ส่วนหัวที่มีโลโก้และชื่อบริษัท

**ถ้าอยากเปลี่ยน:**
| ต้องการแก้ | ไปแก้ที่ |
| :--- | :--- |
| ตำแหน่งโลโก้ | `getLogoHTML()` ใน `printService.ts` |
| ข้อความในใบเคลม | ค้นหา text ที่อยากแก้ใน `printService.ts` |
| ฟอนต์ / สี | `getCommonStyles()` ใน `printService.ts` |
| ข้อมูลบริษัท (ชื่อ/ที่อยู่) | หน้าเว็บ **Settings** (เก็บใน Firebase → ดึงมาอัตโนมัติ) |

**ความสัมพันธ์:**
```
pages/DocumentPreview.tsx  ←── import ── services/printService.ts
pages/JobDetail.tsx        ←── import ── services/printService.ts
```
ข้อมูลที่แสดงในใบพิมพ์ดึงมาจาก `MockDb.getSettings()` (ข้อมูลบริษัท) และข้อมูล RMA จาก Firestore

---

## 🏠 3. อยากแก้หน้าค้นหาสถานะ (หน้าแรกลูกค้า)

### ไฟล์ที่เกี่ยวข้อง:

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `pages/CustomerSearch.tsx` | หน้าแรก — ช่องกรอกค้นหา + ปุ่มลงทะเบียน |
| `pages/CustomerStatus.tsx` | หน้าแสดงผลสถานะงาน |
| `services/mockDb.ts` → `searchRMAsPublic()` | Logic ค้นหา (ต้องกรอกตรง 100%) |
| `i18n/translations.ts` → `public.*` | ข้อความบนหน้านี้ทั้งหมด |

**Flow การทำงาน:**
```
CustomerSearch.tsx
  ↓ [กด Search]
  navigate('/status?q=...')
  ↓
CustomerStatus.tsx
  ↓ [เรียก]
mockDb.searchRMAsPublic(query)
  ↓ [ผลลัพธ์]
แสดง RMA cards พร้อม Stepper สถานะ
```

**ถ้าอยากแก้:**
- **เปลี่ยนเงื่อนไขค้นหา** → `services/mockDb.ts` ฟังก์ชัน `searchRMAsPublic()`
- **เปลี่ยนหน้าตาผลลัพธ์** → `pages/CustomerStatus.tsx`
- **เปลี่ยนข้อความ "ไม่พบข้อมูล"** → `i18n/translations.ts` key: `public.notFound`

---

## 📋 4. อยากแก้ฟอร์มรับงานเคลม (Admin)

### ไฟล์ที่เกี่ยวข้อง:

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `pages/SubmitClaim.tsx` | หน้ารับงานโดย Admin พร้อม Job ID |
| `components/ProductEntryForm.tsx` | ฟอร์มกรอกข้อมูลสินค้าแต่ละชิ้น |
| `components/HddBulkModal.tsx` | Modal เพิ่ม HDD หลายลูก |
| `components/ScannerModal.tsx` | Modal สแกน Barcode |
| `types.ts` → `interface RMA` | โครงสร้างข้อมูลที่บันทึก |
| `services/mockDb.ts` → `addRMA()` | บันทึกข้อมูลลง Firestore |
| `constants/options.ts` | รายชื่อยี่ห้อ, ประเภทสินค้า |

**ถ้าอยากเพิ่ม Field ข้อมูลใหม่** (เช่น เพิ่ม "เบอร์ติดต่อสำรอง"):
1. `types.ts` → เพิ่ม `customerPhone2?: string` ใน interface `RMA`
2. `components/ProductEntryForm.tsx` → เพิ่ม `<input>` สำหรับ field ใหม่
3. `pages/JobDetail.tsx` → เพิ่มการแสดงผล field นี้ในหน้ารายละเอียด
4. `services/printService.ts` → เพิ่มค่านี้ในใบพิมพ์ (ถ้าต้องการ)

**ความสัมพันธ์:**
```
SubmitClaim.tsx
  ↓ render
  ProductEntryForm.tsx (หนึ่ง Job มีหลายชิ้น)
    ↓ ใช้
    HddBulkModal.tsx (เพิ่ม HDD)
    ScannerModal.tsx (สแกน S/N)
  ↓ [กด Submit]
mockDb.generateNextGroupRequestId() → สร้าง Job ID
mockDb.addRMA() × N → บันทึกทุกชิ้น
```

---

## 🔧 5. อยากแก้หน้ารายละเอียดงาน (Job Detail)

### ไฟล์ที่เกี่ยวข้อง:

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `pages/JobDetail.tsx` | หน้าหลัก — แสดงข้อมูล + ปุ่มทุกอย่าง |
| `components/EditRMADrawer.tsx` | Drawer ด้านข้างสำหรับแก้ไขงาน |
| `components/ShipmentTagModal.tsx` | Modal พิมพ์ป้ายสินค้า |
| `services/printService.ts` | สร้างใบพิมพ์เอกสาร |
| `services/mockDb.ts` → `updateRMA()` | บันทึกการเปลี่ยนแปลงลง Firebase |
| `pages/DocumentPreview.tsx` | Preview เอกสารก่อนพิมพ์ |

**ความสัมพันธ์:**
```
JobDetail.tsx
  ↓ เปิด
  EditRMADrawer.tsx (แก้ไขสถานะ, ผลการซ่อม, S/N ใหม่)
    ↓ บันทึก
    mockDb.updateRMA()
  ↓ กดพิมพ์
  navigate('/admin/document/...')
    ↓
  DocumentPreview.tsx
    ↓ เรียก
    printService.getCustomerFormHTML() / getImporterFormHTML()
```

---

## 👤 6. อยากแก้หน้าลงทะเบียนของลูกค้า

### ไฟล์ที่เกี่ยวข้อง:

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `pages/CustomerSubmit.tsx` | ฟอร์มลงทะเบียนทั้งหมด |
| `lineConfig.ts` | ตั้งค่ากลุ่ม LINE ที่จะแจ้งเตือน |
| `types.ts` → `interface RMA` | โครงสร้างข้อมูลที่ส่ง |
| `services/mockDb.ts` → `addRMA()` | บันทึกงานใหม่ลง Firestore |
| `constants/options.ts` | รายชื่อยี่ห้อ / ประเภทสินค้า |

**ถ้าอยากเพิ่ม/ลด field ในฟอร์มลูกค้า:**
- แก้ JSX ใน `pages/CustomerSubmit.tsx`
- แก้ `types.ts` ถ้าเพิ่ม field ใหม่
- อาจต้องแก้ `pages/IncomingClaims.tsx` ด้วย (เพื่อให้แสดง field ใหม่ตอน Admin รับงาน)

---

## 📊 7. อยากแก้ Dashboard (กราฟ / สถิติ)

### ไฟล์ที่เกี่ยวข้อง:

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `pages/Dashboard.tsx` | หน้า Dashboard ทั้งหมด |
| `services/mockDb.ts` → `getStats()` | ดึงข้อมูลสถิติจาก Firestore |
| `types.ts` → `interface DashboardStats` | โครงสร้างข้อมูลสถิติ |

**ถ้าอยากเพิ่ม Card / กราฟใหม่:**
1. `services/mockDb.ts` → `getStats()` → เพิ่ม logic คำนวณ
2. `types.ts` → `DashboardStats` → เพิ่ม field ใหม่
3. `pages/Dashboard.tsx` → เพิ่ม UI แสดงผล

---

## 🎨 8. อยากเปลี่ยนโลโก้

### ไฟล์ที่เกี่ยวข้อง:
- **รูปภาพ:** `public/logo.png` (ต้องใส่ไฟล์รูปใหม่ชื่อเดิมเป๊ะๆ)
- **Logo ในใบพิมพ์:** ดึงมาจากการตั้งค่าในหน้า Admin → **Settings**

> 💡 โลโก้ในเว็บดึงจาก `/logo.png` ส่วนโลโก้ในใบพิมพ์ดึงจาก `settings.logoUrl` ที่เก็บใน Firebase

---

## 🔐 9. อยากเพิ่ม/แก้ระดับสิทธิ์ Admin

### ไฟล์ที่เกี่ยวข้อง:

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `services/mockDb.ts` | Logic กำหนด role (admin/staff) |
| `components/ProtectedRoute.tsx` | Guard ป้องกันหน้า Admin |
| `components/Navbar.tsx` | ซ่อน/แสดงเมนูตาม role |

**Super Admin (กำหนดในโค้ด):**
ค้นหาบรรทัดนี้ใน `services/mockDb.ts`:
```ts
const role = (email === 'support@sectechnology.co.th' || email === 'admin@sec-claim.com') ? 'admin' : 'staff';
```
เพิ่ม email ใหม่ในเงื่อนไขนั้นได้เลย

---

## 🌐 10. อยากเพิ่มหน้าใหม่ในระบบ

ต้องแก้ **อย่างน้อย 2 ไฟล์** เสมอ:

**ขั้นตอน:**
1. สร้างไฟล์ `pages/NewPage.tsx`
2. เปิด `App.tsx` → เพิ่ม import และ Route:
   ```tsx
   const NewPage = lazy(() => import('./pages/NewPage').then(m => ({ default: m.NewPage })));
   // ...
   <Route path="/admin/new-page" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
   ```
3. เปิด `components/Navbar.tsx` → เพิ่มลิงก์เมนูใหม่

---

## 🔄 แผนภาพความสัมพันธ์ภาพรวม

```
Firebase Firestore (Database)
        ↕ (CRUD)
services/mockDb.ts ─────────── services/firebaseConfig.ts
        ↕ (import)
pages/*.tsx + components/*.tsx
        ↕ (แสดงผล / รับ Input)
i18n/translations.ts  (ข้อความ)
types.ts              (โครงสร้างข้อมูล)
constants/options.ts  (ตัวเลือก Dropdown)
```

---

*อัปเดตล่าสุด มีนาคม 2026*
