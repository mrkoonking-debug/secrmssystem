
import React, { useEffect, useState } from 'react';
import { ShieldCheck, LogOut, Globe, LayoutGrid, List, PlusCircle, User, Users, Menu, X, Truck, Settings, BarChart3, Tag, Building2, Bell, History } from 'lucide-react';
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    setUser(MockDb.getCurrentUser());

    // Function to update the count of unassigned rmas
    const checkIncoming = async () => {
      try {
        const incoming = await MockDb.getUnassignedRMAs();
        setUnassignedCount(incoming.length);
      } catch (err) {
        console.error("Failed to fetch unassigned count", err);
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

  const NavLink = ({ to, label, icon: Icon, hasDot = false, badgeCount = 0 }: { to: string, label: string, icon: any, hasDot?: boolean, badgeCount?: number }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-[#0071e3] text-white shadow-lg shadow-blue-500/20' : 'text-[#86868b] dark:text-gray-400 hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-sm hover:text-[#1d1d1f] dark:hover:text-white'}`}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition-colors'}`} />
        <span className="text-sm font-semibold tracking-tight">{label}</span>

        {/* 🔥 แจ้งเตือนเป็นตัวเลข กรอบสีแดง */}
        {badgeCount > 0 && (
          <div className="absolute right-3 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-black px-1.5 rounded-full shadow-sm ring-2 ring-[#f5f5f7] dark:ring-[#161617]">
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
          <NavLink to="/admin/dashboard" label={t('nav.overview')} icon={LayoutGrid} />
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#f5f5f7]/95 dark:bg-[#161617]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-[#333] flex items-center justify-between px-4">
        <Link to={user ? "/admin/dashboard" : "/"} className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-base text-[#1d1d1f] dark:text-white tracking-tighter">SEC RMA</span>
        </Link>
        <div className="flex items-center gap-2">
          {unassignedCount > 0 && (
            <Link to="/admin/incoming" className="relative p-2">
              <Bell className="w-5 h-5 text-[#86868b]" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black px-1 rounded-full ring-2 ring-[#f5f5f7] dark:ring-[#161617]">
                {unassignedCount > 99 ? '99+' : unassignedCount}
              </span>
            </Link>
          )}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ===== Mobile Slide-Out Overlay ===== */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />

          {/* Panel */}
          <div className="absolute top-14 right-0 bottom-0 w-[280px] bg-[#f5f5f7] dark:bg-[#161617] border-l border-gray-200/50 dark:border-[#333] flex flex-col overflow-hidden animate-slide-up">
            <div className="flex-1 flex flex-col gap-1 px-4 py-4 overflow-y-auto custom-scrollbar">
              {navContent}
            </div>

            {/* Bottom section */}
            <div className="p-4 mt-auto border-t border-gray-200/50 dark:border-[#333]">
              <div className="flex items-center justify-between mb-4 bg-white dark:bg-[#1c1c1e] p-2 rounded-full shadow-sm border border-gray-100 dark:border-[#333]">
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
          </div>
        </div>
      )}

      {/* ===== Desktop Sidebar (unchanged) ===== */}
      <aside className={`hidden md:flex flex-col w-72 z-50 bg-[#f5f5f7] dark:bg-[#161617] ${embedded ? 'h-full border-r border-gray-200/50 dark:border-[#333]' : 'fixed left-0 top-0 bottom-0 border-r border-gray-200/50 dark:border-[#333]'
        }`}>
        <div className="p-8 pb-4">
          <Link to={user ? "/admin/dashboard" : "/"} className="flex items-center gap-3 group">
            <div className="h-10 w-10 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-xl text-[#1d1d1f] dark:text-white tracking-tighter text-nowrap">SEC RMA</span>
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
