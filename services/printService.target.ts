
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
            <img src="${att.previewUrl || ''}" style="max-width: 100%; max-height: 150px; border: 1px solid #ddd; padding: 4px; border-radius: 4px;" />
            <div style="font-size: 10px; color: #666; margin-top: 4px;">${att.fileName}</div>
        </div>
    `).join('');
  return `
        <div style="margin-top: 16px; border-top: 1px solid #e5e5ea; padding-top: 12px; page-break-inside: avoid;">
            <div class="apple-section-title" style="margin-bottom: 8px; border:none; padding:0; font-size:12px;">Attached Images (รูปภาพประกอบ)</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                ${images}
            </div>
        </div>
    `;
};

const getCommonStyles = () => `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
    
    .print-doc { 
      font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1d1d1f !important;
      line-height: 1.4; 
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 15mm;
      margin: 0 auto; 
      background: white;
      box-sizing: border-box;
      position: relative;
    }

    /* Typography Utilities */
    .print-doc h1, .print-doc h2, .print-doc h3, .print-doc h4 { color: #1d1d1f; margin-top: 0; }
    .print-doc .apple-section-title { 
        font-size: 14px; 
        font-weight: 600; 
        color: #1d1d1f; 
        margin-bottom: 12px; 
        padding-bottom: 4px; 
        border-bottom: 1px solid #e5e5ea; 
        letter-spacing: -0.01em;
    }
    
    /* Header Styles */
    .print-doc .doc-header { 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start; 
        margin-bottom: 12px; 
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e5ea; 
    }
    .print-doc .doc-title-block { text-align: left; }
    .print-doc .doc-title { 
        font-size: 18px; 
        font-weight: 700; 
        color: #1d1d1f; 
        letter-spacing: -0.015em; 
        line-height: 1.2; 
        margin-bottom: 2px; 
    }
    .print-doc .doc-subtitle { font-size: 11px; color: #86868b; font-weight: 400; }

    /* Meta Info Styles */
    .print-doc .meta-grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr;
        gap: 16px; 
        margin-bottom: 16px; 
    }
    .print-doc .meta-block {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    
    /* Item Card (Apple Style - No border, just layout isolation) */
    .print-doc .apple-item-block { 
        margin-bottom: 20px; 
        page-break-inside: avoid; 
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .print-doc .apple-item-header { 
        font-weight: 700; 
        font-size: 14px; 
        color: #1d1d1f;
        letter-spacing: -0.01em;
    }
    .print-doc .apple-item-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 4px;
    }
    .print-doc .apple-item-grid-3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
        margin-bottom: 4px;
    }

    /* Universal Label/Value */
    .print-doc .label { 
        font-size: 9px; 
        text-transform: uppercase; 
        letter-spacing: 0.04em; 
        color: #86868b; 
        font-weight: 600; 
        margin-bottom: 2px; 
        display: block; 
    }
    .print-doc .value { 
        font-size: 12px; 
        font-weight: 500; 
        color: #1d1d1f; 
    }
    .print-doc .value-secondary {
        font-size: 11px;
        color: #444;
    }
    
    /* Footer/Signatures */
    .print-doc .footer-grid { 
        display: flex; 
        justify-content: space-between; 
        margin-top: 24px; 
        gap: 32px; 
        page-break-inside: avoid; 
        border-top: 1px solid #e5e5ea;
        padding-top: 16px;
    }
    .print-doc .footer-grid > div { flex: 1; }
    .print-doc .signature-box { margin-top: 4px; }
    .print-doc .signature-line { 
        height: 24px; 
        border-bottom: 1px dashed #d1d1d6; 
        margin-bottom: 6px; 
    }
    @media print {
      @page { size: A4; margin: 0; }
      body * { visibility: hidden; }
      #print-content, #print-content * { visibility: visible; }
      #print-content { position: absolute; left: 0; top: 0; width: 100%; }
      .print-doc { width: 100%; height: 100%; margin: 0; padding: 20mm !important; box-shadow: none; border: none; }
    }
  </style>
`;

export const getImporterFormHTML = async (rmas: RMA[]): Promise<string> => {
  if (!rmas || rmas.length === 0) return '';
  const rma = rmas[0];
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
      <h3 style="font-size: 12px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 3px; text-transform: uppercase; font-weight: 600;">Product Information (${rmas.length} Items)</h3>
      ${rmas.map((item, index) => `
      <div class="item-card">
        <div class="item-card-header">
          Item ${index + 1}: ${item.brand}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; padding: 0 4px;">
          <div>
            <div class="label">Product Model (รุ่น)</div>
            <div class="value" style="font-size: 12px; font-weight: 600;">${item.productModel}</div>
          </div>
          <div>
            <div class="label">Serial Number (S/N)</div>
            <div class="value" style="font-size: 12px; font-family: monospace; font-weight: 600;">${item.serialNumber}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px;">
          <div class="box" style="margin-bottom: 0;">
            <div class="label" style="color: #000;">Root Cause / Issue Found (สาเหตุ/อาการที่พบ)</div>
            <div class="value" style="margin-top: 3px; font-size: 12px;">${item.resolution?.rootCause || '-'}</div>
            ${item.deviceUsername || item.devicePassword ? `
            <div style="margin-top: 6px; border-top: 1px dashed #ccc; padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
               <div>
                 <div class="label">Device Username (ยูสเซอร์)</div>
                 <div class="value" style="font-size: 12px; font-weight: bold; color: #d32f2f;">${item.deviceUsername || '-'}</div>
               </div>
               <div>
                 <div class="label">Device Password (รหัสผ่าน)</div>
                 <div class="value" style="font-size: 12px; font-weight: bold; color: #d32f2f;">${item.devicePassword || '-'}</div>
               </div>
            </div>` : ''}
          </div>
          <div class="box" style="margin-bottom: 0;">
            <div class="label">Included Accessories (อุปกรณ์ที่ส่งไปด้วย)</div>
            <div class="value" style="font-size: 12px; margin-top: 3px;">
              ${item.distributorSentItems && item.distributorSentItems.length > 0
      ? item.distributorSentItems.map(formatAccessory).join(', ')
      : (item.accessories.length > 0 ? item.accessories.map(formatAccessory).join(', ') : 'Unit Only (เฉพาะเครื่อง)')}
            </div>
          </div>
        </div>
        ${getImagesHTML(item)}
      </div>
      `).join('')}
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

export const getCustomerFormHTML = async (rmas: RMA[]): Promise<string> => {
  if (!rmas || rmas.length === 0) return '';
  const rma = rmas[0]; // Use first RMA for common details
  const settings = await MockDb.getSettings();

  return `
    ${getCommonStyles()}
    <div class="print-doc">
      ${getLogoHTML(settings)}
      <div class="doc-header">
        <div class="doc-title-block">
          <div class="doc-title">ใบรับคืนสินค้าเคลม / บริการ (Customer Return Note)</div>
          <div class="doc-subtitle">For Customer (ส่วนของลูกค้า)</div>
        </div>
        <div style="text-align: right;">
          <div class="label">Service Ref No.</div>
          <div class="value" style="font-size: 18px; font-weight: bold;">${rma.id}</div>
          <div class="value" style="font-size: 12px;">Date: ${new Date().toLocaleDateString('th-TH')}</div>
        </div>
      </div>
      <div class="meta-grid">
        <div class="meta-block">
          <div class="label">Customer Details (ลูกค้า)</div>
          <div class="value" style="font-size: 14px; font-weight: 700;">${rma.customerName}</div>
          <div class="value-secondary">Tel: ${rma.customerPhone || '-'}</div>
          <div class="value-secondary">Email: ${rma.customerEmail}</div>
          ${rma.customerLineId ? `<div class="value-secondary">Line ID: ${rma.customerLineId}</div>` : ''}
        </div>
        <div class="meta-block">
          <div class="label">Service Status (สถานะ)</div>
          <div class="value" style="font-size: 14px; font-weight: 700;">
            ${rma.status === 'REPAIRED' ? 'ดำเนินการเสร็จสิ้น (Completed)' :
      rma.status === 'REJECTED' ? 'ส่งคืน (Returned/Rejected)' :
        rma.status.replace('_', ' ')}
          </div>
        </div>
      </div>
      
      <div class="apple-section-title">Service Item Details (${rmas.length} Items)</div>
      
      ${rmas.map((item, index) => `
      <div class="apple-item-block">
        <div class="apple-item-header">
          ${index + 1}. ${item.brand} — ${item.productModel}
        </div>
        
        <div class="apple-item-grid-3">
          <div>
            <div class="label">Product Model (รุ่น)</div>
            <div class="value" style="font-size: 13px; font-weight: 600;">${item.productModel}</div>
            <div class="value-secondary" style="font-size: 10px; margin-top: 1px;">${item.productType}</div>
          </div>
          <div>
            <div class="label">Serial Number (S/N)</div>
            <div class="value-secondary" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">Original: ${item.serialNumber}</div>
            ${item.resolution?.replacedSerialNumber ? `<div class="value" style="margin-top: 2px; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">New: ${item.resolution.replacedSerialNumber}</div>` : ''}
          </div>
          <div>
            <div class="label">Warranty (การรับประกัน)</div>
            <div class="value">${item.repairCosts?.warrantyStatus ? (translations.th.warranty as any)[item.repairCosts.warrantyStatus] : '-'}</div>
          </div>
        </div>

        <div class="apple-item-grid" style="border-top: 1px solid #e5e5ea; padding-top: 8px;">
          <div>
            <div class="label" style="color:#1d1d1f; font-weight: 700;">Resolution (ผลการดำเนินการ)</div>
            <div class="value" style="margin-top: 2px; font-size: 13px;">
              ${item.resolution?.actionTaken ? formatAction(item.resolution.actionTaken) : (item.status === 'REPAIRED' ? 'Completed / Replaced' : 'Checked')}
            </div>
            
            <div style="margin-top: 12px;">
               <div class="label">Root Cause / Issue Found (สาเหตุ/อาการที่พบ)</div>
               <div class="value-secondary">${item.resolution?.rootCause || '-'}</div>
               ${item.deviceUsername || item.devicePassword ? `
               <div style="margin-top: 6px; display: flex; gap: 16px;">
                 <div>
                   <div class="label" style="font-size: 8px;">Device Username</div>
                   <div style="font-family: monospace; font-size: 11px;">${item.deviceUsername || '-'}</div>
                 </div>
                 <div>
                   <div class="label" style="font-size: 8px;">Device Password</div>
                   <div style="font-family: monospace; font-size: 11px;">${item.devicePassword || '-'}</div>
                 </div>
               </div>` : ''}
            </div>
            ${item.resolution?.technicalNotes ? `
            <div style="margin-top: 12px;">
               <div class="label">Technical Note (หมายเหตุช่าง)</div>
               <div class="value-secondary">${item.resolution.technicalNotes}</div>
            </div>` : ''}
          </div>
          
          <div>
            <div class="label">Items Returned (อุปกรณ์ที่ส่งคืนลูกค้า)</div>
            <div class="value-secondary" style="margin-top: 2px;">
              <ul style="margin: 0 0 0 16px; padding: 0; font-size: 11px; line-height: 1.6; color:#444;">
                <li>Main Unit (${item.productModel})</li>
                ${item.accessories.map(acc => `<li>${formatAccessory(acc)}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
        ${getImagesHTML(item)}
      </div>
      `).join('')}
      <div class="footer-grid">
        <div class="signature-box">
          <div class="label">Delivered By (ผู้ส่งคืน - Sentinel)</div>
          <div class="signature-line"></div>
          <div class="value" style="font-size: 11px;">Date: ...........................................</div>
        </div>
        <div class="signature-box">
          <div class="label">Received By (ลูกค้าผู้รับของ)</div>
          <div style="font-size: 9px; color: #666; margin-bottom: 4px;">ข้าพเจ้าได้รับสินค้าคืนในสภาพเรียบร้อย</div>
          <div class="signature-line"></div>
          <div class="value" style="font-size: 11px;">Sign: ...........................................</div>
        </div>
      </div>
    </div>
  `;
};

export const printDistributorDocuments = async (rmas: RMA[]) => {
  try {
    if (!rmas || rmas.length === 0) return;
    const combinedHTML = await getImporterFormHTML(rmas);
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
    // Cleanup after short delay to ensure print dialog opened
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 500);
};
