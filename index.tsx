
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ============================================
// จุดเริ่มต้นของโปรแกรม (Entry Point)
// ============================================

// 1. ค้นหา Element ที่มี id="root" ในไฟล์ index.html
const rootElement = document.getElementById('root');

// ตรวจสอบว่าเจอหรือไม่ (กัน Error)
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 2. สร้าง Root สำหรับ React และเริ่มการทำงาน (Render)
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* เรียกใช้ Component หลักชื่อ App ที่เป็นหัวใจของเว็บ */}
    <App />
  </React.StrictMode>
);
