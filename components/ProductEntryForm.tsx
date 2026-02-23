
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, ScanBarcode, X, Box, Wifi, Zap, ShoppingBag, Layers, HardDrive, Check } from 'lucide-react';
import { ProductType, Team } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { GlassSelect } from './GlassSelect';
import { COMMON_ACCESSORIES } from '../constants/options';
import { MockDb } from '../services/mockDb';
import { HddBulkModal } from './HddBulkModal';
import { ScannerModal } from './ScannerModal';

const getInputClass = (hasError: boolean) => `
  w-full px-4 py-3 text-sm rounded-2xl outline-none transition-all
  bg-white dark:bg-white/5 
  border border-gray-200 dark:border-white/10
  text-[#1d1d1f] dark:text-white
  placeholder-gray-500 dark:placeholder-gray-500
  focus:bg-white dark:focus:bg-black/40
  focus:ring-2 focus:ring-[#0071e3] focus:border-transparent
  hover:bg-white/80 dark:hover:bg-white/5
  hover:border-blue-400/50 dark:hover:border-white/30
  ${hasError ? 'border-red-500 focus:ring-red-500' : ''}
`;

interface ProductEntryFormProps {
    mode: 'admin' | 'customer';
    onAddItem: (item: any) => void;
}

export const ProductEntryForm: React.FC<ProductEntryFormProps> = ({ mode, onAddItem }) => {
    const { t } = useLanguage();

    // Dynamic Options state
    const [brandOptions, setBrandOptions] = useState<any[]>([]);
    const [distOptions, setDistOptions] = useState<any[]>([]);

    // Main Item State
    const [currentItem, setCurrentItem] = useState({
        brand: '', model: '', serial: '', type: ProductType.CCTV_CAMERA,
        distributor: '', issue: '', accessories: [] as string[], team: '' as Team | '',
        deviceUsername: '', devicePassword: '',
    });

    // UI Helper State
    const [selectedMainTeam, setSelectedMainTeam] = useState<'A' | 'B' | 'C' | ''>('');
    const [customAccessory, setCustomAccessory] = useState('');
    const [customDistributor, setCustomDistributor] = useState('');
    const [customBrand, setCustomBrand] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Modals State
    const [showHddModal, setShowHddModal] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanTarget, setScanTarget] = useState<'model' | 'serial'>('serial');

    // Load dynamic data
    useEffect(() => {
        const loadData = async () => {
            const [brands, dists] = await Promise.all([MockDb.getBrands(), MockDb.getDistributors()]);
            setBrandOptions([...brands, { value: 'Other', label: t('submit.other') }]);
            setDistOptions([...dists, { value: 'Other', label: t('submit.other') }]);
        };
        loadData();
    }, [t]);

    // Auto-select Team logic
    useEffect(() => {
        if (mode === 'customer') return;
        const teamMap: Record<string, any> = { 'A': Team.HIKVISION, 'B': Team.DAHUA, '': '' };
        if (selectedMainTeam !== 'C') setCurrentItem(prev => ({ ...prev, team: teamMap[selectedMainTeam] || '' }));
        else setCurrentItem(prev => ({ ...prev, team: '' }));
    }, [selectedMainTeam, mode]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const required = ['brand', 'model', 'serial', 'issue'];
        if (mode === 'admin') required.push('team', 'distributor');

        required.forEach(f => {
            let val = (currentItem as any)[f];
            if (f === 'distributor' && val === 'Other') val = customDistributor;
            if (f === 'brand' && val === 'Other') val = customBrand;
            if (!val || (typeof val === 'string' && !val.trim())) newErrors[f] = t('validation.required');
        });

        if (mode === 'admin' && selectedMainTeam === 'C' && !currentItem.team) newErrors.team = t('modals.selectSubUnit');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddClick = () => {
        if (!validate()) return;

        let finalAcc = [...currentItem.accessories];
        if (customAccessory.trim() && !finalAcc.includes(customAccessory.trim())) finalAcc.push(customAccessory.trim());

        onAddItem({
            ...currentItem,
            brand: currentItem.brand === 'Other' ? customBrand.trim() : currentItem.brand,
            distributor: mode === 'customer' ? 'Customer' : (currentItem.distributor === 'Other' ? customDistributor.trim() : currentItem.distributor),
            accessories: finalAcc,
            team: mode === 'customer' ? Team.TEAM_C : currentItem.team,
            deviceUsername: currentItem.deviceUsername.trim(),
            devicePassword: currentItem.devicePassword.trim(),
        });

        // Reset Form
        setCurrentItem({ brand: '', model: '', serial: '', type: ProductType.CCTV_CAMERA, distributor: '', issue: '', accessories: [], team: '', deviceUsername: '', devicePassword: '' });
        setSelectedMainTeam(''); setCustomDistributor(''); setCustomBrand(''); setCustomAccessory(''); setErrors({});
    };

    const toggleAccessory = (acc: string) => {
        if (acc === 'acc_hdd') setShowHddModal(true);
        else setCurrentItem(prev => prev.accessories.includes(acc) ? { ...prev, accessories: prev.accessories.filter(a => a !== acc) } : { ...prev, accessories: [...prev.accessories, acc] });
    };

    const getExistingHdds = () => currentItem.accessories.filter(a => a.startsWith('acc_hdd::')).map(a => a.split('::')[1]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <GlassSelect label={t('submit.brand')} value={currentItem.brand} onChange={val => { setCurrentItem(p => ({ ...p, brand: val })); setErrors(p => ({ ...p, brand: '' })); }} options={brandOptions} searchable recentKey="brand" hasError={!!errors.brand} />
                    {currentItem.brand === 'Other' && <input value={customBrand} onChange={e => setCustomBrand(e.target.value)} className={`mt-2 ${getInputClass(!!errors.customBrand)}`} placeholder={t('placeholders.specifyBrand')} />}
                </div>

                <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('submit.model')}</label>
                    <div className="relative">
                        <input value={currentItem.model} onChange={e => setCurrentItem({ ...currentItem, model: e.target.value })} className={`${getInputClass(!!errors.model)} pr-10`} placeholder={t('submit.enterModel')} />
                        <button type="button" onClick={() => { setScanTarget('model'); setShowScanner(true); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors"><ScanBarcode className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('submit.serial')}</label>
                    <div className="relative">
                        <input value={currentItem.serial} onChange={e => setCurrentItem({ ...currentItem, serial: e.target.value })} className={`${getInputClass(!!errors.serial)} pr-10`} placeholder={t('submit.enterSn')} />
                        <button type="button" onClick={() => { setScanTarget('serial'); setShowScanner(true); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors"><ScanBarcode className="w-5 h-5" /></button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 ml-2">{t('submit.serialHint')}</p>
                </div>
            </div>

            {mode === 'admin' && (
                <TeamSelector selectedMain={selectedMainTeam} onSelectMain={setSelectedMainTeam} currentTeam={currentItem.team} onSelectSub={(t: any) => setCurrentItem(p => ({ ...p, team: t }))} t={t} error={errors.team} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mode === 'admin' && (
                    <div>
                        <GlassSelect label={t('submit.distributor')} value={currentItem.distributor} onChange={val => setCurrentItem(p => ({ ...p, distributor: val }))} options={distOptions} searchable recentKey="distributor" hasError={!!errors.distributor} />
                        {currentItem.distributor === 'Other' && <input value={customDistributor} onChange={e => setCustomDistributor(e.target.value)} className={`mt-2 ${getInputClass(!!errors.customDistributor)}`} placeholder={t('placeholders.specifyDistributor')} />}
                    </div>
                )}

                <div className={mode === 'customer' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('submit.accessories')}</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {COMMON_ACCESSORIES.map(acc => {
                            const hddCount = acc === 'acc_hdd' ? currentItem.accessories.filter(a => a.startsWith('acc_hdd::')).length : 0;
                            const isActive = currentItem.accessories.includes(acc) || hddCount > 0;
                            return (
                                <button
                                    type="button"
                                    key={acc}
                                    onClick={(e) => { e.preventDefault(); toggleAccessory(acc); }}
                                    className={`px-4 py-2 text-xs font-medium rounded-full border transition-all flex items-center gap-2 ${isActive ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-md' : 'bg-white dark:bg-[#2c2c2e] border-[#d2d2d7] dark:border-[#424245] text-[#1d1d1f] dark:text-gray-300 hover:border-[#0071e3] hover:text-[#0071e3]'}`}
                                >
                                    {t(`accessories_list.${acc}`)}
                                    {acc === 'acc_hdd' && <span className={`flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold ${hddCount > 0 ? 'bg-white text-[#0071e3]' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>{hddCount > 0 ? hddCount : <Plus className="w-2.5 h-2.5" />}</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input type="text" value={customAccessory} onChange={e => setCustomAccessory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setCustomAccessory(''), toggleAccessory(customAccessory))} placeholder={t('publicSubmit.otherAccPlaceholder')} className={`flex-1 ${getInputClass(false)} !py-2`} />
                        <button type="button" onClick={() => { if (customAccessory) { toggleAccessory(customAccessory); setCustomAccessory(''); } }} className="px-4 py-2 bg-gray-100 dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-[#48484a]"><Plus className="w-4 h-4" /></button>
                    </div>
                    {currentItem.accessories.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#424245]">
                            {currentItem.accessories.map((acc, idx) => (
                                <span key={`${acc}-${idx}`} className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#3a3a3c] text-xs font-medium rounded-lg shadow-sm border border-gray-200 dark:border-[#48484a] text-[#1d1d1f] dark:text-white">
                                    {acc.startsWith('acc_hdd::') ? `HDD (${acc.split('::')[1]})` : (acc.startsWith('acc_') ? t(`accessories_list.${acc}`) : acc)}
                                    <button type="button" onClick={() => setCurrentItem(p => ({ ...p, accessories: p.accessories.filter(a => a !== acc) }))} className="text-gray-400 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('submit.issueDesc')}</label>
                <textarea value={currentItem.issue} onChange={e => setCurrentItem({ ...currentItem, issue: e.target.value })} rows={3} className={getInputClass(!!errors.issue)} placeholder={mode === 'customer' ? t('placeholders.issueCustomer') : t('placeholders.issueAdmin')} />
                <p className="text-[11px] text-gray-400 mt-1 ml-2">{t('submit.issueHint')}</p>
            </div>

            {/* Device Username / Password (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('submit.deviceUsername')}</label>
                    <input value={currentItem.deviceUsername} onChange={e => setCurrentItem({ ...currentItem, deviceUsername: e.target.value })} className={getInputClass(false)} placeholder={t('placeholders.username')} />
                    <p className="text-[11px] text-gray-400 mt-1 ml-2">{t('submit.usernameHint')}</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-2">{t('submit.devicePassword')}</label>
                    <input value={currentItem.devicePassword} onChange={e => setCurrentItem({ ...currentItem, devicePassword: e.target.value })} className={getInputClass(false)} placeholder={t('placeholders.password')} />
                    <p className="text-[11px] text-gray-400 mt-1 ml-2">{t('submit.passwordHint')}</p>
                </div>
            </div>

            <button onClick={handleAddClick} className="w-full py-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]">
                <Plus className="w-5 h-5" /> {t(mode === 'customer' ? 'publicSubmit.addAnother' : 'submit.addToJob')}
            </button>

            {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScan={(val) => { setCurrentItem(p => ({ ...p, [scanTarget]: val })); setShowScanner(false); }} />}

            {showHddModal && (
                <HddBulkModal
                    initialSerials={getExistingHdds()}
                    onClose={() => setShowHddModal(false)}
                    onConfirm={(serials) => {
                        const nonHdd = currentItem.accessories.filter(a => !a.startsWith('acc_hdd::'));
                        const newHdd = serials.map(s => `acc_hdd::${s}`);
                        setCurrentItem(p => ({ ...p, accessories: [...nonHdd, ...newHdd] }));
                        setShowHddModal(false);
                    }}
                />
            )}
        </div>
    );
};

// --- Sub Components ---

const TeamSelector = ({ selectedMain, onSelectMain, currentTeam, onSelectSub, t, error }: any) => {
    const getActiveClass = (color: string) => {
        switch (color) {
            case 'red': return 'border-red-500 ring-2 ring-red-500/20 shadow-sm';
            case 'orange': return 'border-orange-500 ring-2 ring-orange-500/20 shadow-sm';
            default: return 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm';
        }
    };

    const getActiveSubClass = (color: string) => {
        switch (color) {
            case 'cyan': return 'border-cyan-500 ring-1 ring-cyan-500';
            case 'yellow': return 'border-yellow-500 ring-1 ring-yellow-500';
            case 'fuchsia': return 'border-fuchsia-500 ring-1 ring-fuchsia-500';
            default: return 'border-blue-500 ring-1 ring-blue-500';
        }
    };

    const getActiveSubText = (color: string) => {
        switch (color) {
            case 'cyan': return 'text-cyan-600';
            case 'yellow': return 'text-yellow-600';
            case 'fuchsia': return 'text-fuchsia-600';
            default: return 'text-blue-600';
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl p-6 border border-gray-200 dark:border-[#333]">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-4">{t('submit.assignTeam')}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {[
                    { id: 'A', label: t('teams.hikvision'), sub: 'Team A', icon: Box, color: 'red', val: Team.HIKVISION },
                    { id: 'B', label: t('teams.dahua'), sub: 'Team B', icon: Layers, color: 'orange', val: Team.DAHUA },
                    { id: 'C', label: `${t('teams.teamC')} (Group)`, sub: 'Team C / E / G', icon: Wifi, color: 'blue', val: null }
                ].map((item) => (
                    <button
                        type="button"
                        key={item.id}
                        onClick={() => onSelectMain(item.id)}
                        className={`relative p-4 rounded-xl border text-left transition-all flex items-start gap-3 bg-white dark:bg-[#2c2c2e] ${selectedMain === item.id ? getActiveClass(item.color) : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                        <div className={`p-2 rounded-lg ${selectedMain === item.id ? `bg-${item.color}-500 text-white` : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}><item.icon className="w-5 h-5" /></div>
                        <div><div className="font-bold text-sm text-[#1d1d1f] dark:text-white">{item.label}</div><div className="text-[10px] text-gray-500">{item.sub}</div></div>
                    </button>
                ))}
            </div>
            {selectedMain === 'C' && (
                <div className="animate-fade-in pl-4 border-l-2 border-[#0071e3]/30 ml-2">
                    <div className="text-xs font-bold text-[#0071e3] uppercase mb-3">{t('modals.selectSubUnit')}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { val: Team.TEAM_C, label: t('teams.teamC'), icon: Wifi, color: 'cyan' },
                            { val: Team.TEAM_E, label: t('teams.teamE'), icon: Zap, color: 'yellow' },
                            { val: Team.TEAM_G, label: t('teams.teamG'), icon: ShoppingBag, color: 'fuchsia' }
                        ].map(sub => (
                            <button
                                type="button"
                                key={sub.val}
                                onClick={() => onSelectSub(sub.val)}
                                className={`p-3 rounded-xl border text-left transition-all text-sm flex items-center gap-2 bg-white dark:bg-[#2c2c2e] ${currentTeam === sub.val ? getActiveSubClass(sub.color) : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#3a3a3c]'}`}
                            >
                                <sub.icon className={`w-4 h-4 ${currentTeam === sub.val ? getActiveSubText(sub.color) : 'text-gray-400'}`} />
                                <span className={currentTeam === sub.val ? `font-bold ${getActiveSubText(sub.color)}` : 'text-gray-600 dark:text-gray-300'}>{sub.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
        </div>
    );
};
