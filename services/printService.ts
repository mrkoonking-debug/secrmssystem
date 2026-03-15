
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
  return `
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body { background: #e5e5e5; }

    .print-doc {
      font-family: 'Sarabun', 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
      color: #1d1d1f;
      line-height: 1.55;
      width: 210mm;
      min-height: 297mm;
      padding: 16mm 18mm;
      margin: 0 auto;
      background: #fff;
    }

    /* ═══  HEADER  ═══ */
    .doc-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 16px;
      border-bottom: 2px solid #2563eb;
      margin-bottom: 24px;
    }
    .doc-logo { height: 42px; width: auto; }
    .doc-company { flex: 1; }
    .doc-company-name {
      font-size: 14px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.01em;
    }
    .doc-company-info {
      font-size: 9.5px; color: #6e6e73; line-height: 1.5; margin-top: 2px;
    }

    /* ═══  DOCUMENT TITLE  ═══ */
    .doc-title-section { margin-bottom: 24px; }
    .doc-title {
      font-family: 'Inter', sans-serif;
      font-size: 28px; font-weight: 700; color: #2563eb;
      letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 8px;
    }
    .doc-subtitle {
      font-size: 12px; color: #6e6e73; text-transform: uppercase;
      letter-spacing: 0.04em; font-weight: 500;
    }
    .doc-meta {
      display: flex; gap: 20px; flex-wrap: wrap; margin-top: 8px;
    }
    .doc-meta-item { font-size: 12px; color: #6e6e73; }
    .doc-meta-item strong { color: #1d1d1f; font-weight: 600; }

    /* ═══  INFO CARDS  ═══ */
    .info-cards {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 12px; margin-bottom: 28px;
    }
    .info-card {
      background: #f0f5ff;
      border-radius: 12px;
      padding: 16px 20px;
      border-left: 3px solid #2563eb;
    }
    .info-card-label {
      font-size: 10px; font-weight: 600; color: #2563eb;
      text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;
    }
    .info-card-name {
      font-size: 15px; font-weight: 600; color: #1d1d1f; margin-bottom: 2px;
    }
    .info-card-detail { font-size: 11px; color: #6e6e73; line-height: 1.5; }

    /* ═══  TABLE  ═══ */
    .section-label {
      font-size: 11px; font-weight: 600; color: #2563eb;
      text-transform: uppercase; letter-spacing: 0.03em;
      margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
    }
    .section-label::after {
      content: ''; flex: 1; height: 1px;
      background: linear-gradient(to right, #bfdbfe, transparent);
    }
    .section-count {
      background: #2563eb; color: #fff; font-size: 9px; font-weight: 700;
      padding: 2px 8px; border-radius: 10px;
    }

    .items-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .items-table th {
      text-align: left; font-size: 10px; font-weight: 600; color: #2563eb;
      text-transform: uppercase; letter-spacing: 0.03em; padding: 10px 12px;
      border-top: 2px solid #2563eb; border-bottom: 2px solid #2563eb;
    }
    .items-table th.center { text-align: center; }
    .items-table td {
      padding: 14px 12px; border-bottom: 0.5px solid #e5e7eb;
      vertical-align: top; color: #1d1d1f;
    }
    .items-table td.center { text-align: center; color: #6e6e73; }

    .item-name { font-size: 13px; font-weight: 600; color: #1d1d1f; margin-bottom: 4px; }
    .item-detail { font-size: 10.5px; color: #6e6e73; line-height: 1.5; }
    .item-serial {
      display: inline-block; font-family: 'Inter', 'SF Mono', monospace;
      font-size: 10px; color: #1d1d1f; background: #f0f5ff;
      padding: 2px 8px; border-radius: 4px; margin-top: 6px;
      border: 0.5px solid #bfdbfe;
    }
    .item-serial-new {
      display: inline-block; font-family: 'Inter', 'SF Mono', monospace;
      font-size: 10px; color: #166534; background: #f0fdf4;
      padding: 2px 8px; border-radius: 4px; margin-top: 3px;
      border: 0.5px solid #bbf7d0;
    }

    /* ═══  SUMMARY  ═══ */
    .summary-row {
      display: flex; justify-content: flex-end; align-items: baseline;
      gap: 16px; padding: 10px 12px;
      border-top: 2px solid #2563eb;
      margin-bottom: 28px;
    }
    .summary-label { font-size: 12px; color: #6e6e73; font-weight: 500; }
    .summary-value {
      font-family: 'Inter', sans-serif; font-size: 16px;
      font-weight: 700; color: #2563eb;
    }

    /* ═══  REMARKS  ═══ */
    .remarks { margin-bottom: 36px; font-size: 10px; color: #6e6e73; line-height: 1.7; }
    .remarks-title {
      font-size: 10px; font-weight: 600; color: #2563eb;
      text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px;
    }

    /* ═══  SIGNATURES  ═══ */
    .signatures {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 24px; margin-top: auto; page-break-inside: avoid;
    }
    .sig-block {
      border: 1px dashed #bfdbfe;
      border-radius: 8px;
      padding: 16px 20px;
      min-height: 100px;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .sig-label {
      font-size: 10px; font-weight: 600; color: #2563eb;
      text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 36px;
    }
    .sig-line { border-bottom: 0.5px solid #1d1d1f; margin-bottom: 6px; }
    .sig-helper { display: flex; justify-content: space-between; }
    .sig-helper-text { font-size: 9px; color: #86868b; }

    @media print {
      @page { size: A4; margin: 0; }
      body { background: white; }
      .print-doc { width: 210mm; min-height: 297mm; padding: 14mm 16mm; }
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
        <td class="center">${index + 1}</td>
        <td>
          <div class="item-name">${item.brand} ${item.productModel}</div>
          <div class="item-detail">อาการเสีย: ${item.resolution?.rootCause || '-'}</div>
          <div class="item-detail">อุปกรณ์ที่ส่ง: ${accString}</div>
          ${item.deviceUsername ? `<div class="item-detail" style="color:#ea580c;">User: ${item.deviceUsername} / Pass: ${item.devicePassword}</div>` : ''}
          <div class="item-serial">S/N: ${item.serialNumber}</div>
        </td>
        <td></td>
      </tr>
    `;
  }).join('');

  return `
    ${getCommonStyles('blue')}
    <div class="print-doc">

      <div class="doc-header">
        <img src="${settings.logoUrl || '/logo.png'}" class="doc-logo" alt="logo" />
        <div class="doc-company">
          <div class="doc-company-name">${settings.nameTh}</div>
          <div class="doc-company-info">${settings.address} | TAX ID: ${settings.taxId} | Tel: ${settings.tel}</div>
        </div>
      </div>

      <div class="doc-title-section">
        <div class="doc-title">ใบส่งเคลมสินค้า</div>
        <div class="doc-subtitle">Distributor RMA Request Form</div>
        <div class="doc-meta">
          <div class="doc-meta-item">Ref: <strong>${rma.groupRequestId || rma.quotationNumber || rma.id}</strong></div>
          <div class="doc-meta-item">วันที่: <strong>${today}</strong></div>
        </div>
      </div>

      <div class="info-cards">
        <div class="info-card">
          <div class="info-card-label">เรียน ผู้นำเข้า / To: Distributor</div>
          <div class="info-card-name">${rma.distributor}</div>
          <div class="info-card-detail">RMA / Service Department</div>
        </div>
        <div class="info-card">
          <div class="info-card-label">จาก / From</div>
          <div class="info-card-name">${settings.nameEn}</div>
          <div class="info-card-detail">Technical Support Dept.</div>
        </div>
      </div>

      <div class="section-label">รายการสินค้า <span class="section-count">${rmas.length} รายการ</span></div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="center" style="width:5%;">#</th>
            <th style="width:75%;">รายละเอียด</th>
            <th style="width:20%;">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div class="summary-row">
        <span class="summary-label">รวมจำนวนสินค้าเคลม</span>
        <span class="summary-value">${rmas.length} ชิ้น</span>
      </div>

      <div class="remarks">
        <div class="remarks-title">หมายเหตุ</div>
        <div>• กรุณาตรวจสอบสภาพสินค้าและอุปกรณ์ที่ส่งเคลมตามรายการด้านบน</div>
        <div>• หากพบความผิดปกติ กรุณาแจ้งกลับภายใน 3 วันทำการ</div>
      </div>

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-label">ผู้ส่ง / Sent By</div>
          <div class="sig-line"></div>
          <div class="sig-helper">
            <span class="sig-helper-text">ลงชื่อ / Signature</span>
            <span class="sig-helper-text">วันที่ / Date ____________</span>
          </div>
        </div>
        <div class="sig-block">
          <div class="sig-label">ผู้รับ / Received By</div>
          <div class="sig-line"></div>
          <div class="sig-helper">
            <span class="sig-helper-text">ลงชื่อ / Signature</span>
            <span class="sig-helper-text">วันที่ / Date ____________</span>
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
        <td class="center">${index + 1}</td>
        <td>
          <div class="item-name">${item.brand} ${item.productModel}</div>
          <div class="item-detail">อาการเสีย: ${item.resolution?.rootCause || '-'}</div>
          <div class="item-detail">การดำเนินการ: ${actionText}</div>
          <div class="item-detail">อุปกรณ์ที่คืน: ${accString}</div>
          <div class="item-serial">S/N: ${item.serialNumber}</div>
          ${item.resolution?.replacedSerialNumber
        ? `<div class="item-serial-new">New S/N: ${item.resolution.replacedSerialNumber}</div>`
        : ''}
        </td>
        <td></td>
      </tr>
    `;
  }).join('');

  return `
    ${getCommonStyles('blue')}
    <div class="print-doc">

      <div class="doc-header">
        <img src="${settings.logoUrl || '/logo.png'}" class="doc-logo" alt="logo" />
        <div class="doc-company">
          <div class="doc-company-name">${settings.nameTh}</div>
          <div class="doc-company-info">${settings.address} | TAX ID: ${settings.taxId} | Tel: ${settings.tel}</div>
        </div>
      </div>

      <div class="doc-title-section">
        <div class="doc-title">ใบส่งคืนสินค้า</div>
        <div class="doc-subtitle">Product Return Note</div>
        <div class="doc-meta">
          <div class="doc-meta-item">Ref: <strong>${rma.groupRequestId || rma.quotationNumber || rma.id}</strong></div>
          <div class="doc-meta-item">วันที่: <strong>${today}</strong></div>
          <div class="doc-meta-item">สถานะ: <strong>${statusText.label}</strong></div>
        </div>
      </div>

      <div class="info-cards">
        <div class="info-card">
          <div class="info-card-label">ข้อมูลลูกค้า / Customer</div>
          <div class="info-card-name">${rma.customerName}</div>
          <div class="info-card-detail">
            ${rma.customerPhone ? `Tel: ${rma.customerPhone}` : ''}
            ${rma.customerPhone && rma.customerEmail ? ' · ' : ''}
            ${rma.customerEmail ? `Email: ${rma.customerEmail}` : ''}
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-label">ศูนย์บริการ / Service Center</div>
          <div class="info-card-name">${settings.nameEn}</div>
          <div class="info-card-detail">${settings.address}</div>
        </div>
      </div>

      <div class="section-label">รายการสินค้า <span class="section-count">${rmas.length} รายการ</span></div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="center" style="width:5%;">#</th>
            <th style="width:75%;">รายละเอียด</th>
            <th style="width:20%;">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div class="remarks">
        <div class="remarks-title">หมายเหตุ</div>
        <div>• การรับประกันไม่ครอบคลุมภัยจากคน, สัตว์, ภัยธรรมชาติ, ตัดต่อสาย, ไฟกระชาก หรือการติดตั้งที่ไม่ได้มาตรฐาน</div>
        <div>• สินค้าที่ส่งคืนแล้ว ไม่รับเปลี่ยนหรือคืนในทุกกรณี</div>
      </div>

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-label">ผู้ส่ง / Sent By</div>
          <div class="sig-line"></div>
          <div class="sig-helper">
            <span class="sig-helper-text">ลงชื่อ / Signature</span>
            <span class="sig-helper-text">วันที่ / Date ____________</span>
          </div>
        </div>
        <div class="sig-block">
          <div class="sig-label">ผู้รับ / Received By</div>
          <div class="sig-line"></div>
          <div class="sig-helper">
            <span class="sig-helper-text">ลงชื่อ / Signature</span>
            <span class="sig-helper-text">วันที่ / Date ____________</span>
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
        
        <!-- ROW 1: SENDER & JOB ID -->
        <div class="st-row-1">
          <div class="st-sender-box">
            <div class="st-sender-left">
              <div class="st-page-badge">${currentBox}/${totalBoxes}</div>
              ${settings.logoUrl ? `<img src="${settings.logoUrl}" class="st-sender-logo" alt="Logo" />` : ''}
            </div>
            <div class="st-sender-info">
              <div class="st-sender-name">${settings.nameTh}</div>
              <div class="st-sender-team">แผนกเคลม: ${teamName}</div>
              <div class="st-sender-details">
                ${settings.address}<br/>
                โทร: ${settings.tel}
              </div>
            </div>
          </div>
          <div class="st-job-box">
            <div class="st-job-content">
              <div class="st-job-label">JOB ID</div>
              <div class="st-job-value" style="font-size: ${displayId.length > 15 ? '12px' : displayId.length > 12 ? '14px' : '18px'};">
                  ${displayId}
              </div>
            </div>
            <div class="st-job-qr-container">
              <img src="${qrDataUrl}" class="st-qr-img" alt="QR" />
              <div class="st-qr-text">สแกน JOB ID</div>
            </div>
          </div>
        </div>

        <!-- ROW 2: TRACKING -->
        <div class="st-row-2">
          <div class="st-track-info">
            <div class="st-track-label">EMS / Tracking No.</div>
            <div class="st-track-val">${trackingId || '-'}</div>
          </div>
          <div class="st-track-center">
            <div class="st-track-placeholder">
              <span style="letter-spacing: 1px;">ติด Tracking Label ที่นี่</span>
            </div>
          </div>
          <div class="st-track-qr-container">
            <img src="${qrTrackingUrl}" class="st-qr-img" alt="QR Tracking" />
            <div class="st-qr-text">สแกน EMS</div>
          </div>
        </div>

        <!-- ROW 3: RECEIVER -->
        <div class="st-row-3">
          <div class="st-receiver-card">
            <div class="st-deliver-header">
              <div class="st-deliver-badge">จัดส่งถึง (DELIVER TO)</div>
            </div>
            <div class="st-receiver-content">
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

      </div>
    </div>`;
  }).join('');

  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
      
      * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0; 
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body { background: #f9fafb; padding: 0; margin: 0; display: block; }
      
      .shipping-label {
        font-family: 'Sarabun', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #1d1d1f;
        width: 210mm;        /* A4 Width */
        height: 148mm;       /* Half A4 Height (A5 Landscape) */
        padding: 10mm;       /* Outer padding */
        margin: 0;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
      }
      
      .st-container {
        width: 100%;
        height: 100%;
        background-color: #fff;
        border: 2px solid #e5e5ea;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        overflow: hidden;
        /* Subtle shadow for preview, removed in print */
        box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
      }

      /* --- ROW 1: HEADER (SENDER & JOB ID) --- */
      .st-row-1 {
        display: flex;
        height: 38mm;
        border-bottom: 2px solid #e5e5ea;
        background-color: #fff;
      }
      
      .st-sender-box {
        flex: 1;
        padding: 12px 16px;
        display: flex;
        align-items: center; /* Centered visually */
        gap: 16px;
      }
      .st-sender-left {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        min-width: 50px;
      }
      .st-sender-logo {
        height: 40px;
        max-width: 80px;
        object-fit: contain;
        border-radius: 8px;
      }
      .st-page-badge {
        background: #f3f4f6;
        color: #6b7280;
        font-size: 10px;
        line-height: 1;
        font-weight: 700;
        padding: 3px 6px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
      }
      .st-sender-info {
        flex: 1;
        padding-top: 2px;
      }
      .st-sender-name {
        font-size: 18px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 2px;
        letter-spacing: -0.01em;
      }
      .st-sender-team {
        font-size: 13px;
        font-weight: 600;
        color: #2563eb; /* Primary blue accent */
        margin-bottom: 3px;
      }
      .st-sender-details {
        font-size: 12px;
        color: #4b5563;
        line-height: 1.4;
      }

      .st-job-box {
        width: 78mm; /* Increased width to fit long IDs */
        background-color: #fce7f3; /* Very soft pink/magenta */
        border-left: 2px solid #e5e5ea;
        display: flex;
        align-items: center;
        padding: 10px 14px;
        gap: 10px;
      }
      .st-job-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
      }
      .st-job-label {
        font-size: 11px;
        font-weight: 700;
        color: #be185d; /* Deep pink */
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
      }
      .st-job-value {
        font-weight: 800;
        color: #111827;
        font-family: 'Inter', monospace;
        letter-spacing: -0.02em;
        line-height: 1.1;
        white-space: nowrap; /* Prevent ugly hypen word breaks */
      }
      .st-job-qr-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      /* --- ROW 2: TRACKING --- */
      .st-row-2 {
        display: flex;
        height: 38mm;
        border-bottom: 2px dashed #d1d5db;
        background-color: #f9fafb;
      }
      .st-track-info {
        width: 70mm; 
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-right: 2px solid #e5e5ea;
        background-color: #fff;
      }
      .st-track-label {
        font-size: 12px;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
      }
      .st-track-val {
        font-size: 20px;
        font-weight: 800;
        color: #111827;
        font-family: 'Inter', monospace;
        letter-spacing: 0.5px;
      }
      
      .st-track-center {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
      }
      .st-track-placeholder {
        border: 2px dashed #cbd5e1;
        background-color: #f1f5f9;
        border-radius: 8px;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        font-size: 14px;
        font-weight: 500;
      }
      
      .st-track-qr-container {
        width: 42mm; 
        border-left: 2px solid #e5e5ea;
        background-color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 6px;
      }

      /* Shared QR Styles */
      .st-qr-img {
        width: 26mm;
        height: 26mm;
        border-radius: 4px;
        mix-blend-mode: multiply;
      }
      .st-qr-text {
        font-size: 9px;
        font-weight: 600;
        color: #6b7280;
        text-align: center;
      }

      /* --- ROW 3: RECEIVER --- */
      .st-row-3 {
        flex: 1;
        padding: 14px 16px;
        background-color: #fff;
        display: flex;
        flex-direction: column;
      }
      .st-receiver-card {
        flex: 1;
        border: 2px solid #111827; /* Strong border for emphasis */
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .st-deliver-header {
        background-color: #111827; /* Dark header */
        color: #fff;
        padding: 6px 14px;
        display: flex;
        align-items: center;
      }
      .st-deliver-badge {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
      .st-receiver-content {
        padding: 12px 16px;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .st-receiver-name {
        font-size: 24px; 
        font-weight: 800;
        color: #111827;
        margin-bottom: 6px;
        line-height: 1.2;
      }
      .st-receiver-contact {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 4px;
      }
      .st-receiver-phone {
        font-size: 20px;
        font-weight: 800;
        color: #111827;
        margin-bottom: 8px;
        font-family: 'Inter', sans-serif;
      }
      .st-receiver-address {
        font-size: 16px;
        color: #4b5563;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Print Adjustments */
      @media print {
        @page { size: A4 portrait; margin: 0; }
        html, body { padding: 0; margin: 0; background: #fff; }
        .shipping-label { 
          width: 210mm; 
          height: 148mm; /* Half A4 height (A5) for print */
          padding: 8mm; /* Slightly smaller padding for print edge */
          margin: 0;
          page-break-after: always;
          border-bottom: 1px dashed #ccc; /* Cut-here guide between labels */
        }
        .st-container {
          border-color: #000; /* High contrast print border */
          box-shadow: none;
        }
        .st-row-1, .st-job-box, .st-track-info, .st-track-qr-container {
          border-color: #000;
        }
        .st-job-box { background-color: #fce7f3 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .st-deliver-header { background-color: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .st-page-badge { border-color: #000; }
        .st-row-2 { border-bottom-color: #000; }
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
