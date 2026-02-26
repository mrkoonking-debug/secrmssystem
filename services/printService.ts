
import { RMA } from '../types';
import { translations } from '../i18n/translations';
import { MockDb } from './mockDb';

const formatAccessory = (acc: string) => {
  if (acc.startsWith('acc_hdd::')) return `HDD (${acc.split('::')[1]})`;
  if (acc.startsWith('acc_')) {
    const label = (translations.th.accessories_list as any)[acc];
    return label || acc;
  }
  return acc;
}

const formatAction = (action: string) => {
  const map: Record<string, string> = {
    'Replaced Component': translations.th.actions.replaced_component,
    'Swapped Unit': translations.th.actions.swapped_unit,
    'Software Update': translations.th.actions.software_update,
    'No Fault Found': translations.th.actions.no_fault_found
  };
  return map[action] || action;
}

const getLogoHTML = (settings: any) => `
  <div style="display: flex; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #0b57d0; padding-bottom: 6px;">
    <div style="margin-right: 12px;">
      <img src="${settings.logoUrl || '/logo.png'}" alt="Company Logo" style="height: 35px; width: auto; object-fit: contain;" />
    </div>
    <div style="flex-grow: 1; text-align: right;">
      <h2 style="margin: 0; color: #000; font-family: 'Prompt', sans-serif; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">${settings.nameEn}</h2>
      <div style="font-size: 11px; color: #333; margin-top: 1px;">${settings.nameTh}</div>
      <div style="font-size: 9px; color: #666; margin-top: 1px;">
        ${settings.address} | TAX ID: ${settings.taxId} | Tel: ${settings.tel}
      </div>
    </div>
  </div>
`;

const getImagesHTML = (rma: RMA) => {
  if (!rma.attachments || rma.attachments.length === 0) return '';
  const images = rma.attachments.map(att => `
    <div style="text-align: center;">
      <img src="${att.previewUrl || ''}" style="max-width: 100%; max-height: 120px; border: 1px solid #e5e5ea; padding: 3px; border-radius: 4px;" />
      <div style="font-size: 9px; color: #86868b; margin-top: 3px;">${att.fileName}</div>
    </div>
  `).join('');
  return `
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e5ea;">
      <div style="font-size: 9px; color: #86868b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 8px;">Attached Images</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">${images}</div>
    </div>
  `;
};

