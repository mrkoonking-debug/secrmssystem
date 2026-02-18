
import { Claim } from '../types';
import { translations } from '../i18n/translations';
import { MockDb } from './mockDb';

// Helper to wrap content with dynamic settings
const withSettings = async (callback: (settings: any) => string) => {
  const settings = await MockDb.getSettings();
  return callback(settings);
};

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
    'No Fault Found': translations.th.actions.no_fault_found,
    'Sent to Vendor': translations.th.actions.sent_to_vendor
  };
  return map[action] || action;
}

const getLogoHTML = (settings: any) => `
  <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #0b57d0; padding-bottom: 15px;">
    <div style="margin-right: 15px;">
      <img src="${settings.logoUrl || '/logo.png'}" alt="Company Logo" style="height: 60px; width: auto; object-fit: contain;" />
    </div>
    <div style="flex-grow: 1; text-align: right;">
      <h2 style="margin: 0; color: #000; font-family: 'Prompt', sans-serif; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">${settings.nameEn}</h2>
      <div style="font-size: 14px; color: #333; margin-top: 4px;">${settings.nameTh}</div>
      <div style="font-size: 11px; color: #666; margin-top: 4px;">
        ${settings.address} | TAX ID: ${settings.taxId}
      </div>
      <div style="font-size: 11px; color: #666;">
        Tel: ${settings.tel} | Web: ${settings.website}
      </div>
    </div>
  </div>
`;

const getImagesHTML = (claim: Claim) => {
  if (!claim.attachments || claim.attachments.length === 0) return '';
  const images = claim.attachments.map(att => `
        <div style="text-align: center;">
            <img src="${att.previewUrl || ''}" style="max-width: 100%; max-height: 150px; border: 1px solid #ddd; padding: 4px; border-radius: 4px;" />
            <div style="font-size: 10px; color: #666; margin-top: 4px;">${att.fileName}</div>
        </div>
    `).join('');
  return `
        <div class="box" style="margin-top: 20px; page-break-inside: avoid;">
            <div class="label" style="border-bottom: 1px dashed #ccc; padding-bottom: 5px; margin-bottom: 10px;">Attached Images (รูปภาพประกอบ)</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                ${images}
            </div>
        </div>
    `;
};

const getCommonStyles = () => `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap');
    .print-doc { 
      font-family: 'Prompt', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      color: #1d1d1f !important;
      line-height: 1.5; 
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto; 
      background: white;
      box-sizing: border-box;
      position: relative;
    }
    .print-doc h1, .print-doc h2, .print-doc h3, .print-doc h4 { color: #000; }
    .print-doc .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #f2f2f7; padding-bottom: 20px; }
    .print-doc .doc-title-block { text-align: left; }
    .print-doc .doc-title { font-size: 24px; font-weight: 600; color: #0071e3; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 4px; }
    .print-doc .doc-subtitle { font-size: 14px; color: #86868b; font-weight: 400; }
    .print-doc .meta-grid { display: flex; gap: 20px; margin-bottom: 30px; }
    .print-doc .meta-grid > div { flex: 1; }
    .print-doc .box { background: #fbfbfd; padding: 16px; border-radius: 16px; border: 1px solid #e5e5ea; }
    .print-doc .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b; font-weight: 600; margin-bottom: 6px; display: block; }
    .print-doc .value { font-size: 14px; font-weight: 500; color: #1d1d1f; }
    .print-doc table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; border: 1px solid #e5e5ea; border-radius: 12px; overflow: hidden; }
    .print-doc th { background: #f2f2f7; text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; font-weight: 600; color: #1d1d1f; border-bottom: 1px solid #d1d1d6; }
    .print-doc td { padding: 14px 16px; border-bottom: 1px solid #f2f2f7; font-size: 14px; color: #1d1d1f; vertical-align: top; background: white; }
    .print-doc tr:last-child td { border-bottom: none; }
    .print-doc .footer-grid { display: flex; justify-content: space-between; margin-top: 60px; gap: 60px; page-break-inside: avoid; }
    .print-doc .footer-grid > div { flex: 1; }
    .print-doc .signature-box { margin-top: 20px; }
    .print-doc .signature-line { height: 50px; border-bottom: 1px solid #d1d1d6; margin-bottom: 12px; }
    @media print {
      @page { size: A4; margin: 0; }
      body * { visibility: hidden; }
      #print-content, #print-content * { visibility: visible; }
      #print-content { position: absolute; left: 0; top: 0; width: 100%; }
      .print-doc { width: 100%; height: 100%; margin: 0; padding: 20mm !important; box-shadow: none; border: none; }
    }
  </style>
`;

