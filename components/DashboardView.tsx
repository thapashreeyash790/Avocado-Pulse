import React, { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { UserRole, TaskStatus, ApprovalStatus } from '../types';
import { ICONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { summarizeProjectProgress } from '../services/gemini';

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
  const { tasks, user, activities, projects } = useApp();
  const [aiSummary, setAiSummary] = useState("Analyzing project status...");

  const totalTasks = tasks.length;
  const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
  const pendingApprovals = tasks.filter(t => t.approvalStatus === ApprovalStatus.PENDING).length;
  const progressPercent = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);

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
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <ICONS.Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 shadow-sm shadow-emerald-200">
            <ICONS.Plus className="w-4 h-4" />
            New Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Progress" 
          value={`${progressPercent}%`} 
          subLabel="Overall completion" 
          icon={<ICONS.TrendingUp className="text-emerald-600" />} 
          trend={progressPercent > 0 ? "+5% from last week" : undefined}
        />
        <StatCard 
          label="Pipeline" 
          value={`रु${totalBudget.toLocaleString()}`} 
          subLabel="Total managed value" 
          icon={<ICONS.TrendingUp className="text-blue-600" />} 
        />
        <StatCard 
          label="Completed" 
          value={completed} 
          subLabel="Tasks finalized" 
          icon={<ICONS.CheckCircle2 className="text-emerald-600" />} 
        />
        {user?.role === UserRole.CLIENT ? (
          <StatCard 
            label="Approvals" 
            value={pendingApprovals} 
            subLabel="Needs your feedback" 
            icon={<ICONS.AlertCircle className="text-orange-600" />} 
            highlight={pendingApprovals > 0}
          />
        ) : (
          <StatCard 
            label="Active" 
            value={inProgress} 
            subLabel="Currently in work" 
            icon={<ICONS.Clock className="text-indigo-600" />} 
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-8">
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
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
        </div>

        {/* Sidebar Analytics - Functional Activity Feed */}
        <div className="space-y-8">
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