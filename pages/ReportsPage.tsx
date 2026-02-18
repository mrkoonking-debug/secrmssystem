
import React, { useEffect, useState } from 'react';
import { MockDb } from '../services/mockDb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown, Filter, Calendar, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';


export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetch = async () => {
      const rmas = await MockDb.getRMAs();

      // Group by Brand
      const brandStats: Record<string, number> = {};
      rmas.forEach(c => {
        brandStats[c.brand] = (brandStats[c.brand] || 0) + 1;
      });

      const chartData = Object.entries(brandStats).map(([name, value]) => ({ name, value }));
      setData(chartData);
      setLoading(false);
    };
    fetch();
  }, []);

  const COLORS = ['#0071e3', '#34c759', '#ff9500', '#af52de', '#ff3b30'];

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-2">{t('nav.reports')}</h1>
          <p className="text-gray-500">วิเคราะห์ข้อมูลการเคลมและสถิติแยกตามยี่ห้อและสถานะ</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#333] rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#2c2c2e]">
            <Calendar className="w-4 h-4" /> This Month
          </button>
          <button className="px-6 py-2.5 bg-[#0071e3] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            <FileDown className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-[2rem]">
          <h3 className="text-lg font-bold mb-8 dark:text-white">Claims by Brand</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#86868b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#86868b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', background: '#fff', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Bar dataKey="value" fill="#0071e3" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2rem]">
          <h3 className="text-lg font-bold mb-8 dark:text-white">Brand Distribution</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-64 md:h-80 w-full md:flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 w-full md:w-auto">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <div className="text-sm font-medium dark:text-gray-300">{entry.name} ({entry.value})</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
