
// ==========================================
// ไฟล์กำหนดโครงสร้างข้อมูล (Types & Interfaces)
// เปรียบเสมือน "พิมพ์เขียว" ว่าข้อมูลแต่ละก้อนต้องมีหน้าตาอย่างไร
// ==========================================

// 1. สถานะของงานเคลม (Enum) - ใช้กำหนดค่าคงที่เพื่อป้องกันการพิมพ์ผิด
export enum ClaimStatus {
  PENDING = 'PENDING',             // รอดำเนินการ (เพิ่งรับของมา)
  DIAGNOSING = 'DIAGNOSING',       // กำลังตรวจเช็ค/วิเคราะห์อาการ
  WAITING_PARTS = 'WAITING_PARTS', // รออะไหล่มาส่ง
  REPAIRED = 'REPAIRED',           // ซ่อมเสร็จแล้ว พร้อมคืน
  REJECTED = 'REJECTED',           // ปฏิเสธการเคลม (เช่น ผิดเงื่อนไข)
  SHIPPED = 'SHIPPED',             // ส่งคืนลูกค้า/ขนส่งแล้ว
  CLOSED = 'CLOSED'                // ปิดงานสมบูรณ์ (ลูกค้าได้รับของแล้ว)
}

// 2. ประเภทสินค้า (Enum)
export enum ProductType {
  CCTV_CAMERA = 'CCTV_CAMERA',     // กล้องวงจรปิด
  NVR_DVR = 'NVR_DVR',             // เครื่องบันทึกภาพ
  NETWORK_SWITCH = 'NETWORK_SWITCH',// สวิตช์เน็ตเวิร์ค
  ROUTER_FIREWALL = 'ROUTER_FIREWALL', // เราเตอร์/ไฟร์วอลล์
  ACCESS_CONTROL = 'ACCESS_CONTROL',   // ระบบสแกนนิ้ว/หน้า
  OTHER = 'OTHER'                  // อื่นๆ
}

// 3. ทีมช่างที่รับผิดชอบ (Enum) - แบ่งตามแบรนด์หรือกลุ่มสินค้า
export enum Team {
  HIKVISION = 'HIKVISION', // ทีม A: ดูแลแบรนด์ Hikvision
  DAHUA = 'DAHUA',         // ทีม B: ดูแลแบรนด์ Dahua
  TEAM_C = 'TEAM_C',       // ทีม C: Network & UNV (กลุ่มหลัก)
  TEAM_E = 'TEAM_E',       // ทีม E: UPS (เครื่องสำรองไฟ)
  TEAM_G = 'TEAM_G'        // ทีม G: ขายออนไลน์ (Shopee/Lazada)
}

// 4. โครงสร้างข้อมูลไฟล์แนบ (รูปภาพ/วิดีโอ)
export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  previewUrl?: string; // URL สำหรับแสดงตัวอย่างรูป
}

// 5. โครงสร้างข้อมูลประวัติ (Timeline) - เก็บ Log การทำงาน
export interface TimelineEvent {
  id: string;
  date: string;        // วันที่และเวลาที่เกิดเหตุการณ์
  type: 'STATUS_CHANGE' | 'NOTE' | 'SYSTEM' | 'CUSTOMER_ACTION'; // ประเภท: เปลี่ยนสถานะ, จดบันทึก, ระบบ, ลูกค้าทำเอง
  description: string; // รายละเอียดเหตุการณ์
  user: string;        // ใครเป็นคนทำ (เช่น Admin, System)
}

// 6. รายละเอียดการซ่อม (Resolution)
export interface ResolutionDetails {
  actionTaken: string;     // ทำอะไรไปบ้าง (เช่น เปลี่ยน Mainboard)
  rootCause: string;       // สาเหตุที่เสีย (เช่น ไฟกระชาก, มดเข้า)
  vendorTicketRef?: string;// เลขใบงานของศูนย์นอก (ถ้าส่งต่อ Synnex/SIS)
  technicalNotes: string;  // บันทึกเชิงเทคนิคสำหรับช่างด้วยกัน
  replacedSerialNumber?: string; // *** NEW: S/N ใหม่กรณีเปลี่ยนตัว ***
}

// 7. สาเหตุความล่าช้า (Enum)
export type DelayReason = 'NONE' | 'WAITING_PARTS' | 'WAITING_DISTRIBUTOR' | 'WAITING_CUSTOMER' | 'INTERNAL_QUEUE';

