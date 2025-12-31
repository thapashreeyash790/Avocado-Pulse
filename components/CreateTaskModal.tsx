
import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { TaskStatus, TaskPriority, ChecklistItem } from '../types';
import { ICONS } from '../constants';

interface CreateTaskModalProps {
  onClose: () => void;
  initialStatus?: TaskStatus;
  initialProjectId?: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  onClose, 
  initialStatus = TaskStatus.TODO,
  initialProjectId
}) => {
  const { addTask, projects } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: new Date().toISOString().split('T')[0],
    status: initialStatus,
    projectId: initialProjectId || (projects.length > 0 ? projects[0].id : '')
  });

  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState('');

  // Update project ID if it wasn't available at first mount
  useEffect(() => {
    if (!formData.projectId && projects.length > 0) {
      setFormData(prev => ({ ...prev, projectId: initialProjectId || projects[0].id }));
    }
  }, [projects, initialProjectId]);

  const handleAddChecklistItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newItemText.trim()) return;
    setChecklistItems([...checklistItems, newItemText.trim()]);
    setNewItemText('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (!formData.projectId) {
      alert("Please select a project for this task.");
      return;
    }
    
    const formattedChecklist: ChecklistItem[] = checklistItems.map(text => ({
      id: Math.random().toString(36).substr(2, 9),
      text,
      isCompleted: false
    }));

    addTask({
      ...formData,
      checklist: formattedChecklist
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-xl shadow-lg shadow-green-100">
              <ICONS.Plus className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Create New Task</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ICONS.Check className="w-5 h-5 text-slate-500 rotate-45" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] custom-scrollbar">
          <form id="create-task-form" onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Assigned Project</label>
              <select 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-black font-bold focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                value={formData.projectId}
                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
              >
                <option value="" disabled>Select Project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Task Title</label>
              <input 
                autoFocus
                required
                type="text" 
                placeholder="e.g. Design System Audit"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-black font-bold focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
              <textarea 
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-black font-medium focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none min-h-[100px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Checklist Section */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Checklist (Optional)</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Add a sub-task..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black font-medium focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddChecklistItem()}
                    className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors border border-green-100"
                  >
                    <ICONS.Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group animate-in slide-in-from-left-2 duration-200">
                      <span className="text-xs text-slate-700 font-medium">{item}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveChecklistItem(index)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <ICONS.Check className="w-4 h-4 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Priority</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-black font-semibold focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Due Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-black font-semibold focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="create-task-form"
            className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-green-100 hover:bg-green-700 active:scale-[0.98] transition-all"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
