
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockDb } from '../services/mockDb';
import { Building2, Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const DistributorManagement: React.FC = () => {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newFull, setNewFull] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFull, setEditFull] = useState('');

  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchDistributors = async () => {
    setLoading(true);
    const data = await MockDb.getDistributors();
    setDistributors(data.sort((a, b) => a.value.localeCompare(b.value)));
    setLoading(false);
  };

  useEffect(() => {
    const user = MockDb.getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    fetchDistributors();
  }, [navigate]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newFull.trim()) return;
    setIsSubmitting(true);
    await MockDb.addDistributor({ value: newName.trim(), label: newFull.trim() });
    setNewName(''); setNewFull('');
    await fetchDistributors();
    setIsSubmitting(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editFull.trim()) return;
    setIsSubmitting(true);
    await MockDb.updateDistributor(id, { value: editName.trim(), label: editFull.trim() });
    setEditingId(null);
    await fetchDistributors();
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('management.deleteConfirm'))) {
      await MockDb.deleteDistributor(id);
      fetchDistributors();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-2">{t('nav.distributors')}</h1>
        <p className="text-gray-500">จัดการรายชื่อดิสทิบิวเตอร์ผู้นำเข้าสำหรับการออกใบนำส่งเคลม</p>
      </div>

      <div className="glass-panel p-8 rounded-[2rem] mb-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-500" /> {t('management.addDistributor')}</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={newName} onChange={e => setNewName(e.target.value)} className="bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm" placeholder={t('management.distributorName')} />
            <input value={newFull} onChange={e => setNewFull(e.target.value)} className="bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm" placeholder={t('management.distributorFullName')} />
          </div>
          <button disabled={isSubmitting} className="w-full py-3 bg-[#0071e3] text-white rounded-xl font-bold shadow-md hover:scale-[1.01] transition-all">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('management.addDistributor')}
          </button>
        </form>
      </div>

      <div className="glass-panel rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-[#333] flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <h3 className="font-bold dark:text-white">รายชื่อดิสทิบิวเตอร์ ({distributors.length})</h3>
          <Building2 className="w-5 h-5 text-gray-400" />
        </div>
        {loading ? <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
          <div className="divide-y divide-gray-100 dark:divide-[#333]">
            {distributors.map((d) => (
              <div key={d.id} className="p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                {editingId === d.id ? (
                  <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="bg-white dark:bg-[#333] border border-[#0071e3] rounded-lg px-3 py-2 text-sm" placeholder="Short Name" />
                      <input value={editFull} onChange={e => setEditFull(e.target.value)} className="bg-white dark:bg-[#333] border border-[#0071e3] rounded-lg px-3 py-2 text-sm" placeholder="Full Company Name" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-bold">Cancel</button>
                      <button onClick={() => handleUpdate(d.id)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"><Check className="w-4 h-4" /> Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg dark:text-white">{d.value}</div>
                      <div className="text-sm text-gray-500">{d.label}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(d.id); setEditName(d.value); setEditFull(d.label); }} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(d.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
