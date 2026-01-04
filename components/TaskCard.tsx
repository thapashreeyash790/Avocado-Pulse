import React, { useState, useEffect, useRef } from 'react';
import { Task, ApprovalStatus, UserRole } from '../types';
import { ICONS, PRIORITY_COLORS } from '../constants';
import { useApp } from '../store/AppContext';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  showProjectInfo?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, draggable, onDragStart, onDragEnd, showProjectInfo }) => {
  const { user, projects, clients, logTime, activeTimer, startTimer, stopTimer } = useApp();

  // Derived state from global activeTimer
  const isTimerRunning = activeTimer?.taskId === task.id;

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  const project = projects.find(p => p.id === task.projectId);
  const client = clients.find(c => c.email === project?.clientId);

  useEffect(() => {
    // If THIS task is the active one, calculate elapsed time
    if (isTimerRunning && activeTimer) {
      const update = () => {
        setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000));
      };
      update();
      timerRef.current = setInterval(update, 1000);
    } else {
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, activeTimer]);

  const handleToggleTimer = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    if (isTimerRunning) {
      await stopTimer();
    } else {
      startTimer(task.id, task.title);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        relative bg-white p-5 rounded-2xl border transition-all duration-300 group
        ${draggable ? 'cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-xl' : 'cursor-pointer hover:bg-slate-50'}
        ${isTimerRunning ? 'border-indigo-500 shadow-indigo-100 ring-2 ring-indigo-50' : 'border-slate-100 shadow-sm hover:border-indigo-200'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider border ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </span>
          {isOverdue && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider bg-red-100 text-red-600 border border-red-200">
              Overdue
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleTimer}
            className={`p-1.5 rounded-lg transition-all ${isTimerRunning ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
            title="Quick Timer"
          >
            {isTimerRunning ? <ICONS.Zap className="w-3.5 h-3.5 fill-current" /> : <ICONS.Clock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-bold text-slate-900 mb-3 text-sm leading-snug group-hover:text-indigo-700 transition-colors">
        {task.title}
      </h4>

      {/* Project Info */}
      {showProjectInfo && project && (
        <div className="mb-4 pl-3 border-l-2 border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{project.name}</p>
          {client && <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{client.company}</p>}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
          {/* Assignees */}
          <div className="flex -space-x-2">
            {task.assignees?.slice(0, 3).map(aid => (
              <img key={aid} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${aid}`} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100" title={aid} alt="" />
            ))}
            {(task.assignees?.length || 0) === 0 && (
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                <ICONS.Plus className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isTimerRunning && (
            <span className="text-xs font-black text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">
              {formatTime(elapsed)}
            </span>
          )}
          <div className={`p-1.5 rounded-lg flex items-center gap-1.5 ${new Date(task.dueDate) < new Date() ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
            <ICONS.Calendar className="w-3 h-3" />
            <span className="text-[9px] font-bold">
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Indicator */}
      <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${task.progress}%` }}></div>
      </div>
    </div>
  );
};

export default TaskCard;
