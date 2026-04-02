
import React, { useEffect, useState } from 'react';
import { ShieldCheck, LogOut, Globe, LayoutGrid, List, PlusCircle, Plus, User, Users, Menu, X, Truck, Settings, BarChart3, Tag, Building2, Bell, History } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MockDb } from '../services/mockDb';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  embedded?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ embedded = false }) => {
  const [user, setUser] = useState<any>(null);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    MockDb.waitForAuth().then(() => {
      setUser(MockDb.getCurrentUser());
    });

    const checkIncoming = async () => {
      try {
        const { unassigned, overdue } = await MockDb.getNavCounts();
        setUnassignedCount(unassigned);
        setOverdueCount(overdue);
      } catch (err) {
        console.error("Failed to fetch counts", err);
      }
    };

    checkIncoming();
    const interval = setInterval(checkIncoming, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [location]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    MockDb.logout();
    setUser(null);
    navigate('/login');
  };

  if (location.pathname === '/login') return null;

  const NavLink = ({ to, label, icon: Icon, badgeCount = 0 }: { to: string, label: string, icon: any, badgeCount?: number }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-[#0071e3] text-white shadow-lg shadow-blue-500/20' : 'text-[#86868b] dark:text-gray-400 hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-sm hover:text-[#1d1d1f] dark:hover:text-white'}`}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition-colors'}`} />
        <span className="text-sm font-semibold tracking-tight">{label}</span>

        {/* 🔥 แจ้งเตือนเป็นตัวเลข กรอบสีแดง */}
        {badgeCount > 0 && (
          <div className="absolute right-3 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-black px-1.5 rounded-full shadow-sm ring-2 ring-white dark:ring-[#161617]">
            {badgeCount > 99 ? '99+' : badgeCount}
          </div>
        )}

        {/* จุดสีฟ้าแสดงสถานะเมนูที่เลือก (ถ้าไม่มีตัวเลขแจ้งเตือน) */}
        {isActive && badgeCount === 0 && (
          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
        )}
      </Link>
    );
  };

  const navContent = (
    <>
      {user ? (
        <>
          <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mb-2 mt-2 pl-4">Management</div>
          <NavLink to="/admin/dashboard" label={t('nav.overview')} icon={LayoutGrid} badgeCount={overdueCount} />
          <NavLink to="/admin/incoming" label={t('nav.incoming')} icon={Bell} badgeCount={unassignedCount} />
          <NavLink to="/admin/rmas" label={t('nav.claims')} icon={List} />
          <NavLink to="/admin/submit" label={t('nav.newRequest')} icon={PlusCircle} />
          <NavLink to="/admin/reports" label={t('nav.reports')} icon={BarChart3} />

          {user.role === 'admin' && (
            <>
              <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mt-8 mb-2 pl-4">System</div>
              <NavLink to="/admin/users" label={t('nav.users')} icon={Users} />
              <NavLink to="/admin/logs" label="System Logs" icon={History} />
              <NavLink to="/admin/brands" label={t('nav.brands')} icon={Tag} />
              <NavLink to="/admin/distributors" label={t('nav.distributors')} icon={Building2} />
              <NavLink to="/admin/settings" label={t('nav.settings')} icon={Settings} />
            </>
          )}
        </>
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] text-center mt-4 shadow-sm border border-gray-100 dark:border-[#333]">
          <p className="text-base font-bold text-[#1d1d1f] dark:text-white mb-2">Customer Portal</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ===== Mobile Top Bar ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#f5f5f7] dark:bg-[#161617] border-b border-gray-200/50 dark:border-[#333] flex items-center justify-between px-4">
        <Link to={user ? "/admin/dashboard" : "/"} className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-base text-[#1d1d1f] dark:text-white tracking-tighter">SEC RMS SYSTEM</span>
        </Link>
        {/* Mobile notifications and menu buttons have been moved to the Bottom Tab Bar */}
      </div>

      {/* ===== Mobile Bottom Tab Bar (Glassmorphism) ===== */}
      {user && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pointer-events-none"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Floating '+' button — positioned from outer wrapper for perfect centering */}
          <Link to="/admin/submit" className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%-1.25rem)] w-12 h-12 bg-gradient-to-b from-[#007aff] to-[#0055d4] text-white rounded-full shadow-[0_4px_14px_rgba(0,122,255,0.4)] flex items-center justify-center active:scale-90 transition-transform z-50 pointer-events-auto" style={{ bottom: 'calc(100% - 1.75rem)' }}>
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </Link>

          {/* Glass capsule bar */}
          <div className="relative bg-white/75 dark:bg-[#1c1c1e]/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] rounded-[22px] shadow-[0_2px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.35)] grid grid-cols-5 items-center h-[52px] pointer-events-auto">

            {/* Dashboard */}
            <Link to="/admin/dashboard" className={`flex flex-col items-center justify-center h-full relative transition-colors ${location.pathname === '/admin/dashboard' ? 'text-[#007aff]' : 'text-[#8e8e93]'}`}>
              <LayoutGrid className="w-[20px] h-[20px]" />
              <span className="text-[9px] font-semibold mt-0.5 leading-none">ภาพรวม</span>
              {overdueCount > 0 && (
                <span className="absolute top-1.5 right-[18%] w-[6px] h-[6px] rounded-full bg-red-500"></span>
              )}
            </Link>

            {/* Claims List */}
            <Link to="/admin/rmas" className={`flex flex-col items-center justify-center h-full transition-colors ${location.pathname === '/admin/rmas' ? 'text-[#007aff]' : 'text-[#8e8e93]'}`}>
              <List className="w-[20px] h-[20px]" />
              <span className="text-[9px] font-semibold mt-0.5 leading-none">รายการ</span>
            </Link>

            {/* Center spacer for '+' button */}
            <div className="flex flex-col items-center justify-end h-full pb-1">
              <span className="text-[9px] font-semibold text-[#8e8e93] leading-none">เพิ่มเคลม</span>
            </div>

            {/* Notifications */}
            <Link to="/admin/incoming" className={`flex flex-col items-center justify-center h-full relative transition-colors ${location.pathname === '/admin/incoming' ? 'text-[#007aff]' : 'text-[#8e8e93]'}`}>
              <Bell className="w-[20px] h-[20px]" />
              <span className="text-[9px] font-semibold mt-0.5 leading-none">แจ้งเตือน</span>
              {unassignedCount > 0 && (
                <span className="absolute top-1 right-[12%] min-w-[15px] h-[15px] flex items-center justify-center bg-red-500 text-white text-[8px] font-bold rounded-full px-0.5 leading-none">
                  {unassignedCount > 99 ? '99+' : unassignedCount}
                </span>
              )}
            </Link>

            {/* More Menu */}
            <button onClick={() => setIsMobileOpen(true)} className={`flex flex-col items-center justify-center h-full transition-colors ${isMobileOpen ? 'text-[#007aff]' : 'text-[#8e8e93]'}`}>
              <Menu className="w-[20px] h-[20px]" />
              <span className="text-[9px] font-semibold mt-0.5 leading-none">อื่นๆ</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== Mobile Slide-Out Overlay ===== */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileOpen(false)} />

          {/* Panel */}
          <div className="absolute top-14 right-0 bottom-0 w-[280px] bg-[#f5f5f7] dark:bg-[#161617] border-l border-gray-200/50 dark:border-[#333] flex flex-col overflow-hidden animate-slide-up">
            <div className="flex-1 min-h-0 flex flex-col gap-1 px-4 py-4 pb-6 overflow-y-auto custom-scrollbar">
              {navContent}
            </div>

            {/* Bottom section */}
            <div
              className="p-4 mt-auto border-t border-gray-200/50 dark:border-[#333] shrink-0 bg-[#f5f5f7] dark:bg-[#161617]"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-between mb-4 bg-white dark:bg-[#1c1c1e] p-2 rounded-full shadow-sm border border-gray-100 dark:border-[#333]">
                <div className="flex gap-1"><ThemeToggle /><LanguageToggle /></div>
                {user && <Link to="/" title="Go to Website" className="p-2 rounded-full text-[#86868b] hover:text-[#0071e3] transition-colors"><Globe className="h-4 w-4" /></Link>}
              </div>

              {user && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-gray-100 dark:border-[#333] shadow-sm mb-1">
                  <div className="w-10 h-10 rounded-full bg-[#f5f5f7] dark:bg-[#3a3a3c] flex items-center justify-center font-bold text-gray-400 shrink-0">{user.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="text-sm font-bold text-[#1d1d1f] dark:text-white truncate">{user.name}</div>
                    <div className="text-[10px] text-[#86868b] truncate uppercase tracking-wider">{user.role}</div>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-[#86868b] hover:text-red-500 transition-colors shrink-0" title="Logout"><LogOut className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Desktop Sidebar (unchanged) ===== */}
      <aside className={`hidden md:flex flex-col w-72 z-50 bg-white dark:bg-[#161617] ${embedded ? 'h-full border-r border-gray-200/50 dark:border-[#333]' : 'fixed left-0 top-0 bottom-0 border-r border-gray-200/50 dark:border-[#333]'
        }`}>
        <div className="p-8 pb-4">
          <Link to={user ? "/admin/dashboard" : "/"} className="flex items-center gap-3 group">
            <div className="h-10 w-10 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-xl text-[#1d1d1f] dark:text-white tracking-tighter text-nowrap">SEC RMS SYSTEM</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col gap-1 px-6 py-6 overflow-y-auto custom-scrollbar">
          {navContent}
        </div>

        <div className="p-6 mt-auto">
          <div className="flex items-center justify-between mb-6 bg-white dark:bg-[#1c1c1e] p-2 rounded-full shadow-sm border border-gray-100 dark:border-[#333]">
            <div className="flex gap-1"><ThemeToggle /><LanguageToggle /></div>
            {user && <Link to="/" title="Go to Website" className="p-2 rounded-full text-[#86868b] hover:text-[#0071e3] transition-colors"><Globe className="h-4 w-4" /></Link>}
          </div>

          {user && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-gray-100 dark:border-[#333] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f7] dark:bg-[#3a3a3c] flex items-center justify-center font-bold text-gray-400">{user.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#1d1d1f] dark:text-white truncate">{user.name}</div>
                <div className="text-[10px] text-[#86868b] truncate uppercase tracking-wider">{user.role}</div>
              </div>
              <button onClick={handleLogout} className="p-2 text-[#86868b] hover:text-red-500 transition-colors" title="Logout"><LogOut className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