export const getImporterFormHTML = async (claim: Claim): Promise<string> => {
  const settings = await MockDb.getSettings();
  return `
    ${getCommonStyles()}
    <div class="print-doc">
      ${getLogoHTML(settings)}
      <div class="doc-header">
        <div class="doc-title-block">
          <div class="doc-title">ใบส่งเคลมสินค้า (สำหรับผู้นำเข้า)</div>
          <div class="doc-subtitle">Distributor RMA Request</div>
        </div>
        <div style="text-align: right;">
          <div class="label">Reference ID</div>
          <div class="value" style="font-size: 18px; font-weight: bold;">${claim.id}</div>
          <div class="value" style="font-size: 12px;">Date: ${new Date().toLocaleDateString('th-TH')}</div>
        </div>
      </div>
      <div class="meta-grid">
        <div class="box">
          <div class="label">To Distributor (เรียน ผู้นำเข้า)</div>
          <div class="value" style="font-size: 15px; font-weight: bold;">${claim.distributor}</div>
          <div class="value" style="font-size: 12px;">RMA / Service Department</div>
        </div>
        <div class="box">
          <div class="label">From (จาก)</div>
          <div class="value">${settings.nameEn}</div>
          <div class="value" style="font-size: 12px;">Attn: Technical Support Dept.</div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ccc;">
             <div class="label">End User Reference</div>
             <div class="value" style="font-size: 12px;">${claim.customerName}</div>
          </div>
        </div>
      </div>
      <h3 style="font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; text-transform: uppercase; font-weight: 600;">Product Information</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 40%;">ยี่ห้อ / รุ่น (Brand / Model)</th>
            <th style="width: 30%;">ประเภท (Type)</th>
            <th style="width: 30%;">หมายเลขเครื่อง (S/N)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${claim.brand}</strong><br/>
              ${claim.productModel}
            </td>
            <td>${claim.productType.replace('_', ' ')}</td>
            <td><span style="font-family: monospace; font-size: 14px; font-weight: 600;">${claim.serialNumber}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="box" style="margin-bottom: 20px; border: 1px solid #000;">
        <div class="label" style="color: #000;">Reported Fault / Symptom (อาการเสีย)</div>
        <div class="value" style="margin-top: 8px; font-size: 14px;">${claim.issueDescription}</div>
      </div>
      <div class="box">
        <div class="label">Included Accessories (อุปกรณ์ที่ส่งไปด้วย)</div>
        <div class="value">
          ${claim.distributorSentItems && claim.distributorSentItems.length > 0
      ? claim.distributorSentItems.map(formatAccessory).join(', ')
      : (claim.accessories.length > 0 ? claim.accessories.map(formatAccessory).join(', ') : 'Unit Only (เฉพาะตัวเครื่อง)')}
        </div>
      </div>
      ${getImagesHTML(claim)}
      <div class="footer-grid">
        <div class="signature-box">
          <div class="label">Sent By (ผู้ส่ง)</div>
          <div class="signature-line"></div>
          <div style="display: flex; justify-content: space-between;">
             <div class="value" style="font-size: 12px;">Name: .................................................</div>
             <div class="value" style="font-size: 12px;">Date: ........................</div>
          </div>
        </div>
        <div class="signature-box">
          <div class="label">Received By (ผู้รับ - ${claim.distributor})</div>
          <div class="signature-line"></div>
          <div style="display: flex; justify-content: space-between;">
             <div class="value" style="font-size: 12px;">RMA No: ..............................................</div>
             <div class="value" style="font-size: 12px;">Date: ........................</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const getCustomerFormHTML = async (claim: Claim): Promise<string> => {
  const settings = await MockDb.getSettings();
  return `
    ${getCommonStyles()}
    <div class="print-doc">
      ${getLogoHTML(settings)}
      <div class="doc-header">
        <div class="doc-title-block">
          <div class="doc-title">ใบส่งคืนสินค้าซ่อมเสร็จ</div>
          <div class="doc-subtitle">Product Return Note</div>
        </div>
        <div style="text-align: right;">
          <div class="label">Job Reference</div>
          <div class="value" style="font-size: 16px;">${claim.quotationNumber || 'N/A'}</div>
          <div class="value" style="font-size: 12px; margin-top: 2px;">Claim ID: ${claim.id}</div>
        </div>
      </div>
      <div class="meta-grid">
        <div class="box">
          <div class="label">Customer Details (ลูกค้า)</div>
          <div class="value" style="font-size: 15px; font-weight: bold;">${claim.customerName}</div>
          <div class="value" style="font-size: 12px;">Tel: ${claim.customerPhone || '-'}</div>
          <div class="value" style="font-size: 12px;">Email: ${claim.customerEmail}</div>
          ${claim.customerLineId ? `<div class="value" style="font-size: 12px;">Line ID: ${claim.customerLineId}</div>` : ''}
        </div>
        <div class="box">
          <div class="label">Service Status (สถานะ)</div>
          <div class="value" style="font-size: 15px; font-weight: bold;">
            ${claim.status === 'REPAIRED' ? 'ซ่อมเสร็จสิ้น (Repaired)' :
      claim.status === 'REJECTED' ? 'คืนคืนไม่ซ่อม (Returned/Rejected)' :
        claim.status.replace('_', ' ')}
          </div>
        </div>
      </div>
      <h3 style="font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; text-transform: uppercase; font-weight: 600;">Service Item Details</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 40%;">สินค้า (Product)</th>
            <th style="width: 30%;">หมายเลขเครื่อง (S/N)</th>
            <th style="width: 30%;">การรับประกัน (Warranty)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${claim.brand} ${claim.productModel}</strong><br/>
              <span style="font-size: 11px; color: #666;">${claim.productType}</span>
            </td>
            <td>
              <div>Original: <span style="font-family: monospace;">${claim.serialNumber}</span></div>
              ${claim.resolution?.replacedSerialNumber ? `<div style="margin-top: 4px; font-weight: bold; color: #000;">New S/N: <span style="font-family: monospace;">${claim.resolution.replacedSerialNumber}</span></div>` : ''}
            </td>
            <td>
              ${claim.repairCosts?.warrantyStatus ? (translations.th.warranty as any)[claim.repairCosts.warrantyStatus] : '-'}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="box" style="margin-bottom: 20px;">
        <div class="label">Resolution (ผลการดำเนินการ)</div>
        <div class="value" style="margin-top: 5px; font-weight: 500;">
          ${claim.resolution?.actionTaken ? formatAction(claim.resolution.actionTaken) : (claim.status === 'REPAIRED' ? 'Repaired / Replaced' : 'Checked')}
        </div>
        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
           <div class="label">Original Issue (อาการที่แจ้ง)</div>
           <div style="font-size: 13px; color: #444;">${claim.issueDescription}</div>
        </div>
        ${claim.resolution?.technicalNotes ? `
        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
           <div class="label">Technical Note (หมายเหตุช่าง)</div>
           <div style="font-size: 13px; color: #444;">${claim.resolution.technicalNotes}</div>
        </div>` : ''}
      </div>
      ${getImagesHTML(claim)}
      <div class="box">
        <div class="label">Items Returned to Customer (อุปกรณ์ที่ส่งคืนลูกค้า)</div>
        <div class="value">
          <ul style="margin: 5px 0 0 20px; padding: 0; list-style-type: square;">
            <li>Main Unit (${claim.productModel})</li>
            ${claim.accessories.map(acc => `<li>${formatAccessory(acc)}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="footer-grid">
        <div class="signature-box">
          <div class="label">Delivered By (ผู้ส่งคืน - Sentinel)</div>
          <div class="signature-line"></div>
          <div class="value" style="font-size: 12px;">Date: ...........................................</div>
        </div>
        <div class="signature-box">
          <div class="label">Received By (ลูกค้าผู้รับของ)</div>
          <div style="font-size: 10px; color: #666; margin-bottom: 5px;">ข้าพเจ้าได้รับสินค้าคืนในสภาพเรียบร้อย</div>
          <div class="signature-line"></div>
          <div class="value" style="font-size: 12px;">Sign: ...........................................</div>
        </div>
      </div>
    </div>
  `;
};