// *** 9. โครงสร้างหลักของใบเคลม (Main Claim Interface) ***
// นี่คือ Object ที่ใช้เก็บข้อมูลงานเคลม 1 งาน
export interface Claim {
  id: string;               // รหัสอ้างอิงงานเคลม (Primary Key) เช่น CLM-12345
  groupRequestId?: string;  // รหัสกลุ่มงาน (กรณีลูกค้าส่งมา 10 ตัวในบิลเดียว จะใช้เลขนี้เชื่อมกัน)
  quotationNumber?: string; // เลขที่ใบเสนอราคา (SEC...) *สำคัญมาก*

  // ข้อมูลลูกค้า
  customerName: string;
  contactPerson?: string; // *** NEW: ชื่อผู้ติดต่อ (แยกจากชื่อบริษัท) ***
  customerEmail: string;
  customerPhone?: string;
  customerLineId?: string;
  customerAddress?: string;       // ที่อยู่ลูกค้า
  customerReturnAddress?: string; // ที่อยู่สำหรับส่งของคืน
  createdBy?: string;             // ใครเป็นคนสร้างรายการนี้ (Admin คนไหน)

  // ข้อมูลสินค้า
  brand: string;           // ยี่ห้อ
  productModel: string;    // รุ่น
  serialNumber: string;    // S/N (หัวใจสำคัญของการเคลม)
  productType: ProductType;// ประเภท
  distributor: string;     // ผู้นำเข้า (Synnex, SIS...) เอาไว้ส่งเคลมต่อ
  accessories: string[];   // ของที่ลูกค้าฝากมาด้วย (กล่อง, สายไฟ, เมาส์)
  distributorSentItems?: string[]; // ของที่เราส่งต่อให้ Vendor (เช่น ส่งแค่ตัวเครื่อง ไม่ส่งสายไฟ)
  attachments?: Attachment[]; // รูปภาพหลักฐาน

  issueDescription: string; // อาการเสียที่ลูกค้าแจ้งมา
  deviceUsername?: string;   // Username อุปกรณ์ (ถ้ามี)
  devicePassword?: string;   // Password อุปกรณ์ (ถ้ามี)
  status: ClaimStatus;      // สถานะปัจจุบันของงาน
  team: Team;               // ทีมไหนรับผิดชอบ
  lineAccount?: string;     // LINE@ ที่ลูกค้าซื้อจาก (e.g. 'hikcctv', 'dahuacctv')

  // เวลา (Timestamp)
  createdAt: string;  // วันที่สร้างรายการ
  updatedAt: string;  // วันที่แก้ไขล่าสุด
  resolvedAt?: string;// วันที่ปิดงาน (เอาไว้คำนวณเวลาทำงานเฉลี่ย)

  history: TimelineEvent[]; // ประวัติการทำงานทั้งหมด (Array)

  // ข้อมูลการดำเนินการ
  serviceType?: 'INTERNAL' | 'EXTERNAL'; // ซ่อมเอง (Internal) หรือ ส่งศูนย์นอก (External)
  resolution?: ResolutionDetails;        // ผลสรุปการซ่อม
  delayReason?: DelayReason;             // สาเหตุที่งานช้า

  // ข้อมูลค่าใช้จ่ายและการรับประกัน
  repairCosts?: {
    labor: number; // ค่าแรง
    parts: number; // ค่าอะไหล่
    warrantyStatus: 'IN_WARRANTY' | 'OUT_OF_WARRANTY' | 'VOID'; // สถานะประกัน
  }
}

// 10. โครงสร้างข้อมูลสำหรับ Dashboard (สถิติรวม)
export interface DashboardStats {
  totalClaims: number;      // งานทั้งหมดในระบบ
  pendingClaims: number;    // งานที่ยังค้างอยู่
  resolvedThisMonth: number;// งานที่จบได้ในเดือนนี้
  criticalIssues: number;   // งานวิกฤต/ล่าช้า

  revenuePipeline: number;    // มูลค่ารายได้คาดการณ์ (ค่าแรง+ค่าของ)
  avgTurnaroundHours: number; // เวลาเฉลี่ยที่ใช้ปิดงาน (ชม.)
  overdueCount: number;       // จำนวนงานที่เกินกำหนด (>7วัน)
  agingBuckets: {             // การกระจายตัวของอายุงาน (ใช้พล็อตกราฟ)
    bucket0_3: number;        // 0-3 วัน
    bucket4_7: number;        // 4-7 วัน
    bucket7plus: number;      // มากกว่า 7 วัน
  };
  urgentClaims: Claim[];      // รายการงานด่วนที่ต้องรีบดู
}
