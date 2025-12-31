
import React from 'react';
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
  const { user, projects, clients } = useApp();

  const project = projects.find(p => p.id === task.projectId);
  const client = clients.find(c => c.email === project?.clientId);
  
  return (
    <div 
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all animate-in slide-in-from-bottom-2
        ${draggable ? 'cursor-grab active:cursor-grabbing hover:border-green-300 hover:shadow-md' : 'cursor-pointer hover:bg-slate-50'}
        group
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-2">
           {task.approvalStatus === ApprovalStatus.APPROVED && (
             <ICONS.CheckCircle2 className="w-4 h-4 text-green-500" />
           )}
           {task.approvalStatus === ApprovalStatus.PENDING && user?.role === UserRole.CLIENT && (
             <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
           )}
        </div>
      </div>

      <h4 className="font-bold text-slate-900 mb-1 group-hover:text-green-600 transition-colors leading-tight text-sm">
        {task.title}
      </h4>

      {showProjectInfo && project && (
        <div className="flex flex-col gap-0.5 mb-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">
            {project.name}
          </span>
          {client && (
            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">
              {client.company}
            </span>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
         <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
            <ICONS.Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
         </div>
         <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${task.progress === 100 ? 'bg-green-500' : 'bg-green-600'}`} 
              style={{ width: `${task.progress}%` }}
            ></div>
         </div>
      </div>
    </div>
  );
};

export default TaskCard;
