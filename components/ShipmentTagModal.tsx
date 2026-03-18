import React, { useState, useEffect } from 'react';
import { X, Package, Trash2, Expand, RefreshCw, Copy, Mail, Plus, Save, Truck } from 'lucide-react';
import { RMA } from '../types';
import { ShippingLabelPayload, getCustomerShippingLabelHTML } from '../services/printService';
import { useLanguage } from '../contexts/LanguageContext';

interface ShipmentTagModalProps {
    isOpen: boolean;
    onClose: () => void;
    rma: RMA;
    allRmas?: RMA[];
    onSave: (customerData: any) => Promise<void>;
    targetType: 'CUSTOMER' | 'DISTRIBUTOR';
}

export const ShipmentTagModal: React.FC<ShipmentTagModalProps> = ({
    isOpen,
    onClose,
    rma,
    allRmas,
    onSave,
    targetType
}) => {
    const { t } = useLanguage();

    // Receiver Info State
    const [receiverName, setReceiverName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [receiverAddress, setReceiverAddress] = useState('');

    // Tracking IDs State
    const [trackingIds, setTrackingIds] = useState<string[]>(['']); // Start with 1 empty box

    const [isSaving, setIsSaving] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (targetType === 'DISTRIBUTOR') {
                setReceiverName(rma.distributor || '');
                setContactPerson((rma as any).distributorContactPerson || '');
                setReceiverPhone((rma as any).distributorPhone || '');
                setReceiverAddress((rma as any).distributorAddress || '');
            } else {
                setReceiverName(rma.customerName || '');
                setContactPerson(rma.contactPerson || '');
                setReceiverPhone(rma.customerPhone || '');
                setReceiverAddress(rma.customerReturnAddress || '');
            }
            const sourceTrackingIds = targetType === 'DISTRIBUTOR' 
                ? rma.trackingIds 
                : rma.customerTrackingIds;
            setTrackingIds(sourceTrackingIds && sourceTrackingIds.length > 0 ? sourceTrackingIds : ['']);
        }
    }, [isOpen, rma, targetType]);

    if (!isOpen) return null;

    const displayId = rma.quotationNumber || rma.id;

    const handleAddTrackingId = () => {
        setTrackingIds([...trackingIds, '']);
    };

    const handleRemoveTrackingId = (index: number) => {
        const newIds = [...trackingIds];
        newIds.splice(index, 1);
        if (newIds.length === 0) {
            newIds.push(''); // Always keep at least 1 input
        }
        setTrackingIds(newIds);
    };

    const handleTrackingIdChange = (index: number, value: string) => {
        const newIds = [...trackingIds];
        newIds[index] = value;
        setTrackingIds(newIds);
    };

    const buildSavePayload = () => {
        const cleanTrackingIds = trackingIds.map(t => t.trim()).filter(Boolean);
        if (targetType === 'DISTRIBUTOR') {
            return {
                distributorContactPerson: contactPerson,
                distributorPhone: receiverPhone,
                distributorAddress: receiverAddress,
                trackingIds: cleanTrackingIds
            };
        } else {
            return {
                customerName: receiverName,
                contactPerson: contactPerson,
                customerPhone: receiverPhone,
                customerReturnAddress: receiverAddress,
                customerTrackingIds: cleanTrackingIds
            };
        }
    };

    const handleSaveAndPrint = async () => {
        try {
            setIsSaving(true);

            // 1. Save updated info to DB
            await onSave(buildSavePayload());

            // 2. Prepare payloads for print service
            const payloads: ShippingLabelPayload[] = trackingIds.map((tid, index) => ({
                rma,
                receiverName,
                contactPerson,
                receiverPhone,
                receiverAddress,
                trackingId: tid,
                currentBox: index + 1,
                totalBoxes: trackingIds.length
            }));

            // 3. Get HTML and show preview
            const html = await getCustomerShippingLabelHTML(payloads);
            setPreviewHtml(html);

        } catch (error) {
            console.error("Failed to save or generate preview", error);
            alert("เกิดข้อผิดพลาดในการบันทึกหรือสร้าง Preview");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintFromPreview = () => {
        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
            iframe.contentWindow.print();
        }
    };

    const handleSaveClick = async () => {
        try {
            setIsSaving(true);
            await onSave(buildSavePayload());
            alert("บันทึกข้อมูลสำเร็จ");
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyData = () => {
        const jobId = rma.groupRequestId || rma.id;
        const refNo = rma.quotationNumber || '-';
        const cleanTrackingIds = trackingIds.map(t => t.trim()).filter(Boolean);
        const items = allRmas && allRmas.length > 0 ? allRmas : [rma];

        let text = `เลขที่งานเคลม (Job ID): ${jobId}\n`;
        text += `เลขอ้างอิง/ใบเสนอราคา: ${refNo}\n\n`;

        // รายการสินค้า
        text += `รายการสินค้า (${items.length} ชิ้น):\n`;
        items.forEach((item, i) => {
            text += `${i + 1}. ${item.brand} ${item.productModel} | S/N: ${item.serialNumber || '-'}\n`;
            text += `   อาการที่ลูกค้าแจ้ง: ${item.issueDescription || '-'}\n`;
            text += `   อาการที่พบ: ${item.resolution?.rootCause || '-'}\n`;
        });

        text += `\nนำส่ง...${receiverName}\n`;
        if (contactPerson) text += `ผู้ติดต่อ: ${contactPerson}\n`;
        if (receiverAddress) text += `${receiverAddress}\n`;
        if (receiverPhone) text += `โทร. ${receiverPhone}\n`;
        text += `\nพัสดุจะปรากฏในระบบภายใน 1-3 วันทำการ\nหากยังไม่ปรากฏ กรุณาตรวจสอบอีกครั้งในวันถัดไป\n`;

        if (cleanTrackingIds.length > 0) {
            text += `\n`;
            cleanTrackingIds.forEach(tid => {
                text += `หมายเลขพัสดุ: ${tid}\n`;
                text += `https://track.thailandpost.co.th/?trackNumber=${tid}\n`;
            });
        }

        navigator.clipboard.writeText(text.trim()).then(() => {
            alert('คัดลอกข้อมูลเรียบร้อยแล้ว');
        }).catch(() => {
            alert('ไม่สามารถคัดลอกได้');
        });
    };

    return (<>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-[#333]">

                {/* Sticky Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 px-6 border-b border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#2c2c2e]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">
                                {targetType === 'CUSTOMER' ? 'สร้างใบปะหน้า - ส่งคืนลูกค้า' : 'สร้างใบปะหน้า - ส่งเคลมศูนย์'}
                            </h2>
                            <p className="text-sm text-gray-500 font-mono">ID: {displayId}</p>
                        </div>
                    </div>        <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-8">

                    {/* Order Info (Read-only) */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#0071e3] mb-4">ข้อมูลงานเคลม</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">รหัสงานเคลม (Job ID):</span>
                                <div className="font-medium mt-1 text-[#1d1d1f] dark:text-white">{rma.groupRequestId || rma.id}</div>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">เลขอ้างอิง/ใบเสนอราคา:</span>
                                <div className="font-medium mt-1 text-[#1d1d1f] dark:text-white">{rma.quotationNumber || '-'}</div>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">ชื่อลูกค้า:</span>
                                <div className="font-medium mt-1 text-[#1d1d1f] dark:text-white">{rma.customerName || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Receiver Info (Editable) */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white mb-4">ข้อมูลผู้รับสินค้า</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">
                                    {targetType === 'DISTRIBUTOR' ? 'ชื่อผู้นำเข้า / ชื่อบริษัท' : 'ชื่อผู้รับ / ชื่อบริษัท'}
                                </label>
                                <input
                                    type="text"
                                    value={receiverName}
                                    onChange={e => setReceiverName(e.target.value)}
                                    className="w-full rounded-xl px-4 py-2.5 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#424245] outline-none font-medium"
                                    placeholder={targetType === 'DISTRIBUTOR' ? 'เช่น Synnex, SIS...' : 'ชื่อลูกค้า'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">ผู้ติดต่อ</label>
                                <input
                                    type="text"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#0071e3] outline-none text-[#1d1d1f] dark:text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">เบอร์โทรติดต่อ</label>
                                <input
                                    type="text"
                                    value={receiverPhone}
                                    onChange={(e) => setReceiverPhone(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#0071e3] outline-none text-[#1d1d1f] dark:text-white text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">ที่อยู่จัดส่ง</label>
                            <textarea
                                value={receiverAddress}
                                onChange={(e) => setReceiverAddress(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#0071e3] outline-none text-[#1d1d1f] dark:text-white text-sm resize-none"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-white/10 w-full my-6"></div>

                    {/* Tracking IDs Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white mb-4">รายการ EMS / Tracking No. ({trackingIds.length} กล่อง)</h3>
                        <div className="space-y-3">
                            {trackingIds.map((tid, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="text-gray-400 text-sm font-mono w-6">#{index + 1}</div>
                                    <input
                                        type="text"
                                        value={tid}
                                        onChange={(e) => handleTrackingIdChange(index, e.target.value)}
                                        placeholder="กรอก EMS / Tracking No. (เว้นว่างไว้ได้)"
                                        className="flex-1 px-4 py-2 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#0071e3] outline-none text-[#1d1d1f] dark:text-white text-sm"
                                    />
                                    {/* Action buttons mirroring UI */}
                                    <div className="flex gap-1">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg"><Expand className="w-4 h-4" /></button>
                                        <button
                                            onClick={() => handleRemoveTrackingId(index)}
                                            className="p-2 text-red-400 hover:text-red-600 border border-red-100 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleAddTrackingId}
                            className="mt-4 w-full py-3 border border-dashed border-gray-300 dark:border-[#444] rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#0071e3] dark:hover:text-[#2997ff] hover:border-[#0071e3] dark:hover:border-[#2997ff] transition-all flex justify-center items-center gap-2 font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" /> เพิ่ม EMS / Tracking No. (กล่องที่ {trackingIds.length + 1})
                        </button>
                    </div>

                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1c1c1e] flex flex-wrap gap-2 justify-between items-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium shadow-sm transition-colors"
                    >
                        ปิด
                    </button>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleSaveClick}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium shadow-md shadow-orange-500/20 transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> บันทึกข้อมูล
                        </button>

                        <button
                            onClick={handleSaveAndPrint}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                        >
                            <Expand className="w-4 h-4" /> Preview ใบติดหน้ากล่อง
                        </button>

                        <button
                            onClick={handleCopyData}
                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4" /> คัดลอกข้อมูล
                        </button>
                    </div>
                </div>
            </div>
        </div>
        {/* Preview Overlay */}
        {previewHtml && (
            <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
                {/* Toolbar */}
                <div className="flex-shrink-0 flex items-center gap-3 px-6 py-2.5 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
                    <h2 className="text-gray-800 font-semibold text-base flex-1">📋 Preview ใบปะหน้ากล่อง</h2>
                    <button
                        onClick={handleCopyData}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                    >
                        <Copy className="w-4 h-4" /> คัดลอกข้อมูล
                    </button>
                    <button
                        onClick={handlePrintFromPreview}
                        className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                    >
                        🖨️ พิมพ์เอกสาร
                    </button>
                    <button
                        onClick={() => setPreviewHtml(null)}
                        className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                    >
                        <X className="w-4 h-4" /> ปิด
                    </button>
                </div>
                {/* Preview Content - A4 size */}
                <div className="flex-1 overflow-auto flex justify-center py-4 px-4">
                    <iframe
                        id="preview-iframe"
                        srcDoc={`<html><head><title>Preview</title></head><body style="margin:0;padding:0;background:#fff;">${previewHtml}</body></html>`}
                        className="border-0 shadow-2xl bg-white"
                        style={{ width: '794px', height: '1123px', minWidth: '794px' }}
                    />
                </div>
            </div>
        )}
    </>);
};
