
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
const getCommonStyles = () => `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

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

    /* ── HEADER ── */
    .doc-header-bar {
      background: linear-gradient(135deg, #0b57d0 0%, #1a73e8 100%);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      color: white;
    }
    .doc-header-left { display: flex; align-items: center; gap: 12px; }
    .doc-header-logo { height: 36px; width: auto; object-fit: contain; }
    .doc-header-title { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; }
    .doc-header-subtitle { font-size: 10px; opacity: 0.8; margin-top: 2px; }
    .doc-header-right { text-align: right; }
    .doc-ref-label { font-size: 9px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.06em; }
    .doc-ref-no { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; font-family: 'Inter', sans-serif; }
    .doc-ref-date { font-size: 11px; opacity: 0.85; margin-top: 2px; }

    /* ── COMPANY INFO BANNER ── */
    .company-banner {
      background: #f7f9fc;
      border: 1px solid #e8edf5;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      font-size: 10px;
      color: #444;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-banner .co-name { font-size: 12px; font-weight: 700; color: #1d1d1f; }

    /* ── PARTIES BLOCK ── */
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }
    .party-box {
      border: 1px solid #e5e5ea;
      border-radius: 8px;
      padding: 12px 14px;
      background: #fff;
    }
    .party-box-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0b57d0;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .party-box-label::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 10px;
      background: #0b57d0;
      border-radius: 2px;
    }
    .party-name { font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 2px; }
    .party-detail { font-size: 10px; color: #666; line-height: 1.6; }

    /* ── SECTION TITLE ── */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #0b57d0;
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
      background: linear-gradient(to right, #d1ddf0, transparent);
    }
    .section-title .count-badge {
      background: #0b57d0;
      color: white;
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 10px;
    }

    /* ── ITEM CARD ── */
    .item-card {
      border: 1px solid #e5e5ea;
      border-radius: 10px;
      margin-bottom: 12px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .item-card-header {
      background: linear-gradient(to right, #f5f8ff, #eef3fd);
      border-bottom: 1px solid #e5e5ea;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .item-no {
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      background: #0b57d0;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .item-brand { font-size: 14px; font-weight: 700; color: #1d1d1f; }
    .item-model { font-size: 11px; color: #555; }
    .item-sn {
      font-family: 'Inter', ui-monospace, Menlo, Monaco, monospace;
      font-size: 11px;
      color: #333;
      background: #edf1fa;
      border-radius: 4px;
      padding: 3px 8px;
    }
    .item-body {
      padding: 12px 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .item-body-full {
      padding: 12px 14px;
    }

    /* ── FIELD LABEL / VALUE ── */
    .f-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #86868b;
      margin-bottom: 3px;
    }
    .f-value {
      font-size: 12px;
      font-weight: 500;
      color: #1d1d1f;
      line-height: 1.4;
    }
    .f-value-mono {
      font-family: 'Inter', ui-monospace, Menlo, Monaco, monospace;
      font-size: 11px;
      color: #333;
    }
    .f-value-accent {
      font-size: 12px;
      font-weight: 600;
      color: #0b57d0;
    }
    .f-chip {
      display: inline-block;
      background: #edf1fa;
      color: #0b57d0;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      margin-top: 2px;
    }
    .f-highlight-box {
      background: #f7f9fc;
      border: 1px dashed #c5d5f0;
      border-radius: 6px;
      padding: 8px 10px;
      margin-top: 6px;
    }

    /* ── ACCESSORY LIST ── */
    .acc-list { list-style: none; padding: 0; margin: 0; }
    .acc-list li {
      font-size: 11px;
      color: #444;
      padding: 2px 0 2px 12px;
      position: relative;
      line-height: 1.5;
    }
    .acc-list li::before {
      content: '·';
      position: absolute;
      left: 0;
      color: #0b57d0;
      font-weight: 700;
    }

    /* ── STATUS BADGE ── */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }
    .status-badge.ok { background: #e6f4ea; color: #137333; }
    .status-badge.warn { background: #fff3e0; color: #b45309; }
    .status-badge.info { background: #e8f0fe; color: #0b57d0; }

    /* ── FOOTER / SIGNATURES ── */
    .footer-section {
      margin-top: 20px;
      padding-top: 14px;
      border-top: 2px solid #e5e5ea;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      page-break-inside: avoid;
    }
    .sig-box {
      border: 1px dashed #c5d5f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .sig-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0b57d0;
      margin-bottom: 3px;
    }
    .sig-subtitle { font-size: 9px; color: #86868b; margin-bottom: 24px; }
    .sig-line { border-bottom: 1px solid #1d1d1f; margin-bottom: 5px; }
    .sig-name-label { font-size: 9px; color: #86868b; }

    @media print {
      @page { size: A4; margin: 0; }
      body { background: white; }
      .print-doc { width: 210mm; min-height: 297mm; padding: 10mm 12mm; }
    }
  </style>
`;

