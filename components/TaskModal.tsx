  // Only allow client to edit/delete their own tasks
  const isClientOwner = user?.role === UserRole.CLIENT && user?.name === task?.assignedTo;
  const canEdit = user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN || isClientOwner;

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { Task, UserRole, TaskStatus, ApprovalStatus, TaskPriority } from '../types';
import { ICONS, PRIORITY_COLORS } from '../constants';
import { generateTaskChecklist } from '../services/gemini';

interface TaskModalProps {
  taskId: string;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ taskId, onClose }) => {
  const { tasks, user, addComment, approveTask, requestChanges, updateTaskStatus, deleteTask, copyTask, setTasks } = useApp();
  const task = tasks.find(t => t.id === taskId);
  
  const [commentText, setCommentText] = useState('');
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || '');
  
  // Description editing state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task?.description || '');
  
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description);
    }
  }, [task?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!task) return null;

  const handleStatusChange = (status: TaskStatus) => {
    if (!canEdit) return;
    updateTaskStatus(taskId, status);
  };

  const handleSaveTitle = () => {
    if (!editedTitle.trim() || !canEdit) return;
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, title: editedTitle.trim() } : t
    ));
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (!canEdit) return;
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, description: editedDescription } : t
    ));
    setIsEditingDescription(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(taskId, commentText);
    setCommentText('');
  };

  const handleDelete = () => {
    if (!canEdit) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId);
      onClose();
    }
  };

  const handleCopy = () => {
    if (!canEdit) return;
    copyTask(taskId);
    setShowActionsMenu(false);
    alert("Task duplicated successfully!");
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#/board?task=${taskId}`;
    navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard!");
    setShowActionsMenu(false);
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!canEdit) return;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newChecklist = t.checklist.map(item => 
          item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        const completedCount = newChecklist.filter(i => i.isCompleted).length;
        const progress = Math.round((completedCount / (newChecklist.length || 1)) * 100);
        return { ...t, checklist: newChecklist, progress };
      }
      return t;
    }));
  };

  const handleAiChecklist = async () => {
    setIsGeneratingChecklist(true);
    const suggestions = await generateTaskChecklist(task.title, task.description);
    const newItems = suggestions.map((s: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      text: s.text,
      isCompleted: false
    }));
    
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, checklist: [...t.checklist, ...newItems] } : t
    ));
    setIsGeneratingChecklist(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4 flex-1">
             <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                <ICONS.Trello className="w-5 h-5 text-indigo-600" />
             </div>
             <div className="flex flex-col flex-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TASK DETAILS</span>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      autoFocus
                      className="text-xl font-bold text-gray-900 leading-tight bg-white border-b-2 border-indigo-600 outline-none w-full"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    />
                    <button onClick={handleSaveTitle} className="text-green-600 p-1 hover:bg-green-50 rounded"><ICONS.Check className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{task.title}</h3>
                    {(user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN || isClientOwner) && (
                      <button 
                        onClick={() => setIsEditingTitle(true)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 transition-all"
                      >
                        <ICONS.Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
             </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ICONS.MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-[60] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button onClick={handleShare} className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <ICONS.Plus className="w-4 h-4 rotate-45" /> Share Link
                </button>
                <button onClick={handleCopy} className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <ICONS.Plus className="w-4 h-4" /> Duplicate Task
                </button>
                {(user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN || isClientOwner) && (
                  <button onClick={handleDelete} className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-50 mt-1">
                    <ICONS.AlertCircle className="w-4 h-4" /> Delete Task
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Info */}
            <div className="lg:col-span-8 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    Description
                  </h4>
                  {(user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN || isClientOwner) && !isEditingDescription && (
                    <button 
                      onClick={() => setIsEditingDescription(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <textarea 
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-black font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none min-h-[120px]"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setIsEditingDescription(false)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveDescription}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {task.description || "No description provided."}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                     Checklist
                     <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px]">{task.checklist.filter(i => i.isCompleted).length}/{task.checklist.length}</span>
                  </h4>
                  {(user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN || isClientOwner) && (
                    <button 
                      onClick={handleAiChecklist}
                      disabled={isGeneratingChecklist}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 transition-all border border-indigo-100"
                    >
                      <ICONS.TrendingUp className={`w-3.5 h-3.5 ${isGeneratingChecklist ? 'animate-bounce' : ''}`} />
                      {isGeneratingChecklist ? 'Thinking...' : 'AI Suggestion'}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {task.checklist.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleToggleChecklist(item.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                        item.isCompleted ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        item.isCompleted ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'
                      }`}>
                        {item.isCompleted && <ICONS.Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`text-sm ${item.isCompleted ? 'line-through' : 'font-medium'}`}>{item.text}</span>
                    </div>
                  ))}
                  {task.checklist.length === 0 && (
                    <p className="text-xs text-gray-400 italic py-4">No checklist items defined yet.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Activity & Comments</h4>
                <div className="space-y-6">
                  {task.comments.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                       <img src={`https://picsum.photos/32/32?random=${comment.userId}`} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-sm font-bold text-gray-900">{comment.userName}</span>
                             <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${comment.role === UserRole.CLIENT ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                               {comment.role}
                             </span>
                             <span className="text-[10px] text-gray-400 font-semibold">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-sm text-black bg-white p-3 rounded-xl border border-gray-100 shadow-sm font-medium">
                             {comment.text}
                          </div>
                       </div>
                    </div>
                  ))}
                  
                  <div className="flex gap-4 pt-2">
                    <img src="https://picsum.photos/32/32?random=current" className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
                    <div className="flex-1 flex flex-col gap-2">
                      <textarea 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..." 
                        className="w-full text-sm p-3 border border-gray-200 rounded-xl text-black font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[80px]"
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={handleAddComment}
                          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all uppercase tracking-wider shadow-sm"
                        >
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Status</label>
                    <select 
                      value={task.status} 
                      onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                      disabled={user?.role === UserRole.CLIENT}
                      className={`w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 ${user?.role === UserRole.CLIENT ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-gray-800'}`}
                    >
                      <option value={TaskStatus.TODO}>To Do</option>
                      <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                      <option value={TaskStatus.COMPLETED}>Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Priority</label>
                    <select 
                      value={task.priority}
                      onChange={(e) => {
                        if (user?.role === UserRole.CLIENT) return;
                        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: e.target.value as TaskPriority } : t));
                      }}
                      disabled={user?.role === UserRole.CLIENT}
                      className={`w-full p-2.5 border rounded-xl text-sm font-bold text-center uppercase tracking-wider outline-none focus:ring-2 focus:ring-indigo-500 ${PRIORITY_COLORS[task.priority]} ${user?.role === UserRole.CLIENT ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                    >
                      <option value={TaskPriority.LOW}>Low</option>
                      <option value={TaskPriority.MEDIUM}>Medium</option>
                      <option value={TaskPriority.HIGH}>High</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Due Date</label>
                    <div className="relative">
                      <ICONS.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="date"
                        value={task.dueDate}
                        disabled={user?.role === UserRole.CLIENT}
                        onChange={(e) => {
                          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, dueDate: e.target.value } : t));
                        }}
                        className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-indigo-500 ${user?.role === UserRole.CLIENT ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Assignee</label>
                    <div className="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-xl">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignedTo}`} className="w-6 h-6 rounded-full" alt="" />
                       <span className="text-sm font-semibold text-gray-800">{task.assignedTo}</span>
                    </div>
                  </div>
               </div>

               {/* Approval Section */}
               {task.status === TaskStatus.COMPLETED && (
                 <div className={`p-6 rounded-2xl border-2 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 ${
                    task.approvalStatus === ApprovalStatus.APPROVED ? 'bg-green-50 border-green-200' :
                    task.approvalStatus === ApprovalStatus.CHANGES_REQUESTED ? 'bg-red-50 border-red-200' :
                    'bg-indigo-50 border-indigo-200'
                 }`}>
                    <h5 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                       <ICONS.CheckCircle2 className={`w-5 h-5 ${
                         task.approvalStatus === ApprovalStatus.APPROVED ? 'text-green-600' : 
                         task.approvalStatus === ApprovalStatus.CHANGES_REQUESTED ? 'text-red-600' : 'text-indigo-600'
                       }`} />
                       {task.approvalStatus === ApprovalStatus.APPROVED ? 'Client Approved' : 
                        task.approvalStatus === ApprovalStatus.CHANGES_REQUESTED ? 'Changes Requested' : 'Pending Approval'}
                    </h5>
                    
                    {user?.role === UserRole.CLIENT && task.approvalStatus === ApprovalStatus.PENDING ? (
                      <div className="space-y-3 mt-4">
                         <button 
                           onClick={() => approveTask(taskId)}
                           className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-green-700 transition-all"
                         >
                           Approve Task
                         </button>
                         <button 
                           onClick={() => requestChanges(taskId)}
                           className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all"
                         >
                           Request Changes
                         </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 leading-relaxed mt-2">
                         {task.approvalStatus === ApprovalStatus.APPROVED ? 'This task has been finalized and locked.' : 
                          task.approvalStatus === ApprovalStatus.CHANGES_REQUESTED ? 'The team is currently reviewing requested changes.' : 
                          'Waiting for client review and final approval.'}
                      </p>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
