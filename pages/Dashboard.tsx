import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DashboardStats, Team, ClaimStatus } from '../types';
import { MockDb } from '../services/mockDb';
import { Clock, CheckCircle2, AlertTriangle, Truck, TrendingUp, AlertOctagon, Timer, ChevronRight, Layers, Box, Wifi, Zap, ShoppingBag, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | 'ALL' | 'GROUP_C'>('ALL');
    const [isGroupCActive, setIsGroupCActive] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            const teamFilter = selectedTeam === 'ALL' ? undefined : selectedTeam;
            const data = await MockDb.getStats(teamFilter);

            // Recalculate "Revenue Pipeline" to act as "Pending Vendor Count" for this view
            const allClaims = await MockDb.getAllClaims();
            const claimsAtVendor = allClaims.filter(c => {
                const isWaiting = c.status === ClaimStatus.WAITING_PARTS;
                if (!teamFilter) return isWaiting;
                const isTeamMatch = teamFilter === 'GROUP_C'
                    ? [Team.TEAM_C, Team.TEAM_E, Team.TEAM_G].includes(c.team)
                    : c.team === teamFilter;
                return isWaiting && isTeamMatch;
            }).length;

            setStats({ ...data, revenuePipeline: claimsAtVendor });
        };
        fetchData();

        if (selectedTeam === 'GROUP_C' || [Team.TEAM_C, Team.TEAM_E, Team.TEAM_G].includes(selectedTeam as Team)) {
            setIsGroupCActive(true);
        } else if (selectedTeam !== 'ALL') {
            setIsGroupCActive(false);
        }
    }, [selectedTeam]);

    const handleMainFilterClick = (type: 'ALL' | 'A' | 'B' | 'C') => {
        if (type === 'ALL') { setSelectedTeam('ALL'); setIsGroupCActive(false); }
        else if (type === 'A') { setSelectedTeam(Team.HIKVISION); setIsGroupCActive(false); }
        else if (type === 'B') { setSelectedTeam(Team.DAHUA); setIsGroupCActive(false); }
        else if (type === 'C') { setSelectedTeam('GROUP_C'); setIsGroupCActive(true); }
    };

    const agingData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: t('dashboard.fresh'), value: stats.agingBuckets.bucket0_3 },
            { name: t('dashboard.aging'), value: stats.agingBuckets.bucket4_7 },
            { name: t('dashboard.stale'), value: stats.agingBuckets.bucket7plus },
        ];
    }, [stats, t]);

    if (!stats) return <div className="p-20 text-center text-gray-400">Loading Data...</div>;

    const StatCard = ({ label, value, icon, color, subValue, subLabel }: any) => (
        <div className="glass-panel p-4 md:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20`}>{icon}</div>
                {subValue && <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#333] px-3 py-1 rounded-full">{subValue} {subLabel}</span>}
            </div>
            <div className="relative z-10 mt-6">
                <div className="text-2xl md:text-4xl font-bold text-[#1d1d1f] dark:text-white tracking-tighter mb-1">{value}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            <div className="flex flex-col justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-2">{t('dashboard.title')}</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">{t('dashboard.welcome')}</p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                        <button onClick={() => handleMainFilterClick('ALL')} className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${selectedTeam === 'ALL' ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black shadow-lg' : 'bg-white dark:bg-[#1c1c1e] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]'}`}>{t('teams.all')}</button>
                        <button onClick={() => handleMainFilterClick('A')} className={`px-6 py-3 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${selectedTeam === Team.HIKVISION ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white dark:bg-[#1c1c1e] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]'}`}><Box className="w-4 h-4" /> Team A</button>
                        <button onClick={() => handleMainFilterClick('B')} className={`px-6 py-3 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${selectedTeam === Team.DAHUA ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-[#1c1c1e] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]'}`}><Layers className="w-4 h-4" /> Team B</button>
                        <button onClick={() => handleMainFilterClick('C')} className={`px-6 py-3 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isGroupCActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-[#1c1c1e] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]'}`}><Wifi className="w-4 h-4" /> Team C <ChevronDown className={`w-3 h-3 ${isGroupCActive ? 'rotate-180' : ''}`} /></button>
                    </div>
                    {isGroupCActive && (
                        <div className="flex items-center gap-3 animate-fade-in pl-4 border-l-2 border-blue-500/20">
                            <button onClick={() => setSelectedTeam(Team.TEAM_C)} className={`px-4 py-2 rounded-full text-xs font-bold ${selectedTeam === Team.TEAM_C ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>Network</button>
                            <button onClick={() => setSelectedTeam(Team.TEAM_E)} className={`px-4 py-2 rounded-full text-xs font-bold ${selectedTeam === Team.TEAM_E ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>UPS</button>
                            <button onClick={() => setSelectedTeam(Team.TEAM_G)} className={`px-4 py-2 rounded-full text-xs font-bold ${selectedTeam === Team.TEAM_G ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>Online</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-10">
                <StatCard label={t('dashboard.pendingAction')} value={stats.pendingClaims} icon={<Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />} color="bg-blue-500" />
                <StatCard label={t('dashboard.revenuePipeline')} value={stats.revenuePipeline} icon={<Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />} color="bg-orange-500" />
                <StatCard label={t('dashboard.avgTurnaround')} value={`${stats.avgTurnaroundHours}`} subLabel={t('dashboard.hrs')} subValue="Avg" icon={<Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />} color="bg-purple-500" />
                <StatCard label={t('dashboard.overdue')} value={stats.overdueCount} icon={<AlertOctagon className="w-6 h-6 text-red-600 dark:text-red-400" />} color="bg-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel p-8">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white flex items-center gap-3"><TrendingUp className="w-6 h-6 text-blue-500" /> {t('dashboard.agingAnalysis')}</h3>
                        <p className="text-sm text-gray-500 mt-1">Claims distribution by time open</p>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={agingData} barSize={80}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#86868b', fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#86868b', fontWeight: 500 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', background: '#fff', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', color: '#1d1d1f' }}
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                />
                                <Bar dataKey="value" fill="#0071e3" radius={[12, 12, 12, 12]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="glass-panel p-8 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white flex items-center gap-3"><AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" /> {t('dashboard.urgentAttention')}</h3>
                        <p className="text-sm text-gray-500 mt-1">Requires immediate action</p>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar max-h-[400px]">
                        {stats.urgentClaims.map(claim => (
                            <Link key={claim.id} to={`/admin/track?id=${claim.id}`} className="block bg-[#f5f5f7] dark:bg-[#2c2c2e] hover:bg-gray-100 dark:hover:bg-[#3a3a3c] p-5 rounded-3xl transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors">{claim.productModel}</div>
                                    <div className="text-[10px] font-mono text-gray-400 bg-white dark:bg-black/20 px-2 py-1 rounded-lg">{claim.id}</div>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">{claim.issueDescription}</div>
                                <div className="flex justify-between items-center">
                                    <StatusBadge status={claim.status} />
                                    <div className="text-[11px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                                        {Math.floor((Date.now() - new Date(claim.createdAt).getTime()) / (86400000))}d ago
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};