/* ─────────────────────────────────────────────
   IMPORTER FORM  (ใบส่งเคลมสินค้า → Distributor)
───────────────────────────────────────────── */
export const getImporterFormHTML = async (rmas: RMA[]): Promise<string> => {
  if (!rmas || rmas.length === 0) return '';
  const rma = rmas[0];
  const settings = await MockDb.getSettings();
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  const itemsHTML = rmas.map((item, index) => {
    const accList = item.distributorSentItems && item.distributorSentItems.length > 0
      ? item.distributorSentItems
      : item.accessories;

    return `
    <div class="item-card">
      <div class="item-card-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="item-no">${index + 1}</div>
          <div>
            <div class="item-brand">${item.brand} &nbsp;<span style="font-weight:400; font-size:12px; color:#555;">${item.productModel}</span></div>
            <div style="font-size: 10px; color: #666; margin-top: 1px;">${item.productType}</div>
          </div>
        </div>
        <div class="item-sn">S/N: ${item.serialNumber}</div>
      </div>
      <div class="item-body">
        <div>
          <div class="f-label">Root Cause / Issue Found (สาเหตุ/อาการที่พบ)</div>
          <div class="f-value">${item.resolution?.rootCause || '—'}</div>
          ${item.deviceUsername || item.devicePassword ? `
          <div class="f-highlight-box" style="margin-top: 8px;">
            <div class="f-label" style="color: #c2410c; margin-bottom: 6px;">⚠ Device Credentials</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <div class="f-label">Username</div>
                <div class="f-value-mono">${item.deviceUsername || '—'}</div>
              </div>
              <div>
                <div class="f-label">Password</div>
                <div class="f-value-mono">${item.devicePassword || '—'}</div>
              </div>
            </div>
          </div>` : ''}
        </div>
        <div>
          <div class="f-label">Included Accessories (อุปกรณ์ที่ส่งไปด้วย)</div>
          ${accList.length > 0
        ? `<ul class="acc-list">${accList.map(a => `<li>${formatAccessory(a)}</li>`).join('')}</ul>`
        : `<div class="f-value" style="color:#86868b;">Unit Only</div>`}
        </div>
      </div>
      ${getImagesHTML(item)}
    </div>
    `;
  }).join('');

  return `
    ${getCommonStyles()}
    <div class="print-doc">

      <!-- HEADER BAR -->
      <div class="doc-header-bar">
        <div class="doc-header-left">
          <img src="${settings.logoUrl || '/logo.png'}" class="doc-header-logo" alt="logo" />
          <div>
            <div class="doc-header-title">ใบส่งเคลมสินค้า</div>
            <div class="doc-header-subtitle">Distributor RMA Request Form · ${settings.nameEn}</div>
          </div>
        </div>
        <div class="doc-header-right">
          <div class="doc-ref-label">Reference No.</div>
          <div class="doc-ref-no">${rma.id}</div>
          <div class="doc-ref-date">${today}</div>
        </div>
      </div>

      <!-- COMPANY BANNER -->
      <div class="company-banner">
        <div>
          <div class="co-name">${settings.nameEn}</div>
          <div>${settings.nameTh}</div>
        </div>
        <div style="text-align: right; font-size: 10px; color: #555;">
          <div>${settings.address}</div>
          <div>TAX ID: ${settings.taxId} &nbsp;|&nbsp; Tel: ${settings.tel}</div>
        </div>
      </div>

      <!-- PARTIES -->
      <div class="parties-grid">
        <div class="party-box">
          <div class="party-box-label">To: Distributor (เรียน ผู้นำเข้า)</div>
          <div class="party-name">${rma.distributor}</div>
          <div class="party-detail">RMA / Service Department</div>
        </div>
        <div class="party-box">
          <div class="party-box-label">From: Our Company (จาก)</div>
          <div class="party-name">${settings.nameEn}</div>
          <div class="party-detail">Attn: Technical Support Dept.</div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e5e5ea;">
            <div class="f-label">End User Reference (ลูกค้าผู้ใช้งาน)</div>
            <div class="f-value">${rma.customerName}</div>
          </div>
        </div>
      </div>

      <!-- ITEMS -->
      <div class="section-title">
        Product Information <span class="count-badge">${rmas.length} Items</span>
      </div>
      ${itemsHTML}

      <!-- SIGNATURES -->
      <div class="footer-section">
        <div class="sig-box">
          <div class="sig-title">ผู้ส่ง / Sent By</div>
          <div class="sig-subtitle">${settings.nameEn} · Technical Support</div>
          <div class="sig-line"></div>
          <div style="display: flex; justify-content: space-between;">
            <div class="sig-name-label">ลงชื่อ / Signature: ____________________</div>
            <div class="sig-name-label">วันที่: ____________</div>
          </div>
        </div>
        <div class="sig-box">
          <div class="sig-title">ผู้รับ / Received By (${rma.distributor})</div>
          <div class="sig-subtitle">RMA No. ที่ผู้นำเข้าออกให้</div>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 12px; align-items: center;">
            <div>
              <div class="f-label">RMA No. (Vendor Ref)</div>
              <div style="border-bottom: 1px solid #1d1d1f; height: 22px;"></div>
            </div>
            <div>
              <div class="f-label">วันที่รับ</div>
              <div style="border-bottom: 1px solid #1d1d1f; height: 22px; width: 80px;"></div>
            </div>
          </div>
          <div class="sig-line"></div>
          <div class="sig-name-label">ลงชื่อ / Signature: ____________________</div>
        </div>
      </div>

    </div>
  `;
};

