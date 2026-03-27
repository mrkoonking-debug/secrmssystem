
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MockDb } from '../services/mockDb';
import { RMA, RMAStatus } from '../types';
import { ArrowLeft, Package, User, Clock, Edit2, AlertCircle, CheckCircle2, History, Trash2, Truck, ShieldCheck, FileText, Edit3, Save, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';

import { printDistributorDocuments, printCustomerDocuments, getDistributorDocumentsHTML, getCustomerDocumentsHTML } from '../services/printService';
import { Printer, Copy, X as XIcon } from 'lucide-react';
import { ShipmentTagModal } from '../components/ShipmentTagModal';
import html2canvas from 'html2canvas';
import { renderHtmlToBlob } from '../services/renderToImage';
import { showToast } from '../services/toast';

export const JobDetail: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const [rmas, setRMAs] = useState<RMA[]>([]);
    const [jobInfo, setJobInfo] = useState<{ id: string, quotationNumber?: string, customerName: string, count: number, date: string, status: string, type: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRMAs, setExpandedRMAs] = useState<Set<string>>(new Set());

    // Shipment Tag Modal state
    const [isShipmentTagModalOpen, setIsShipmentTagModalOpen] = useState(false);
    const [shipmentTagTarget, setShipmentTagTarget] = useState<'CUSTOMER' | 'DISTRIBUTOR'>('CUSTOMER');

    // Document Preview Popup state
    const [docPreviewHtml, setDocPreviewHtml] = useState<string | null>(null);
    const [docPreviewType, setDocPreviewType] = useState<'DISTRIBUTOR' | 'CUSTOMER'>('DISTRIBUTOR');
    const [docPreviewRmas, setDocPreviewRmas] = useState<RMA[]>([]);
    const docPreviewRenderRef = useRef<HTMLDivElement>(null);
    const [isCopyingImage, setIsCopyingImage] = useState(false);

    // Customer edit state
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);
    const [customerForm, setCustomerForm] = useState({
        quotationNumber: '',
        customerName: '',
        contactPerson: '',
        customerPhone: '',
        customerLineId: '',
        customerEmail: '',
        customerReturnAddress: ''
    });

    const [searchParams, setSearchParams] = useSearchParams();

    const { t } = useLanguage();
    const navigate = useNavigate();

    // ... (rest of useEffects)



    const refreshRMAs = async () => {
        const allRMAs = await MockDb.getRMAs();
        const decodedId = decodeURIComponent(jobId || '');
        const jobRMAs = allRMAs.filter(c =>
            c.quotationNumber === decodedId ||
            c.groupRequestId === decodedId ||
            (c.quotationNumber === '' && c.groupRequestId === '' && c.id === decodedId)
        );
        setRMAs(jobRMAs);
    };

    useEffect(() => {
        const fetchJobData = async () => {
            if (!jobId) return;
            setLoading(true);
            try {
                const allRMAs = await MockDb.getRMAs();
                const decodedId = decodeURIComponent(jobId);

                // Enhanced lookup logic
                const jobRMAs = allRMAs.filter(c =>
                    c.quotationNumber === decodedId ||
                    c.groupRequestId === decodedId ||
                    (c.id === decodedId)
                );

                if (jobRMAs.length > 0) {
                    setRMAs(jobRMAs);
                    jobRMAs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

                    const first = jobRMAs[0];
                    setJobInfo({
                        id: first.groupRequestId || first.quotationNumber || decodedId,
                        quotationNumber: first.quotationNumber,
                        customerName: first.customerName,
                        count: jobRMAs.length,
                        date: first.createdAt,
                        status: jobRMAs.every(r => r.status === RMAStatus.CLOSED) ? 'Completed' : 'In Progress',
                        type: first.quotationNumber ? 'QUOTATION' : first.groupRequestId ? 'GROUP' : 'SINGLE'
                    });

                    // Initialize customer form
                    setCustomerForm({
                        quotationNumber: first.quotationNumber || '',
                        customerName: first.customerName || '',
                        contactPerson: first.contactPerson || '',
                        customerPhone: first.customerPhone || '',
                        customerLineId: first.customerLineId || '',
                        customerEmail: first.customerEmail || '',
                        customerReturnAddress: first.customerReturnAddress || ''
                    });

                    const editRmaId = searchParams.get('editRmaId');
                    if (editRmaId) {
                        navigate(`/admin/rma/${editRmaId}/edit`, { replace: true });
                    }
                } else {
                    navigate('/admin/rmas');
                }
            } catch (error) {
                console.error("Failed to fetch job", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobData();
    }, [jobId, searchParams]);

    const toggleHistory = (id: string) => {
        const newSet = new Set(expandedRMAs);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedRMAs(newSet);
    };

    const handleEditClick = (rma: RMA) => {
        navigate(`/admin/rma/${rma.id}/edit`);
    };

    const handleSaveCustomer = async () => {
        setIsSavingCustomer(true);
        try {
            const updates: Partial<RMA> = {
                quotationNumber: customerForm.quotationNumber,
                customerName: customerForm.customerName,
                contactPerson: customerForm.contactPerson,
                customerPhone: customerForm.customerPhone,
                customerLineId: customerForm.customerLineId,
                customerEmail: customerForm.customerEmail,
                customerReturnAddress: customerForm.customerReturnAddress
            };
            // Update all RMAs in this job
            for (const rma of rmas) {
                await MockDb.updateRMA(rma.id, updates);
            }
            // Update local state
            setJobInfo(prev => prev ? { ...prev, customerName: customerForm.customerName, quotationNumber: customerForm.quotationNumber } : null);
            await refreshRMAs();
            setIsEditingCustomer(false);
        } catch (error) {
            console.error('Failed to update customer info', error);
        } finally {
            setIsSavingCustomer(false);
        }
    };

    const handleSaveShipmentTagData = async (customerData: any) => {
        if (!jobInfo || rmas.length === 0) return;
        try {
            // Update all RMAs in this job
            for (const rma of rmas) {
                await MockDb.updateRMA(rma.id, customerData);
            }
            await refreshRMAs();
        } catch (error) {
            console.error("Failed to save shipment tag data", error);
            alert("Failed to save data");
        }
    };

    const handleCancelCustomerEdit = () => {
        // Reset form to current data
        if (rmas.length > 0) {
            const first = rmas[0];
            setCustomerForm({
                quotationNumber: first.quotationNumber || '',
                customerName: first.customerName || '',
                contactPerson: first.contactPerson || '',
                customerPhone: first.customerPhone || '',
                customerLineId: first.customerLineId || '',
                customerEmail: first.customerEmail || '',
                customerReturnAddress: first.customerReturnAddress || ''
            });
        }
        setIsEditingCustomer(false);
    };



    if (loading) return <div className="p-12 text-center">Loading Job...</div>;
    if (!jobInfo) return null;

    const closedRMAs = rmas.filter(rma => rma.status === RMAStatus.CLOSED);
    const hasClosedRMAs = closedRMAs.length > 0;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <Link to="/admin/rmas" className="flex items-center text-sm font-medium text-gray-500 hover:text-[#0071e3] transition-colors"><ArrowLeft className="h-4 w-4 mr-1" /> {t('track.backToList')}</Link>
            </div>

            {/* Unified Job Header & Customer Info Card */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-6 sm:p-8 mb-8 border border-gray-100 dark:border-[#333] shadow-sm">

                {/* --- TOP HEADER SECTION --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-2xl shadow-inner"><Package /></div>
                        <div>
                            <div className="flex items-center flex-wrap gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-[#1d1d1f] dark:text-white leading-none">
                                    {jobInfo.id}
                                </h1>
                                <span className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1 font-medium ${jobInfo.quotationNumber ? 'bg-gray-50 dark:bg-[#2c2c2e] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#424245]' : 'bg-gray-50/50 dark:bg-[#2c2c2e]/50 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-[#424245]/50 italic'}`}>
                                    <span className="uppercase text-[10px] font-bold opacity-60">Ref:</span>
                                    {jobInfo.quotationNumber || 'ไม่มี Ref'}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(jobInfo.date).toLocaleDateString()}</span>
                                <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs text-[#1d1d1f] dark:text-gray-300 font-medium">{jobInfo.count} {t('claimsList.items')}</span>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium border border-green-100 dark:border-green-900/30">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {rmas.filter(c => c.status === RMAStatus.CLOSED || c.status === RMAStatus.REPAIRED).length} {t('track.doneBadge')}
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border border-blue-100 dark:border-blue-900/30">
                                        <Clock className="w-3 h-3" />
                                        {rmas.filter(c => c.status !== RMAStatus.CLOSED && c.status !== RMAStatus.REPAIRED).length} {t('track.activeBadge')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRINT ACTION GROUPS */}
                    <div className="flex flex-col xl:flex-row flex-wrap gap-3 w-full xl:w-auto xl:justify-end">
                        {/* Distributor Group */}
                        <div className="flex flex-col sm:flex-row items-stretch border border-gray-200 dark:border-[#424245] rounded-xl overflow-hidden shrink-0 w-full sm:w-auto">
                            <div className="flex items-center justify-center px-4 py-2 sm:py-0 bg-gray-50/80 dark:bg-black/20 sm:border-r border-b sm:border-b-0 border-gray-200 dark:border-[#424245] text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                โซนผู้นำเข้า
                            </div>
                            <div className="flex flex-1 items-center bg-transparent">
                                <button
                                    onClick={async () => {
                                        const html = await getDistributorDocumentsHTML(rmas);
                                        if (html) {
                                            setDocPreviewHtml(html);
                                            setDocPreviewType('DISTRIBUTOR');
                                            setDocPreviewRmas(rmas);
                                        }
                                    }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-[#1d1d1f] dark:text-gray-200 font-medium transition-colors text-sm border-r border-gray-200 dark:border-[#424245] whitespace-nowrap"
                                    title="พิมพ์ใบส่งเคลม"
                                >
                                    <Printer className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
                                    ใบส่งเคลม
                                </button>
                                <button
                                    onClick={() => { setShipmentTagTarget('DISTRIBUTOR'); setIsShipmentTagModalOpen(true); }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-[#1d1d1f] dark:text-gray-200 font-medium transition-colors text-sm whitespace-nowrap"
                                    title="ปะหน้ากล่อง (ผู้นำเข้า)"
                                >
                                    <Truck className="w-4 h-4 text-orange-500" strokeWidth={2.5} />
                                    ใบปะหน้า
                                </button>
                            </div>
                        </div>

                        {/* Customer Group - Same Neutral Style */}
                        <div className="flex flex-col shrink-0 w-full sm:w-auto">
                            <div className="flex flex-col sm:flex-row items-stretch border border-gray-200 dark:border-[#424245] rounded-xl overflow-hidden">
                                <div className="flex items-center justify-center px-4 py-2 sm:py-0 bg-gray-50/80 dark:bg-black/20 sm:border-r border-b sm:border-b-0 border-gray-200 dark:border-[#424245] text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    โซนลูกค้า
                                </div>
                                <div className="flex flex-1 items-center bg-transparent">
                                    <button
                                        onClick={async () => {
                                            const html = await getCustomerDocumentsHTML(closedRMAs);
                                            if (html) {
                                                setDocPreviewHtml(html);
                                                setDocPreviewType('CUSTOMER');
                                                setDocPreviewRmas(closedRMAs);
                                            }
                                        }}
                                        disabled={!hasClosedRMAs}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm border-r border-gray-200 dark:border-[#424245] transition-colors whitespace-nowrap ${!hasClosedRMAs ? 'bg-gray-50 dark:bg-black/20 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-60' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-[#1d1d1f] dark:text-gray-200 font-medium'}`}
                                        title={!hasClosedRMAs ? "ต้องปิดงานก่อนถึงจะใช้งานได้" : "พิมพ์ใบส่งคืนลูกค้า (เฉพาะงานที่ปิดแล้ว)"}
                                    >
                                        <User className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
                                        ใบส่งคืน
                                    </button>
                                    <button
                                        onClick={() => { setShipmentTagTarget('CUSTOMER'); setIsShipmentTagModalOpen(true); }}
                                        disabled={!hasClosedRMAs}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm transition-colors whitespace-nowrap ${!hasClosedRMAs ? 'bg-gray-50 dark:bg-black/20 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-60' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-[#1d1d1f] dark:text-gray-200 font-medium'}`}
                                        title={!hasClosedRMAs ? "ต้องปิดงานก่อนถึงจะใช้งานได้" : "ปะหน้ากล่อง (ลูกค้า)"}
                                    >
                                        <Truck className="w-4 h-4 text-orange-500" strokeWidth={2.5} />
                                        ใบปะหน้า
                                    </button>
                                </div>
                            </div>
                            {!hasClosedRMAs && (
                                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                    <span>ยังไม่มีงานที่ปิดแล้ว ({closedRMAs.length}/{rmas.length} ปิดแล้ว) — กดตรวจสอบและปิดงานในหน้าแก้ไขก่อน</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SEC DIVIDER */}
                <div className="w-full h-px bg-gray-200 dark:bg-[#333] mb-6"></div>

                {/* --- CUSTOMER INFO SECTION --- */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-semibold text-base flex items-center gap-3 text-[#1d1d1f] dark:text-white">
                            <User className="w-5 h-5 text-gray-400" />
                            {t('submit.customerDetails')}
                        </h2>
                        {!isEditingCustomer ? (
                            <button onClick={() => setIsEditingCustomer(true)} className="text-xs text-blue-500 font-medium hover:text-blue-600 transition-colors flex items-center gap-1"><Edit3 className="w-3 h-3" /> {t('track.changeBtn')}</button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={handleCancelCustomerEdit} className="px-4 py-1.5 text-xs text-gray-500 hover:text-red-500 font-medium transition-colors">{t('track.cancelBtn')}</button>
                                <button onClick={handleSaveCustomer} disabled={isSavingCustomer} className="px-5 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-full shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50">
                                    {isSavingCustomer ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    {isSavingCustomer ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditingCustomer ? (
                        <div className="space-y-4 animate-fade-in bg-gray-50 dark:bg-black/20 p-5 rounded-2xl border border-gray-100 dark:border-[#333]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0071e3] uppercase mb-2 ml-1">เลขที่ใบเสนอราคา/บิล</label>
                                    <input type="text" value={customerForm.quotationNumber} onChange={e => setCustomerForm(p => ({ ...p, quotationNumber: e.target.value }))} className="w-full rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-blue-200 dark:border-blue-800/50 outline-none ring-1 ring-blue-100 dark:ring-blue-900/30" placeholder="SECXXXXXX" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">{t('publicSubmit.companyName')}</label>
                                    <input type="text" value={customerForm.customerName} onChange={e => setCustomerForm(p => ({ ...p, customerName: e.target.value }))} className="w-full rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="ชื่อลูกค้า / บริษัท" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">{t('publicSubmit.contactName')}</label>
                                    <input type="text" value={customerForm.contactPerson} onChange={e => setCustomerForm(p => ({ ...p, contactPerson: e.target.value }))} className="w-full rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="ชื่อผู้ติดต่อ" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">{t('publicSubmit.phone')}</label>
                                    <input type="text" value={customerForm.customerPhone} onChange={e => setCustomerForm(p => ({ ...p, customerPhone: e.target.value }))} className="w-full rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="เบอร์โทรศัพท์" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">{t('submit.lineId')}</label>
                                    <input type="text" value={customerForm.customerLineId} onChange={e => setCustomerForm(p => ({ ...p, customerLineId: e.target.value }))} className="w-full rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="LINE ID" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Email</label>
                                    <input type="text" value={customerForm.customerEmail} onChange={e => setCustomerForm(p => ({ ...p, customerEmail: e.target.value }))} className="w-full rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="อีเมล (ถ้ามี)" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">{t('submit.returnAddress')}</label>
                                <textarea value={customerForm.customerReturnAddress} onChange={e => setCustomerForm(p => ({ ...p, customerReturnAddress: e.target.value }))} rows={2} className="w-full rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="ที่อยู่สำหรับจัดส่งคืน" />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                            <div className="flex flex-col gap-1">
                                <span className="text-gray-400 font-semibold text-[11px] tracking-wider uppercase">{t('publicSubmit.companyName')}</span>
                                <span className="text-[#1d1d1f] dark:text-gray-200 font-medium">{customerForm.customerName || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-gray-400 font-semibold text-[11px] tracking-wider uppercase">{t('publicSubmit.contactName')}</span>
                                <span className="text-[#1d1d1f] dark:text-gray-200 font-medium">{customerForm.contactPerson || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-gray-400 font-semibold text-[11px] tracking-wider uppercase">{t('publicSubmit.phone')}</span>
                                <span className="text-[#1d1d1f] dark:text-gray-200 font-medium">{customerForm.customerPhone || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-gray-400 font-semibold text-[11px] tracking-wider uppercase">{t('submit.lineId')}</span>
                                <span className="text-[#1d1d1f] dark:text-gray-200 font-medium">{customerForm.customerLineId || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <span className="text-gray-400 font-semibold text-[11px] tracking-wider uppercase">Email</span>
                                <span className="text-[#1d1d1f] dark:text-gray-200 font-medium">{customerForm.customerEmail || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <span className="text-gray-400 font-semibold text-[11px] tracking-wider uppercase">{t('submit.returnAddress')}</span>
                                <div className="text-[#1d1d1f] dark:text-gray-200 font-medium leading-relaxed bg-gray-50 dark:bg-black/10 p-3 rounded-xl border border-gray-100 dark:border-white/5 whitespace-pre-line mt-1">
                                    {customerForm.customerReturnAddress || '-'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white ml-2 mb-4">{t('claimsList.items')}</h2>
                {rmas.map((item, index) => {
                    const isClosed = [RMAStatus.CLOSED, RMAStatus.REPAIRED, RMAStatus.REJECTED].includes(item.status);
                    const isExpanded = expandedRMAs.has(item.id);

                    // เรียงลำดับประวัติให้ล่าสุดอยู่บนสุด
                    const sortedHistory = item.history ? [...item.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

                    return (
                        <div key={item.id} className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6 transition-all hover:bg-gray-50 dark:hover:bg-[#2c2c2e] border border-gray-100 dark:border-[#333]">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex-shrink-0">{isClosed ? <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div> : <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold">{index + 1}</div>}</div>
                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div><div className="font-bold text-lg text-[#1d1d1f] dark:text-white">{item.productModel}</div><div className="text-sm text-gray-500">{item.brand}</div><div className="mt-1 inline-block text-xs font-mono bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">S/N: {item.serialNumber}</div></div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">{t('track.issueReported')}
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2"><AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /><span className="line-clamp-2">{item.issueDescription}</span></div>
                                        {item.resolution?.rootCause && (
                                            <div className="mt-2">
                                                <div className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">{t('track.rootCause')}</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" /><span className="line-clamp-2">{item.resolution.rootCause}</span></div>
                                            </div>
                                        )}
                                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                                            <Truck className="w-3 h-3" /> {t('submit.distributor')}:{' '}
                                            <span className="inline-flex items-center gap-1 ml-1">
                                                <span className="text-[#1d1d1f] dark:text-white font-medium">{item.distributor || '-'}</span>
                                            </span>
                                        </div>
                                        {/* Warranty Status */}
                                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> {t('track.warrantyStatus')}:{' '}
                                            <span className="inline-flex items-center gap-1 ml-1">
                                                <span className={`font-medium ${item.repairCosts?.warrantyStatus === 'IN_WARRANTY' ? 'text-green-500' :
                                                    item.repairCosts?.warrantyStatus === 'OUT_OF_WARRANTY' ? 'text-orange-500' :
                                                        item.repairCosts?.warrantyStatus === 'VOID' ? 'text-red-500' :
                                                            'text-[#1d1d1f] dark:text-white'
                                                    }`}>{item.repairCosts?.warrantyStatus ? t(`warranty.${item.repairCosts.warrantyStatus}`) : '-'}</span>
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400 flex items-start gap-1 w-full">
                                            <FileText className="w-3 h-3 mt-1 flex-shrink-0" />
                                            <span className="font-bold uppercase mt-1 w-24 flex-shrink-0 truncate" title={t('track.internalNote') || 'Notes'}>{t('track.internalNote') || 'Notes'}:</span>
                                            <div className="flex-grow py-1 text-sm text-[#1d1d1f] dark:text-white whitespace-pre-line" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                                {item.notes ? item.notes : <span className="text-gray-300 italic">ไม่มีบันทึก</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex flex-wrap items-center md:flex-col md:items-end gap-3 md:min-w-[140px]">
                                    <div className="group relative inline-block">
                                        <StatusBadge status={item.status} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleHistory(item.id)}
                                            className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-gray-200 dark:bg-white/20 text-gray-800 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500'}`}
                                            title="View Timeline"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                        {/* Delete Button */}
                                        <button
                                            onClick={async () => {
                                                if (!confirm('คุณต้องการลบรายการนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) return;
                                                try {
                                                    setLoading(true);
                                                    await MockDb.deleteRMA(item.id);
                                                    // Check remaining RMAs in this job
                                                    const allRMAs = await MockDb.getRMAs();
                                                    const decodedId = decodeURIComponent(jobId || '');
                                                    const remaining = allRMAs.filter(c =>
                                                        c.quotationNumber === decodedId ||
                                                        c.groupRequestId === decodedId ||
                                                        (c.id === decodedId)
                                                    );
                                                    if (remaining.length === 0) {
                                                        navigate('/admin/rmas');
                                                    } else {
                                                        setRMAs(remaining);
                                                        setLoading(false);
                                                    }
                                                } catch (err) {
                                                    console.error('Delete failed:', err);
                                                    alert('ลบไม่สำเร็จ: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                                    setLoading(false);
                                                }
                                            }}
                                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                            title="Delete RMA"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleEditClick(item)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-[#0071e3] transition-colors"
                                            title="Edit Details"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expandable History Timeline */}
                            {isExpanded && (
                                <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-white/10 animate-fade-in">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><Clock className="w-3 h-3" /> {t('track.activityLog')}</h3>
                                    <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-white/10 pl-2">
                                        {sortedHistory.length > 0 ? (
                                            sortedHistory.map((evt) => (
                                                <div key={evt.id} className="relative pl-8">
                                                    <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#1c1c1e] ${evt.type === 'STATUS_CHANGE' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{evt.description}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{new Date(evt.date).toLocaleString()} • {evt.user}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="pl-8 text-sm text-gray-400">{t('track.noHistory')}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Shipment Tag Modal - Appears when "Print Shipping Label" is clicked */}
            {rmas.length > 0 && (
                <ShipmentTagModal
                    isOpen={isShipmentTagModalOpen}
                    onClose={() => setIsShipmentTagModalOpen(false)}
                    rma={rmas[0]}
                    allRmas={rmas}
                    onSave={handleSaveShipmentTagData}
                    targetType={shipmentTagTarget}
                />
            )}

            {/* Document Preview Popup */}
            {docPreviewHtml && (
                <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
                    {/* Toolbar */}
                    <div className="flex-shrink-0 flex items-center gap-3 px-6 py-2.5 bg-white/90 dark:bg-[#1c1c1e]/95 backdrop-blur border-b border-gray-200 dark:border-white/10 shadow-sm">
                        <h2 className="text-gray-800 dark:text-white font-semibold text-base flex-1">📋 Preview เอกสาร</h2>
                        {/* Copy Text Only (Facebook friendly) */}
                        <button
                            onClick={() => {
                                const rma0 = docPreviewRmas[0];
                                const jobIdVal = rma0?.groupRequestId || rma0?.id || '-';
                                const quotationVal = rma0?.quotationNumber || '-';
                                let textLines: string[] = [];
                                textLines.push(`เลขที่งานเคลม (Job ID): ${jobIdVal}`);
                                textLines.push(`เลขอ้างอิง/ใบเสนอราคา: ${quotationVal}`);
                                const actionMap: Record<string, string> = {
                                    'Replaced Component': 'ศูนย์เปลี่ยนอะไหล่',
                                    'Swapped Unit': 'เปลี่ยนเครื่อง (Swap)',
                                    'Software Update': 'อัพเดทซอฟต์แวร์',
                                    'No Fault Found': 'ไม่พบอาการเสีย(ส่งคืน)'
                                };
                                const formatAction = (action?: string) => action ? (actionMap[action] || action) : '-';
                                if (docPreviewType === 'CUSTOMER') {
                                    textLines.push(`ลูกค้า: ${rma0?.customerName || '-'}`);
                                    textLines.push('');
                                    textLines.push(`รายการสินค้า (${docPreviewRmas.length} ชิ้น):`);
                                    docPreviewRmas.forEach((r, i) => {
                                        textLines.push(`รายการ ${i + 1}:`);
                                        textLines.push(`   ${r.brand} รุ่น: ${r.productModel}`);
                                        textLines.push(`   S/N: ${r.serialNumber}`);
                                        textLines.push(`   อาการที่พบ: ${r.resolution?.rootCause || '-'}`);
                                        if (r.resolution?.actionTaken) {
                                            textLines.push(`   การดำเนินการ: ${formatAction(r.resolution.actionTaken)}`);
                                            if (r.resolution.actionDetails) textLines.push(`   รายละเอียด: ${r.resolution.actionDetails}`);
                                            if (r.resolution.replacedSerialNumber) textLines.push(`   S/N ใหม่: ${r.resolution.replacedSerialNumber}`);
                                        }
                                        if (i < docPreviewRmas.length - 1) textLines.push('');
                                    });
                                } else {
                                    textLines.push(`ผู้นำเข้า: ${rma0?.distributor || '-'}`);
                                    textLines.push('');
                                    textLines.push(`รายการสินค้า (${docPreviewRmas.length} ชิ้น):`);
                                    docPreviewRmas.forEach((r, i) => {
                                        textLines.push(`รายการ ${i + 1}:`);
                                        textLines.push(`   ${r.brand} รุ่น: ${r.productModel}`);
                                        textLines.push(`   S/N: ${r.serialNumber}`);
                                        textLines.push(`   อาการที่ลูกค้าแจ้ง: ${r.issueDescription || '-'}`);
                                        textLines.push(`   อาการที่พบ: ${r.resolution?.rootCause || '-'}`);
                                        if (r.resolution?.actionTaken) {
                                            textLines.push(`   การดำเนินการ: ${formatAction(r.resolution.actionTaken)}`);
                                            if (r.resolution.actionDetails) textLines.push(`   รายละเอียด: ${r.resolution.actionDetails}`);
                                            if (r.resolution.replacedSerialNumber) textLines.push(`   S/N ใหม่: ${r.resolution.replacedSerialNumber}`);
                                        }
                                        if (i < docPreviewRmas.length - 1) textLines.push('');
                                    });
                                }
                                navigator.clipboard.writeText(textLines.join('\n')).then(() => {
                                    showToast('คัดลอกข้อความแล้ว!', 'success');
                                }).catch(() => showToast('ไม่สามารถคัดลอกได้', 'error'));
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                            title="คัดลอกเฉพาะข้อความ (ใช้กับ Facebook ได้)"
                        >
                            <Copy className="w-4 h-4" /> ข้อความ
                        </button>
                        {/* Copy Image Only */}
                        <button
                            onClick={async () => {
                                if (!docPreviewHtml || isCopyingImage) return;
                                setIsCopyingImage(true);
                                try {
                                    const blob = await renderHtmlToBlob(docPreviewHtml);
                                    try {
                                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                                        showToast('คัดลอกรูปภาพแล้ว!', 'success');
                                    } catch {
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url; a.download = `rma-doc-${jobId}.png`; a.click();
                                        URL.revokeObjectURL(url);
                                        showToast('ดาวน์โหลดรูปภาพแล้ว', 'info');
                                    }
                                } catch (err) {
                                    console.error('Copy image failed:', err);
                                    showToast('ไม่สามารถสร้างรูปภาพได้ ลองปิดแล้วเปิดใหม่', 'error');
                                } finally {
                                    setIsCopyingImage(false);
                                }
                            }}
                            disabled={isCopyingImage}
                            className={`px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${isCopyingImage ? 'opacity-60 cursor-wait' : ''}`}
                            title="คัดลอกเฉพาะรูปภาพ"
                        >
                            {isCopyingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />} รูปภาพ
                        </button>
                        {/* Copy Both (LINE friendly) */}
                        <button
                            onClick={async () => {
                                if (!docPreviewHtml || isCopyingImage) return;
                                setIsCopyingImage(true);
                                try {
                                    const blob = await renderHtmlToBlob(docPreviewHtml);
                                    // Build text summary
                                    const rma0 = docPreviewRmas[0];
                                    const jobIdVal = rma0?.groupRequestId || rma0?.id || '-';
                                    const quotationVal = rma0?.quotationNumber || '-';
                                    let textLines: string[] = [];
                                    textLines.push(`เลขที่งานเคลม (Job ID): ${jobIdVal}`);
                                    textLines.push(`เลขอ้างอิง/ใบเสนอราคา: ${quotationVal}`);
                                    const actionMap: Record<string, string> = {
                                        'Replaced Component': 'ศูนย์เปลี่ยนอะไหล่',
                                        'Swapped Unit': 'เปลี่ยนเครื่อง (Swap)',
                                        'Software Update': 'อัพเดทซอฟต์แวร์',
                                        'No Fault Found': 'ไม่พบอาการเสีย(ส่งคืน)'
                                    };
                                    const formatAction = (action?: string) => action ? (actionMap[action] || action) : '-';
                                    if (docPreviewType === 'CUSTOMER') {
                                        textLines.push(`ลูกค้า: ${rma0?.customerName || '-'}`);
                                        textLines.push('');
                                        textLines.push(`รายการสินค้า (${docPreviewRmas.length} ชิ้น):`);
                                        docPreviewRmas.forEach((r, i) => {
                                            textLines.push(`รายการ ${i + 1}:`);
                                            textLines.push(`   ${r.brand} รุ่น: ${r.productModel}`);
                                            textLines.push(`   S/N: ${r.serialNumber}`);
                                            textLines.push(`   อาการที่พบ: ${r.resolution?.rootCause || '-'}`);
                                            if (r.resolution?.actionTaken) {
                                                textLines.push(`   การดำเนินการ: ${formatAction(r.resolution.actionTaken)}`);
                                                if (r.resolution.actionDetails) textLines.push(`   รายละเอียด: ${r.resolution.actionDetails}`);
                                                if (r.resolution.replacedSerialNumber) textLines.push(`   S/N ใหม่: ${r.resolution.replacedSerialNumber}`);
                                            }
                                            if (i < docPreviewRmas.length - 1) textLines.push('');
                                        });
                                    } else {
                                        textLines.push(`ผู้นำเข้า: ${rma0?.distributor || '-'}`);
                                        textLines.push('');
                                        textLines.push(`รายการสินค้า (${docPreviewRmas.length} ชิ้น):`);
                                        docPreviewRmas.forEach((r, i) => {
                                            textLines.push(`รายการ ${i + 1}:`);
                                            textLines.push(`   ${r.brand} รุ่น: ${r.productModel}`);
                                            textLines.push(`   S/N: ${r.serialNumber}`);
                                            textLines.push(`   อาการที่ลูกค้าแจ้ง: ${r.issueDescription || '-'}`);
                                            textLines.push(`   อาการที่พบ: ${r.resolution?.rootCause || '-'}`);
                                            if (r.resolution?.actionTaken) {
                                                textLines.push(`   การดำเนินการ: ${formatAction(r.resolution.actionTaken)}`);
                                                if (r.resolution.actionDetails) textLines.push(`   รายละเอียด: ${r.resolution.actionDetails}`);
                                                if (r.resolution.replacedSerialNumber) textLines.push(`   S/N ใหม่: ${r.resolution.replacedSerialNumber}`);
                                            }
                                            if (i < docPreviewRmas.length - 1) textLines.push('');
                                        });
                                    }
                                    const copyText = textLines.join('\n');
                                    try {
                                        await navigator.clipboard.write([
                                            new ClipboardItem({
                                                'image/png': blob,
                                                'text/plain': new Blob([copyText], { type: 'text/plain' })
                                            })
                                        ]);
                                        showToast('คัดลอกรูป + ข้อความแล้ว! วางใน LINE ได้เลย', 'success');
                                    } catch {
                                        await navigator.clipboard.writeText(copyText);
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url; a.download = `rma-doc-${jobId}.png`; a.click();
                                        URL.revokeObjectURL(url);
                                        showToast('คัดลอกข้อความแล้ว + ดาวน์โหลดรูปแยก', 'info');
                                    }
                                } catch (err) {
                                    console.error('Copy failed:', err);
                                    showToast('ไม่สามารถสร้างรูปภาพได้ ลองปิดแล้วเปิดใหม่', 'error');
                                } finally {
                                    setIsCopyingImage(false);
                                }
                            }}
                            disabled={isCopyingImage}
                            className={`px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${isCopyingImage ? 'opacity-60 cursor-wait' : ''}`}
                            title="คัดลอกทั้งรูปภาพและข้อความ (สำหรับ LINE)"
                        >
                            {isCopyingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />} ทั้งหมด (LINE)
                        </button>
                        <button
                            onClick={() => {
                                const iframe = document.getElementById('doc-preview-iframe') as HTMLIFrameElement;
                                iframe?.contentWindow?.print();
                            }}
                            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                            🖨️ พิมพ์เอกสาร
                        </button>
                        <button
                            onClick={() => setDocPreviewHtml(null)}
                            className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                            <XIcon className="w-4 h-4" /> ปิด
                        </button>
                    </div>
                    {/* Warning banner for partial customer documents */}
                    {docPreviewType === 'CUSTOMER' && docPreviewRmas.length < rmas.length && (
                        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            <span className="text-sm text-amber-700 dark:text-amber-300">
                                แสดงเฉพาะงานที่ปิดแล้ว <strong>{docPreviewRmas.length}</strong> จาก <strong>{rmas.length}</strong> รายการ — อีก <strong>{rmas.length - docPreviewRmas.length}</strong> รายการยังไม่ได้ปิดงาน ไม่แสดงในเอกสาร
                            </span>
                        </div>
                    )}
                    {/* Preview Content - A4 */}
                    <div className="flex-1 overflow-auto flex justify-center py-4 px-4 bg-gray-100/50 dark:bg-black/50">
                        <iframe
                            id="doc-preview-iframe"
                            srcDoc={`<html><head><title>Preview</title></head><body style="margin:0;padding:0;background:#fff;">${docPreviewHtml}</body></html>`}
                            className="border-0 shadow-2xl bg-white"
                            style={{ width: '794px', height: '1123px', minWidth: '794px' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
