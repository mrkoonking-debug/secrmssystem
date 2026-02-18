import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RMA, RMAStatus, Team, DelayReason, ResolutionDetails } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Save, AlertCircle, ArrowRight, CheckCircle2, ChevronRight, RotateCcw, Truck, Box, Layers, Wifi, Zap, ShoppingBag, ShieldCheck, RefreshCw, AlertOctagon } from 'lucide-react';
import { GlassSelect } from './GlassSelect';
import { MockDb } from '../services/mockDb';

interface EditRMAFullPageProps {
    isOpen: boolean;
    onClose: () => void;
    rma: RMA;
    onSave: (rmaId: string, updates: Partial<RMA>, diffs: { field: string, old: string, new: string }[]) => Promise<void>;
}

export const EditRMAFullPage: React.FC<EditRMAFullPageProps> = ({ isOpen, onClose, rma, onSave }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<RMA | null>(null);
    const [distOptions, setDistOptions] = useState<any[]>([]);
    const [isReviewing, setIsReviewing] = useState(false);
    const [diffs, setDiffs] = useState<{ field: string, old: string, new: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [customDist, setCustomDist] = useState('');

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

            // Sync Team
            setTempTeam(rma.team);
            if (rma.team === Team.HIKVISION) setMainGroup('A');
            else if (rma.team === Team.DAHUA) setMainGroup('B');
            else if ([Team.TEAM_C, Team.TEAM_E, Team.TEAM_G].includes(rma.team)) setMainGroup('C');
            else setMainGroup('');

            // Load options
            const loadDists = async () => {
                const dists = await MockDb.getDistributors();
                setDistOptions([...dists, { value: 'Other', label: t('submit.other') }]);
            };
            loadDists();
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
        if (formData.resolution?.actionTaken !== rma.resolution?.actionTaken) {
            newDiffs.push({ field: t('track.actionTaken'), old: fmt(rma.resolution?.actionTaken), new: fmt(formData.resolution?.actionTaken) });
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
            distributor: formData.distributor === 'Other' ? customDist : formData.distributor
        };

        await onSave(rma.id, updates, diffs);
        setIsSaving(false);
        onClose();
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
        { value: "Sent to Vendor", label: t('actions.sent_to_vendor') }
    ];

    const showNewSerialInput = formData.resolution?.actionTaken === "Swapped Unit" || formData.resolution?.actionTaken === "Replaced Component";

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className={`bg-white dark:bg-[#1c1c1e] w-full max-w-[95vw] h-full shadow-2xl flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#2c2c2e]">
                    <div>
                        <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-blue-500" />
                            {t('track.edit')}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="font-mono bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{rma.id}</span>
                            <span>{rma.productModel}</span>
                            <span>•</span>
                            <span>{rma.serialNumber}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-8 bg-[#f5f5f7] dark:bg-black relative">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-20"> {/* pb-20 for footer space */}

                        {/* COLUMN 1: Intake & Products (Span 4) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 h-full">
                                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                                    <AlertOctagon className="w-5 h-5 text-gray-400" /> Intake Information
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{t('track.issueReported')}</label>
                                        <textarea
                                            value={formData.issueDescription}
                                            onChange={e => handleFormChange('issueDescription', e.target.value)}
                                            rows={5}
                                            className="w-full px-4 py-3 text-sm rounded-xl outline-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#1d1d1f] dark:text-white focus:ring-2 focus:ring-[#0071e3]"
                                        />
                                    </div>
                                    <div>
                                        <GlassSelect
                                            label={t('submit.distributor')}
                                            value={formData.distributor || ''}
                                            onChange={val => handleFormChange('distributor', val)}
                                            options={distOptions}
                                        />
                                        {formData.distributor === 'Other' && (
                                            <input
                                                value={customDist}
                                                onChange={e => setCustomDist(e.target.value)}
                                                className="mt-2 w-full px-3 py-2 text-xs rounded-xl outline-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#1d1d1f] dark:text-white"
                                                placeholder="Specify Distributor..."
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <GlassSelect
                                            label={t('track.warrantyStatus')}
                                            value={formData.repairCosts?.warrantyStatus || ''}
                                            onChange={handleWarrantyChange}
                                            options={warrantyOptions}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 2: Resolution & Status & Team (Span 4) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 h-full">
                                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                                    <ShieldCheck className="w-5 h-5 text-gray-400" /> Status & Resolution
                                </h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <GlassSelect
                                            label={t('track.statusLabel')}
                                            value={formData.status || ''}
                                            onChange={val => handleFormChange('status', val)}
                                            options={statusOptions}
                                        />
                                        <div>
                                            <div className="flex justify-between items-center mb-2 ml-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('track.assignedTeam')}</label>
                                                {!isChangingTeam && (
                                                    <button onClick={() => setIsChangingTeam(true)} className="text-[10px] text-blue-500 font-bold hover:underline">Change</button>
                                                )}
                                            </div>
                                            {isChangingTeam ? (
                                                <div className="space-y-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 relative z-20">
                                                    <div className="grid grid-cols-1 gap-1.5">
                                                        <button onClick={() => handleGroupSelect('A')} className={`p-2 rounded-lg border text-left text-xs flex items-center gap-2 ${mainGroup === 'A' ? 'bg-white dark:bg-[#2c2c2e] border-red-500 text-red-700 dark:text-red-400' : 'bg-white dark:bg-[#1c1c1e] border-transparent text-gray-700 dark:text-gray-300'}`}><Box className="w-3 h-3 text-red-500" /> Team A</button>
                                                        <button onClick={() => handleGroupSelect('B')} className={`p-2 rounded-lg border text-left text-xs flex items-center gap-2 ${mainGroup === 'B' ? 'bg-white dark:bg-[#2c2c2e] border-orange-500 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-[#1c1c1e] border-transparent text-gray-700 dark:text-gray-300'}`}><Layers className="w-3 h-3 text-orange-500" /> Team B</button>
                                                        <button onClick={() => handleGroupSelect('C')} className={`p-2 rounded-lg border text-left text-xs flex items-center gap-2 ${mainGroup === 'C' ? 'bg-white dark:bg-[#2c2c2e] border-blue-500 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-[#1c1c1e] border-transparent text-gray-700 dark:text-gray-300'}`}><Wifi className="w-3 h-3 text-blue-500" /> Team C</button>
                                                    </div>
                                                    {mainGroup === 'C' && (
                                                        <div className="grid grid-cols-1 gap-1.5 pl-3 border-l-2 border-blue-500/20">
                                                            {[
                                                                { val: Team.TEAM_C, label: 'Network', icon: Wifi },
                                                                { val: Team.TEAM_E, label: 'UPS', icon: Zap },
                                                                { val: Team.TEAM_G, label: 'Online', icon: ShoppingBag }
                                                            ].map(sub => (
                                                                <button key={sub.val} onClick={() => setTempTeam(sub.val)} className={`p-2 rounded-lg border text-[10px] flex items-center gap-2 ${tempTeam === sub.val ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-[#1c1c1e] border-transparent text-gray-700 dark:text-gray-300'}`}><sub.icon className="w-3 h-3" /> {sub.label}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <button onClick={() => { setIsChangingTeam(false); setTempTeam(rma.team); }} className="w-full py-1 text-[10px] text-gray-400 hover:text-red-500">Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm font-bold text-[#1d1d1f] dark:text-white border border-gray-200 dark:border-white/10">
                                                    <ShieldCheck className="w-4 h-4 text-blue-500" /> {t(`teams.${teamKey(tempTeam)}`)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <GlassSelect label={t('track.actionTaken')} value={formData.resolution?.actionTaken || ''} onChange={val => handleResolutionChange('actionTaken', val)} options={actionOptions} />

                                    {/* ALWAYS VISIBLE but Disabled if not Swapped */}
                                    <div>
                                        <label className={`block text-xs font-bold uppercase mb-2 ml-1 tracking-wider flex items-center gap-1 ${showNewSerialInput ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                            <RefreshCw className="w-3 h-3" /> {t('track.newSerial')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.resolution?.replacedSerialNumber || ''}
                                            onChange={(e) => handleResolutionChange('replacedSerialNumber', e.target.value)}
                                            disabled={!showNewSerialInput}
                                            className={`w-full px-4 py-3 text-sm rounded-xl outline-none border transition-colors ${showNewSerialInput
                                                ? 'bg-white dark:bg-[#1c1c1e] border-green-200 dark:border-green-500/30 focus:ring-2 focus:ring-green-500 text-[#1d1d1f] dark:text-white'
                                                : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-400 cursor-not-allowed'
                                                }`}
                                            placeholder={showNewSerialInput ? "Enter New S/N" : "N/A"}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">{t('track.rootCause')}</label>
                                            <input type="text" value={formData.resolution?.rootCause || ''} onChange={(e) => handleResolutionChange('rootCause', e.target.value)} className="w-full px-4 py-3 text-sm rounded-xl outline-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-[#0071e3] text-[#1d1d1f] dark:text-white" placeholder="e.g. Power Surge" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">{t('track.vendorRef')}</label>
                                            <input type="text" value={formData.resolution?.vendorTicketRef || ''} onChange={(e) => handleResolutionChange('vendorTicketRef', e.target.value)} className="w-full px-4 py-3 text-sm rounded-xl outline-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-[#0071e3] text-[#1d1d1f] dark:text-white" placeholder="e.g. RMA-SYN-9988" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 3: Logistics & Notes (Span 4) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 h-full">
                                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                                    <Truck className="w-5 h-5 text-gray-400" /> Logistics & Notes
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">{t('track.delayReason')}</label>
                                        {formData.delayReason === 'NONE' ? (
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm font-medium text-green-600">
                                                    <CheckCircle2 className="w-4 h-4" /> {t('delays.NONE')}
                                                </div>
                                                <button onClick={() => handleFormChange('delayReason', 'WAITING_PARTS')} className="px-4 py-3 text-xs font-bold text-orange-500 hover:bg-orange-50 rounded-xl border border-orange-200 transition-colors">แจ้งล่าช้า</button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <GlassSelect value={formData.delayReason || ''} onChange={val => handleFormChange('delayReason', val)} options={delayOptions.filter(d => d.value !== 'NONE')} hasError />
                                                <button onClick={() => handleFormChange('delayReason', 'NONE')} className="text-xs font-bold text-green-500 hover:underline ml-1">กลับเป็นปกติ</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-grow">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{t('track.internalNote')}</label>
                                        <textarea
                                            value={formData.notes || ''}
                                            onChange={e => handleFormChange('notes', e.target.value)}
                                            rows={6}
                                            className="w-full px-4 py-3 text-sm rounded-xl outline-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#1d1d1f] dark:text-white focus:ring-2 focus:ring-[#0071e3]"
                                            placeholder="Add internal notes..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* REVIEW MODAL OVERLAY - Uses Portal to escape parent transform context */}
                    {isReviewing && createPortal(
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-fade-in font-sans">
                            <div className="bg-white dark:bg-[#1e1e20] w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden">

                                {/* Modal Header */}
                                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between bg-gray-50/50 dark:bg-white/5">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            Confirm Changes
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">Please verify the following updates for RMA <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{rma.id}</span></p>
                                    </div>
                                    <button onClick={() => setIsReviewing(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Content - Table View */}
                                <div className="p-0 overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-black/20 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-8 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs w-1/4">Field</th>
                                                <th className="px-8 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs w-1/3">Original Value</th>
                                                <th className="px-8 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs w-1/3">New Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {diffs.map((diff, index) => (
                                                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-8 py-4 font-medium text-gray-700 dark:text-gray-300 border-r border-gray-50 dark:border-white/5">
                                                        {diff.field}
                                                    </td>
                                                    <td className="px-8 py-4 text-gray-500 line-through opacity-60 decoration-red-400/50">
                                                        {diff.old}
                                                    </td>
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

                                {/* Modal Footer */}
                                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#2c2c2e] flex justify-between items-center z-20">
                                    <div className="text-xs text-gray-400">
                                        <span className="font-bold text-gray-600 dark:text-gray-300">{diffs.length}</span> field{diffs.length > 1 ? 's' : ''} modified
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsReviewing(false)}
                                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Back to Edit
                                        </button>
                                        <button
                                            onClick={handleFinalSave}
                                            disabled={isSaving}
                                            className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 transform active:scale-95"
                                        >
                                            {isSaving ? (
                                                <>Processing...</>
                                            ) : (
                                                <>Confirm Update <ArrowRight className="w-4 h-4" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </div>

                {/* Footer (Main Drawer) */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#2c2c2e] flex justify-end gap-3 z-20">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePreSave}
                        className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#0071e3] hover:bg-[#0077ed] shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        ตรวจสอบและบันทึก <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
