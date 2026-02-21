
import { RMA } from '../types';
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

const getImagesHTML = (rma: RMA) => {
  if (!rma.attachments || rma.attachments.length === 0) return '';
  const images = rma.attachments.map(att => `
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
      line-height: 1.4; 
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm;
      margin: 0 auto; 
      background: white;
      box-sizing: border-box;
      position: relative;
    }
    .print-doc h1, .print-doc h2, .print-doc h3, .print-doc h4 { color: #000; margin-top: 0; }
    .print-doc .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 2px solid #f2f2f7; padding-bottom: 10px; }
    .print-doc .doc-title-block { text-align: left; }
    .print-doc .doc-title { font-size: 20px; font-weight: 600; color: #0071e3; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 2px; }
    .print-doc .doc-subtitle { font-size: 13px; color: #86868b; font-weight: 400; }
    .print-doc .meta-grid { display: flex; gap: 15px; margin-bottom: 15px; }
    .print-doc .meta-grid > div { flex: 1; }
    .print-doc .box { background: #fbfbfd; padding: 12px; border-radius: 12px; border: 1px solid #e5e5ea; margin-bottom: 12px; box-sizing: border-box; }
    .print-doc .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b; font-weight: 600; margin-bottom: 2px; display: block; }
    .print-doc .value { font-size: 13px; font-weight: 500; color: #1d1d1f; }
    .print-doc table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 15px; border: 1px solid #e5e5ea; border-radius: 8px; overflow: hidden; }
    .print-doc th { background: #f2f2f7; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; font-weight: 600; color: #1d1d1f; border-bottom: 1px solid #d1d1d6; }
    .print-doc td { padding: 10px 12px; border-bottom: 1px solid #f2f2f7; font-size: 13px; color: #1d1d1f; vertical-align: top; background: white; }
    .print-doc tr:last-child td { border-bottom: none; }
    .print-doc .footer-grid { display: flex; justify-content: space-between; margin-top: 15px; gap: 40px; page-break-inside: avoid; }
    .print-doc .footer-grid > div { flex: 1; }
    .print-doc .signature-box { margin-top: 5px; }
    .print-doc .signature-line { height: 25px; border-bottom: 1px solid #d1d1d6; margin-bottom: 8px; }
    @media print {
      @page { size: A4; margin: 0; }
      body * { visibility: hidden; }
      #print-content, #print-content * { visibility: visible; }
      #print-content { position: absolute; left: 0; top: 0; width: 100%; }
      .print-doc { width: 100%; height: 100%; margin: 0; padding: 20mm !important; box-shadow: none; border: none; }
    }
  </style>
`;

export const getImporterFormHTML = async (rma: RMA): Promise<string> => {
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
          <div class="value" style="font-size: 18px; font-weight: bold;">${rma.id}</div>
          <div class="value" style="font-size: 12px;">Date: ${new Date().toLocaleDateString('th-TH')}</div>
        </div>
      </div>
      <div class="meta-grid">
        <div class="box">
          <div class="label">To Distributor (เรียน ผู้นำเข้า)</div>
          <div class="value" style="font-size: 15px; font-weight: bold;">${rma.distributor}</div>
          <div class="value" style="font-size: 12px;">RMA / Service Department</div>
        </div>
        <div class="box">
          <div class="label">From (จาก)</div>
          <div class="value">${settings.nameEn}</div>
          <div class="value" style="font-size: 12px;">Attn: Technical Support Dept.</div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ccc;">
             <div class="label">End User Reference</div>
             <div class="value" style="font-size: 12px;">${rma.customerName}</div>
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
              <strong>${rma.brand}</strong><br/>
              ${rma.productModel}
            </td>
            <td>${rma.productType.replace('_', ' ')}</td>
            <td><span style="font-family: monospace; font-size: 14px; font-weight: 600;">${rma.serialNumber}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="box" style="border: 1px solid #000;">
        <div class="label" style="color: #000;">Reported Fault / Symptom (อาการเสีย)</div>
        <div class="value" style="margin-top: 8px; font-size: 14px;">${rma.issueDescription}</div>
        ${rma.devicePassword ? `
        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
           <div class="label">Device Password (รหัสผ่านเครื่อง)</div>
           <div class="value" style="font-size: 14px; font-weight: bold; color: #d32f2f;">${rma.devicePassword}</div>
        </div>` : ''}
      </div>
      <div class="box">
        <div class="label">Included Accessories (อุปกรณ์ที่ส่งไปด้วย)</div>
        <div class="value">
          ${rma.distributorSentItems && rma.distributorSentItems.length > 0
      ? rma.distributorSentItems.map(formatAccessory).join(', ')
      : (rma.accessories.length > 0 ? rma.accessories.map(formatAccessory).join(', ') : 'Unit Only (เฉพาะตัวเครื่อง)')}
        </div>
      </div>
      ${getImagesHTML(rma)}
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
          <div class="label">Received By (ผู้รับ - ${rma.distributor})</div>
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

export const getCustomerFormHTML = async (rma: RMA): Promise<string> => {
  const settings = await MockDb.getSettings();
  return `
    ${getCommonStyles()}
    <div class="print-doc">
      ${getLogoHTML(settings)}
      <div class="doc-header">
        <div class="doc-title-block">
          <div class="doc-title">ใบส่งคืนสินค้าเคลม</div>
          <div class="doc-subtitle">Product Return Note</div>
        </div>
        <div style="text-align: right;">
          <div class="label">Job Reference</div>
          <div class="value" style="font-size: 16px;">${rma.quotationNumber || 'N/A'}</div>
          <div class="value" style="font-size: 12px; margin-top: 2px;">RMA ID: ${rma.id}</div>
        </div>
      </div>
      <div class="meta-grid">
        <div class="box">
          <div class="label">Customer Details (ลูกค้า)</div>
          <div class="value" style="font-size: 15px; font-weight: bold;">${rma.customerName}</div>
          <div class="value" style="font-size: 12px;">Tel: ${rma.customerPhone || '-'}</div>
          <div class="value" style="font-size: 12px;">Email: ${rma.customerEmail}</div>
          ${rma.customerLineId ? `<div class="value" style="font-size: 12px;">Line ID: ${rma.customerLineId}</div>` : ''}
        </div>
        <div class="box">
          <div class="label">Service Status (สถานะ)</div>
          <div class="value" style="font-size: 15px; font-weight: bold;">
            ${rma.status === 'REPAIRED' ? 'ดำเนินการเสร็จสิ้น (Completed)' :
      rma.status === 'REJECTED' ? 'ส่งคืน (Returned/Rejected)' :
        rma.status.replace('_', ' ')}
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
              <strong>${rma.brand} ${rma.productModel}</strong><br/>
              <span style="font-size: 11px; color: #666;">${rma.productType}</span>
            </td>
            <td>
              <div>Original: <span style="font-family: monospace;">${rma.serialNumber}</span></div>
              ${rma.resolution?.replacedSerialNumber ? `<div style="margin-top: 4px; font-weight: bold; color: #000;">New S/N: <span style="font-family: monospace;">${rma.resolution.replacedSerialNumber}</span></div>` : ''}
            </td>
            <td>
              ${rma.repairCosts?.warrantyStatus ? (translations.th.warranty as any)[rma.repairCosts.warrantyStatus] : '-'}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="box">
        <div class="label">Resolution (ผลการดำเนินการ)</div>
        <div class="value" style="margin-top: 5px; font-weight: 500;">
          ${rma.resolution?.actionTaken ? formatAction(rma.resolution.actionTaken) : (rma.status === 'REPAIRED' ? 'Completed / Replaced' : 'Checked')}
        </div>
        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
           <div class="label">Original Issue (อาการที่แจ้ง)</div>
           <div style="font-size: 13px; color: #444;">${rma.issueDescription}</div>
        </div>
        ${rma.resolution?.technicalNotes ? `
        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
           <div class="label">Technical Note (หมายเหตุช่าง)</div>
           <div style="font-size: 13px; color: #444;">${rma.resolution.technicalNotes}</div>
        </div>` : ''}
      </div>
      ${getImagesHTML(rma)}
      <div class="box">
        <div class="label">Items Returned to Customer (อุปกรณ์ที่ส่งคืนลูกค้า)</div>
        <div class="value">
          <ul style="margin: 5px 0 0 20px; padding: 0; list-style-type: square;">
            <li>Main Unit (${rma.productModel})</li>
            ${rma.accessories.map(acc => `<li>${formatAccessory(acc)}</li>`).join('')}
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

export const printDistributorDocuments = async (rmas: RMA[]) => {
  try {
    let combinedHTML = '';

    for (let i = 0; i < rmas.length; i++) {
      const rma = rmas[i];
      const importerHTML = await getImporterFormHTML(rma);

      combinedHTML += `
          ${importerHTML}
        `;

      if (i < rmas.length - 1) {
        combinedHTML += '<div style="page-break-before: always;"></div>';
      }
    }

    executePrint(combinedHTML, rmas.length > 0 ? (rmas[0].quotationNumber || rmas[0].groupRequestId || rmas[0].id) : 'Distributor_Forms');
  } catch (err) {
    console.error("Error generating print documents:", err);
    alert("Error generating documents. Please try again.");
  }
};

export const printCustomerDocuments = async (rmas: RMA[]) => {
  try {
    let combinedHTML = '';

    for (let i = 0; i < rmas.length; i++) {
      const rma = rmas[i];
      const customerHTML = await getCustomerFormHTML(rma);

      combinedHTML += `
          ${customerHTML}
        `;

      if (i < rmas.length - 1) {
        combinedHTML += '<div style="page-break-before: always;"></div>';
      }
    }

    executePrint(combinedHTML, rmas.length > 0 ? (rmas[0].quotationNumber || rmas[0].groupRequestId || rmas[0].id) : 'Customer_Forms');
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
    // Cleanup after short delay to ensure print dialog opened
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 500);
};
