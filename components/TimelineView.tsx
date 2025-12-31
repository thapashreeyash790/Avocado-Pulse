
import React from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { TaskStatus } from '../types';

const TimelineView: React.FC = () => {
  const { tasks } = useApp();
  
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="p-8 max-w-5xl mx-auto">
       <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Project Timeline</h2>
          <p className="text-gray-500">Visual breakdown of milestones and deadlines</p>
       </div>

       <div className="relative border-l-2 border-gray-100 ml-4 space-y-12 pb-12">
          {sortedTasks.map((task, index) => (
            <div key={task.id} className="relative pl-10 group">
               {/* Dot */}
               <div className={`absolute left-[-9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-4 ring-gray-50 transition-all group-hover:scale-125 z-10 ${
                 task.status === TaskStatus.COMPLETED ? 'bg-green-500' :
                 task.status === TaskStatus.IN_PROGRESS ? 'bg-indigo-500' : 'bg-slate-300'
               }`}></div>

               <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group-hover:border-indigo-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                     <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                     </div>
                     <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                        task.status === TaskStatus.IN_PROGRESS ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                     }`}>
                        {task.status.replace('_', ' ')}
                     </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6 font-light leading-relaxed">
                    {task.description}
                  </p>

                  <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                     <div className="flex items-center gap-2">
                        <img src={`https://picsum.photos/24/24?random=${task.id}`} className="w-6 h-6 rounded-full" alt="" />
                        <span className="text-xs font-semibold text-gray-700">{task.assignedTo}</span>
                     </div>
                     <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <ICONS.CheckCircle2 className="w-3.5 h-3.5" />
                        {task.progress}% Complete
                     </div>
                  </div>
               </div>
            </div>
          ))}
          
          <div className="relative pl-10">
             <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-4 ring-gray-50 bg-indigo-600 z-10"></div>
             <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                <h3 className="font-bold text-lg mb-1">Project Launch</h3>
                <p className="text-indigo-100 text-sm font-light">Estimated completion: July 2024</p>
             </div>
          </div>
       </div>
    </div>
  );
};

export default TimelineView;
