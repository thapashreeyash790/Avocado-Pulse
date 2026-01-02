
import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Task, TaskStatus, UserRole } from '../types';
import { STATUS_LABELS, ICONS } from '../constants';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import CreateTaskModal from './CreateTaskModal';

const KanbanBoard: React.FC = () => {
  const { tasks, user, projects, clients, updateTaskStatus, trackTaskVisit } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeProjectFilter, setActiveProjectFilter] = useState<string>('all');
  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredTasks = useMemo(() => {
    if (activeProjectFilter === 'all') return tasks;
    return tasks.filter(t => t.projectId === activeProjectFilter);
  }, [tasks, activeProjectFilter]);

  const headerTitle = useMemo(() => {
    if (user?.role === UserRole.CLIENT) {
      const clientProfile = clients.find(c => c.email.toLowerCase() === user.email.toLowerCase());
      return `${clientProfile?.company || 'Client'} Project Workspace`;
    }
    return "Projects Workspace";
  }, [user, clients]);

  const columns = [
    { id: TaskStatus.TODO, label: STATUS_LABELS.TO_DO, color: 'border-slate-300 bg-slate-50/50' },
    { id: TaskStatus.IN_PROGRESS, label: STATUS_LABELS.IN_PROGRESS, color: 'border-indigo-200 bg-indigo-50/30' },
    { id: TaskStatus.COMPLETED, label: STATUS_LABELS.COMPLETED, color: 'border-green-200 bg-green-50/30' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (user?.role !== UserRole.TEAM && user?.role !== UserRole.ADMIN) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('taskId', taskId);
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setActiveColumn(null);
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setActiveColumn(status);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (user?.role === UserRole.CLIENT) return;
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
    setActiveColumn(null);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{headerTitle}</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="relative group">
              <ICONS.Trello className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <select
                value={activeProjectFilter}
                onChange={e => setActiveProjectFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-900 text-white border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500 cursor-pointer appearance-none shadow-xl transition-all hover:bg-black"
              >
                <option value="all" className="bg-slate-900">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ICONS.ArrowRight className="w-3 h-3 text-white rotate-90" />
              </div>
            </div>
            {activeProjectFilter !== 'all' && (
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 uppercase tracking-widest animate-in fade-in zoom-in-95">
                Active Project View
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-xl shadow-green-100 active:scale-95"
        >
          <ICONS.Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-1 min-w-[320px] max-w-[400px] flex flex-col"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${column.id === TaskStatus.TODO ? 'bg-slate-400' :
                  column.id === TaskStatus.IN_PROGRESS ? 'bg-green-500' : 'bg-green-600'
                  }`}></span>
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">{column.label}</h3>
                <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500">
                  {filteredTasks.filter(t => t.status === column.id).length}
                </span>
              </div>
            </div>

            <div className={`
              flex-1 rounded-2xl border-2 border-dashed p-4 space-y-4 overflow-y-auto custom-scrollbar transition-colors
              ${column.color} 
              ${activeColumn === column.id ? 'drag-over' : 'border-transparent'}
            `}>
              {filteredTasks
                .filter(t => t.status === column.id)
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    showProjectInfo={activeProjectFilter === 'all'}
                    onClick={() => { setSelectedTaskId(task.id); trackTaskVisit(task.id); }}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    draggable={user?.role !== UserRole.CLIENT}
                  />
                ))
              }
              {filteredTasks.filter(t => t.status === column.id).length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                  <ICONS.Clock className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No tasks here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTaskId && <TaskModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          initialProjectId={activeProjectFilter !== 'all' ? activeProjectFilter : undefined}
          initialStatus={TaskStatus.TODO}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
