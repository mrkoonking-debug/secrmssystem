import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RMA, RMAStatus, Team, DelayReason, ResolutionDetails } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Save, AlertCircle, ArrowRight, CheckCircle2, ChevronRight, RotateCcw, Truck, Box, Layers, Wifi, Zap, ShoppingBag, ShieldCheck, RefreshCw, AlertOctagon, Plus, Check } from 'lucide-react';
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

        return newDiffs;
    };

    const handlePreSave = () => {
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
                actionTaken: formData.resolution.actionTaken === 'Other' ? customAction : formData.resolution.actionTaken
            };
        }

        // Firebase Firestore does not accept 'undefined' values.
        // We strip them out cleanly.
        Object.keys(updates).forEach(key => {
            if (updates[key as keyof Partial<RMA>] === undefined) {
                delete updates[key as keyof Partial<RMA>];
            }
        });

        try {
            await onSave(rma.id, updates, diffs);
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
        { value: "Replaced Component", label: t('actions.replaced_component') },
        { value: "Swapped Unit", label: t('actions.swapped_unit') },
        { value: "Software Update", label: t('actions.software_update') },
        { value: "No Fault Found", label: t('actions.no_fault_found') },
        { value: "Other", label: t('submit.other') }
    ];

    const showNewSerialInput = formData.resolution?.actionTaken === "Swapped Unit" || formData.resolution?.actionTaken === "Replaced Component";

    return (
        <div className="max-w-5xl mx-auto py-6 px-4 animate-fade-in">
            {/* PAGE HEADER */}
            <div className="flex justify-between items-end mb-8 px-2">
                <div>
                    <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-1">{t('track.edit')}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="font-mono bg-gray-200 dark:bg-gray-600 px-2.5 py-0.5 rounded-lg text-gray-700 dark:text-gray-300 font-bold">{rma.id}</span>
                        {rma.groupRequestId && (
                            <span className="font-mono bg-[#0071e3]/10 text-[#0071e3] px-2.5 py-0.5 rounded-lg font-bold border border-[#0071e3]/20">Job: {rma.groupRequestId}</span>
                        )}
                        <span>{rma.brand} {rma.productModel}</span>
                        <span>•</span>
                        <span className="font-mono">{rma.serialNumber}</span>
                    </div>
                </div>
                <button onClick={onClose} className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 rotate-180" /> กลับ
                </button>
            </div>

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
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-3 ml-2">{t('submit.accessories')}</label>
                        <div className="flex flex-wrap gap-2 mb-2">
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
                        <div className="flex gap-2 mb-2">
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
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-[#2c2c2e] rounded-2xl border border-gray-200 dark:border-[#424245]">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-50">
                        <div className="relative z-50">
                            <GlassSelect label={t('track.statusLabel')} value={formData.status || ''} onChange={val => handleFormChange('status', val)} options={statusOptions} searchable recentKey="status" />
                        </div>
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

                    <div className="relative z-40">
                        <GlassSelect label={t('track.actionTaken')} value={formData.resolution?.actionTaken || ''} onChange={(val) => handleResolutionChange('actionTaken', val)} options={actionOptions} placeholder={t('track.selectAction')} searchable recentKey="actionTaken" />
                        {formData.resolution?.actionTaken === 'Other' && (
                            <input type="text" value={customAction} onChange={(e) => setCustomAction(e.target.value)} className="mt-2 w-full px-4 py-3.5 text-sm rounded-2xl outline-none bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] text-[#1d1d1f] dark:text-white" placeholder="Specify action taken..." autoFocus />
                        )}
                    </div>

                    <div>
                        <label className={`block text-xs font-semibold uppercase mb-2 ml-2 flex items-center gap-1 ${showNewSerialInput ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                            <RefreshCw className="w-3.5 h-3.5" /> {t('track.newSerial')}
                        </label>
                        <input type="text" value={formData.resolution?.replacedSerialNumber || ''} onChange={(e) => handleResolutionChange('replacedSerialNumber', e.target.value)} disabled={!showNewSerialInput} className={`w-full rounded-2xl px-4 py-3.5 text-sm outline-none border transition-colors ${showNewSerialInput ? 'bg-white dark:bg-[#2c2c2e] border-green-300 dark:border-green-500/30 text-[#1d1d1f] dark:text-white' : 'bg-gray-100 dark:bg-[#2c2c2e] border-gray-200 dark:border-[#424245] text-gray-400 cursor-not-allowed'}`} placeholder={showNewSerialInput ? "Enter New S/N" : "N/A"} />
                    </div>

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
                </div>
            </div>

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
                <button onClick={onClose} className="px-8 py-3.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors">
                    {t('track.cancelBtn')}
                </button>
                <button onClick={handlePreSave} className="px-10 py-3.5 rounded-full text-sm font-bold text-white bg-[#0071e3] hover:bg-[#0077ed] shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 transform hover:scale-[1.01] active:scale-[0.98]">
                    ตรวจสอบและบันทึก <ChevronRight className="w-4 h-4" />
                </button>
            </div>

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
        </div>
    );
};

