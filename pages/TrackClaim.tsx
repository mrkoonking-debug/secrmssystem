
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MockDb } from '../services/mockDb';
import { Claim, ClaimStatus, ResolutionDetails, DelayReason, Team } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Save, Truck, CheckCircle2, AlertOctagon, Timer, PackageCheck, FileText, Clock, RefreshCw, Loader2, Box, Layers, Wifi, Zap, ShoppingBag, ChevronDown, ShieldCheck, Pencil, X, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { GlassSelect } from '../components/GlassSelect';

const INPUT_STYLE = "w-full bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-white focus:ring-2 focus:ring-[#0071e3] transition-all outline-none";

const teamKey = (team: string | null | undefined) => {
    if (!team) return '';
    const map: Record<string, string> = { HIKVISION: 'hikvision', DAHUA: 'dahua', TEAM_C: 'teamC', TEAM_E: 'teamE', TEAM_G: 'teamG' };
    return map[team] || team.toLowerCase();
};

export const TrackClaim: React.FC = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();
    const [claim, setClaim] = useState<Claim | null>(null);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastAction, setLastAction] = useState('');
    const { t } = useLanguage();

    const [note, setNote] = useState('');
    const [status, setStatus] = useState<ClaimStatus>(ClaimStatus.PENDING);
    const [shipmentConfig, setShipmentConfig] = useState<string[]>([]);
    const [resolution, setResolution] = useState<ResolutionDetails>({ actionTaken: '', rootCause: '', vendorTicketRef: '', technicalNotes: '', replacedSerialNumber: '' });
    const [delayReason, setDelayReason] = useState<DelayReason>('NONE');
    const [warrantyStatus, setWarrantyStatus] = useState<'IN_WARRANTY' | 'OUT_OF_WARRANTY' | 'VOID'>('IN_WARRANTY');

    // --- Team Re-assignment State ---
    const [tempTeam, setTempTeam] = useState<Team | ''>('');
    const [mainGroup, setMainGroup] = useState<'A' | 'B' | 'C' | ''>('');
    const [isChangingTeam, setIsChangingTeam] = useState(false);
    const [isEditingIssue, setIsEditingIssue] = useState(false);
    const [editIssueText, setEditIssueText] = useState('');
    const [isEditingDist, setIsEditingDist] = useState(false);
    const [editDistValue, setEditDistValue] = useState('');
    const [customDistValue, setCustomDistValue] = useState('');
    const [distOptions, setDistOptions] = useState<any[]>([]);

    // Load distributor options
    useEffect(() => {
        const loadDists = async () => {
            const dists = await MockDb.getDistributors();
            setDistOptions([...dists, { value: 'Other', label: t('submit.other') }]);
        };
        loadDists();
    }, [t]);

    useEffect(() => {
        const fetchClaim = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            const c = await MockDb.getClaimById(id);
            if (c) {
                setClaim(c);
                setStatus(c.status);
                if (c.resolution) setResolution(c.resolution);
                if (c.delayReason) setDelayReason(c.delayReason);
                if (c.repairCosts?.warrantyStatus) setWarrantyStatus(c.repairCosts.warrantyStatus);

                // Sync Team state
                setTempTeam(c.team);
                if (c.team === Team.HIKVISION) setMainGroup('A');
                else if (c.team === Team.DAHUA) setMainGroup('B');
                else if ([Team.TEAM_C, Team.TEAM_E, Team.TEAM_G].includes(c.team)) setMainGroup('C');

                if (c.distributorSentItems) setShipmentConfig(c.distributorSentItems);
                else setShipmentConfig([`Main Unit (${c.productModel})`]);
                setLoading(false);
            } else if (retryCount < 3) {
                setTimeout(() => setRetryCount(prev => prev + 1), 1500);
            } else {
                setLoading(false);
            }
        };
        fetchClaim();
    }, [id, retryCount]);

    const handleSave = async () => {
        if (!claim || isSaving) return;
        setIsSaving(true);

        try {
            const updates: Partial<Claim> = {
                status,
                resolution,
                delayReason,
                distributorSentItems: shipmentConfig,
                repairCosts: { ...claim.repairCosts, labor: claim.repairCosts?.labor || 0, parts: claim.repairCosts?.parts || 0, warrantyStatus }
            };

            // Handle Team Change
            const currentUser = MockDb.getCurrentUser();
            const userName = currentUser?.name || 'Admin';

            if (tempTeam && tempTeam !== claim.team) {
                updates.team = tempTeam as Team;
                await MockDb.addTimelineEvent(claim.id, {
                    type: 'SYSTEM',
                    description: `แก้ไขทีมผู้ดูแล: ${t(`teams.${teamKey(claim.team)}`)} -> ${t(`teams.${teamKey(tempTeam)}`)}`,
                    user: userName
                });
            }

            if (status !== claim.status) {
                await MockDb.addTimelineEvent(claim.id, { type: 'STATUS_CHANGE', description: `Status updated to ${status}`, user: userName });
            }

            await MockDb.updateClaim(claim.id, updates);

            if (note.trim()) { await MockDb.addTimelineEvent(claim.id, { type: 'NOTE', description: note, user: userName }); setNote(''); }

            const updated = await MockDb.getClaimById(claim.id);
            if (updated) {
                setClaim(updated);
                setIsChangingTeam(false);
                // Extract the latest timeline event for the popup
                const latestEvent = updated.history && updated.history.length > 0
                    ? updated.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                    : null;
                setLastAction(latestEvent?.description || '');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2500);
            }
        } catch (error) {
            console.error("Failed to save claim", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGroupSelect = (group: 'A' | 'B' | 'C') => {
        setMainGroup(group);
        if (group === 'A') setTempTeam(Team.HIKVISION);
        else if (group === 'B') setTempTeam(Team.DAHUA);
        else setTempTeam(''); // Force select C group sub-teams
    };

    const formatAccessory = (acc: string) => {
        if (acc.startsWith('acc_hdd::')) return `HDD (${acc.split('::')[1]})`;
        if (acc.startsWith('acc_')) return t(`accessories_list.${acc}`);
        return acc;
    };

    const toggleShipmentItem = (item: string) => setShipmentConfig(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-[#0071e3] animate-spin" />
            <p className="text-gray-500 font-medium">กำลังค้นหาข้อมูลจากฐานข้อมูล...</p>
        </div>
    );

    if (!claim) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center animate-fade-in">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <AlertOctagon className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-2">Claim not found</h2>
            <div className="flex gap-3">
                <button onClick={() => { setRetryCount(0); setLoading(true); }} className="px-8 py-3 bg-gray-100 dark:bg-white/10 rounded-full text-sm font-bold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> ลองใหม่
                </button>
                <Link to="/admin/claims" className="px-8 py-3 bg-[#0071e3] text-white rounded-full text-sm font-bold">ไปหน้ารายการทั้งหมด</Link>
            </div>
        </div>
    );

    const availableItems = [`Main Unit (${claim.productModel})`, ...claim.accessories];
    const daysOpen = Math.floor((Date.now() - new Date(claim.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysOpen > 7 && ![ClaimStatus.CLOSED, ClaimStatus.REPAIRED, ClaimStatus.SHIPPED].includes(claim.status);

    const statusOptions = Object.values(ClaimStatus).map(s => ({ value: s, label: t(`status.${s}`) }));
    const delayOptions = ['NONE', 'WAITING_PARTS', 'WAITING_DISTRIBUTOR', 'WAITING_CUSTOMER', 'INTERNAL_QUEUE'].map(d => ({ value: d, label: t(`delays.${d}`) }));
    const actionOptions = [
        { value: "Replaced Component", label: t('actions.replaced_component') },
        { value: "Swapped Unit", label: t('actions.swapped_unit') },
        { value: "Software Update", label: t('actions.software_update') },
        { value: "No Fault Found", label: t('actions.no_fault_found') },
        { value: "Sent to Vendor", label: t('actions.sent_to_vendor') }
    ];
    const warrantyOptions = [{ value: "IN_WARRANTY", label: t('warranty.IN_WARRANTY') }, { value: "OUT_OF_WARRANTY", label: t('warranty.OUT_OF_WARRANTY') }, { value: "VOID", label: t('warranty.VOID') }];

    const showNewSerialInput = resolution.actionTaken === "Swapped Unit" || resolution.actionTaken === "Replaced Component";

    // เรียงลำดับประวัติให้ล่าสุดอยู่บนสุด
    const sortedHistory = claim.history ? [...claim.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-8 px-2">
                <Link to="/admin/claims" className="flex items-center text-sm font-medium text-gray-500 hover:text-[#0071e3] transition-colors"><ArrowLeft className="h-4 w-4 mr-1" /> {t('track.backToList')}</Link>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${isOverdue ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-white dark:bg-[#2c2c2e] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#424245]'}`}><Timer className="w-4 h-4" />{daysOpen} {t('track.days')} {t('track.timeOpen')}</div>
                    <div className="text-xs font-mono text-gray-400 px-3 py-1.5 bg-white dark:bg-[#2c2c2e] rounded-full border border-gray-200 dark:border-[#424245]">ID: {claim.id}</div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* ===== Product Info Card ===== */}
                <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 border border-gray-100 dark:border-[#333]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">{t(`teams.${teamKey(claim.team)}`)}</div>
                            <h1 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-1">{claim.productModel}</h1>
                            <p className="text-gray-500 font-medium">{claim.brand} • {claim.serialNumber}</p>
                        </div>
                        <StatusBadge status={claim.status} isOverdue={isOverdue} />
                    </div>
                    <div className="p-6 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 rounded-2xl">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 flex items-center gap-2">
                            {t('track.issueReported')}
                            {!isEditingIssue && (
                                <button onClick={() => { setIsEditingIssue(true); setEditIssueText(claim.issueDescription); }} className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-400 hover:text-blue-600 transition-colors" title="Edit Issue"><Pencil className="w-3 h-3" /></button>
                            )}
                        </span>
                        {isEditingIssue ? (
                            <div className="space-y-2 mt-1">
                                <textarea
                                    value={editIssueText}
                                    onChange={e => setEditIssueText(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm rounded-xl outline-none bg-white dark:bg-white/5 border border-blue-300 dark:border-blue-500/30 text-[#1d1d1f] dark:text-white focus:ring-2 focus:ring-[#0071e3] resize-none"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={async () => {
                                            const newIssue = editIssueText.trim();
                                            if (!newIssue) return;
                                            await MockDb.updateClaim(claim.id, { issueDescription: newIssue, updatedAt: new Date().toISOString() });
                                            await MockDb.addTimelineEvent(claim.id, { type: 'SYSTEM', description: `แก้ไขอาการที่แจ้ง`, user: MockDb.getCurrentUser()?.name || 'Staff' });
                                            const updated = await MockDb.getClaimById(claim.id);
                                            if (updated) setClaim(updated);
                                            setIsEditingIssue(false);
                                        }}
                                        disabled={!editIssueText.trim()}
                                        className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 disabled:opacity-40 transition-colors flex items-center gap-1"
                                    ><CheckCircle2 className="w-3 h-3" /> Save</button>
                                    <button onClick={() => setIsEditingIssue(false)} className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white text-xs font-bold hover:bg-gray-300 transition-colors">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[#1d1d1f] dark:text-gray-200 leading-relaxed">{claim.issueDescription}</p>
                        )}
                    </div>
                    {/* Distributor */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                            <Truck className="w-3 h-3" /> {t('submit.distributor')}
                            {!isEditingDist && (
                                <button onClick={() => { setIsEditingDist(true); setEditDistValue(claim.distributor || ''); }} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-[#0071e3] transition-colors" title="Edit Distributor"><Pencil className="w-3 h-3" /></button>
                            )}
                        </div>
                        {isEditingDist ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="w-56">
                                    <GlassSelect
                                        value={editDistValue}
                                        onChange={val => setEditDistValue(val)}
                                        options={distOptions}
                                        searchable
                                        placeholder="Select..."
                                    />
                                </div>
                                {editDistValue === 'Other' && (
                                    <input
                                        value={customDistValue}
                                        onChange={e => setCustomDistValue(e.target.value)}
                                        className="w-40 px-3 py-2.5 text-sm rounded-xl outline-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#1d1d1f] dark:text-white focus:ring-1 focus:ring-[#0071e3]"
                                        placeholder="Specify..."
                                    />
                                )}
                                <button
                                    onClick={async () => {
                                        const newDist = editDistValue === 'Other' ? customDistValue.trim() : editDistValue;
                                        if (!newDist) return;
                                        await MockDb.updateClaim(claim.id, { distributor: newDist, updatedAt: new Date().toISOString() });
                                        await MockDb.addTimelineEvent(claim.id, { type: 'SYSTEM', description: `เปลี่ยน Distributor เป็น: ${newDist}`, user: MockDb.getCurrentUser()?.name || 'Staff' });
                                        const updated = await MockDb.getClaimById(claim.id);
                                        if (updated) setClaim(updated);
                                        setIsEditingDist(false); setEditDistValue(''); setCustomDistValue('');
                                    }}
                                    disabled={!editDistValue || (editDistValue === 'Other' && !customDistValue.trim())}
                                    className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 transition-colors"
                                ><Check className="w-4 h-4" /></button>
                                <button onClick={() => { setIsEditingDist(false); setEditDistValue(''); setCustomDistValue(''); }} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-300 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{claim.distributor || '-'}</p>
                        )}
                    </div>
                </div>

                {/* ===== MERGED: Status + Resolution + Actions ===== */}
                <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 border border-gray-100 dark:border-[#333]">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[#1d1d1f] dark:text-white"><CheckCircle2 className="w-5 h-5 text-green-500" /> {t('track.resolutionDetails')}</h3>

                    {/* Row 1: Status + Team + Warranty */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div><GlassSelect label={t('track.statusLabel')} value={status} onChange={val => setStatus(val as ClaimStatus)} options={statusOptions} /></div>
                        <div>
                            <div className="flex justify-between items-center mb-2 ml-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('track.assignedTeam')}</label>
                                {!isChangingTeam && (
                                    <button onClick={() => setIsChangingTeam(true)} className="text-[10px] text-blue-500 font-bold hover:underline">Change</button>
                                )}
                            </div>
                            {isChangingTeam ? (
                                <div className="space-y-2 animate-fade-in p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                    <div className="grid grid-cols-1 gap-1.5">
                                        <button onClick={() => handleGroupSelect('A')} className={`p-2 rounded-lg border text-left text-xs flex items-center gap-2 ${mainGroup === 'A' ? 'bg-white dark:bg-[#2c2c2e] border-red-500' : 'bg-white dark:bg-[#1c1c1e] border-transparent'}`}><Box className="w-3 h-3 text-red-500" /> Team A (Hikvision)</button>
                                        <button onClick={() => handleGroupSelect('B')} className={`p-2 rounded-lg border text-left text-xs flex items-center gap-2 ${mainGroup === 'B' ? 'bg-white dark:bg-[#2c2c2e] border-orange-500' : 'bg-white dark:bg-[#1c1c1e] border-transparent'}`}><Layers className="w-3 h-3 text-orange-500" /> Team B (Dahua)</button>
                                        <button onClick={() => handleGroupSelect('C')} className={`p-2 rounded-lg border text-left text-xs flex items-center gap-2 ${mainGroup === 'C' ? 'bg-white dark:bg-[#2c2c2e] border-blue-500' : 'bg-white dark:bg-[#1c1c1e] border-transparent'}`}><Wifi className="w-3 h-3 text-blue-500" /> Team C Group</button>
                                    </div>
                                    {mainGroup === 'C' && (
                                        <div className="grid grid-cols-1 gap-1.5 pl-3 border-l-2 border-blue-500/20">
                                            {[
                                                { val: Team.TEAM_C, label: 'Network', icon: Wifi },
                                                { val: Team.TEAM_E, label: 'UPS', icon: Zap },
                                                { val: Team.TEAM_G, label: 'Online', icon: ShoppingBag }
                                            ].map(sub => (
                                                <button key={sub.val} onClick={() => setTempTeam(sub.val)} className={`p-2 rounded-lg border text-[10px] flex items-center gap-2 ${tempTeam === sub.val ? 'bg-white dark:bg-[#2c2c2e] border-[#0071e3]' : 'bg-white dark:bg-[#1c1c1e] border-transparent'}`}><sub.icon className="w-3 h-3" /> {sub.label}</button>
                                            ))}
                                        </div>
                                    )}
                                    <button onClick={() => { setIsChangingTeam(false); setTempTeam(claim.team); }} className="w-full py-1 text-[10px] text-gray-400 hover:text-red-500">Cancel</button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm font-bold text-[#1d1d1f] dark:text-white">
                                    <ShieldCheck className="w-4 h-4 text-blue-500" /> {t(`teams.${teamKey(tempTeam)}`)}
                                </div>
                            )}
                        </div>
                        <div><GlassSelect label={t('track.warrantyStatus')} value={warrantyStatus} onChange={val => setWarrantyStatus(val as any)} options={warrantyOptions} /></div>
                    </div>

                    {/* Row 2: Action + Root Cause + Vendor Ref */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-6 border-t border-gray-200/50 dark:border-white/10">
                        <div><GlassSelect label={t('track.actionTaken')} value={resolution.actionTaken} onChange={val => setResolution({ ...resolution, actionTaken: val })} options={actionOptions} placeholder={t('track.selectAction')} /></div>
                        {showNewSerialInput && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-2 ml-2 tracking-wider flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {t('track.newSerial')}</label>
                                <input type="text" value={resolution.replacedSerialNumber || ''} onChange={(e) => setResolution({ ...resolution, replacedSerialNumber: e.target.value })} className={`${INPUT_STYLE} border-green-400 ring-1 ring-green-400/20`} placeholder="Enter New S/N" />
                            </div>
                        )}
                        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2 tracking-wider">{t('track.rootCause')}</label><input type="text" value={resolution.rootCause} onChange={(e) => setResolution({ ...resolution, rootCause: e.target.value })} className={INPUT_STYLE} placeholder="e.g. Power Surge" /></div>
                        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2 tracking-wider">{t('track.vendorRef')}</label><input type="text" value={resolution.vendorTicketRef} onChange={(e) => setResolution({ ...resolution, vendorTicketRef: e.target.value })} className={INPUT_STYLE} placeholder="e.g. RMA-SYN-9988" /></div>
                    </div>

                    {/* Row 3: Delay + Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-6 border-t border-gray-200/50 dark:border-white/10">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2 tracking-wider">{t('track.delayReason')}</label>
                            {delayReason === 'NONE' ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-sm font-medium text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="w-4 h-4" /> {t('delays.NONE')}
                                    </div>
                                    <button
                                        onClick={() => setDelayReason('WAITING_PARTS' as DelayReason)}
                                        className="px-3 py-2 text-xs font-bold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/20 transition-colors flex items-center gap-1.5"
                                    >
                                        <AlertOctagon className="w-3.5 h-3.5" /> แจ้งล่าช้า
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-fade-in">
                                    <GlassSelect value={delayReason} onChange={val => setDelayReason(val as DelayReason)} options={delayOptions.filter(d => d.value !== 'NONE')} hasError />
                                    <button
                                        onClick={() => setDelayReason('NONE' as DelayReason)}
                                        className="text-xs font-bold text-green-500 hover:text-green-600 hover:underline flex items-center gap-1 ml-2"
                                    >
                                        <CheckCircle2 className="w-3 h-3" /> กลับเป็นปกติ (ไม่ล่าช้า)
                                    </button>
                                </div>
                            )}
                        </div>
                        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-2 tracking-wider">{t('track.internalNote')}</label><textarea value={note} onChange={(e) => setNote(e.target.value)} className={`${INPUT_STYLE} h-24 resize-none`} placeholder={t('track.addNote')}></textarea></div>
                    </div>

                    {/* Save Button */}
                    <button onClick={handleSave} disabled={isSaving} className={`w-full py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-transform active:scale-[0.98] ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : t('track.save')}
                    </button>

                    {/* Print Forms */}
                    <div className="pt-6 mt-6 border-t border-gray-200/50 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Link to={`/admin/document/importer/${claim.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors border border-gray-100 dark:border-[#333]"><div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><FileText className="w-4 h-4" /></div><span className="text-sm font-medium text-[#1d1d1f] dark:text-white">{t('track.distributorForm')}</span></Link>
                        <Link to={`/admin/document/customer/${claim.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors border border-gray-100 dark:border-[#333]"><div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"><FileText className="w-4 h-4" /></div><span className="text-sm font-medium text-[#1d1d1f] dark:text-white">{t('track.customerForm')}</span></Link>
                    </div>
                </div>

                {/* ===== Timeline ===== */}
                <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 border border-gray-100 dark:border-[#333]">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[#1d1d1f] dark:text-white"><Clock className="w-5 h-5 text-gray-400" /> {t('track.activityLog')}</h3>
                    <div className="space-y-8 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-[#333]">
                        {sortedHistory.map((evt) => (<div key={evt.id} className="relative pl-10"><div className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-[#1c1c1e] ${evt.type === 'STATUS_CHANGE' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div><div><p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{evt.description}</p><p className="text-xs text-gray-400 mt-1">{new Date(evt.date).toLocaleString()} • {evt.user}</p></div></div>))}
                    </div>
                </div>
            </div>

            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '0.2s' }}>
                    <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] shadow-2xl flex flex-col items-center transform scale-100 transition-all animate-scale-up">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white mb-2">{t('track.saveSuccess')}</h3>
                        <p className="text-gray-500 text-sm mb-1">{new Date().toLocaleTimeString()}</p>
                        {lastAction && <p className="text-[#0071e3] text-sm font-medium text-center px-4 mt-2 bg-blue-50 dark:bg-blue-900/10 py-1 rounded-lg">{lastAction}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};
