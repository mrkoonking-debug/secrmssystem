
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockDb } from '../services/mockDb';
import { UserPlus, Trash2, Shield, User, Loader2, AlertCircle, Check } from 'lucide-react';
import { Team } from '../types';
import { GlassSelect } from '../components/GlassSelect';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'staff', team: 'ALL'
  });

  const fetchUsers = async () => {
    setLoading(true);
    const data = await MockDb.getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    const user = MockDb.getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    fetchUsers();
  }, [navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await MockDb.createStaffAccount(formData);
      setSuccess('สร้างบัญชีพนักงานสำเร็จ!');
      setFormData({ name: '', email: '', password: '', role: 'staff', team: 'ALL' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถสร้างบัญชีได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (confirm('ยืนยันการลบพนักงานรายนี้? (จะไม่สามารถกู้คืนได้)')) {
      await MockDb.deleteStaffAccount(uid);
      fetchUsers();
    }
  };

  const roleOptions = [
    { value: 'staff', label: 'พนักงานทั่วไป (Staff)' },
    { value: 'admin', label: 'ผู้จัดการระบบ (Admin)' }
  ];

  const teamOptions = [
    { value: 'ALL', label: 'ทุกแผนก' },
    { value: Team.HIKVISION, label: 'Team A (Hikvision)' },
    { value: Team.DAHUA, label: 'Team B (Dahua)' },
    { value: Team.TEAM_C, label: 'Team C (Network)' },
    { value: Team.TEAM_E, label: 'Team E (UPS)' },
    { value: Team.TEAM_G, label: 'Team G (Online)' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white mb-2">จัดการพนักงาน</h1>
        <p className="text-gray-500">สร้างและจัดการสิทธิ์การเข้าถึงระบบสำหรับทีมงานของคุณ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ฟอร์มสร้างพนักงานใหม่ */}
        <div className="glass-panel p-8 rounded-[2rem] h-fit">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" /> เพิ่มพนักงานใหม่
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">ชื่อ-นามสกุล</label>
              <input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm"
                placeholder="สมชาย มั่นคง"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">อีเมลเข้าระบบ</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm"
                placeholder="staff01@sec-claim.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">รหัสผ่าน</label>
              <input
                required
                type="password"
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-gray-50 dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#424245] rounded-xl px-4 py-3 text-sm"
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>

            <GlassSelect
              label="ระดับสิทธิ์"
              value={formData.role}
              onChange={val => setFormData({ ...formData, role: val })}
              options={roleOptions}
            />

            <GlassSelect
              label="แผนกที่รับผิดชอบ"
              value={formData.team}
              onChange={val => setFormData({ ...formData, team: val })}
              options={teamOptions}
            />

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-600 rounded-xl text-xs flex items-center gap-2"><Check className="w-4 h-4" /> {success}</div>}

            <button
              disabled={isSubmitting}
              className="w-full py-4 bg-[#0071e3] hover:bg-[#0077ed] disabled:bg-gray-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'สร้างบัญชี'}
            </button>
          </form>
        </div>

        {/* รายชื่อพนักงานทั้งหมด */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold mb-4 ml-2">รายชื่อทีมงาน ({users.length})</h3>
          {loading ? (
            <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-300" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((user) => (
                <div key={user.uid} className="glass-panel p-6 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {user.role === 'admin' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="font-bold dark:text-white">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      <div className="mt-1 flex gap-2">
                        <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-600 uppercase font-bold">{user.role}</span>
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded text-blue-600 uppercase font-bold">{user.team}</span>
                      </div>
                    </div>
                  </div>
                  {MockDb.getCurrentUser()?.uid !== user.uid && (
                    <button
                      onClick={() => handleDelete(user.uid)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
