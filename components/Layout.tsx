import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../constants';
import { useApp } from '../store/AppContext';
import { UserRole, AppNotification, isInternalRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, notifications, markNotificationsAsRead, dismissNotification } = useApp();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg shadow-sm">
              <ICONS.CheckCircle2 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Avocado Project manager</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem to="/" icon={<ICONS.LayoutDashboard />} label="Pulse" onClick={() => setSidebarOpen(false)} />

          {(user.role === UserRole.ADMIN || user.permissions?.projects !== false) && (
            <NavItem to="/board" icon={<ICONS.Trello />} label="Projects" onClick={() => setSidebarOpen(false)} />
          )}

          {(user.role === UserRole.ADMIN || user.permissions?.timeline !== false) && (
            <NavItem to="/timeline" icon={<ICONS.Calendar />} label="Timeline" onClick={() => setSidebarOpen(false)} />
          )}

          {(user.role === UserRole.ADMIN || user.permissions?.billing !== false) && (
            <NavItem to="/sales" icon={<ICONS.TrendingUp />} label="Billing" onClick={() => setSidebarOpen(false)} />
          )}

          {isInternalRole(user.role) && (user.role === UserRole.ADMIN || user.permissions?.management === true) && (
            <NavItem to="/management" icon={<ICONS.Settings />} label="Workspace" onClick={() => setSidebarOpen(false)} />
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-3">
            <img src={user.avatar} className="w-10 h-10 rounded-full bg-white shadow-sm" alt="" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full p-2.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-black uppercase tracking-widest transition-colors">Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <button onClick={() => setSidebarOpen(true)} className="p-2 lg:hidden">
            <ICONS.Trello className="w-5 h-5 text-emerald-600" />
          </button>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Avocado Project manager Shared Workspace</div>
          <div className="relative" ref={notificationRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-slate-50 rounded-full transition-colors">
              <ICONS.Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b bg-slate-50 font-bold text-xs uppercase text-slate-500 tracking-wider">Recent Alerts</div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} className="p-4 border-b text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors">{n.message}</div>
                  )) : <div className="p-8 text-center text-slate-400 text-xs italic">All clear!</div>}
                </div>
                {notifications.length > 0 && (
                  <button onClick={markNotificationsAsRead} className="w-full p-3 text-[10px] font-bold text-emerald-600 uppercase hover:bg-emerald-50 border-t">Mark all as read</button>
                )}
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-auto custom-scrollbar">{children}</div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string, onClick: () => void }> = ({ to, icon, label, onClick }) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
    <span className="w-5 h-5">{icon}</span><span className="text-sm font-semibold">{label}</span>
  </NavLink>
);

export default Layout;