/* ─────────────────────────────────────────────
   SHARED STYLES
───────────────────────────────────────────── */
const getCommonStyles = (theme: 'blue' | 'orange' = 'blue') => {
  const isOrange = theme === 'orange';
  const primary = isOrange ? '#ea580c' : '#2563eb';
  const dark = isOrange ? '#9a3412' : '#0b57d0';
  const light = isOrange ? '#fed7aa' : '#d1ddf0';
  const bgLight = isOrange ? '#ffedd5' : '#e8f0fe';
  const border = isOrange ? '#fdba74' : '#c5d5f0';

  return `
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    * { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body { background: #f0f0f0; }

    .print-doc {
      font-family: 'Sarabun', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1d1d1f;
      line-height: 1.5;
      width: 210mm;
      min-height: 297mm;
      padding: 12mm 14mm 14mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
    }

    /* ── COMBINED HEADER ── */
    .doc-header-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 3px solid #1d1d1f;
    }
    .doc-header-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      flex: 1;
    }
    .doc-header-logo {
      height: 48px;
      width: auto;
      object-fit: contain;
    }
    .doc-header-company {
      margin-top: 4px;
    }
    .co-name {
      font-size: 11px;
      font-weight: 700;
      color: #1d1d1f;
      margin-bottom: 2px;
    }
    .co-details {
      font-size: 11px;
      color: #1d1d1f;
      line-height: 1.6;
    }
    
    .doc-header-title {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0;
      color: ${primary}; /* Bright blue matching reference */
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      margin-bottom: 24px;
    }
    .doc-header-subtitle {
      font-size: 11px;
      color: #9ca3af;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 2px;
    }

    .doc-header-right {
      text-align: right;
      flex: 1;
      padding-bottom: 8px;
    }
    .doc-ref-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }
    .doc-ref-no {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      font-family: 'Inter', sans-serif;
      color: #1d1d1f;
      margin: 4px 0 8px;
      line-height: 1;
    }
    .doc-ref-date {
      font-size: 12px;
      color: #555;
      font-weight: 500;
      margin-top: 4px;
    }

    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .party-box {
      border: 1px solid #e5e5ea;
      border-radius: 8px;
      padding: 16px;
      background: #fff;
    }
    .party-box-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${primary};
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .party-box-label::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 14px;
      background: ${primary};
      border-radius: 4px;
    }
    .party-name { font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 2px; }
    .party-detail { font-size: 10px; color: #666; line-height: 1.6; }
    .party-divider {
      margin: 12px 0;
      border-top: 1px dashed #e5e5ea;
    }

    /* ── SECTION TITLE ── */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: ${primary};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, ${light}, transparent);
    }
    .section-title .count-badge {
      background: ${primary};
      color: white;
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 10px;
    }


    /* ── ITEMS TABLE ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11px;
    }
    .items-table th {
      background-color: #fff;
      color: ${primary};
      font-weight: 700;
      text-align: center;
      padding: 6px 8px;
      border-top: 2px solid ${primary};
      border-bottom: 2px solid ${primary};
    }
    .items-table th.align-left { text-align: left; }
    .items-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #e5e5ea;
      vertical-align: top;
    }
    .items-table td.align-center { text-align: center; }
    .items-table td.align-right { text-align: right; }
    
    .item-brand-model { font-weight: 700; color: #1d1d1f; margin-bottom: 4px; font-size: 12px; }
    .item-desc { color: #555; font-size: 10px; line-height: 1.4; }
    .item-sn { font-family: 'Inter', monospace; margin-top: 4px; font-size: 10px; color: #333; }
    
    .table-summary {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 10px;
    }
    .table-summary td {
      padding: 4px 8px;
      text-align: right;
    }
    .table-summary td:nth-child(1) {
      color: ${dark};
      font-weight: 700;
    }
    .table-summary td:nth-child(2) {
      width: 80px;
      color: #1d1d1f;
      font-weight: 700;
      font-size: 13px;
    }
    
    .remarks-section {
      margin-top: 40px;
      font-size: 10px;
      color: #1d1d1f;
      line-height: 1.5;
    }
    .remarks-label {
      color: ${dark};
      font-weight: 700;
      margin-bottom: 6px;
    }

    /* ── FOOTER / SIGNATURES ── */
    .footer-section {
      margin-top: 40px;
      padding-top: 14px;
      border-top: 2px solid #e5e5ea;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      page-break-inside: avoid;
    }
    .sig-box {
      border: 1px dashed ${border};
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 120px;
    }
    .sig-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${primary};
      margin-bottom: 30px;
    }
    .sig-subtitle { font-size: 9px; color: #86868b; margin-bottom: 24px; }
    .sig-line { border-bottom: 1px solid #1d1d1f; margin-bottom: 6px; }
    .sig-name-label { font-size: 9px; color: #86868b; }

    @media print {
      @page { size: A4; margin: 0; }
      body { background: white; }
      .print-doc { width: 210mm; min-height: 297mm; padding: 10mm 12mm; }
    }
  </style>
`;
};

