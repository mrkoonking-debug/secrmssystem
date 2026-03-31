
import React, { useEffect, useState, useMemo } from 'react';
import { MockDb } from '../services/mockDb';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { FileDown, Calendar, Loader2, TrendingUp, CheckCircle2, Clock, AlertTriangle, ChevronDown, Package, Wrench, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { RMA, RMAStatus } from '../types';

type DateRange = 'week' | 'month' | '3months' | 'year' | 'all';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  week: 'สัปดาห์นี้',
  month: 'เดือนนี้',
  '3months': '3 เดือนล่าสุด',
  year: 'ปีนี้',
  all: 'ทั้งหมด',
};

const getStartDate = (range: DateRange): Date | null => {
  const now = new Date();
  switch (range) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month': return new Date(now.getFullYear(), now.getMonth(), 1);
    case '3months': return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    case 'year': return new Date(now.getFullYear(), 0, 1);
    case 'all': return null;
  }
};

export const ReportsPage: React.FC = () => {
  const [allRMAs, setAllRMAs] = useState<RMA[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      const rmas = await MockDb.getRMAs();
      setAllRMAs(rmas);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setShowDropdown(false);
    if (showDropdown) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showDropdown]);

  // Filter RMAs by date range
  const filteredRMAs = useMemo(() => {
    const start = getStartDate(dateRange);
    if (!start) return allRMAs;
    return allRMAs.filter(rma => new Date(rma.createdAt) >= start);
  }, [allRMAs, dateRange]);

  // ==================== KPI CALCULATIONS ====================

  const kpis = useMemo(() => {
    const total = filteredRMAs.length;
    const closed = filteredRMAs.filter(r => r.status === RMAStatus.CLOSED || r.status === RMAStatus.REPAIRED).length;
    const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // Average turnaround (days) for resolved items
    const resolvedItems = filteredRMAs.filter(r => r.resolvedAt);
    let avgDays = 0;
    if (resolvedItems.length > 0) {
      const totalDays = resolvedItems.reduce((sum, r) => {
        const created = new Date(r.createdAt).getTime();
        const resolved = new Date(r.resolvedAt!).getTime();
        return sum + (resolved - created) / (1000 * 60 * 60 * 24);
      }, 0);
      avgDays = Math.round((totalDays / resolvedItems.length) * 10) / 10;
    }

    const openCount = filteredRMAs.filter(r =>
      r.status === RMAStatus.PENDING || r.status === RMAStatus.DIAGNOSING || r.status === RMAStatus.WAITING_PARTS
    ).length;

    return { total, completionRate, avgDays, openCount };
  }, [filteredRMAs]);

  // ==================== STATUS PIPELINE ====================

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRMAs.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });

    const statusConfig: { key: RMAStatus; label: string; color: string }[] = [
      { key: RMAStatus.PENDING, label: 'รอดำเนินการ', color: '#f59e0b' },
      { key: RMAStatus.DIAGNOSING, label: 'กำลังตรวจสอบ', color: '#3b82f6' },
      { key: RMAStatus.WAITING_PARTS, label: 'รออะไหล่/ส่งศูนย์', color: '#f97316' },
      { key: RMAStatus.REPAIRED, label: 'ซ่อมเสร็จ', color: '#10b981' },
      { key: RMAStatus.REJECTED, label: 'ปฏิเสธ', color: '#ef4444' },
      { key: RMAStatus.CLOSED, label: 'ปิดงาน', color: '#6b7280' },
    ];

    return statusConfig.map(s => ({
      name: s.label,
      value: counts[s.key] || 0,
      fill: s.color,
    }));
  }, [filteredRMAs]);

  // ==================== BRAND DISTRIBUTION ====================

  const brandData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRMAs.forEach(r => { counts[r.brand] = (counts[r.brand] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRMAs]);

  // ==================== PRODUCT TYPE DISTRIBUTION ====================

  const productTypeData = useMemo(() => {
    const typeLabels: Record<string, string> = {
      'CCTV_CAMERA': 'กล้อง CCTV',
      'NVR_DVR': 'เครื่องบันทึก NVR/DVR',
      'NETWORK_SWITCH': 'Switch',
      'ROUTER_FIREWALL': 'Router/Firewall',
      'ACCESS_CONTROL': 'Access Control',
      'OTHER': 'อื่นๆ',
    };
    const counts: Record<string, number> = {};
    filteredRMAs.forEach(r => {
      const label = typeLabels[r.productType] || r.productType;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRMAs]);

  // ==================== WEEKLY TREND ====================

  const weeklyTrend = useMemo(() => {
    if (filteredRMAs.length === 0) return [];

    // Get range
    const dates = filteredRMAs.map(r => new Date(r.createdAt).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates, Date.now()));

    // Build weekly buckets
    const weeks: { label: string; start: Date; count: number }[] = [];
    const current = new Date(minDate);
    current.setDate(current.getDate() - current.getDay()); // Start of week
    current.setHours(0, 0, 0, 0);

    while (current <= maxDate) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const label = `${current.getDate()}/${current.getMonth() + 1}`;
      weeks.push({ label, start: new Date(current), count: 0 });
      current.setDate(current.getDate() + 7);
    }

    // Count RMAs per week
    filteredRMAs.forEach(rma => {
      const created = new Date(rma.createdAt);
      for (let i = weeks.length - 1; i >= 0; i--) {
        if (created >= weeks[i].start) {
          weeks[i].count++;
          break;
        }
      }
    });

    // Limit to last 12 weeks max
    return weeks.slice(-12).map(w => ({ name: w.label, งาน: w.count }));
  }, [filteredRMAs]);

  // ==================== TOP FAILING MODELS ====================

  const topModels = useMemo(() => {
    const counts: Record<string, { brand: string; count: number }> = {};
    filteredRMAs.forEach(r => {
      const key = `${r.brand} ${r.productModel}`;
      if (!counts[key]) counts[key] = { brand: r.brand, count: 0 };
      counts[key].count++;
    });
    return Object.entries(counts)
      .map(([model, data]) => ({ model, brand: data.brand, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredRMAs]);

  // ==================== TURNAROUND DISTRIBUTION ====================

  const turnaroundDist = useMemo(() => {
    const buckets = [
      { label: '1-3 วัน', min: 0, max: 3, count: 0, color: '#10b981' },
      { label: '4-7 วัน', min: 4, max: 7, count: 0, color: '#3b82f6' },
      { label: '8-14 วัน', min: 8, max: 14, count: 0, color: '#f59e0b' },
      { label: '15-30 วัน', min: 15, max: 30, count: 0, color: '#f97316' },
      { label: '30+ วัน', min: 31, max: 9999, count: 0, color: '#ef4444' },
    ];

    filteredRMAs.filter(r => r.resolvedAt).forEach(r => {
      const days = Math.ceil((new Date(r.resolvedAt!).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      for (const b of buckets) {
        if (days >= b.min && days <= b.max) { b.count++; break; }
      }
    });

    return buckets.map(b => ({ name: b.label, value: b.count, fill: b.color }));
  }, [filteredRMAs]);

  // ==================== COLORS ====================

  const BRAND_COLORS = ['#0071e3', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  const TYPE_COLORS = ['#6366f1', '#14b8a6', '#f97316', '#e11d48', '#a855f7', '#64748b'];

  // ==================== RENDER ====================

  if (loading) return (
    <div className="p-20 text-center">
      <Loader2 className="animate-spin mx-auto w-8 h-8 text-gray-400" />
      <p className="text-sm text-gray-400 mt-4">กำลังโหลดข้อมูล...</p>
    </div>
  );

  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-[#1c1c1e] px-4 py-3 rounded-2xl shadow-xl border border-gray-100 dark:border-[#333]">
        <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
            {p.value} {p.name || 'งาน'}
          </p>
        ))}
      </div>
    );
  };

  // Donut label renderer
  const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value, percent }: any) => {
    if (percent < 0.05) return null; // Don't label tiny slices
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#86868b" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600}>
        {name} ({value})
      </text>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] dark:text-white mb-1">{t('nav.reports')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">วิเคราะห์ข้อมูลเชิงลึก เพื่อการตัดสินใจที่แม่นยำ</p>
        </div>
        <div className="flex gap-3">
          {/* Date Range Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
              className="px-5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#333] rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#0071e3]" />
              {DATE_RANGE_LABELS[dateRange]}
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#333] rounded-2xl shadow-xl overflow-hidden z-50">
                {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map(key => (
                  <button
                    key={key}
                    onClick={() => { setDateRange(key); setShowDropdown(false); }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${dateRange === key
                      ? 'bg-[#0071e3] text-white'
                      : 'text-[#1d1d1f] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]'
                      }`}
                  >
                    {DATE_RANGE_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8">
        <div className="glass-panel p-5 md:p-6 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">{kpis.total}</div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">งานทั้งหมด</div>
        </div>

        <div className="glass-panel p-5 md:p-6 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight flex items-baseline gap-1">
            {kpis.completionRate}<span className="text-lg text-gray-400">%</span>
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">อัตราปิดงาน</div>
        </div>

        <div className="glass-panel p-5 md:p-6 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight flex items-baseline gap-1">
            {kpis.avgDays}<span className="text-lg text-gray-400">วัน</span>
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">เวลาเฉลี่ย</div>
        </div>

        <div className="glass-panel p-5 md:p-6 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">{kpis.openCount}</div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">ค้างดำเนินการ</div>
        </div>
      </div>

      {/* Row 2: Trend + Status Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-8 mb-8">
        {/* Weekly Trend - wider */}
        <div className="lg:col-span-3 glass-panel p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              แนวโน้มงานเข้ารายสัปดาห์
            </h3>
            <p className="text-xs text-gray-400 mt-1">จำนวนงานเคลมที่เข้ามาในแต่ละสัปดาห์</p>
          </div>
          <div className="h-64 w-full">
            {weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0071e3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.08)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#86868b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#86868b' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltipContent />} />
                  <Area type="monotone" dataKey="งาน" stroke="#0071e3" strokeWidth={2.5} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">ไม่มีข้อมูลในช่วงเวลานี้</div>
            )}
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="lg:col-span-2 glass-panel p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-green-500" />
              สถานะงาน
            </h3>
            <p className="text-xs text-gray-400 mt-1">จำนวนงานในแต่ละสถานะ</p>
          </div>
          <div className="space-y-3">
            {statusData.filter(s => s.value > 0).map((item, i) => {
              const maxVal = Math.max(...statusData.map(s => s.value), 1);
              const pct = (item.value / maxVal) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium text-gray-500 dark:text-gray-400 text-right flex-shrink-0 truncate">{item.name}</div>
                  <div className="flex-1 h-7 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.fill }}
                    />
                  </div>
                  <div className="w-8 text-sm font-bold text-[#1d1d1f] dark:text-white text-right">{item.value}</div>
                </div>
              );
            })}
            {statusData.every(s => s.value === 0) && (
              <div className="text-center text-gray-400 text-sm py-8">ไม่มีข้อมูล</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Brand + Product Type Donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 mb-8">
        {/* Brand Distribution */}
        <div className="glass-panel p-6 md:p-8">
          <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-6">สัดส่วนแยกยี่ห้อ</h3>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="h-56 w-full md:flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={brandData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {brandData.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 w-full md:w-auto">
              {brandData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{entry.name}</span>
                  <span className="text-xs font-bold text-[#1d1d1f] dark:text-white ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Type Distribution */}
        <div className="glass-panel p-6 md:p-8">
          <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-6">ประเภทสินค้าที่เคลม</h3>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="h-56 w-full md:flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={productTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {productTypeData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 w-full md:w-auto">
              {productTypeData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{entry.name}</span>
                  <span className="text-xs font-bold text-[#1d1d1f] dark:text-white ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Top Models + Turnaround Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
        {/* Top Failing Models */}
        <div className="glass-panel p-6 md:p-8">
          <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-1">รุ่นที่เคลมบ่อยที่สุด</h3>
          <p className="text-xs text-gray-400 mb-5">ข้อมูลช่วยระบุสินค้าที่มีปัญหาคุณภาพ</p>
          {topModels.length > 0 ? (
            <div className="space-y-2">
              {topModels.map((item, i) => {
                const maxCount = topModels[0]?.count || 1;
                const pct = (item.count / maxCount) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i < 3
                      ? 'bg-[#0071e3] text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#1d1d1f] dark:text-white truncate">{item.model}</div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full bg-[#0071e3] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#1d1d1f] dark:text-white flex-shrink-0">{item.count}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-8">ไม่มีข้อมูล</div>
          )}
        </div>

        {/* Turnaround Distribution */}
        <div className="glass-panel p-6 md:p-8">
          <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-1">ระยะเวลาดำเนินการ</h3>
          <p className="text-xs text-gray-400 mb-5">กระจายตัวของเวลาที่ใช้ปิดงาน</p>
          <div className="h-56 w-full">
            {turnaroundDist.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnaroundDist} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.08)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#86868b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#86868b' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltipContent />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {turnaroundDist.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">ไม่มีงานที่ปิดในช่วงเวลานี้</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
