import React, { useState, useEffect } from 'react';
import { RMA, RMAStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Save, AlertCircle, ArrowRight, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { GlassSelect } from './GlassSelect';
import { MockDb } from '../services/mockDb';

interface EditRMAModalProps {
    isOpen: boolean;
    onClose: () => void;
    rma: RMA;
    onSave: (rmaId: string, updates: Partial<RMA>, diffs: { field: string, old: string, new: string }[]) => Promise<void>;
}

export const EditRMAModal: React.FC<EditRMAModalProps> = ({ isOpen, onClose, rma, onSave }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<Partial<RMA>>({});
    const [distOptions, setDistOptions] = useState<any[]>([]);
    const [isReviewing, setIsReviewing] = useState(false);
    const [diffs, setDiffs] = useState<{ field: string, old: string, new: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [customDist, setCustomDist] = useState('');

    useEffect(() => {
        if (isOpen && rma) {
            setFormData({
                issueDescription: rma.issueDescription,
                distributor: rma.distributor,
                repairCosts: { ...rma.repairCosts }, // Deep copy for nested object
                status: rma.status,
                notes: rma.notes || ''
            });
            setIsReviewing(false);
            setDiffs([]);
            setCustomDist('');

            // Load options
            const loadDists = async () => {
                const dists = await MockDb.getDistributors();
                setDistOptions([...dists, { value: 'Other', label: t('submit.other') }]);
            };
            loadDists();
        }
    }, [isOpen, rma, t]);

    if (!isOpen || !rma) return null;

    const handleFormChange = (field: keyof RMA | 'warrantyStatus', value: any) => {
        if (field === 'warrantyStatus') {
            setFormData(prev => ({
                ...prev,
                repairCosts: { ...prev.repairCosts!, warrantyStatus: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const calculateDiffs = () => {
        const newDiffs: { field: string, old: string, new: string }[] = [];

        // Helper to format values for display
        const fmt = (val: any) => val ? String(val) : '(Empty)';

        if (formData.issueDescription !== rma.issueDescription) {
            newDiffs.push({ field: t('track.issueReported'), old: fmt(rma.issueDescription), new: fmt(formData.issueDescription) });
        }

        const currentDist = formData.distributor === 'Other' ? customDist : formData.distributor;
        if (currentDist !== rma.distributor) {
            newDiffs.push({ field: t('submit.distributor'), old: fmt(rma.distributor), new: fmt(currentDist) });
        }

        if (formData.repairCosts?.warrantyStatus !== rma.repairCosts?.warrantyStatus) {
            const oldW = rma.repairCosts?.warrantyStatus ? t(`warranty.${rma.repairCosts.warrantyStatus}`) : '-';
            const newW = formData.repairCosts?.warrantyStatus ? t(`warranty.${formData.repairCosts.warrantyStatus}`) : '-';
            newDiffs.push({ field: t('track.warrantyStatus'), old: oldW, new: newW });
        }

        if (formData.status !== rma.status) {
            newDiffs.push({ field: t('track.statusLabel'), old: t(`status.${rma.status}`), new: t(`status.${formData.status}`) });
        }

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
        // Prepare final updater object
        const updates: Partial<RMA> = {
            ...formData,
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all animate-scale-up border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#2c2c2e]">
                    <div>
                        <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                            {isReviewing ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-blue-500" />}
                            {isReviewing ? 'ตรวจสอบความถูกต้องของการแก้ไข' : t('track.edit')}
                        </h2>
                        <p className="text-xs text-gray-500">{rma.productModel} • {rma.serialNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6">
                    {isReviewing ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 text-center mb-4">กรุณาตรวจสอบรายการที่แก้ไขด้านล่างก่อนยืนยัน</p>
                            <div className="space-y-3">
                                {diffs.map((diff, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                                        <div className="w-1/3 text-xs font-bold text-gray-400 uppercase text-right">{diff.field}</div>
                                        <div className="flex-grow flex items-center gap-3 text-sm">
                                            <span className="text-red-500 line-through opacity-70">{diff.old}</span>
                                            <ArrowRight className="w-4 h-4 text-gray-400" />
                                            <span className="text-green-600 dark:text-green-400 font-bold">{diff.new}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Issue */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{t('track.issueReported')}</label>
                                <textarea
                                    value={formData.issueDescription}
                                    onChange={e => handleFormChange('issueDescription', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm rounded-xl outline-none bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-[#1d1d1f] dark:text-white focus:ring-2 focus:ring-[#0071e3]"
                                />
                            </div>

                            {/* Distributor & Warranty Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <GlassSelect
                                        label={t('submit.distributor')}
                                        value={formData.distributor || ''}
                                        onChange={val => handleFormChange('distributor', val)}
                                        options={distOptions}
                                        placeholder="Select..."
                                    />
                                    {formData.distributor === 'Other' && (
                                        <input
                                            value={customDist}
                                            onChange={e => setCustomDist(e.target.value)}
                                            className="mt-2 w-full px-3 py-2 text-xs rounded-xl outline-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#1d1d1f] dark:text-white focus:ring-1 focus:ring-[#0071e3]"
                                            placeholder="Specify Distributor..."
                                        />
                                    )}
                                </div>
                                <div>
                                    <GlassSelect
                                        label={t('track.warrantyStatus')}
                                        value={formData.repairCosts?.warrantyStatus || ''}
                                        onChange={val => handleFormChange('warrantyStatus', val)}
                                        options={warrantyOptions}
                                        placeholder="Select..."
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <GlassSelect
                                    label={t('track.statusLabel')}
                                    value={formData.status || ''}
                                    onChange={val => handleFormChange('status', val)}
                                    options={statusOptions}
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{t('track.internalNote')}</label>
                                <textarea
                                    value={formData.notes || ''}
                                    onChange={e => handleFormChange('notes', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm rounded-xl outline-none bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-[#1d1d1f] dark:text-white focus:ring-2 focus:ring-[#0071e3]"
                                    placeholder="Add internal notes..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#2c2c2e] flex justify-end gap-3">
                    {isReviewing ? (
                        <>
                            <button
                                onClick={() => setIsReviewing(false)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> กลับไปแก้ไข
                            </button>
                            <button
                                onClick={handleFinalSave}
                                disabled={isSaving}
                                className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                            >
                                {isSaving ? 'Saving...' : <>ยืนยันและบันทึกข้อมูล <CheckCircle2 className="w-4 h-4" /></>}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePreSave}
                                className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-[#0071e3] hover:bg-[#0077ed] shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                            >
                                บันทึกข้อมูล <ChevronRight className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