/* ─────────────────────────────────────────────
   IMPORTER FORM  (ใบส่งเคลมสินค้า → Distributor)
───────────────────────────────────────────── */
export const getImporterFormHTML = async (rmas: RMA[]): Promise<string> => {
  if (!rmas || rmas.length === 0) return '';
  const rma = rmas[0];
  const settings = await MockDb.getSettings();
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  const tableRows = rmas.map((item, index) => {
    const accList = item.distributorSentItems && item.distributorSentItems.length > 0
      ? item.distributorSentItems
      : item.accessories;
    const accString = accList.length > 0 ? accList.map(a => formatAccessory(a)).join(', ') : 'Unit Only (เฉพาะเครื่อง)';

    return `
      <tr>
        <td class="align-center" style="font-weight: normal; padding-top: 16px;">${index + 1}</td>
        <td style="padding-top: 16px; padding-left: 12px;">
          <div class="item-brand-model" style="font-size: 13px;">${item.brand} ${item.productModel}</div>
          <div class="item-desc" style="color: #666;">อาการเสีย: ${item.resolution?.rootCause || '-'}</div>
          <div class="item-desc" style="color: #666;">อุปกรณ์ที่ส่ง: ${accString}</div>
          ${item.deviceUsername ? `<div class="item-desc" style="color:#ea580c; margin-top: 2px;">User: ${item.deviceUsername} / Pass: ${item.devicePassword}</div>` : ''}
          <div class="item-sn" style="color: #333; margin-top: 6px; font-size: 11px;">S/N: ${item.serialNumber}</div>
        </td>
        <td></td>
      </tr>
    `;
  }).join('');

  return `
    ${getCommonStyles('blue')}
    <div class="print-doc">

      <!-- HEADER BAR -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px;">
        <img src="${settings.logoUrl || '/logo.png'}" style="height: 60px; width: auto;" alt="logo" />
        <div style="text-align: right; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 20px; font-weight: 700; color: #333;">${settings.nameTh}</div>
          <div style="font-size: 11px; color: #666; margin-top: 6px; line-height: 1.5;">
            ${settings.address} | TAX ID: ${settings.taxId}<br/>
            Tel: ${settings.tel} | Web: www.sectechnology.co.th
          </div>
        </div>
      </div>
      
      <div style="height: 2px; background-color: #2563eb; margin-bottom: 20px;"></div>
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <div>
          <div style="font-size: 24px; font-weight: 700; color: #2563eb;">ใบส่งเคลมสินค้า</div>
          <div style="font-size: 14px; color: #555; margin-top: 4px; text-transform: uppercase;">DISTRIBUTOR RMA REQUEST FORM</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; font-weight: 700; color: #555; letter-spacing: 0.5px;">REFERENCE NO.</div>
          <div style="font-size: 18px; font-weight: 700; color: #1d1d1f; margin-top: 4px;">${rma.groupRequestId || rma.quotationNumber || rma.id}</div>
          <div style="font-size: 11px; color: #555; margin-top: 2px;">Date: ${today}</div>
        </div>
      </div>

      <!-- PARTIES -->
      <div class="parties-grid">
        <div class="party-box">
          <div class="party-box-label">TO: DISTRIBUTOR (เรียน ผู้นำเข้า)</div>
          <div class="party-name">${rma.distributor}</div>
          <div class="party-detail">RMA / Service Department</div>
        </div>
        <div class="party-box">
          <div class="party-box-label">FROM: OUR COMPANY (จาก)</div>
          <div class="party-name">${settings.nameEn}</div>
          <div class="party-detail">Attn: Technical Support Dept.</div>
          <div class="party-divider"></div>
          <div>
            <div style="font-size:9px; font-weight:700; color:#9ca3af; margin-bottom:4px;">End User Reference (ลูกค้าผู้ใช้งาน)</div>
            <div style="font-size:12px; font-weight:700; color:#1d1d1f;">${rma.customerName}</div>
          </div>
        </div>
      </div>

      <!-- ITEMS (TABLE) -->
      <div class="section-title">
        PRODUCT INFORMATION <span class="count-badge">${rmas.length} ITEMS</span>
      </div>

      <table class="items-table" style="border-top: 2px solid #2563eb; border-bottom: 2px solid #2563eb;">
        <thead>
          <tr>
            <th style="width: 5%; color: #2563eb; border-bottom: 2px solid #2563eb;">#</th>
            <th class="align-left" style="width: 75%; color: #2563eb; border-bottom: 2px solid #2563eb; padding-left: 12px;">รายละเอียดชิ้นส่วน/สินค้า</th>
            <th style="width: 20%; color: #2563eb; border-bottom: 2px solid #2563eb;">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <table class="table-summary">
        <tr>
          <td>รวมจำนวนสินค้าเคลม</td>
          <td>${rmas.length} ชิ้น</td>
        </tr>
      </table>
      
      <div class="remarks-section">
        <div class="remarks-label">หมายเหตุ</div>
        <div>- กรุณาตรวจสอบสภาพสินค้าและอุปกรณ์ที่ส่งเคลมตามรายการด้านบน</div>
        <div>- หากพบความผิดปกติ กรุณาแจ้งกลับภายใน 3 วันทำการ</div>
      </div>

      <!-- SIGNATURES -->
      <div class="footer-section">
        <div class="sig-box">
          <div class="sig-title">ผู้ส่ง / SENT BY</div>
          <div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between;">
              <div class="sig-name-label">ลงชื่อ / Signature</div>
              <div class="sig-name-label">วันที่ / Date: ____________</div>
            </div>
          </div>
        </div>
        <div class="sig-box">
          <div class="sig-title">ผู้รับ / RECEIVED BY</div>
          <div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between;">
              <div class="sig-name-label">ลงชื่อ / Signature</div>
              <div class="sig-name-label">วันที่ / Date: ____________</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
};

export const getCustomerFormHTML = async (rmas: RMA[]): Promise<string> => {
  if (!rmas || rmas.length === 0) return '';
  const rma = rmas[0];
  const settings = await MockDb.getSettings();
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  const statusText = rma.status === 'REPAIRED'
    ? { label: 'ดำเนินการเสร็จสิ้น', en: 'Completed', cls: 'ok' }
    : rma.status === 'REJECTED'
      ? { label: 'ส่งคืน / ปฏิเสธ', en: 'Returned/Rejected', cls: 'warn' }
      : { label: rma.status.replace('_', ' '), en: '', cls: 'info' };

  const tableRows = rmas.map((item, index) => {
    const accList = item.accessories || [];
    const accString = accList.length > 0 ? accList.map(a => formatAccessory(a)).join(', ') : 'Unit Only';

    const actionText = item.resolution?.actionTaken
      ? formatAction(item.resolution.actionTaken)
      : (item.status === 'REPAIRED' ? 'Completed / Replaced' : 'Checked');

    return `
      <tr>
        <td class="align-center" style="font-weight: normal; padding-top: 16px;">${index + 1}</td>
        <td style="padding-top: 16px; padding-left: 12px;">
          <div class="item-brand-model" style="font-size: 13px;">${item.brand} ${item.productModel}</div>
          <div class="item-desc" style="color: #666;">อาการเสีย: ${item.resolution?.rootCause || '-'}</div>
          <div class="item-desc" style="color: #666;">อุปกรณ์ที่คืน: ${accString}</div>
          <div class="item-sn" style="color: #333; margin-top: 6px; font-size: 11px;">S/N: ${item.serialNumber}</div>
          ${item.resolution?.replacedSerialNumber
        ? `<div class="item-sn" style="color:#137333;">New S/N: ${item.resolution.replacedSerialNumber}</div>`
        : ''}
        </td>
        <td></td>
      </tr>
    `;
  }).join('');

  return `
    ${getCommonStyles('blue')}
    <div class="print-doc">

      <!-- HEADER BAR -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px;">
        <img src="${settings.logoUrl || '/logo.png'}" style="height: 60px; width: auto;" alt="logo" />
        <div style="text-align: right; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 20px; font-weight: 700; color: #333;">${settings.nameTh}</div>
          <div style="font-size: 11px; color: #666; margin-top: 6px; line-height: 1.5;">
            ${settings.address} | TAX ID: ${settings.taxId}<br/>
            Tel: ${settings.tel} | Web: www.sectechnology.co.th
          </div>
        </div>
      </div>
      
      <div style="height: 2px; background-color: #2563eb; margin-bottom: 20px;"></div>
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <div>
          <div style="font-size: 24px; font-weight: 700; color: #2563eb;">ใบส่งคืนสินค้าเคลม</div>
          <div style="font-size: 14px; color: #555; margin-top: 4px;">Product Return Note</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; font-weight: 700; color: #555; letter-spacing: 0.5px;">JOB REFERENCE</div>
          <div style="font-size: 18px; font-weight: 700; color: #1d1d1f; margin-top: 4px;">${rma.groupRequestId || rma.quotationNumber || rma.id}</div>
        </div>
      </div>

      <!-- PARTIES -->
      <div class="parties-grid">
        <div class="party-box" style="padding: 12px 16px;">
          <div class="party-box-label" style="color:#1d1d1f; margin-bottom: 8px;">CUSTOMER DETAILS (ลูกค้า)</div>
          <div class="party-name">${rma.customerName}</div>
          <div class="party-detail" style="margin-top: 4px;">
            ${rma.customerPhone ? `Tel: ${rma.customerPhone}<br/>` : ''}
            ${rma.customerEmail ? `Email: ${rma.customerEmail}<br/>` : ''}
          </div>
        </div>
        <div class="party-box" style="padding: 12px 16px;">
          <div class="party-box-label" style="color:#1d1d1f; margin-bottom: 8px;">SERVICE STATUS (สถานะ)</div>
          <div style="font-size: 14px; font-weight: 700; color: #1d1d1f; text-transform: uppercase;">
             ${rma.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      <!-- ITEMS (TABLE) -->
      <div class="section-title">
        SERVICE ITEM DETAILS
      </div>

      <table class="items-table" style="border-top: 2px solid #2563eb; border-bottom: 2px solid #2563eb;">
        <thead>
          <tr>
            <th style="width: 5%; color: #2563eb; border-bottom: 2px solid #2563eb;">#</th>
            <th class="align-left" style="width: 75%; color: #2563eb; border-bottom: 2px solid #2563eb; padding-left: 12px;">รายละเอียดชิ้นส่วน/สินค้า</th>
            <th style="width: 20%; color: #2563eb; border-bottom: 2px solid #2563eb;">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <table class="table-summary">
        <tr>
          <td></td>
          <td></td>
        </tr>
      </table>
      
      <div class="remarks-section">
        <div class="remarks-label">หมายเหตุ</div>
        <div>- การรับประกันไม่ครอบคลุมภัยจากคน, สัตว์, ภัยธรรมชาติ, ตัดต่อสาย, ไฟกระชาก หรือการติดตั้งที่ไม่ได้มาตรฐาน</div>
        <div>- สินค้าที่ส่งคืนแล้ว ไม่รับเปลี่ยนหรือคืนในทุกกรณี</div>
      </div>

      <!-- SIGNATURES -->
      <div class="footer-section">
        <div class="sig-box">
          <div class="sig-title" style="color: #0b57d0;">ผู้ส่ง / SENT BY</div>
          <div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between;">
              <div class="sig-name-label">ลงชื่อ / Signature</div>
              <div class="sig-name-label">วันที่ / Date: ____________</div>
            </div>
          </div>
        </div>
        <div class="sig-box">
          <div class="sig-title" style="color: #0b57d0;">ผู้รับ / RECEIVED BY</div>
          <div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between;">
              <div class="sig-name-label">ลงชื่อ / Signature</div>
              <div class="sig-name-label">วันที่ / Date: ____________</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
};
export interface ShippingLabelPayload {
  rma: RMA;
  receiverName: string;
  contactPerson: string;
  receiverPhone: string;
  receiverAddress: string;
  trackingId: string;
  currentBox: number;
  totalBoxes: number;
}

export const getCustomerShippingLabelHTML = async (payloads: ShippingLabelPayload[]): Promise<string> => {
  if (!payloads || payloads.length === 0) return '';
  const settings = await MockDb.getSettings();

  const labelsHTML = payloads.map((payload, index) => {
    const { rma, receiverName, contactPerson, receiverPhone, receiverAddress, trackingId, currentBox, totalBoxes } = payload;

    // Determine Job ID to show in the pink box
    const displayId = rma.groupRequestId || rma.quotationNumber || rma.id;
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(displayId)}&margin=0`;
    const qrTrackingUrl = trackingId && trackingId.trim() !== ''
      ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingId)}&margin=0`
      : `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('NO_TRACKING')}&margin=0`;

    // Format the assigned team to be displayed with the sender name
    let teamName = '';
    let teamPhone = '092-273-xxxx'; // Default/Mock team phone
    if (rma.team) {
      if (rma.team === 'HIKVISION') { teamName = 'Team A: Hikvision'; teamPhone = '061-111-2222'; }
      else if (rma.team === 'DAHUA') { teamName = 'Team B: Dahua'; teamPhone = '061-333-4444'; }
      else if (rma.team === 'TEAM_C') { teamName = 'Team C: Network & UNV'; teamPhone = '061-555-6666'; }
      else if (rma.team === 'TEAM_E') { teamName = 'Team E: UPS'; teamPhone = '061-777-8888'; }
      else if (rma.team === 'TEAM_G') { teamName = 'Team G: Online Platform'; teamPhone = '061-999-0000'; }
      else { teamName = `Team ${rma.team}`; }
    }

    const pageBreak = index < payloads.length - 1 ? 'page-break-after: always;' : '';

    return `
    <div class="shipping-label" style="${pageBreak}">
      <div class="st-container">
        
        <!-- ROW 1 -->
        <div class="st-row-1">
          <div class="st-pink-box">
            <div class="st-pink-label">JOB ID</div>
            <div class="st-pink-value" style="font-size: ${displayId.length > 12 ? '14px' : '18px'}; line-height: 1.2;">
                ${displayId}
            </div>
            <img src="${qrDataUrl}" class="st-pink-qr" alt="QR" />
          </div>
          <div class="st-sender-box">
            ${settings.logoUrl ? `<img src="${settings.logoUrl}" class="st-sender-logo" alt="Logo" />` : ''}
            <div class="st-sender-info">
              <div class="st-sender-name">${settings.nameTh}</div>
              <div class="st-sender-team">ฝ่ายเคลม: ${teamName}</div>
              <div class="st-sender-details">
                ${settings.address}<br/>
                โทร: ${settings.tel}
              </div>
            </div>
            <div class="st-page-badge">${currentBox}/${totalBoxes}</div>
          </div>
        </div>

        <!-- ROW 2 -->
        <div class="st-row-2">
          <div class="st-track-left">
            <div class="st-track-label">Tracking ID</div>
            <div class="st-track-val">${trackingId || '-'}</div>
          </div>
          <div class="st-track-center">
            <div class="st-track-placeholder">ติด Tracking Label ที่นี่</div>
          </div>
          <div class="st-track-right">
            <img src="${qrTrackingUrl}" alt="QR Tracking" />
          </div>
        </div>

        <!-- ROW 3 -->
        <div class="st-row-3">
          <div class="st-deliver-badge">กรุณานำส่ง</div>
          <div class="st-receiver-box">
            <div class="st-receiver-name">${receiverName || '________________________________'}</div>
            <div class="st-receiver-contact">ผู้ติดต่อ: ${contactPerson || '_________________'}</div>
            <div class="st-receiver-phone">โทร. ${receiverPhone || '_________________'}</div>
            <div class="st-receiver-address">
              ${receiverAddress
        ? receiverAddress.replace(/\\n/g, '<br/>')
        : '________________________________________________<br/>________________________________________________'}
            </div>
          </div>
        </div>

      </div>
    </div>`;
  }).join('');

  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      
      * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0; 
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body { background: #fff; padding: 0; margin: 0; display: block; }
      
      .shipping-label {
        font-family: 'Sarabun', 'Inter', sans-serif;
        color: #000;
        width: 210mm;        /* A4 Width */
        height: 297mm;       /* Full A4 Height */
        padding: 10mm;       /* Outer padding */
        margin: 0;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
      }
      
      /* --- HALF PAGE GUIDE --- */
      .st-half-page-guide {
        display: none; /* Removed */
      }
      
      .st-container {
        border: 2px solid #000;
        width: 100%;
        height: 100%; /* Fill the 297mm minus padding */
        display: block; 
        box-sizing: border-box;
      }

      /* --- ROW 1: HEADER --- */
      .st-row-1 {
        display: flex;
        border-bottom: 2px solid #000;
        height: 40mm;
        box-sizing: border-box;
      }
      .st-pink-box {
        background-color: #e83a8b;
        color: #fff;
        width: 45mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 5px;
        border-right: 2px solid #000;
      }
      .st-pink-label {
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 2px;
      }
      .st-pink-value {
        background: #fff;
        color: #000;
        font-size: 16px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'Inter', monospace;
        margin-bottom: 5px;
        width: 90%;
        text-align: center;
      }
      .st-pink-qr {
        width: 18mm;
        height: 18mm;
        background: #fff;
        padding: 2px;
      }
      
      .st-sender-box {
        flex: 1;
        padding: 10px;
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 15px;
      }
      .st-sender-logo {
        height: 50px;
        object-fit: contain;
      }
      .st-page-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: #000;
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 6px;
      }
      .st-sender-info {
        flex: 1;
      }
      .st-sender-name {
        font-size: 20px;
        font-weight: 700;
        margin-top: 5px;
        margin-bottom: 4px;
      }
      .st-sender-team {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 2px;
      }
      .st-sender-details {
        font-size: 14px;
        line-height: 1.4;
      }

      /* --- ROW 2: TRACKING --- */
      .st-row-2 {
        display: flex;
        border-bottom: 2px solid #000;
        height: 50mm; /* Fixed height, increased for A4 */
        box-sizing: border-box;
      }
      .st-track-left {
        width: 50mm; /* Prevent long tracking IDs from wrapping */
        padding: 5px 5px 5px 10px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-sizing: border-box;
      }
      .st-track-label {
        font-size: 14px;
        font-weight: 600;
        color: #555;
      }
      .st-track-val {
        font-size: 22px;
        font-weight: 700;
        font-family: 'Inter', monospace;
      }
      .st-track-center {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .st-track-placeholder {
        border: 2px dashed #999;
        width: 130mm; /* Trimmed slightly */
        height: 40mm; /* Trimmed slightly */
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 16px;
      }
      .st-track-right {
        width: 35mm; /* Fixed width to prevent shrinking box */
        border-left: 2px solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px;
        box-sizing: border-box;
      }
      .st-track-right img {
        width: 100%;
        height: auto;
        max-width: 30mm;
      }

      /* --- ROW 3: RECEIVER --- */
      .st-row-3 {
        padding: 12px;
        position: relative;
        height: calc(100% - 90mm); /* Rest of container */
        display: block;
        box-sizing: border-box;
      }
      .st-deliver-badge {
        display: inline-block;
        border: 1px solid #000;
        padding: 6px 14px;
        font-size: 18px;
        font-weight: 700;
        border-radius: 4px;
        margin-bottom: 12px;
      }
      .st-receiver-box {
        border: 1px solid #000;
        border-radius: 8px;
        padding: 15px 15px; 
        height: calc(100% - 50px); /* Fill space minus badge */
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        box-sizing: border-box;
        overflow: hidden;
      }
      .st-receiver-name {
        font-size: 24px; 
        font-weight: 700;
        margin-bottom: 6px;
      }
      .st-receiver-contact {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 6px;
      }
      .st-receiver-phone {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .st-receiver-address {
        font-size: 20px;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 6;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      @media print {
        @page { size: A4 portrait; margin: 0; }
        html, body { padding: 0; margin: 0; background: #fff; }
        .shipping-label { 
          width: 210mm; 
          height: 297mm; /* Full A4 height */
          padding: 10mm; 
          margin: 0;
          page-break-after: always;
        }
        /* Use exact background colors when printing */
        .st-pink-box { background-color: #e83a8b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .st-opt-blue { background-color: #eff6ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .st-opt-purple { background-color: #faf5ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .st-opt-orange { background-color: #fff7ed !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
    ${labelsHTML}
  `;
};

export const printCustomerShippingLabel = async (payloads: ShippingLabelPayload[]) => {
  try {
    if (!payloads || payloads.length === 0) return;
    const html = await getCustomerShippingLabelHTML(payloads);
    executePrint(html, payloads[0].rma.id + '_Shipping_Label');
  } catch (err) {
    console.error("Error generating shipping label:", err);
    alert("Error generating document. Please try again.");
  }
};

export const printDistributorDocuments = async (rmas: RMA[]) => {
  try {
    if (!rmas || rmas.length === 0) return;

    // Group RMAs by distributor name
    const grouped: Record<string, RMA[]> = {};
    for (const rma of rmas) {
      const key = rma.distributor || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(rma);
    }

    // Generate a separate document per distributor, combine with page breaks
    const pages: string[] = [];
    for (const distName of Object.keys(grouped)) {
      const html = await getImporterFormHTML(grouped[distName]);
      pages.push(html);
    }
    const combinedHTML = pages.join('<div style="page-break-after: always;"></div>');

    executePrint(combinedHTML, rmas[0].quotationNumber || rmas[0].groupRequestId || rmas[0].id || 'Distributor_Forms');
  } catch (err) {
    console.error("Error generating print documents:", err);
    alert("Error generating documents. Please try again.");
  }
};

export const printCustomerDocuments = async (rmas: RMA[]) => {
  try {
    if (!rmas || rmas.length === 0) return;
    const combinedHTML = await getCustomerFormHTML(rmas);
    executePrint(combinedHTML, rmas[0].quotationNumber || rmas[0].groupRequestId || rmas[0].id || 'Customer_Forms');
  } catch (err) {
    console.error("Error generating print documents:", err);
    alert("Error generating documents. Please try again.");
  }
};

const executePrint = (html: string, titleName: string) => {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  iframe.style.display = 'none';

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.error("Failed to access iframe document for printing.");
    return;
  }
  doc.write(`<html><head><title>Print - ${titleName}</title></head><body><div id="print-content">${html}</div></body></html>`);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 500);
};
