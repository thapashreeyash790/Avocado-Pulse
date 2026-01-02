import React, { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { UserRole, TaskStatus, ApprovalStatus } from '../types';
import { ICONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { summarizeProjectProgress } from '../services/gemini';
import TaskModal from './TaskModal';

const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const DashboardView: React.FC = () => {
  const { tasks, user, activities, projects, trackTaskVisit } = useApp();
  const [aiSummary, setAiSummary] = useState("Analyzing project status...");
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'calendar'>('overview');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Strict Filtering for Pulse
  const filteredTasks = tasks.filter(t => {
    if (user?.role === UserRole.ADMIN) return true;
    if (user?.role === UserRole.CLIENT) {
      const project = projects.find(p => p.id === t.projectId);
      return project?.clientId === user.email || project?.clientId === user.id;
    }
    // Team member: see only assigned tasks on Pulse
    return t.assignedTo === user?.id;
  });

  const filteredProjects = projects.filter(p => {
    if (user?.role === UserRole.ADMIN) return true;
    if (user?.role === UserRole.CLIENT) return p.clientId === user.email || p.clientId === user.id;
    // Team member: see projects where they have assigned tasks
    return filteredTasks.some(t => t.projectId === p.id);
  });

  const totalTasks = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const inProgress = filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const todo = filteredTasks.filter(t => t.status === TaskStatus.TODO).length;
  const pendingApprovals = filteredTasks.filter(t => t.approvalStatus === ApprovalStatus.PENDING).length;
  const progressPercent = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  const totalBudget = filteredProjects.reduce((sum, p) => sum + p.budget, 0);

  const chartData = [
    { name: 'To Do', value: todo, color: '#94a3b8' },
    { name: 'In Progress', value: inProgress, color: '#6366f1' },
    { name: 'Completed', value: completed, color: '#10b981' },
  ];

  useEffect(() => {
    async function fetchSummary() {
      if (tasks.length === 0) {
        setAiSummary("No tasks yet. Create some tasks to see an AI summary of your progress!");
        return;
      }
      const summary = await summarizeProjectProgress(tasks);
      setAiSummary(summary);
    }
    fetchSummary();
  }, [tasks]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Avocado Project manager Pulse</h2>
          <p className="text-gray-500">Real-time transparency into your workspace</p>
        </div>
        <div className="flex bg-white/50 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200Scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'assignments' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200Scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {user?.role === UserRole.CLIENT ? 'My Projects' : 'Assignments'}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'calendar' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200Scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Calendar
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(user?.role === UserRole.ADMIN || user?.permissions?.timeline !== false) && (
              <StatCard
                label="Progress"
                value={`${progressPercent}%`}
                subLabel="Overall completion"
                icon={<ICONS.TrendingUp className="text-emerald-600" />}
                trend={progressPercent > 0 ? "+5% from last week" : undefined}
              />
            )}
            {(user?.role === UserRole.ADMIN || user?.permissions?.billing !== false) && (
              <StatCard
                label="Pipeline"
                value={`रु${totalBudget.toLocaleString()}`}
                subLabel="Total managed value"
                icon={<ICONS.TrendingUp className="text-blue-600" />}
              />
            )}
            {(user?.role === UserRole.ADMIN || user?.permissions?.timeline !== false) && (
              <StatCard
                label="Completed"
                value={completed}
                subLabel="Tasks finalized"
                icon={<ICONS.CheckCircle2 className="text-emerald-600" />}
              />
            )}
            {user?.role === UserRole.CLIENT ? (
              <StatCard
                label="Approvals"
                value={pendingApprovals}
                subLabel="Needs your feedback"
                icon={<ICONS.AlertCircle className="text-orange-600" />}
                highlight={pendingApprovals > 0}
              />
            ) : (user?.role === UserRole.ADMIN || user?.permissions?.timeline !== false) ? (
              <StatCard
                label="Active"
                value={inProgress}
                subLabel="Currently in work"
                icon={<ICONS.Clock className="text-indigo-600" />}
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Column */}
            <div className="lg:col-span-2 space-y-8">
              {(user?.role === UserRole.ADMIN || user?.permissions?.timeline !== false) && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900">Task Health</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-400 rounded-full"></span> To Do</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-indigo-500 rounded-full"></span> In Progress</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Completed</div>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {(user?.role === UserRole.ADMIN || user?.permissions?.timeline !== false) && (
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 rounded-2xl text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">Avocado Project manager Intelligence</span>
                        <h3 className="text-xl font-bold">Executive AI Summary</h3>
                      </div>
                      <p className="text-emerald-50 leading-relaxed font-light italic">"{aiSummary}"</p>
                    </div>
                    <div className="flex-shrink-0 bg-white/10 p-4 rounded-full backdrop-blur-sm border border-white/20">
                      <ICONS.CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-400/20 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Sidebar Analytics - Functional Activity Feed */}
            <div className="space-y-8">
              <MiniCalendar tasks={filteredTasks} />
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
                <h3 className="font-bold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-6 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4 animate-in slide-in-from-right-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100 text-xs flex items-center justify-center font-bold text-slate-400">
                          {activity.userAvatar ? <img src={activity.userAvatar} alt="" /> : activity.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium truncate">{activity.userName}</p>
                          <p className="text-xs text-gray-500 mt-0.5 break-words">{activity.action}</p>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">{formatRelativeTime(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                      <ICONS.Clock className="w-8 h-8 mb-2" />
                      <p className="text-xs font-medium">No activity logged yet...</p>
                    </div>
                  )}
                </div>
                {activities.length > 0 && (
                  <button className="w-full mt-8 py-2 text-sm text-emerald-600 font-semibold hover:underline border-t border-slate-50 pt-4">
                    View Full History
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
          <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Active Responsibilities</h3>
          <div className="space-y-4">
            {filteredTasks.length > 0 ? filteredTasks.map(t => {
              const project = projects.find(p => p.id === t.projectId);
              return (
                <div key={t.id} onClick={() => { setSelectedTaskId(t.id); trackTaskVisit(t.id); }} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${t.status === TaskStatus.COMPLETED ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                      {t.status === TaskStatus.COMPLETED ? <ICONS.CheckCircle2 className="w-5 h-5" /> : <ICONS.Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{t.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{project?.name || 'Unknown Project'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">Due {new Date(t.dueDate).toLocaleDateString()}</p>
                    <p className={`text-[9px] font-black uppercase tracking-tighter ${new Date(t.dueDate) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
                      {new Date(t.dueDate) < new Date() ? 'Overdue' : 'On Track'}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center text-slate-400 italic font-medium">No assigned tasks found for this period.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
          <CalendarView tasks={filteredTasks} />
        </div>
      )}
      {selectedTaskId && <TaskModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
    </div>
  );
};

const MiniCalendar: React.FC<{ tasks: any[] }> = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = currentDate.toLocaleString('default', { month: 'short' });

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 text-sm whitespace-nowrap uppercase tracking-wider">{monthName} {currentDate.getFullYear()}</h3>
        <div className="flex gap-1">
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"><ICONS.ArrowRight className="w-3 h-3 rotate-180" /></button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"><ICONS.ArrowRight className="w-3 h-3" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[8px] font-black text-slate-300 text-center uppercase mb-1">{d}</div>
        ))}
        {days.map((day, i) => {
          const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
          const hasTasks = day && tasks.some(t => t.dueDate === dateStr);
          const isToday = day && day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

          return (
            <div key={i} className="aspect-square flex items-center justify-center relative">
              {day && (
                <>
                  <span className={`text-[10px] font-bold ${isToday ? 'bg-emerald-600 text-white w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-emerald-100' : 'text-slate-600'}`}>{day}</span>
                  {hasTasks && !isToday && <div className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarView: React.FC<{ tasks: any[] }> = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{monthName} {currentDate.getFullYear()}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-slate-100 rounded-lg"><ICONS.ArrowRight className="w-4 h-4 rotate-180" /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold bg-slate-100 rounded-lg">Today</button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-slate-100 rounded-lg"><ICONS.ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-slate-50 p-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
        ))}
        {days.map((day, i) => {
          const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
          const dayTasks = tasks.filter(t => t.dueDate === dateStr);
          const isToday = day && day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

          return (
            <div key={i} className={`bg-white min-h-[100px] p-2 ${!day ? 'bg-slate-50/50' : ''}`}>
              {day && (
                <>
                  <span className={`text-xs font-bold ${isToday ? 'bg-emerald-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayTasks.map(t => (
                      <div key={t.id} className="text-[8px] p-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-bold truncate" title={t.title}>
                        {t.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string | number, subLabel: string, icon: React.ReactNode, trend?: string, highlight?: boolean }> = ({ label, value, subLabel, icon, trend, highlight }) => (
  <div className={`bg-white p-6 rounded-2xl border ${highlight ? 'border-orange-200 ring-2 ring-orange-50 bg-orange-50/10' : 'border-gray-200'} shadow-sm transition-all hover:shadow-md group`}>
    <div className="flex items-center justify-between mb-4">
      <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">{icon}</div>
      {trend && <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5"><ICONS.TrendingUp className="w-3 h-3" /> {trend}</span>}
    </div>
    <div>
      <h4 className="text-2xl font-bold text-gray-900 mb-1">{value}</h4>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-gray-400 mt-2">{subLabel}</p>
    </div>
  </div>
);

export default DashboardView;