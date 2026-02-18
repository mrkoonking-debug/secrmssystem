
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockDb } from '../services/mockDb';
import { Settings, Save, Check, Loader2, Globe, Building } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const user = MockDb.getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    const fetch = async () => {
      const data = await MockDb.getSettings();
      setSettings(data);
      setLoading(false);
    };
    fetch();
  }, [navigate]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await MockDb.updateSettings(settings);
    setSuccess('Settings Saved!');
    setIsSaving(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-2">{t('nav.settings')}</h1>
        <p className="text-gray-500">ตั้งค่าข้อมูลบริษัทสำหรับใช้แสดงผลในเอกสารใบเคลมและใบรับคืน</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-panel p-8 rounded-[2rem] space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2"><Building className="w-5 h-5 text-blue-500" /> ข้อมูลบริษัท</h3>

          <div className="flex flex-col md:flex-row gap-8 items-start mb-6 border-b border-gray-100 dark:border-white/10 pb-6">
            <div className="shrink-0">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Company Logo</label>
              <div className="w-48 h-20 border-2 border-dashed border-gray-200 dark:border-[#424245] rounded-xl flex items-center justify-center bg-gray-50 dark:bg-[#2c2c2e] overflow-hidden relative group cursor-pointer hover:border-blue-500 transition-colors">
                {settings.logoUrl ?
                  <img src={settings.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" /> :
                  <span className="text-gray-400 text-xs">Upload Logo</span>
                }
                <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity pointer-events-none">Click to Change</div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Recommended: 200px width (PNG/JPG)</p>
            </div>
            <div className="flex-1 pt-4">
              <h4 className="font-bold text-sm text-[#1d1d1f] dark:text-white mb-1">Logo Configuration</h4>
              <p className="text-xs text-gray-500 leading-relaxed">This logo will appear on all printed documents including Distributor RMA Requests and Customer Return Notes. Please use a transparent PNG for best results.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Company Name (TH)</label>
              <input value={settings.nameTh} onChange={e => setSettings({ ...settings, nameTh: e.target.value })} className="w-full bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Company Name (EN)</label>
              <input value={settings.nameEn} onChange={e => setSettings({ ...settings, nameEn: e.target.value })} className="w-full bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Address</label>
            <textarea value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} className="w-full bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm" rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tax ID</label>
              <input value={settings.taxId} onChange={e => setSettings({ ...settings, taxId: e.target.value })} className="w-full bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tel</label>
              <input value={settings.tel} onChange={e => setSettings({ ...settings, tel: e.target.value })} className="w-full bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Website</label>
              <input value={settings.website} onChange={e => setSettings({ ...settings, website: e.target.value })} className="w-full bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>
        </div>



        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] border border-gray-100 dark:border-[#333]">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Globe className="w-4 h-4" /> Changes will reflect on all PDF documents.
          </div>
          <div className="flex items-center gap-4">
            {success && <span className="text-green-500 text-sm font-bold flex items-center gap-1"><Check className="w-4 h-4" /> {success}</span>}
            <button disabled={isSaving} className="px-8 py-3 bg-[#0071e3] text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 active:scale-95 transition-all">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Settings</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
