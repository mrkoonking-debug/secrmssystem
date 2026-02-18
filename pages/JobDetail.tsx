
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MockDb } from '../services/mockDb';
import { RMA, RMAStatus } from '../types';
import { ArrowLeft, Package, User, Clock, Edit2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, History, Trash2, Truck, Pencil, Check, X, ShieldCheck, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { GlassSelect } from '../components/GlassSelect';

export const JobDetail: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const [rmas, setRMAs] = useState<RMA[]>([]);
    const [jobInfo, setJobInfo] = useState<{ customer: string, count: number, date: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRMAs, setExpandedRMAs] = useState<Set<string>>(new Set());
    const [editingDistRMA, setEditingDistRMA] = useState<string | null>(null);
    const [editDistValue, setEditDistValue] = useState('');
    const [customDistValue, setCustomDistValue] = useState('');
    const [distOptions, setDistOptions] = useState<any[]>([]);
    const [editingIssueRMA, setEditingIssueRMA] = useState<string | null>(null);
    const [editIssueValue, setEditIssueValue] = useState('');
    const [editingWarrantyRMA, setEditingWarrantyRMA] = useState<string | null>(null);
    const [editWarrantyValue, setEditWarrantyValue] = useState('');
    const [editingNotesRMA, setEditingNotesRMA] = useState<string | null>(null);
    const [notesState, setNotesState] = useState<Record<string, string>>({}); // Static Notes State
    const [editingStatusRMA, setEditingStatusRMA] = useState<string | null>(null);
    const [editStatusValue, setEditStatusValue] = useState<RMAStatus | ''>('');
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Load distributor options
    useEffect(() => {
        const loadDists = async () => {
            const dists = await MockDb.getDistributors();
            setDistOptions([...dists, { value: 'Other', label: t('submit.other') }]);
        };
        loadDists();
    }, [t]);

    const handleSaveDistributor = async (rmaId: string) => {
        const newDist = editDistValue === 'Other' ? customDistValue.trim() : editDistValue;
        if (!newDist) return;
        await MockDb.updateRMA(rmaId, { distributor: newDist, updatedAt: new Date().toISOString() });
        await MockDb.addTimelineEvent(rmaId, {
            type: 'SYSTEM',
            description: `เปลี่ยน Distributor เป็น: ${newDist}`,
            user: MockDb.getCurrentUser()?.name || 'Staff'
        });
        await refreshRMAs();
        setEditingDistRMA(null);
        setEditDistValue('');
        setCustomDistValue('');
    };

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

    const handleSaveIssue = async (rmaId: string) => {
        const newIssue = editIssueValue.trim();
        if (!newIssue) return;
        await MockDb.updateRMA(rmaId, { issueDescription: newIssue, updatedAt: new Date().toISOString() });
        await MockDb.addTimelineEvent(rmaId, {
            type: 'SYSTEM',
            description: `แก้ไขอาการที่แจ้ง`,
            user: MockDb.getCurrentUser()?.name || 'Staff'
        });
        await refreshRMAs();
        setEditingIssueRMA(null);
        setEditIssueValue('');
    };

    const warrantyOptions = [
        { value: 'IN_WARRANTY', label: t('warranty.IN_WARRANTY') },
        { value: 'OUT_OF_WARRANTY', label: t('warranty.OUT_OF_WARRANTY') },
        { value: 'VOID', label: t('warranty.VOID') }
    ];

    const handleSaveWarranty = async (rmaId: string) => {
        if (!editWarrantyValue) return;
        await MockDb.updateRMA(rmaId, {
            repairCosts: { labor: 0, parts: 0, warrantyStatus: editWarrantyValue as any },
            updatedAt: new Date().toISOString()
        });
        await MockDb.addTimelineEvent(rmaId, {
            type: 'SYSTEM',
            description: `เปลี่ยนสถานะประกัน: ${t(`warranty.${editWarrantyValue}`)}`,
            user: MockDb.getCurrentUser()?.name || 'Staff'
        });
        await refreshRMAs();
        setEditingWarrantyRMA(null);
        setEditWarrantyValue('');
    };

    const handleSaveNotes = async (rmaId: string) => {
        const newNotes = (notesState[rmaId] || '').trim();
        // Optimistic update or just wait for refresh?
        // User requested: "The text must remain in the field after saving."
        // We do NOT clear notesState[rmaId].

        await MockDb.updateRMA(rmaId, { notes: newNotes, updatedAt: new Date().toISOString() });
        await MockDb.addTimelineEvent(rmaId, {
            type: 'NOTE',
            description: `อัปเดตบันทึก: ${newNotes || '(Empty)'}`,
            user: MockDb.getCurrentUser()?.name || 'Staff'
        });
        await refreshRMAs();
    };

    const statusOptions = Object.values(RMAStatus).map(s => ({ value: s, label: t(`status.${s}`) }));

    const handleSaveStatus = async (rmaId: string) => {
        if (!editStatusValue) return;
        await MockDb.updateRMA(rmaId, { status: editStatusValue as RMAStatus, updatedAt: new Date().toISOString() });
        await MockDb.addTimelineEvent(rmaId, {
            type: 'STATUS_CHANGE',
            description: `เปลี่ยนสถานะเป็น: ${t(`status.${editStatusValue}`)}`,
            user: MockDb.getCurrentUser()?.name || 'Staff'
        });
        await refreshRMAs();
        setEditingStatusRMA(null);
        setEditStatusValue('');
    };

    useEffect(() => {
        const fetch = async () => {
            if (jobId) {
                const decodedId = decodeURIComponent(jobId);
                const allRMAs = await MockDb.getRMAs();
                const jobRMAs = allRMAs.filter(c =>
                    c.quotationNumber === decodedId ||
                    c.groupRequestId === decodedId ||
                    (c.quotationNumber === '' && c.groupRequestId === '' && c.id === decodedId)
                );

                if (jobRMAs.length > 0) {
                    setRMAs(jobRMAs);
                    jobRMAs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                    setJobInfo({ customer: jobRMAs[0].customerName, count: jobRMAs.length, date: jobRMAs[0].createdAt });
                } else {
                    navigate('/admin/rmas'); // Updated route
                }
            }
            setLoading(false);
        };
        fetch();
    }, [jobId, navigate]);

    const toggleHistory = (id: string) => {
        const newSet = new Set(expandedRMAs);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedRMAs(newSet);
    };

    if (loading) return <div className="p-12 text-center">Loading Job...</div>;
    if (!jobInfo) return null;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <Link to="/admin/rmas" className="flex items-center text-sm font-medium text-gray-500 hover:text-[#0071e3] transition-colors"><ArrowLeft className="h-4 w-4 mr-1" /> {t('track.backToList')}</Link>
                <div className="text-xs font-mono text-gray-400 px-3 py-1.5 bg-white/50 dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">JOB: {decodeURIComponent(jobId || '')}</div>
            </div>

            <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 mb-8 border border-gray-100 dark:border-[#333]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-2xl shadow-inner"><Package /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-1">{jobId}</h1>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500"><span className="flex items-center gap-1"><User className="w-4 h-4" /> {jobInfo.customer}</span><span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(jobInfo.date).toLocaleDateString()}</span><span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs">{jobInfo.count} Items</span></div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="text-center px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl"><div className="text-xl font-bold text-green-600 dark:text-green-400">{rmas.filter(c => c.status === RMAStatus.CLOSED || c.status === RMAStatus.REPAIRED).length}</div><div className="text-[10px] uppercase text-green-600/70 font-bold">Done</div></div>
                        <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><div className="text-xl font-bold text-blue-600 dark:text-blue-400">{rmas.filter(c => c.status !== RMAStatus.CLOSED && c.status !== RMAStatus.REPAIRED).length}</div><div className="text-[10px] uppercase text-blue-600/70 font-bold">Active</div></div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white ml-2 mb-4">{t('claimsList.items')}</h2>
                {rmas.map((item, index) => {
                    const isClosed = [RMAStatus.CLOSED, RMAStatus.REPAIRED, RMAStatus.SHIPPED, RMAStatus.REJECTED].includes(item.status);
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
                                            {editingIssueRMA !== item.id && (
                                                <button onClick={() => { setEditingIssueRMA(item.id); setEditIssueValue(item.issueDescription); }} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-[#0071e3] transition-colors" title="Edit Issue"><Pencil className="w-3 h-3" /></button>
                                            )}
                                        </div>
                                        {editingIssueRMA === item.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editIssueValue}
                                                    onChange={e => setEditIssueValue(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-3 py-2 text-sm rounded-xl outline-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#1d1d1f] dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0071e3] resize-none"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleSaveIssue(item.id)} disabled={!editIssueValue.trim()} className="px-3 py-1 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 disabled:opacity-40 transition-colors flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
                                                    <button onClick={() => { setEditingIssueRMA(null); setEditIssueValue(''); }} className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white text-xs font-bold hover:bg-gray-300 transition-colors">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2"><AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /><span className="line-clamp-2">{item.issueDescription}</span></div>
                                        )}
                                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                                            <Truck className="w-3 h-3" /> {t('submit.distributor')}:{' '}
                                            {editingDistRMA === item.id ? (
                                                <span className="inline-flex items-center gap-2 ml-1">
                                                    <span className="inline-block w-full md:w-48">
                                                        <GlassSelect
                                                            value={editDistValue}
                                                            onChange={val => setEditDistValue(val)}
                                                            options={distOptions}
                                                            searchable
                                                            placeholder="Select..."
                                                        />
                                                    </span>
                                                    {editDistValue === 'Other' && (
                                                        <input
                                                            value={customDistValue}
                                                            onChange={e => setCustomDistValue(e.target.value)}
                                                            className="w-32 px-2 py-1.5 text-xs rounded-lg outline-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#1d1d1f] dark:text-white focus:ring-1 focus:ring-[#0071e3]"
                                                            placeholder="Specify..."
                                                        />
                                                    )}
                                                    <button onClick={() => handleSaveDistributor(item.id)} disabled={!editDistValue || (editDistValue === 'Other' && !customDistValue.trim())} className="p-1 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 transition-colors"><Check className="w-3 h-3" /></button>
                                                    <button onClick={() => { setEditingDistRMA(null); setEditDistValue(''); setCustomDistValue(''); }} className="p-1 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-400 transition-colors"><X className="w-3 h-3" /></button>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 ml-1">
                                                    <span className="text-[#1d1d1f] dark:text-white font-medium">{item.distributor || '-'}</span>
                                                    <button onClick={() => { setEditingDistRMA(item.id); setEditDistValue(item.distributor || ''); }} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-[#0071e3] transition-colors" title="Edit Distributor"><Pencil className="w-3 h-3" /></button>
                                                </span>
                                            )}
                                        </div>
                                        {/* Warranty Status */}
                                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> {t('track.warrantyStatus')}:{' '}
                                            {editingWarrantyRMA === item.id ? (
                                                <span className="inline-flex items-center gap-2 ml-1">
                                                    <span className="inline-block w-full md:w-48">
                                                        <GlassSelect
                                                            value={editWarrantyValue}
                                                            onChange={val => setEditWarrantyValue(val)}
                                                            options={warrantyOptions}
                                                            placeholder="Select..."
                                                        />
                                                    </span>
                                                    <button onClick={() => handleSaveWarranty(item.id)} disabled={!editWarrantyValue} className="p-1 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 transition-colors"><Check className="w-3 h-3" /></button>
                                                    <button onClick={() => { setEditingWarrantyRMA(null); setEditWarrantyValue(''); }} className="p-1 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-400 transition-colors"><X className="w-3 h-3" /></button>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 ml-1">
                                                    <span className={`font-medium ${item.repairCosts?.warrantyStatus === 'IN_WARRANTY' ? 'text-green-500' :
                                                        item.repairCosts?.warrantyStatus === 'OUT_OF_WARRANTY' ? 'text-orange-500' :
                                                            item.repairCosts?.warrantyStatus === 'VOID' ? 'text-red-500' :
                                                                'text-[#1d1d1f] dark:text-white'
                                                        }`}>{item.repairCosts?.warrantyStatus ? t(`warranty.${item.repairCosts.warrantyStatus}`) : '-'}</span>
                                                    <button onClick={() => { setEditingWarrantyRMA(item.id); setEditWarrantyValue(item.repairCosts?.warrantyStatus || ''); }} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-[#0071e3] transition-colors" title="Edit Warranty"><Pencil className="w-3 h-3" /></button>
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400 flex items-start gap-1 w-full">
                                            <FileText className="w-3 h-3 mt-1 flex-shrink-0" />
                                            <span className="font-bold uppercase mt-1 w-24 flex-shrink-0 truncate" title={t('track.internalNote') || 'Notes'}>{t('track.internalNote') || 'Notes'}:</span>
                                            <div className="flex-grow flex items-center gap-2">
                                                <textarea
                                                    value={notesState[item.id] !== undefined ? notesState[item.id] : (item.notes || '')}
                                                    onChange={e => setNotesState(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                    rows={1}
                                                    className="flex-grow px-2 py-1 text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-[#0071e3] outline-none resize-none transition-colors"
                                                    placeholder={t('track.addNote') || 'Add note...'}
                                                    style={{ minHeight: '1.5rem' }}
                                                />
                                                <button
                                                    onClick={() => handleSaveNotes(item.id)}
                                                    className="p-1 rounded-md text-gray-400 hover:text-[#0071e3] transition-colors"
                                                    title="Save Note"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex flex-wrap items-center md:flex-col md:items-end gap-3 md:min-w-[140px]">
                                    {editingStatusRMA === item.id ? (
                                        <div className="flex items-center gap-2 min-w-[200px] bg-white dark:bg-[#2c2c2e] p-1 rounded-xl shadow-lg border border-gray-100 dark:border-[#333] z-10">
                                            <div className="flex-grow">
                                                <GlassSelect
                                                    value={editStatusValue}
                                                    onChange={val => setEditStatusValue(val as RMAStatus)}
                                                    options={statusOptions}
                                                />
                                            </div>
                                            <button onClick={() => handleSaveStatus(item.id)} className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600"><Check className="w-4 h-4" /></button>
                                            <button onClick={() => setEditingStatusRMA(null)} className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-300"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <div className="group relative inline-block">
                                            <StatusBadge status={item.status} />
                                            <button
                                                onClick={() => { setEditingStatusRMA(item.id); setEditStatusValue(item.status); }}
                                                className="absolute -right-2 -top-2 p-1 bg-white dark:bg-gray-700 rounded-full shadow-md text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-gray-600 z-10"
                                                title="Change Status"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
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
                                                if (!confirm('Are you sure you want to delete this rma? This action cannot be undone.')) return;
                                                setLoading(true);
                                                await MockDb.deleteRMA(item.id);
                                                // Refresh List
                                                await refreshRMAs();
                                                setLoading(false);
                                            }}
                                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                            title="Delete RMA"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <Link to={`/admin/track?id=${item.id}`} className="flex items-center gap-2 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/20 transition-transform hover:scale-105 active:scale-95">
                                            <Edit2 className="w-4 h-4" /> {t('track.edit')}
                                        </Link>
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
                                            <div className="pl-8 text-sm text-gray-400">No history available</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
