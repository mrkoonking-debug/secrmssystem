
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MockDb } from '../services/mockDb';
import { RMA, RMAStatus } from '../types';
import { ArrowLeft, Package, User, Clock, Edit2, AlertCircle, CheckCircle2, History, Trash2, Truck, ShieldCheck, FileText, Edit3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { EditRMADrawer } from '../components/EditRMADrawer';
import { printJobDocuments } from '../services/printService';
import { Printer } from 'lucide-react'; // Added import or ensure it is already there

export const JobDetail: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const [rmas, setRMAs] = useState<RMA[]>([]);
    const [jobInfo, setJobInfo] = useState<{ id: string, customerName: string, count: number, date: string, status: string, type: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRMAs, setExpandedRMAs] = useState<Set<string>>(new Set());
    const [editingRMA, setEditingRMA] = useState<RMA | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const { t } = useLanguage();
    const navigate = useNavigate();

    // ... (rest of useEffects)

    const handleSaveChanges = async (rmaId: string, updates: Partial<RMA>, diffs: { field: string, old: string, new: string }[]) => {
        await MockDb.updateRMA(rmaId, { ...updates, updatedAt: new Date().toISOString() });

        // Add single system event summarizing changes
        const changeDesc = diffs.map(d => `${d.field}: ${d.old} -> ${d.new}`).join(', ');
        await MockDb.addTimelineEvent(rmaId, {
            type: 'SYSTEM',
            description: `Edited: ${changeDesc}`,
            user: MockDb.getCurrentUser()?.name || 'Staff'
        });

        await refreshRMAs();
        setEditingRMA(null);
        setIsEditOpen(false); // Close drawer after saving
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
                        id: decodedId,
                        customerName: first.customerName,
                        count: jobRMAs.length,
                        date: first.createdAt,
                        status: jobRMAs.every(r => r.status === RMAStatus.CLOSED) ? 'Completed' : 'In Progress',
                        type: first.quotationNumber ? 'QUOTATION' : first.groupRequestId ? 'GROUP' : 'SINGLE'
                    });

                    // Check for auto-open query param
                    const editRmaId = searchParams.get('editRmaId');
                    if (editRmaId && !isEditOpen) {
                        const targetRMA = jobRMAs.find(r => r.id === editRmaId);
                        if (targetRMA) {
                            setEditingRMA(targetRMA);
                            setIsEditOpen(true);
                        }
                    }
                } else {
                    // navigate('/admin/rmas'); // Optional redirect
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
        setEditingRMA(rma);
        setIsEditOpen(true);
        // Optional: Update URL to reflect state?
        // setSearchParams({ editRmaId: rma.id });
        // Might be annoying if user just wants quick edit.
    };

    const handleCloseEdit = () => {
        setIsEditOpen(false);
        setEditingRMA(null);
        // Clear param if it exists
        if (searchParams.get('editRmaId')) {
            setSearchParams({}, { replace: true });
        }
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
                            <h1 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-1">{jobInfo.id}</h1>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500"><span className="flex items-center gap-1"><User className="w-4 h-4" /> {jobInfo.customerName}</span><span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(jobInfo.date).toLocaleDateString()}</span><span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs">{jobInfo.count} Items</span></div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => printJobDocuments(rmas)}
                            className="flex items-center gap-2 px-6 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-transform hover:scale-105 active:scale-95"
                            title="Print Distributor & Customer Forms"
                        >
                            <Printer className="w-5 h-5" />
                            <span>Print Forms</span>
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 justify-end mt-4 md:mt-0">
                    <div className="text-center px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl"><div className="text-xl font-bold text-green-600 dark:text-green-400">{rmas.filter(c => c.status === RMAStatus.CLOSED || c.status === RMAStatus.REPAIRED).length}</div><div className="text-[10px] uppercase text-green-600/70 font-bold">Done</div></div>
                    <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><div className="text-xl font-bold text-blue-600 dark:text-blue-400">{rmas.filter(c => c.status !== RMAStatus.CLOSED && c.status !== RMAStatus.REPAIRED).length}</div><div className="text-[10px] uppercase text-blue-600/70 font-bold">Active</div></div>
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
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2"><AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /><span className="line-clamp-2">{item.issueDescription}</span></div>
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
                                            <div className="flex-grow py-1 text-sm text-[#1d1d1f] dark:text-white break-words">
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
                                            <div className="pl-8 text-sm text-gray-400">No history available</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Edit Slide-over */}
            {editingRMA && (
                <EditRMADrawer
                    isOpen={isEditOpen}
                    onClose={handleCloseEdit}
                    rma={editingRMA}
                    onSave={handleSaveChanges}
                />
            )}
        </div>
    );
};
