
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { UserRole, TaskStatus } from '../types';
import TaskModal from './TaskModal';

const MyStuffView: React.FC = () => {
    const { user, tasks, activities, projects, docs, trackTaskVisit, addBoost } = useApp();
    const [activeTab, setActiveTab] = useState<'assignments' | 'bookmarks' | 'schedule' | 'drafts' | 'activities' | 'boosts' | 'visited' | 'activity_feed'>('assignments');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    if (!user) return null;

    const myTasks = tasks.filter(t => t.assignedTo === user.name);
    const myProjects = projects.filter(p => p.clientId === user.email || p.clientId === user.id);
    const bookmarkedItems = tasks.filter(t => user.bookmarks?.includes(t.id))
        .concat(projects.filter(p => user.bookmarks?.includes(p.id)) as any)
        .concat(docs.filter(d => user.bookmarks?.includes(d.id)) as any);

    const myActivities = activities.filter(a => a.userId === user.id);

    // Recent visited tasks (lookup from tasks state)
    const recentVisited = (user.visitedTasks || [])
        .map(v => tasks.find(t => t.id === v.taskId))
        .filter(t => !!t);

    const scheduleTasks = myTasks.filter(t => !!t.dueDate).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const tabs = [
        { id: 'assignments', label: 'My Assignments', icon: <ICONS.ListTodo className="w-5 h-5" /> },
        { id: 'bookmarks', label: 'My Bookmarks', icon: <ICONS.Bookmark className="w-5 h-5" /> },
        { id: 'schedule', label: 'My Schedule', icon: <ICONS.Calendar className="w-5 h-5" /> },
        { id: 'activities', label: 'My Activity', icon: <ICONS.Activity className="w-5 h-5" /> },
        { id: 'activity_feed', label: 'Activity Feed', icon: <ICONS.History className="w-5 h-5" /> },
        { id: 'visited', label: 'Visited Tasks', icon: <ICONS.Clock className="w-5 h-5" /> },
        { id: 'drafts', label: 'My Drafts', icon: <ICONS.Edit3 className="w-5 h-5" /> },
        { id: 'boosts', label: 'My Boosts', icon: <ICONS.Zap className="w-5 h-5" /> },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <header className="mb-10 text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20">
                    <ICONS.Archive className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">My Stuff</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Everything you've been working on, all in one place.</p>
            </header>

            <div className="flex flex-wrap justify-center gap-2 mb-12">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 scale-105' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-sm min-h-[500px] overflow-hidden">
                {activeTab === 'assignments' && (
                    <div className="p-8 animate-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                            <ICONS.ListTodo className="text-emerald-500 dark:text-emerald-400" /> Active Assignments
                        </h2>
                        <div className="space-y-4">
                            {myTasks.length > 0 ? myTasks.map(t => (
                                <TaskListItem
                                    key={t.id}
                                    task={t}
                                    project={projects.find(p => p.id === t.projectId)}
                                    onClick={() => { setSelectedTaskId(t.id); trackTaskVisit(t.id); }}
                                />
                            )) : <EmptyState message="No tasks assigned to you right now." icon={<ICONS.CheckCircle2 />} />}
                        </div>
                    </div>
                )}

                {activeTab === 'bookmarks' && (
                    <div className="p-8 animate-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                            <ICONS.Bookmark className="text-amber-500 dark:text-amber-400" /> Bookmarked Items
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bookmarkedItems.length > 0 ? (bookmarkedItems as any[]).map(item => (
                                <div key={item.id} className="p-5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-2xl hover:border-amber-200 dark:hover:border-amber-500 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-600 border border-slate-100 dark:border-slate-500 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-sm">
                                            {item.title ? <ICONS.Trello /> : <ICONS.FileText />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{item.title || item.name}</h4>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{item.title ? 'Task' : 'Project/Doc'}</p>
                                        </div>
                                    </div>
                                    <ICONS.ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-all" />
                                </div>
                            )) : <EmptyState message="Nothing bookmarked yet." icon={<ICONS.Star />} />}
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="p-8 animate-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                            <ICONS.Calendar className="text-blue-500 dark:text-blue-400" /> Personal Schedule
                        </h2>
                        <div className="space-y-8">
                            {scheduleTasks.length > 0 ? scheduleTasks.map(t => (
                                <div key={t.id} className="flex gap-6 items-start">
                                    <div className="w-16 flex-shrink-0 text-center">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{new Date(t.dueDate).toLocaleString('default', { month: 'short' })}</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{new Date(t.dueDate).getDate()}</p>
                                    </div>
                                    <div className="flex-1 p-5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-2xl hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all">
                                        <h4 className="font-bold text-slate-900 dark:text-white">{t.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{projects.find(p => p.id === t.projectId)?.name || 'Project'}</p>
                                    </div>
                                </div>
                            )) : <EmptyState message="No scheduled tasks found." icon={<ICONS.Clock />} />}
                        </div>
                    </div>
                )}

                {activeTab === 'activities' && (
                    <div className="p-8 animate-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                            <ICONS.Zap className="text-emerald-500 dark:text-emerald-400" /> Recent Activities
                        </h2>
                        <div className="space-y-6">
                            {myActivities.length > 0 ? myActivities.map(a => (
                                <div key={a.id} className="flex gap-4 items-start">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-2"></div>
                                    <div>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium">You {a.action} in <span className="font-bold text-emerald-600 dark:text-emerald-400">{a.taskTitle || 'a project'}</span></p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            )) : <EmptyState message="No recent activity logged." icon={<ICONS.History />} />}
                        </div>
                    </div>
                )}

                {activeTab === 'drafts' && (
                    <div className="p-8 animate-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                            <ICONS.Edit3 className="text-indigo-500 dark:text-indigo-400" /> Saved Drafts
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(user.drafts || []).length > 0 ? user.drafts?.map((d, i) => (
                                <div key={i} className="p-5 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded text-[9px] font-black uppercase tracking-widest">{d.type}</span>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-widest">{new Date(d.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium line-clamp-2">{(d.content as any)?.title || (d.content as any)?.text || 'Untitled Draft'}</p>
                                </div>
                            )) : <EmptyState message="No unfinished drafts." icon={<ICONS.Edit3 />} />}
                        </div>
                    </div>
                )}

                {activeTab === 'boosts' && (
                    <div className="p-8 animate-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                            <ICONS.Zap className="text-yellow-500 dark:text-yellow-400" /> Boosts & High-Fives
                        </h2>
                        <div className="space-y-4">
                            {(user.boosts || []).length > 0 ? user.boosts?.map((b, i) => (
                                <div key={i} className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-100 dark:border-yellow-800 rounded-[2rem] relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-yellow-200 dark:border-yellow-700 flex items-center justify-center font-bold text-yellow-600 dark:text-yellow-400 text-xs shadow-sm">
                                                {b.fromUserName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{b.fromUserName}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Sent you a boost!</p>
                                            </div>
                                        </div>
                                        <p className="text-slate-800 dark:text-slate-200 font-medium italic">"{b.message}"</p>
                                    </div>
                                    <ICONS.Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-yellow-500/10 dark:text-yellow-400/10 group-hover:scale-110 transition-transform" />
                                </div>
                            )) : <EmptyState message="No boosts yet. Keep up the great work!" icon={<ICONS.Zap />} />}
                        </div>
                    </div>
                )}

                {activeTab === 'activity_feed' && (
                    <div className="p-8 animate-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                            <ICONS.History className="text-indigo-500 dark:text-indigo-400" /> History of Tasks
                        </h2>
                        <div className="space-y-8">
                            {activities.length > 0 ? activities.slice(0, 30).map(a => (
                                <div key={a.id} className="flex gap-4 items-start border-l-2 border-slate-100 dark:border-slate-700 pl-6 relative">
                                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-indigo-500 dark:bg-indigo-400 border-2 border-white dark:border-slate-800"></div>
                                    <img src={a.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.userName}`} className="w-10 h-10 rounded-full shadow-sm" alt="" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">{a.userName}</span>
                                                <span className="text-slate-500 dark:text-slate-400">{a.action}</span>
                                            </div>
                                            {a.userId !== user.id && (
                                                <button
                                                    onClick={() => addBoost(a.userId, `Awesome work on ${a.taskTitle || 'this'}!`)}
                                                    className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                                                    title="Send a boost!"
                                                >
                                                    <ICONS.Zap className="w-3.5 h-3.5 fill-current" />
                                                </button>
                                            )}
                                        </div>
                                        {a.taskTitle && (
                                            <div
                                                onClick={() => a.taskId && setSelectedTaskId(a.taskId)}
                                                className="mt-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800 inline-block cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                            >
                                                {a.taskTitle}
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-2">{new Date(a.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            )) : <EmptyState message="No task history found." icon={<ICONS.History />} />}
                        </div>
                    </div>
                )}

                {activeTab === 'visited' && (
                    <div className="p-8 animate-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                            <ICONS.Clock className="text-slate-500 dark:text-slate-400" /> Recently Visited Tasks
                        </h2>
                        <div className="space-y-4">
                            {recentVisited.length > 0 ? recentVisited.map(t => (
                                <TaskListItem
                                    key={t!.id}
                                    task={t!}
                                    project={projects.find(p => p.id === t?.projectId)}
                                    onClick={() => { setSelectedTaskId(t!.id); trackTaskVisit(t!.id); }}
                                />
                            )) : <EmptyState message="You haven't visited any tasks recently." icon={<ICONS.Search />} />}
                        </div>
                    </div>
                )}
            </div>
            {selectedTaskId && <TaskModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
        </div>
    );
};

const TaskListItem: React.FC<{ task: any, project?: any, onClick?: () => void }> = ({ task, project, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-2xl hover:border-emerald-200 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all group ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${task.status === TaskStatus.COMPLETED ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-indigo-500 dark:bg-indigo-600'}`}>
                {task.status === TaskStatus.COMPLETED ? <ICONS.CheckCircle2 className="w-5 h-5" /> : <ICONS.Clock className="w-5 h-5" />}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{task.title}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{project?.name || 'Unknown Project'}</p>
            </div>
        </div>
        <div className="text-right flex items-center gap-4">
            <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Due {new Date(task.dueDate).toLocaleDateString()}</p>
                <p className={`text-[9px] font-black uppercase tracking-tighter ${new Date(task.dueDate) < new Date() ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {new Date(task.dueDate) < new Date() ? 'Overdue' : 'On Track'}
                </p>
            </div>
            <ICONS.ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-all" />
        </div>
    </div>
);

const EmptyState: React.FC<{ message: string, icon: React.ReactNode }> = ({ message, icon }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
            {React.cloneElement(icon as React.ReactElement, { className: 'w-8 h-8' })}
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{message}</p>
    </div>
);

export default MyStuffView;
