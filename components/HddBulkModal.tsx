
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HardDrive, Minus, Plus, Check, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HddBulkModalProps {
    initialSerials?: string[];
    onClose: () => void;
    onConfirm: (serials: string[]) => void;
}

/**
 * Shared HDD entry modal — used by ProductEntryForm and EditRMADrawer.
 * Allows entering serial numbers for one or more HDDs.
 */
export const HddBulkModal: React.FC<HddBulkModalProps> = ({
    initialSerials = [],
    onClose,
    onConfirm,
}) => {
    const { t } = useLanguage();
    const [quantity, setQuantity] = useState(Math.max(1, initialSerials.length));
    const [serials, setSerials] = useState<string[]>(
        initialSerials.length > 0 ? initialSerials : ['']
    );
    const listRef = useRef<HTMLDivElement>(null);

    const updateQty = (newQ: number) => {
        const q = Math.max(1, Math.min(50, newQ));
        setQuantity(q);
        setSerials(prev => {
            const next = [...prev];
            while (next.length < q) next.push('');
            while (next.length > q) next.pop();
            return next;
        });
        if (newQ > quantity) {
            setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 100);
        }
    };

    const handleConfirm = () => {
        const valid = serials.map(s => s.trim()).filter(Boolean);
        if (valid.length) {
            onConfirm(valid);
        } else if (confirm(t('modals.clearHddConfirm'))) {
            onConfirm([]);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-[#333] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-[#333] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <HardDrive className="w-7 h-7 text-[#0071e3]" />
                        <div>
                            <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white">{t('modals.hddTitle')}</h3>
                            <p className="text-xs text-gray-400">{t('modals.hddInstruction')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Quantity selector */}
                <div className="px-6 pt-5 pb-2 flex items-center gap-4">
                    <button onClick={() => updateQty(quantity - 1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#2c2c2e] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors">
                        <Minus className="w-4 h-4 dark:text-white" />
                    </button>
                    <span className="text-2xl font-bold dark:text-white w-10 text-center">{quantity}</span>
                    <button onClick={() => updateQty(quantity + 1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#2c2c2e] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors">
                        <Plus className="w-4 h-4 dark:text-white" />
                    </button>
                    <span className="text-sm text-gray-400">ฮาร์ดดิสก์</span>
                </div>

                {/* Serial number inputs */}
                <div ref={listRef} className="px-6 pb-4 space-y-2 max-h-[40vh] overflow-y-auto">
                    {serials.map((sn, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#2c2c2e] flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                                {idx + 1}
                            </span>
                            <input
                                value={sn}
                                onChange={e => { const n = [...serials]; n[idx] = e.target.value; setSerials(n); }}
                                className="flex-1 px-4 py-2.5 text-sm rounded-xl outline-none bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] text-[#1d1d1f] dark:text-white focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
                                placeholder={t('placeholders.hddSerial').replace('#', (idx + 1).toString())}
                            />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-[#333] flex gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors">
                        {t('modals.cancel')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.99]"
                    >
                        <Check className="w-4 h-4" />
                        {t('modals.confirmHdd').replace('{{count}}', quantity.toString())}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
