import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RMA, RMAStatus, Team, DelayReason, ResolutionDetails } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Save, AlertCircle, ArrowRight, CheckCircle2, ChevronRight, RotateCcw, Truck, Box, Layers, Wifi, Zap, ShoppingBag, ShieldCheck, RefreshCw, AlertOctagon, Plus, Check, Pencil, Lock, Search, Package, Wrench, Undo2, PackageCheck, ClipboardCheck, Settings2 } from 'lucide-react';
import { GlassSelect } from './GlassSelect';
import { MockDb } from '../services/mockDb';
import { HddBulkModal } from './HddBulkModal';

interface EditRMADrawerProps {
    isOpen: boolean;
    onClose: () => void;
    rma: RMA;
    onSave: (rmaId: string, updates: Partial<RMA>, diffs: { field: string, old: string, new: string }[]) => Promise<void>;
}

export const EditRMADrawer: React.FC<EditRMADrawerProps> = ({ isOpen, onClose, rma, onSave }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<RMA | null>(null);
    const [distOptions, setDistOptions] = useState<any[]>([]);
    const [brandOptions, setBrandOptions] = useState<any[]>([]);
    const [isReviewing, setIsReviewing] = useState(false);
    const [diffs, setDiffs] = useState<{ field: string, old: string, new: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [customDist, setCustomDist] = useState('');
    const [customBrand, setCustomBrand] = useState('');

    // Custom Action State
    const [customAction, setCustomAction] = useState('');
    const [customAccessory, setCustomAccessory] = useState('');
    const [showHddModal, setShowHddModal] = useState(false);
    const [isAccessoriesLocked, setIsAccessoriesLocked] = useState(true);
    const [accessoriesBackup, setAccessoriesBackup] = useState<string[]>([]);
    const [showAccReview, setShowAccReview] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Soft Lock State - lock closed jobs
    const [isLocked, setIsLocked] = useState(false);

    // Event-Driven Workflow
    const [showManualStatus, setShowManualStatus] = useState(false);
    const [showVendorResultPopup, setShowVendorResultPopup] = useState(false);
    const [showCloseSummary, setShowCloseSummary] = useState(false);
    const [vendorForm, setVendorForm] = useState({ actionTaken: '', actionDetails: '', replacedSerialNumber: '', vendorTicketRef: '' });

    // Team State
    const [tempTeam, setTempTeam] = useState<Team | ''>('');
    const [mainGroup, setMainGroup] = useState<'A' | 'B' | 'C' | ''>('');
    const [isChangingTeam, setIsChangingTeam] = useState(false);

    useEffect(() => {
        if (isOpen && rma) {
            setFormData(JSON.parse(JSON.stringify(rma))); // Deep copy
            setIsReviewing(false);
            setDiffs([]);
            setCustomDist(rma.distributor || '');

            // Initialize lock state for closed jobs
            setIsLocked(rma.status === RMAStatus.CLOSED);

            // Initialize customAction if current actionTaken is not in predefined options
            const predefinedActions = ["Replaced Component", "Swapped Unit", "Software Update", "No Fault Found", "Other"];
            if (rma.resolution?.actionTaken && !predefinedActions.includes(rma.resolution.actionTaken)) {
                setCustomAction(rma.resolution.actionTaken);
                // Also set formData.resolution.actionTaken to 'Other' to show the custom input
                setFormData(prev => prev ? ({
                    ...prev,
                    resolution: { ...prev.resolution!, actionTaken: 'Other' }
                }) : null);
            } else {
                setCustomAction('');
            }

            // Sync Team
            setTempTeam(rma.team);
            if (rma.team === Team.HIKVISION) setMainGroup('A');
            else if (rma.team === Team.DAHUA) setMainGroup('B');
            else if ([Team.TEAM_C, Team.TEAM_E, Team.TEAM_G].includes(rma.team)) setMainGroup('C');
            else setMainGroup('');

            // Load options
            const loadOptions = async () => {
                const [dists, brands] = await Promise.all([MockDb.getDistributors(), MockDb.getBrands()]);
                setDistOptions([...dists, { value: 'Other', label: t('submit.other') }]);
                setBrandOptions([...brands, { value: 'Other', label: t('submit.other') }]);

                // If current brand is not in the predefined list, set it as custom
                const brandValues = brands.map((b: any) => b.value);
                if (rma.brand && !brandValues.includes(rma.brand)) {
                    setCustomBrand(rma.brand);
                    setFormData(prev => prev ? ({ ...prev, brand: 'Other' }) : null);
                } else {
                    setCustomBrand('');
                }
            };
            loadOptions();
        }
    }, [isOpen, rma, t]);

    if (!isOpen || !formData) return null;

    const teamKey = (team: string | null | undefined) => {
        if (!team) return '';
        const map: Record<string, string> = { HIKVISION: 'hikvision', DAHUA: 'dahua', TEAM_C: 'teamC', TEAM_E: 'teamE', TEAM_G: 'teamG' };
        return map[team] || team.toLowerCase();
    };

    const handleFormChange = (field: keyof RMA, value: any) => {
        setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handleResolutionChange = (field: keyof ResolutionDetails, value: any) => {
        setFormData(prev => prev ? ({
            ...prev,
            resolution: { ...prev.resolution!, [field]: value }
        }) : null);
    };

    const handleWarrantyChange = (val: any) => {
        setFormData(prev => prev ? ({
            ...prev,
            repairCosts: { ...prev.repairCosts!, warrantyStatus: val }
        }) : null);
    };

    const handleGroupSelect = (group: 'A' | 'B' | 'C') => {
        setMainGroup(group);
        if (group === 'A') setTempTeam(Team.HIKVISION);
        else if (group === 'B') setTempTeam(Team.DAHUA);
        else setTempTeam('');
    };

    const calculateDiffs = () => {
        const newDiffs: { field: string, old: string, new: string }[] = [];
        const fmt = (val: any) => val ? String(val) : '(Empty)';

        if (formData.issueDescription !== rma.issueDescription) {
            newDiffs.push({ field: t('track.issueReported'), old: fmt(rma.issueDescription), new: fmt(formData.issueDescription) });
        }

        if (formData.deviceUsername !== rma.deviceUsername) {
            newDiffs.push({ field: 'Device Username', old: fmt(rma.deviceUsername), new: fmt(formData.deviceUsername) });
        }

        if (formData.devicePassword !== rma.devicePassword) {
            newDiffs.push({ field: 'Device Password', old: fmt(rma.devicePassword), new: fmt(formData.devicePassword) });
        }

        const currentBrand = formData.brand === 'Other' ? customBrand : formData.brand;
        if (currentBrand !== rma.brand) {
            newDiffs.push({ field: 'ยี่ห้อ (Brand)', old: fmt(rma.brand), new: fmt(currentBrand) });
        }

        if (formData.productModel !== rma.productModel) {
            newDiffs.push({ field: 'รุ่น (Model)', old: fmt(rma.productModel), new: fmt(formData.productModel) });
        }

        if (formData.serialNumber !== rma.serialNumber) {
            newDiffs.push({ field: 'S/N', old: fmt(rma.serialNumber), new: fmt(formData.serialNumber) });
        }

        const currentDist = formData.distributor === 'Other' ? customDist : formData.distributor;
        if (currentDist !== rma.distributor) {
            newDiffs.push({ field: t('submit.distributor'), old: fmt(rma.distributor), new: fmt(currentDist) });
        }

        if (tempTeam !== rma.team) {
            newDiffs.push({ field: t('track.assignedTeam'), old: t(`teams.${teamKey(rma.team)}`), new: t(`teams.${teamKey(tempTeam)}`) });
        }

        if (formData.status !== rma.status) {
            newDiffs.push({ field: t('track.statusLabel'), old: t(`status.${rma.status}`), new: t(`status.${formData.status}`) });
        }

        if (formData.repairCosts?.warrantyStatus !== rma.repairCosts?.warrantyStatus) {
            const oldW = rma.repairCosts?.warrantyStatus ? t(`warranty.${rma.repairCosts.warrantyStatus}`) : '-';
            const newW = formData.repairCosts?.warrantyStatus ? t(`warranty.${formData.repairCosts?.warrantyStatus}`) : '-';
            newDiffs.push({ field: t('track.warrantyStatus'), old: oldW, new: newW });
        }

        // Resolution Fields
        const currentActionTaken = formData.resolution?.actionTaken === 'Other' ? customAction : formData.resolution?.actionTaken;
        if (currentActionTaken !== rma.resolution?.actionTaken) {
            newDiffs.push({ field: t('track.actionTaken'), old: fmt(rma.resolution?.actionTaken), new: fmt(currentActionTaken) });
        }
        if (formData.resolution?.rootCause !== rma.resolution?.rootCause) {
            newDiffs.push({ field: t('track.rootCause'), old: fmt(rma.resolution?.rootCause), new: fmt(formData.resolution?.rootCause) });
        }
        if (formData.resolution?.vendorTicketRef !== rma.resolution?.vendorTicketRef) {
            newDiffs.push({ field: t('track.vendorRef'), old: fmt(rma.resolution?.vendorTicketRef), new: fmt(formData.resolution?.vendorTicketRef) });
        }
        if (formData.resolution?.replacedSerialNumber !== rma.resolution?.replacedSerialNumber) {
            newDiffs.push({ field: t('track.newSerial'), old: fmt(rma.resolution?.replacedSerialNumber), new: fmt(formData.resolution?.replacedSerialNumber) });
        }

        // Delay
        if (formData.delayReason !== rma.delayReason) {
            const oldD = rma.delayReason === 'NONE' ? t('delays.NONE') : t(`delays.${rma.delayReason}`);
            const newD = formData.delayReason === 'NONE' ? t('delays.NONE') : t(`delays.${formData.delayReason}`);
            newDiffs.push({ field: t('track.delayReason'), old: oldD, new: newD });
        }

        // Notes
        if ((formData.notes || '').trim() !== (rma.notes || '').trim()) {
            newDiffs.push({ field: t('track.internalNote'), old: fmt(rma.notes), new: fmt(formData.notes) });
        }

        // Accessories
        const oldAcc = (rma.accessories || []).sort().join(', ');
        const newAcc = (formData.accessories || []).sort().join(', ');
        if (oldAcc !== newAcc) {
            const fmtAcc = (keys: string[]) => keys.length === 0 ? '(ไม่มี)' : keys.map(k => k.startsWith('acc_') ? t(`accessories_list.${k}`) : k).join(', ');
            newDiffs.push({ field: t('submit.accessories'), old: fmtAcc(rma.accessories || []), new: fmtAcc(formData.accessories || []) });
        }

        // Distributor Sent Items
        const oldSent = (rma.distributorSentItems || []).sort().join(', ');
        const newSent = (formData.distributorSentItems || []).sort().join(', ');
        if (oldSent !== newSent) {
            const fmtSent = (keys: string[]) => {
                if (keys.length === 0) return '(ไม่ได้เลือก)';
                return keys.map(k => k === 'unit' ? 'ตัวเครื่อง' : (k.startsWith('acc_') ? t(`accessories_list.${k}`) : k)).join(', ');
            };
            newDiffs.push({ field: 'อุปกรณ์ที่ส่งเคลม', old: fmtSent(rma.distributorSentItems || []), new: fmtSent(formData.distributorSentItems || []) });
        }

        return newDiffs;
    };

    const handleSafeClose = () => {
        const diffs = calculateDiffs();
        if (diffs.length > 0) {
            setShowUnsavedModal(true);
        } else {
            onClose();
        }
    };

    const handlePreSave = () => {
        // ถ้าปิดงาน (CLOSED) ต้องเลือกผลการดำเนินงานก่อน
        const currentAction = formData.resolution?.actionTaken === 'Other' ? customAction : formData.resolution?.actionTaken;
        if (formData.status === RMAStatus.CLOSED && (!currentAction || currentAction.trim() === '')) {
            alert('กรุณาเลือก "วิธีแก้ไข/ดำเนินการ" ก่อนปิดงาน');
            return;
        }

        const calculatedDiffs = calculateDiffs();
        if (calculatedDiffs.length === 0) {
            alert("No changes detected.");
            return;
        }
        setDiffs(calculatedDiffs);
        setIsReviewing(true);
    };

    const handleFinalSave = async () => {
        setIsSaving(true);
        const updates: Partial<RMA> = {
            ...formData,
            team: tempTeam as Team,
            brand: formData.brand === 'Other' ? customBrand : formData.brand,
            distributor: formData.distributor === 'Other' ? customDist : formData.distributor,
        };

        if (formData.resolution) {
            updates.resolution = {
                ...formData.resolution,
                actionTaken: formData.resolution.actionTaken === 'Other' ? customAction : (formData.resolution.actionTaken || '')
            };
        }

        // Firebase Firestore does not accept 'undefined' values.
        // We strip them out cleanly — including nested objects.
        const stripUndefined = (obj: any) => {
            Object.keys(obj).forEach(key => {
                if (obj[key] === undefined) {
                    delete obj[key];
                } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
                    stripUndefined(obj[key]);
                }
            });
        };
        stripUndefined(updates);

        try {
            await onSave(rma.id, updates, diffs);
            setIsLocked(true); // Auto-lock back after save
            onClose();
        } catch (error) {
            console.error("Failed to save RMA updates:", error);
            alert("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSaving(false);
        }
    };

    const warrantyOptions = [
        { value: 'IN_WARRANTY', label: t('warranty.IN_WARRANTY') },
        { value: 'OUT_OF_WARRANTY', label: t('warranty.OUT_OF_WARRANTY') },
        { value: 'VOID', label: t('warranty.VOID') }
    ];
    const statusOptions = Object.values(RMAStatus).map(s => ({ value: s, label: t(`status.${s}`) }));
    const delayOptions = ['NONE', 'WAITING_PARTS', 'WAITING_DISTRIBUTOR', 'WAITING_CUSTOMER', 'INTERNAL_QUEUE'].map(d => ({ value: d, label: t(`delays.${d}`) }));
    const actionOptions = [
        { value: "", label: "-- ยังไม่ดำเนินการ --" },
        { value: "Replaced Component", label: t('actions.replaced_component') },
        { value: "Swapped Unit", label: t('actions.swapped_unit') },
        { value: "Software Update", label: t('actions.software_update') },
        { value: "No Fault Found", label: t('actions.no_fault_found') },
        { value: "Other", label: t('submit.other') }
    ];


    return (
        <div className="max-w-5xl mx-auto py-6 px-4 animate-fade-in">
            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8 px-2">
                <div>
                    <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-2">{t('track.edit')}</h1>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-500">
                        <span className="font-mono bg-gray-200 dark:bg-gray-600 px-2.5 py-0.5 rounded-lg text-gray-700 dark:text-gray-300 font-bold whitespace-nowrap">{rma.id}</span>
                        {rma.groupRequestId && (
                            <span className="font-mono bg-[#0071e3]/10 text-[#0071e3] px-2.5 py-0.5 rounded-lg font-bold border border-[#0071e3]/20 whitespace-nowrap">Job: {rma.groupRequestId}</span>
                        )}
                        <span className="whitespace-nowrap">{rma.brand} {rma.productModel}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-mono whitespace-nowrap">{rma.serialNumber}</span>
                    </div>
                </div>
                <button onClick={handleSafeClose} className="w-fit px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 rotate-180" /> กลับ
                </button>
            </div>

            {/* SOFT LOCK BANNER */}
            {isLocked && (
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600/40 rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">งานนี้ปิดแล้ว — ข้อมูลถูกล็อค</p>
                            <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">กดปลดล็อคเพื่อแก้ไขข้อมูล</p>
                        </div>
                    </div>
                    <button onClick={() => setIsLocked(false)} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap">
                        🔓 ปลดล็อคเพื่อแก้ไข
                    </button>
                </div>
            )}

            <fieldset disabled={isLocked} className={isLocked ? 'opacity-60 pointer-events-none' : ''}>

            {/* SECTION 1: ข้อมูลสินค้า */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 mb-6 border border-gray-100 dark:border-[#333]">
                <h2 className="font-semibold text-lg flex items-center gap-3 mb-6 text-[#1d1d1f] dark:text-white">
                    <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                    ข้อมูลสินค้า
                </h2>
                <div className="space-y-5">
                    <div className="relative z-40">
                        <GlassSelect
                            label="ยี่ห้อ (Brand)"
                            value={formData.brand || ''}
                            onChange={val => handleFormChange('brand', val)}
                            options={brandOptions}
                            searchable
                            recentKey="brand"
                        />
                        {formData.brand === 'Other' && (
                            <input
                                value={customBrand}
                                onChange={e => setCustomBrand(e.target.value)}
                                className="mt-2 w-full px-4 py-3.5 text-sm rounded-2xl outline-none bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] text-[#1d1d1f] dark:text-white"
                                placeholder="ระบุยี่ห้อ..."
                            />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">รุ่น (Model)</label>
                            <input type="text" value={formData.productModel || ''} onChange={e => handleFormChange('productModel', e.target.value)} className="w-full rounded-2xl px-4 py-3.5 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="e.g. DH-IPC-HFW2439S" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">S/N (Serial Number)</label>
                            <input type="text" value={formData.serialNumber || ''} onChange={e => handleFormChange('serialNumber', e.target.value)} className="w-full rounded-2xl px-4 py-3.5 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none font-mono" placeholder="Serial Number" />
                        </div>
                    </div>

                    {/* Accessories */}
                    <div>
                        <div className="flex items-center justify-between mb-3 ml-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase">{t('submit.accessories')}</label>
                            {isAccessoriesLocked ? (
                                <button type="button" onClick={() => {
                                    setAccessoriesBackup([...(formData.accessories || [])]);
                                    setIsAccessoriesLocked(false);
                                }} className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl text-gray-500 hover:text-[#0071e3] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                    <Pencil className="w-3 h-3" /> แก้ไข
                                </button>
                            ) : (
                                <div className="flex gap-1.5">
                                    <button type="button" onClick={() => {
                                        handleFormChange('accessories', accessoriesBackup);
                                        setIsAccessoriesLocked(true);
                                    }} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                        <RotateCcw className="w-3 h-3" /> ยกเลิก
                                    </button>
                                    <button type="button" onClick={() => {
                                        const current = formData.accessories || [];
                                        const added = current.filter(a => !accessoriesBackup.includes(a));
                                        const removed = accessoriesBackup.filter(a => !current.includes(a));
                                        if (added.length === 0 && removed.length === 0) {
                                            setIsAccessoriesLocked(true);
                                            return;
                                        }
                                        setShowAccReview(true);
                                    }} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-xl text-white bg-[#0071e3] hover:bg-[#0077ED] transition-all">
                                        <Check className="w-3 h-3" /> บันทึก
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={`flex flex-wrap gap-2 mb-2 ${isAccessoriesLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                            {['acc_box', 'acc_adapter', 'acc_hdmi', 'acc_mouse', 'acc_remote', 'acc_hdd', 'acc_cables'].map(acc => {
                                const hddCount = acc === 'acc_hdd' ? (formData.accessories || []).filter(a => a.startsWith('acc_hdd::')).length : 0;
                                const isActive = (formData.accessories || []).includes(acc) || hddCount > 0;
                                return (
                                    <button
                                        key={acc}
                                        type="button"
                                        onClick={() => {
                                            if (acc === 'acc_hdd') { setShowHddModal(true); return; }
                                            const current = formData.accessories || [];
                                            handleFormChange('accessories', isActive ? current.filter(a => a !== acc) : [...current, acc]);
                                        }}
                                        className={`px-4 py-2 text-xs font-medium rounded-full border transition-all flex items-center gap-2 ${isActive
                                            ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-md'
                                            : 'bg-white dark:bg-[#2c2c2e] border-[#d2d2d7] dark:border-[#424245] text-[#1d1d1f] dark:text-gray-300 hover:border-[#0071e3] hover:text-[#0071e3]'
                                            }`}
                                    >
                                        {t(`accessories_list.${acc}`)}
                                        {acc === 'acc_hdd' && <span className={`flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold ${hddCount > 0 ? 'bg-white text-[#0071e3]' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>{hddCount > 0 ? hddCount : <Plus className="w-2.5 h-2.5" />}</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className={`flex gap-2 mb-2 ${isAccessoriesLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                            <input
                                type="text"
                                value={customAccessory}
                                onChange={e => setCustomAccessory(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customAccessory.trim()) { handleFormChange('accessories', [...(formData.accessories || []), customAccessory.trim()]); setCustomAccessory(''); } } }}
                                placeholder="รายการอื่นๆ..."
                                className="flex-1 px-4 py-2.5 text-sm rounded-2xl outline-none bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] text-[#1d1d1f] dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => { if (customAccessory.trim()) { handleFormChange('accessories', [...(formData.accessories || []), customAccessory.trim()]); setCustomAccessory(''); } }}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white rounded-2xl hover:bg-gray-200 dark:hover:bg-[#48484a] transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        {(formData.accessories || []).length > 0 && (
                            <div className={`flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-[#2c2c2e] rounded-2xl border border-gray-200 dark:border-[#424245] ${isAccessoriesLocked ? 'pointer-events-none' : ''}`}>
                                {(formData.accessories || []).map((acc, idx) => (
                                    <span key={`${acc}-${idx}`} className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#3a3a3c] text-xs font-medium rounded-xl shadow-sm border border-gray-200 dark:border-[#48484a] text-[#1d1d1f] dark:text-white">
                                        {acc.startsWith('acc_hdd::') ? `HDD (${acc.split('::')[1]})` : (acc.startsWith('acc_') ? t(`accessories_list.${acc}`) : acc)}
                                        <button type="button" onClick={() => handleFormChange('accessories', (formData.accessories || []).filter(a => a !== acc))} className="text-gray-400 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 2: ข้อมูลการรับเข้า */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 mb-6 border border-gray-100 dark:border-[#333]">
                <h2 className="font-semibold text-lg flex items-center gap-3 mb-6 text-[#1d1d1f] dark:text-white">
                    <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
                    {t('track.intakeInfo')}
                </h2>
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('track.issueReported')}</label>
                        <textarea value={formData.issueDescription} onChange={e => handleFormChange('issueDescription', e.target.value)} rows={3} className="w-full rounded-2xl px-4 py-3.5 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">Device Username (ยูสเซอร์)</label>
                            <input type="text" value={formData.deviceUsername || ''} onChange={e => handleFormChange('deviceUsername', e.target.value)} className="w-full rounded-2xl px-4 py-3.5 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="N/A" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">Device Password (รหัสผ่าน)</label>
                            <input type="text" value={formData.devicePassword || ''} onChange={e => handleFormChange('devicePassword', e.target.value)} className="w-full rounded-2xl px-4 py-3.5 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="N/A" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-30">
                        <div className="relative z-20">
                            <GlassSelect label={t('submit.distributor')} value={formData.distributor || ''} onChange={val => handleFormChange('distributor', val)} options={distOptions} searchable recentKey="distributor" />
                            {formData.distributor === 'Other' && (
                                <input value={customDist} onChange={e => setCustomDist(e.target.value)} className="mt-2 w-full px-4 py-3 text-sm rounded-2xl outline-none bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] text-[#1d1d1f] dark:text-white" placeholder={t('submit.distributor')} />
                            )}
                        </div>
                        <div className="relative z-10">
                            <GlassSelect label={t('track.warrantyStatus')} value={formData.repairCosts?.warrantyStatus || ''} onChange={handleWarrantyChange} options={warrantyOptions} searchable recentKey="warrantyStatus" />
                        </div>
                    </div>
                </div>
            </div>

{/* SECTION 3: สถานะและการดำเนินการ */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 mb-6 border border-gray-100 dark:border-[#333]">
                <h2 className="font-semibold text-lg flex items-center gap-3 mb-6 text-[#1d1d1f] dark:text-white">
                    <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
                    {t('track.statusResolution')}
                </h2>
                <div className="space-y-5">
                    {/* ROW 1: Status Badge + Team */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Status Badge + Transition Buttons */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('track.statusLabel')}</label>
                            <div className={`px-4 py-3.5 rounded-2xl text-sm font-bold border flex items-center gap-2 ${
                                formData.status === RMAStatus.PENDING ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300' :
                                formData.status === RMAStatus.DIAGNOSING ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600/40 text-blue-700 dark:text-blue-300' :
                                formData.status === RMAStatus.WAITING_PARTS ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600/40 text-orange-700 dark:text-orange-300' :
                                formData.status === RMAStatus.REPAIRED ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600/40 text-green-700 dark:text-green-300' :
                                formData.status === RMAStatus.CLOSED ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600/40 text-purple-700 dark:text-purple-300' :
                                'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600/40 text-red-700 dark:text-red-300'
                            }`}>
                                {formData.status === RMAStatus.PENDING && <AlertCircle className="w-4 h-4" />}
                                {formData.status === RMAStatus.DIAGNOSING && <Search className="w-4 h-4" />}
                                {formData.status === RMAStatus.WAITING_PARTS && <Package className="w-4 h-4" />}
                                {formData.status === RMAStatus.REPAIRED && <CheckCircle2 className="w-4 h-4" />}
                                {formData.status === RMAStatus.CLOSED && <Lock className="w-4 h-4" />}
                                {formData.status === RMAStatus.REJECTED && <X className="w-4 h-4" />}
                                {t(`status.${formData.status}`)}
                            </div>

                            {/* Transition Buttons */}
                            <div className="mt-3 space-y-2">
                                <label className="block text-xs font-semibold text-gray-500 uppercase ml-2 mb-1">ขั้นตอนถัดไป</label>

                                {formData.status === RMAStatus.PENDING && (
                                    <>
                                        <p className="text-[11px] text-gray-400 ml-2 mb-1">กดเพื่อเริ่มตรวจสอบอาการสินค้า</p>
                                        <button type="button" onClick={() => handleFormChange('status', RMAStatus.DIAGNOSING)}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600/40 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium transition-colors">
                                            <Search className="w-4 h-4" /> 🔍 เริ่มตรวจสอบ
                                        </button>
                                    </>
                                )}

                                {formData.status === RMAStatus.DIAGNOSING && (
                                    <>
                                    <p className="text-[11px] text-gray-400 ml-2 mb-1">ตรวจสอบเสร็จแล้ว เลือกขั้นตอนที่เหมาะสม</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button type="button" onClick={() => {
                                            if (!formData.resolution?.rootCause) {
                                                if (!confirm('ยังไม่ได้กรอก "อาการที่พบ" ต้องการส่งเคลมศูนย์เลยหรือไม่?')) return;
                                            }
                                            handleFormChange('status', RMAStatus.WAITING_PARTS);
                                        }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-600/40 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-sm font-medium transition-colors">
                                            <Package className="w-4 h-4" /> 📦 ส่งเคลมศูนย์
                                        </button>
                                        <button type="button" onClick={() => {
                                            handleFormChange('status', RMAStatus.REPAIRED);
                                            handleResolutionChange('actionTaken', 'Software Update');
                                        }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-green-300 dark:border-green-600/40 bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-medium transition-colors">
                                            <Wrench className="w-4 h-4" /> 🔧 แก้ไข Config/Firmware (จบที่ร้าน)
                                        </button>
                                        <button type="button" onClick={() => {
                                            handleFormChange('status', RMAStatus.REPAIRED);
                                            handleResolutionChange('actionTaken', 'No Fault Found');
                                        }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600/40 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 text-gray-600 dark:text-gray-400 text-sm font-medium transition-colors">
                                            <Undo2 className="w-4 h-4" /> ↩️ ไม่พบอาการเสีย (ส่งคืน)
                                        </button>
                                    </div>
                                    </>
                                )}

                                {formData.status === RMAStatus.WAITING_PARTS && (
                                    <>
                                        <p className="text-[11px] text-gray-400 ml-2 mb-1">ของกลับจากศูนย์แล้ว กดเพื่อลงข้อมูลผลจากศูนย์</p>
                                        <button type="button" onClick={() => {
                                            setVendorForm({ actionTaken: '', actionDetails: '', replacedSerialNumber: '', vendorTicketRef: formData.resolution?.vendorTicketRef || '' });
                                            setShowVendorResultPopup(true);
                                        }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600/40 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium transition-colors">
                                            <PackageCheck className="w-4 h-4" /> 📥 รับของคืนจากศูนย์
                                        </button>
                                    </>
                                )}

                                {formData.status === RMAStatus.REPAIRED && (
                                    <>
                                        <p className="text-[11px] text-gray-400 ml-2 mb-1">ตรวจสอบข้อมูลทั้งหมดก่อนปิดงาน กดเพื่อดูสรุปและยืนยัน</p>
                                        <button type="button" onClick={() => setShowCloseSummary(true)}
                                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold shadow-lg shadow-green-500/20 transition-all transform active:scale-[0.98]">
                                            <ClipboardCheck className="w-4 h-4" /> ✅ ตรวจสอบและปิดงาน
                                        </button>
                                    </>
                                )}

                                {formData.status !== RMAStatus.CLOSED && (
                                    <button type="button" onClick={() => setShowManualStatus(!showManualStatus)}
                                        className="mt-1 ml-2 text-[11px] text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1">
                                        <Settings2 className="w-3 h-3" /> {showManualStatus ? 'ซ่อน' : 'เปลี่ยนสถานะด้วยตนเอง'}
                                    </button>
                                )}

                                {showManualStatus && formData.status !== RMAStatus.CLOSED && (
                                    <div className="relative z-50 mt-1">
                                        <GlassSelect label="" value={formData.status || ''} onChange={val => handleFormChange('status', val)} options={statusOptions} searchable recentKey="status" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Team Picker (unchanged) */}
                        <div>
                            <div className="flex justify-between items-center mb-2 ml-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase">{t('track.assignedTeam')}</label>
                                {!isChangingTeam && (
                                    <button onClick={() => setIsChangingTeam(true)} className="text-[11px] text-blue-500 font-bold hover:underline">{t('track.changeBtn')}</button>
                                )}
                            </div>
                            {isChangingTeam ? (
                                <div className="space-y-2 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 relative z-20">
                                    <div className="grid grid-cols-1 gap-1.5">
                                        <button onClick={() => handleGroupSelect('A')} className={`p-2.5 rounded-xl border text-left text-xs flex items-center gap-2 transition-all ${mainGroup === 'A' ? 'bg-white dark:bg-[#2c2c2e] border-red-500 text-red-700 dark:text-red-400 shadow-sm' : 'bg-white dark:bg-[#1c1c1e] border-transparent text-gray-700 dark:text-gray-300'}`}><Box className="w-3.5 h-3.5 text-red-500" /> Team A: Hikvision</button>
                                        <button onClick={() => handleGroupSelect('B')} className={`p-2.5 rounded-xl border text-left text-xs flex items-center gap-2 transition-all ${mainGroup === 'B' ? 'bg-white dark:bg-[#2c2c2e] border-orange-500 text-orange-700 dark:text-orange-400 shadow-sm' : 'bg-white dark:bg-[#1c1c1e] border-transparent text-gray-700 dark:text-gray-300'}`}><Layers className="w-3.5 h-3.5 text-orange-500" /> Team B: Dahua</button>
                                        <button onClick={() => handleGroupSelect('C')} className={`p-2.5 rounded-xl border text-left text-xs flex items-center gap-2 transition-all ${mainGroup === 'C' ? 'bg-white dark:bg-[#2c2c2e] border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm' : 'bg-white dark:bg-[#1c1c1e] border-transparent text-gray-700 dark:text-gray-300'}`}><Wifi className="w-3.5 h-3.5 text-blue-500" /> Team C: Network/Others</button>
                                    </div>
                                    {mainGroup === 'C' && (
                                        <div className="grid grid-cols-1 gap-1.5 pl-3 border-l-2 border-blue-500/20">
                                            {[
                                                { val: Team.TEAM_C, label: 'Network', icon: Wifi, colorClass: 'text-blue-500', activeBg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300' },
                                                { val: Team.TEAM_E, label: 'UPS', icon: Zap, colorClass: 'text-yellow-500', activeBg: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300' },
                                                { val: Team.TEAM_G, label: 'Online', icon: ShoppingBag, colorClass: 'text-fuchsia-500', activeBg: 'bg-fuchsia-50 dark:bg-fuchsia-900/30 border-fuchsia-500 text-fuchsia-700 dark:text-fuchsia-300' }
                                            ].map(sub => (
                                                <button key={sub.val} onClick={() => setTempTeam(sub.val)} className={`p-2 rounded-lg border text-xs flex items-center gap-2 transition-all ${tempTeam === sub.val ? `${sub.activeBg} shadow-sm` : 'bg-white dark:bg-[#1c1c1e] border-transparent text-gray-700 dark:text-gray-300'}`}><sub.icon className={`w-3 h-3 ${sub.colorClass}`} /> {sub.label}</button>
                                            ))}
                                        </div>
                                    )}
                                    <button onClick={() => { setIsChangingTeam(false); setTempTeam(rma.team); }} className="w-full py-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">{t('track.cancelBtn')}</button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-3.5 bg-gray-50 dark:bg-[#2c2c2e] rounded-2xl text-sm font-bold text-[#1d1d1f] dark:text-white border border-gray-200 dark:border-[#424245]">
                                    <ShieldCheck className="w-4 h-4 text-blue-500" /> {t(`teams.${teamKey(tempTeam)}`)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ROW 2: Resolution Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('track.rootCause')}</label>
                            <input type="text" value={formData.resolution?.rootCause || ''} onChange={(e) => handleResolutionChange('rootCause', e.target.value)} className="w-full rounded-2xl px-4 py-3.5 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="e.g. Power Surge" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('track.vendorRef')}</label>
                            <input type="text" value={formData.resolution?.vendorTicketRef || ''} onChange={(e) => handleResolutionChange('vendorTicketRef', e.target.value)} className="w-full rounded-2xl px-4 py-3.5 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder="e.g. RMA-SYN-9988" />
                        </div>
                    </div>

                    {/* actionTaken summary - shown read-only when set */}
                    {formData.resolution?.actionTaken && (
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/10">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">ผลการดำเนินการ</label>
                            <div className="space-y-1.5 text-sm text-[#1d1d1f] dark:text-white">
                                <p><span className="text-gray-500 text-xs">วิธีดำเนินการ:</span> <strong>{actionOptions.find(o => o.value === formData.resolution?.actionTaken)?.label || formData.resolution?.actionTaken}</strong></p>
                                {formData.resolution?.actionDetails && (
                                    <p><span className="text-gray-500 text-xs">รายละเอียด:</span> {formData.resolution.actionDetails}</p>
                                )}
                                {formData.resolution?.replacedSerialNumber && (
                                    <p><span className="text-gray-500 text-xs">S/N ใหม่:</span> <span className="font-mono">{formData.resolution.replacedSerialNumber}</span></p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 3.5: อุปกรณ์ที่ส่งให้ผู้นำเข้า */}
            {(formData.accessories || []).length > 0 && (
                <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 mb-6 border border-gray-100 dark:border-[#333]">
                    <h2 className="font-semibold text-lg flex items-center gap-3 mb-2 text-[#1d1d1f] dark:text-white">
                        <span className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm font-bold"><Truck className="w-4 h-4" /></span>
                        อุปกรณ์ที่ส่งเคลม
                    </h2>
                    <p className="text-xs text-gray-400 mb-5 ml-11">เลือกรายการที่จะส่งไปให้ผู้นำเข้า (รายการที่ไม่เลือก = เก็บไว้ที่ร้าน)</p>
                    <div className="flex flex-wrap gap-2">
                        {/* Unit always as option */}
                        <button
                            type="button"
                            onClick={() => {
                                const current = formData.distributorSentItems || [];
                                const isActive = current.includes('unit');
                                handleFormChange('distributorSentItems', isActive ? current.filter(a => a !== 'unit') : [...current, 'unit']);
                            }}
                            className={`px-4 py-2 text-xs font-medium rounded-full border transition-all flex items-center gap-2 ${(formData.distributorSentItems || []).includes('unit')
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                    : 'bg-white dark:bg-[#2c2c2e] border-[#d2d2d7] dark:border-[#424245] text-[#1d1d1f] dark:text-gray-300 hover:border-orange-400 hover:text-orange-500'
                                }`}
                        >
                            <Box className="w-3.5 h-3.5" /> ตัวเครื่อง (Unit)
                        </button>
                        {(formData.accessories || []).map((acc, idx) => {
                            const isActive = (formData.distributorSentItems || []).includes(acc);
                            const label = acc.startsWith('acc_hdd::') ? `HDD (${acc.split('::')[1]})` : (acc.startsWith('acc_') ? t(`accessories_list.${acc}`) : acc);
                            return (
                                <button
                                    key={`${acc}-${idx}`}
                                    type="button"
                                    onClick={() => {
                                        const current = formData.distributorSentItems || [];
                                        handleFormChange('distributorSentItems', isActive ? current.filter(a => a !== acc) : [...current, acc]);
                                    }}
                                    className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${isActive
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                            : 'bg-white dark:bg-[#2c2c2e] border-[#d2d2d7] dark:border-[#424245] text-[#1d1d1f] dark:text-gray-300 hover:border-orange-400 hover:text-orange-500'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* SECTION 4: บันทึก */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 mb-6 border border-gray-100 dark:border-[#333]">
                <h2 className="font-semibold text-lg flex items-center gap-3 mb-6 text-[#1d1d1f] dark:text-white">
                    <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-sm font-bold">4</span>
                    {t('track.internalNote')}
                </h2>
                <textarea value={formData.notes || ''} onChange={e => handleFormChange('notes', e.target.value)} rows={4} className="w-full rounded-2xl px-4 py-3.5 text-sm text-[#1d1d1f] dark:text-white bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] outline-none" placeholder={t('track.addNotesPlaceholder')} />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end items-center gap-4 px-2 pb-8">
                <button onClick={handleSafeClose} className="px-8 py-3.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors">
                    {t('track.cancelBtn')}
                </button>
                <button onClick={handlePreSave} className="px-10 py-3.5 rounded-full text-sm font-bold text-white bg-[#0071e3] hover:bg-[#0077ed] shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 transform hover:scale-[1.01] active:scale-[0.98]">
                    ตรวจสอบและบันทึก <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* UNSAVED CHANGES MODAL */}
            {showUnsavedModal && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fade-in font-sans">
                    <div className="bg-white dark:bg-[#1e1e20] w-full max-w-sm rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-7 h-7 text-amber-500" />
                            </div>
                            <h3 className="font-bold text-[#1d1d1f] dark:text-white text-lg mb-2">ยังไม่ได้บันทึก</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">คุณมีรายการที่แก้ไขแต่ยังไม่ได้บันทึก<br />หากออกจากหน้านี้ การแก้ไขทั้งหมดจะหายไป</p>
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button onClick={() => setShowUnsavedModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-[#0071e3] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                กลับไปแก้ไข
                            </button>
                            <button onClick={() => { setShowUnsavedModal(false); onClose(); }} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                                ออกโดยไม่บันทึก
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ACCESSORIES REVIEW MODAL */}
            {showAccReview && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fade-in font-sans">
                    <div className="bg-white dark:bg-[#1e1e20] w-full max-w-md rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1d1d1f] dark:text-white text-base">ยืนยันการแก้ไขอุปกรณ์</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">กรุณาตรวจสอบรายการที่เปลี่ยนแปลง</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAccReview(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-3">
                            {(() => {
                                const current = formData.accessories || [];
                                const added = current.filter(a => !accessoriesBackup.includes(a));
                                const removed = accessoriesBackup.filter(a => !current.includes(a));
                                const fmtLabel = (a: string) => a.startsWith('acc_hdd::') ? `HDD (${a.split('::')[1]})` : (a.startsWith('acc_') ? t(`accessories_list.${a}`) : a);
                                return (
                                    <>
                                        {added.map((a, i) => (
                                            <div key={`add-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30">
                                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><Plus className="w-3 h-3 text-white" /></div>
                                                <span className="text-sm font-medium text-green-700 dark:text-green-400">เพิ่ม: {fmtLabel(a)}</span>
                                            </div>
                                        ))}
                                        {removed.map((a, i) => (
                                            <div key={`rm-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                                                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0"><X className="w-3 h-3 text-white" /></div>
                                                <span className="text-sm font-medium text-red-700 dark:text-red-400">เอาออก: {fmtLabel(a)}</span>
                                            </div>
                                        ))}
                                        <p className="text-xs text-gray-400 text-center pt-1">{added.length + removed.length} รายการที่เปลี่ยนแปลง</p>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={() => setShowAccReview(false)} className="px-5 py-2.5 text-sm font-medium rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">ยกเลิก</button>
                            <button onClick={() => { setShowAccReview(false); setIsAccessoriesLocked(true); }} className="px-5 py-2.5 text-sm font-semibold rounded-full text-white bg-[#0071e3] hover:bg-[#0077ED] transition-colors flex items-center gap-2">
                                <Check className="w-4 h-4" /> ยืนยันการเปลี่ยนแปลง
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* VENDOR RESULT POPUP */}
            {showVendorResultPopup && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fade-in font-sans">
                    <div className="bg-white dark:bg-[#1e1e20] w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/10">
                            <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                <PackageCheck className="w-6 h-6 text-blue-500" /> 📥 ลงผลจากศูนย์
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">กรอกรายละเอียดที่ศูนย์แจ้งมา</p>
                        </div>
                        <div className="p-8 space-y-5 overflow-y-auto">
                            <div className="relative z-50">
                                <GlassSelect label="วิธีดำเนินการ" value={vendorForm.actionTaken} onChange={val => setVendorForm(p => ({ ...p, actionTaken: val }))} options={actionOptions.filter(o => o.value !== '')} placeholder="เลือกวิธีดำเนินการ" searchable />
                            </div>
                            {vendorForm.actionTaken === 'Replaced Component' && (
                                <div>
                                    <label className="block text-xs font-semibold text-orange-500 uppercase mb-1.5 ml-2">รายละเอียดการเปลี่ยนอะไหล่</label>
                                    <input type="text" value={vendorForm.actionDetails} onChange={e => setVendorForm(p => ({ ...p, actionDetails: e.target.value }))} className="w-full px-4 py-3.5 text-sm rounded-2xl outline-none bg-white dark:bg-[#2c2c2e] border border-orange-300 dark:border-orange-500/30 text-[#1d1d1f] dark:text-white" placeholder="เช่น เปลี่ยน Mainboard" />
                                </div>
                            )}
                            {vendorForm.actionTaken === 'Swapped Unit' && (
                                <div>
                                    <label className="block text-xs font-semibold text-green-500 uppercase mb-1.5 ml-2 flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> S/N สินค้าตัวใหม่</label>
                                    <input type="text" value={vendorForm.replacedSerialNumber} onChange={e => setVendorForm(p => ({ ...p, replacedSerialNumber: e.target.value }))} className="w-full px-4 py-3.5 text-sm rounded-2xl outline-none bg-white dark:bg-[#2c2c2e] border border-green-300 dark:border-green-500/30 text-[#1d1d1f] dark:text-white" placeholder="Enter New S/N" />
                                </div>
                            )}
                            {vendorForm.actionTaken === 'Other' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-2">ระบุวิธีดำเนินการ</label>
                                    <input type="text" value={vendorForm.actionDetails} onChange={e => setVendorForm(p => ({ ...p, actionDetails: e.target.value }))} className="w-full px-4 py-3.5 text-sm rounded-2xl outline-none bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] text-[#1d1d1f] dark:text-white" placeholder="ระบุ..." />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-2">เลข RMA Vendor</label>
                                <input type="text" value={vendorForm.vendorTicketRef} onChange={e => setVendorForm(p => ({ ...p, vendorTicketRef: e.target.value }))} className="w-full px-4 py-3.5 text-sm rounded-2xl outline-none bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] text-[#1d1d1f] dark:text-white" placeholder="e.g. RMA-SYN-9988" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#2c2c2e] flex justify-end gap-3">
                            <button onClick={() => setShowVendorResultPopup(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">ยกเลิก</button>
                            <button onClick={() => {
                                if (!vendorForm.actionTaken) { alert('กรุณาเลือกวิธีดำเนินการ'); return; }
                                // Apply vendor form to resolution
                                setFormData(prev => prev ? ({
                                    ...prev,
                                    status: RMAStatus.REPAIRED,
                                    resolution: {
                                        ...prev.resolution!,
                                        actionTaken: vendorForm.actionTaken === 'Other' ? vendorForm.actionDetails : vendorForm.actionTaken,
                                        actionDetails: vendorForm.actionTaken === 'Replaced Component' ? vendorForm.actionDetails : (prev.resolution?.actionDetails || ''),
                                        replacedSerialNumber: vendorForm.replacedSerialNumber || (prev.resolution?.replacedSerialNumber || ''),
                                        vendorTicketRef: vendorForm.vendorTicketRef || (prev.resolution?.vendorTicketRef || '')
                                    }
                                }) : null);
                                if (vendorForm.actionTaken === 'Other') setCustomAction(vendorForm.actionDetails);
                                setShowVendorResultPopup(false);
                            }} className="px-8 py-2.5 rounded-full text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                                <Check className="w-4 h-4" /> บันทึกผล
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* CLOSE JOB SUMMARY POPUP */}
            {showCloseSummary && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fade-in font-sans">
                    <div className="bg-white dark:bg-[#1e1e20] w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/10">
                            <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                <ClipboardCheck className="w-6 h-6 text-green-500" /> 📋 สรุปก่อนปิดงาน
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">ตรวจสอบข้อมูลก่อนปิดงาน เมื่อปิดแล้วข้อมูลจะถูกล็อค</p>
                        </div>
                        <div className="p-8 space-y-4 overflow-y-auto">
                            <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/10 space-y-2.5 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">สินค้า</span><strong className="text-[#1d1d1f] dark:text-white">{formData.brand} {formData.productModel}</strong></div>
                                <div className="flex justify-between"><span className="text-gray-500">S/N</span><span className="font-mono text-[#1d1d1f] dark:text-white">{formData.serialNumber}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">อาการที่ลูกค้าแจ้ง</span><span className="text-[#1d1d1f] dark:text-white">{formData.issueDescription || '-'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">อาการที่พบ</span><span className="text-[#1d1d1f] dark:text-white">{formData.resolution?.rootCause || '-'}</span></div>
                                <hr className="border-gray-200 dark:border-gray-700" />
                                <div className="flex justify-between"><span className="text-gray-500">วิธีดำเนินการ</span><strong className="text-[#1d1d1f] dark:text-white">{actionOptions.find(o => o.value === formData.resolution?.actionTaken)?.label || formData.resolution?.actionTaken || '-'}</strong></div>
                                {formData.resolution?.actionDetails && (
                                    <div className="flex justify-between"><span className="text-gray-500">รายละเอียด</span><span className="text-[#1d1d1f] dark:text-white">{formData.resolution.actionDetails}</span></div>
                                )}
                                {formData.resolution?.replacedSerialNumber && (
                                    <div className="flex justify-between"><span className="text-gray-500">S/N ใหม่</span><span className="font-mono text-[#1d1d1f] dark:text-white">{formData.resolution.replacedSerialNumber}</span></div>
                                )}
                                {formData.resolution?.vendorTicketRef && (
                                    <div className="flex justify-between"><span className="text-gray-500">เลข RMA Vendor</span><span className="text-[#1d1d1f] dark:text-white">{formData.resolution.vendorTicketRef}</span></div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/30">
                                <span className="text-lg">⚠️</span>
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">เมื่อปิดงานแล้ว ข้อมูลจะถูกล็อค ต้องปลดล็อคก่อนถึงจะแก้ไขได้</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#2c2c2e] flex justify-end gap-3">
                            <button onClick={() => setShowCloseSummary(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">ย้อนกลับแก้ไข</button>
                            <button onClick={() => {
                                handleFormChange('status', RMAStatus.CLOSED);
                                setShowCloseSummary(false);
                            }} className="px-8 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 transform active:scale-95">
                                <Check className="w-4 h-4" /> ✅ ยืนยันปิดงาน
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* REVIEW MODAL OVERLAY */}
            {isReviewing && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fade-in font-sans">
                    <div className="bg-white dark:bg-[#1e1e20] w-full max-w-3xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    {t('track.confirmChanges')}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{t('track.verifyChangesMsg')} <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{rma.id}</span></p>
                            </div>
                            <button onClick={() => setIsReviewing(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-black/20 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-8 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs w-1/4">{t('track.field')}</th>
                                        <th className="px-8 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs w-1/3">{t('track.oldValue')}</th>
                                        <th className="px-8 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs w-1/3">{t('track.newValue')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {diffs.map((diff, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-8 py-4 font-medium text-gray-700 dark:text-gray-300 border-r border-gray-50 dark:border-white/5">{diff.field}</td>
                                            <td className="px-8 py-4 text-gray-500 line-through opacity-60 decoration-red-400/50">{diff.old}</td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg w-fit">
                                                    {diff.new}
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#2c2c2e] flex justify-between items-center">
                            <div className="text-xs text-gray-400">
                                <span className="font-bold text-gray-600 dark:text-gray-300">{diffs.length}</span> {t('track.field')}{diffs.length > 1 ? 's' : ''} modified
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsReviewing(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    {t('track.cancelEdit')}
                                </button>
                                <button onClick={handleFinalSave} disabled={isSaving} className="px-8 py-2.5 rounded-full text-sm font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 transform active:scale-95">
                                    {isSaving ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>
                                    ) : (
                                        <>{t('track.confirmChanges')} <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* HDD Modal */}
            {showHddModal && (
                <HddBulkModal
                    initialSerials={(formData.accessories || []).filter(a => a.startsWith('acc_hdd::')).map(a => a.split('::')[1])}
                    onClose={() => setShowHddModal(false)}
                    onConfirm={(serials) => {
                        const nonHdd = (formData.accessories || []).filter(a => !a.startsWith('acc_hdd::'));
                        handleFormChange('accessories', [...nonHdd, ...serials.map(s => `acc_hdd::${s}`)]);
                        setShowHddModal(false);
                    }}
                />
            )}

            </fieldset>
        </div>
    );
};