/* ─────────────────────────────────────────────
   CUSTOMER FORM (ใบรับคืนสินค้า → Customer)
───────────────────────────────────────────── */
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

  const itemsHTML = rmas.map((item, index) => {
    const warrantyText = item.repairCosts?.warrantyStatus
      ? (translations.th.warranty as any)[item.repairCosts.warrantyStatus]
      : '—';
    const actionText = item.resolution?.actionTaken
      ? formatAction(item.resolution.actionTaken)
      : (item.status === 'REPAIRED' ? 'Completed / Replaced' : 'Checked');

    return `
    <div class="item-card">
      <div class="item-card-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="item-no">${index + 1}</div>
          <div>
            <div class="item-brand">${item.brand} &nbsp;<span style="font-weight:400; font-size:12px; color:#555;">${item.productModel}</span></div>
            <div style="font-size: 10px; color: #666; margin-top: 1px;">${item.productType}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="item-sn">S/N: ${item.serialNumber}</div>
          ${item.resolution?.replacedSerialNumber
        ? `<div style="font-family: 'Inter', monospace; font-size: 10px; color: #137333; font-weight: 600; margin-top: 3px;">New S/N: ${item.resolution.replacedSerialNumber}</div>`
        : ''}
        </div>
      </div>
      <div class="item-body">

        <!-- LEFT COLUMN -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <div class="f-label">Warranty Status (การรับประกัน)</div>
            <div class="f-chip">${warrantyText}</div>
          </div>
          <div>
            <div class="f-label">Action Taken (วิธีการดำเนินการ)</div>
            <div class="f-value-accent">${actionText}</div>
          </div>
          <div>
            <div class="f-label">Root Cause / Issue Found (สาเหตุ/อาการที่พบ)</div>
            <div class="f-value">${item.resolution?.rootCause || '—'}</div>
          </div>
          ${item.resolution?.technicalNotes ? `
          <div class="f-highlight-box">
            <div class="f-label" style="margin-bottom: 4px;">Technical Note (หมายเหตุช่าง)</div>
            <div class="f-value" style="font-size: 11px; color: #444;">${item.resolution.technicalNotes}</div>
          </div>` : ''}
          ${item.deviceUsername || item.devicePassword ? `
          <div class="f-highlight-box" style="border-color: #f5a623;">
            <div class="f-label" style="color: #c2410c; margin-bottom: 5px;">⚠ Device Credentials</div>
            <div style="display: flex; gap: 20px;">
              <div>
                <div class="f-label">Username</div>
                <div class="f-value-mono">${item.deviceUsername || '—'}</div>
              </div>
              <div>
                <div class="f-label">Password</div>
                <div class="f-value-mono">${item.devicePassword || '—'}</div>
              </div>
            </div>
          </div>` : ''}
        </div>

        <!-- RIGHT COLUMN -->
        <div>
          <div class="f-label">Items Returned (อุปกรณ์ที่ส่งคืนลูกค้า)</div>
          <ul class="acc-list" style="margin-top: 4px;">
            <li style="font-weight: 600; color: #1d1d1f;">Main Unit — ${item.productModel}</li>
            ${item.accessories.map(acc => `<li>${formatAccessory(acc)}</li>`).join('')}
          </ul>
        </div>
      </div>
      ${getImagesHTML(item)}
    </div>
    `;
  }).join('');

  return `
    ${getCommonStyles()}
    <div class="print-doc">

      <!-- HEADER BAR -->
      <div class="doc-header-bar">
        <div class="doc-header-left">
          <img src="${settings.logoUrl || '/logo.png'}" class="doc-header-logo" alt="logo" />
          <div>
            <div class="doc-header-title">ใบรับคืนสินค้าเคลม / บริการ</div>
            <div class="doc-header-subtitle">Customer Service Return Note · ${settings.nameEn}</div>
          </div>
        </div>
        <div class="doc-header-right">
          <div class="doc-ref-label">Service Ref No.</div>
          <div class="doc-ref-no">${rma.id}</div>
          <div class="doc-ref-date">${today}</div>
        </div>
      </div>

      <!-- COMPANY BANNER -->
      <div class="company-banner">
        <div>
          <div class="co-name">${settings.nameEn}</div>
          <div>${settings.nameTh} &nbsp;|&nbsp; ${settings.address}</div>
        </div>
        <div style="text-align: right; font-size: 10px; color: #555;">
          Tel: ${settings.tel} &nbsp;|&nbsp; TAX ID: ${settings.taxId}
        </div>
      </div>

      <!-- PARTIES -->
      <div class="parties-grid">
        <div class="party-box">
          <div class="party-box-label">Customer (ลูกค้า)</div>
          <div class="party-name">${rma.customerName}</div>
          <div class="party-detail">
            ${rma.customerPhone ? `Tel: ${rma.customerPhone}<br/>` : ''}
            ${rma.customerEmail ? `Email: ${rma.customerEmail}<br/>` : ''}
            ${rma.customerLineId ? `Line ID: ${rma.customerLineId}` : ''}
          </div>
        </div>
        <div class="party-box" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="party-box-label">Service Status (สถานะงาน)</div>
            <div style="margin-top: 6px;">
              <span class="status-badge ${statusText.cls}">${statusText.label} ${statusText.en ? '(' + statusText.en + ')' : ''}</span>
            </div>
          </div>
          <div style="margin-top: 10px;">
            <div class="f-label">Total Items (จำนวนรายการ)</div>
            <div class="f-value" style="font-size: 16px; font-weight: 700;">${rmas.length} ชิ้น</div>
          </div>
        </div>
      </div>

      <!-- ITEMS -->
      <div class="section-title">
        Service Item Details <span class="count-badge">${rmas.length} Items</span>
      </div>
      ${itemsHTML}

      <!-- SIGNATURES -->
      <div class="footer-section">
        <div class="sig-box">
          <div class="sig-title">ผู้ส่งคืน / Delivered By</div>
          <div class="sig-subtitle">${settings.nameEn} · Technical Support Team</div>
          <div class="sig-line" style="margin-bottom: 5px;"></div>
          <div style="display: flex; justify-content: space-between;">
            <div class="sig-name-label">ลงชื่อ / Signature: ____________________</div>
            <div class="sig-name-label">วันที่: ____________</div>
          </div>
        </div>
        <div class="sig-box">
          <div class="sig-title">ผู้รับสินค้า / Received By (ลูกค้า)</div>
          <div class="sig-subtitle">ข้าพเจ้าได้รับสินค้าคืนในสภาพเรียบร้อยครบถ้วน</div>
          <div class="sig-line" style="margin-bottom: 5px;"></div>
          <div style="display: flex; justify-content: space-between;">
            <div class="sig-name-label">ลงชื่อ / Signature: ____________________</div>
            <div class="sig-name-label">วันที่: ____________</div>
          </div>
        </div>
      </div>

    </div>
  `;
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
