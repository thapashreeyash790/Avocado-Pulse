
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { Task, UserRole, TaskStatus, ApprovalStatus, TaskPriority, CustomFieldDefinition } from '../types';
import { ICONS, PRIORITY_COLORS } from '../constants';
import { generateTaskChecklist } from '../services/gemini';

interface TaskModalProps {
  taskId: string;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ taskId, onClose }) => {
  const {
    tasks, user, addComment, approveTask, requestChanges, updateTaskStatus, deleteTask, copyTask,
    updateTask, toggleBookmark, logTime, updateTaskAssignees, toggleTaskFollower, allUsers, settings,
    activeTimer, startTimer, stopTimer
  } = useApp();

  const task = tasks.find(t => t.id === taskId);
  const fieldDefs = settings?.customFieldDefinitions.filter(d => d.resource === 'TASK') || [];

  const isClientOwner = user?.role === UserRole.CLIENT && user?.name === task?.assignedTo;
  const canEdit = user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN || isClientOwner;

  const [commentText, setCommentText] = useState('');
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || '');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task?.description || '');

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');

  // Timer State (Global)
  const isTimerRunning = activeTimer?.taskId === taskId;
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description);
    }
  }, [task?.id]);

  useEffect(() => {
    if (isTimerRunning && activeTimer) {
      const update = () => setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000));
      update();
      timerRef.current = setInterval(update, 1000);
    } else {
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, activeTimer]);

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim() || !task) return;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newChecklistItem.trim(),
      isCompleted: false
    };
    const newChecklist = [...task.checklist, newItem];
    updateTaskChecklist(newChecklist);
    setNewChecklistItem('');
  };

  const handleDeleteChecklistItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task) return;
    const newChecklist = task.checklist.filter(i => i.id !== itemId);
    updateTaskChecklist(newChecklist);
  };

  const startEditingItem = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChecklistId(item.id);
    setEditingChecklistText(item.text);
  };

  const saveEditingItem = () => {
    if (!task || !editingChecklistId) return;
    const newChecklist = task.checklist.map(i =>
      i.id === editingChecklistId ? { ...i, text: editingChecklistText } : i
    );
    updateTaskChecklist(newChecklist);
    setEditingChecklistId(null);
    setEditingChecklistText('');
  };

  const updateTaskChecklist = (newChecklist: any[]) => {
    const completedCount = newChecklist.filter(i => i.isCompleted).length;
    const progress = Math.round((completedCount / (newChecklist.length || 1)) * 100);
    updateTask(taskId, { checklist: newChecklist, progress });
  };

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleToggleTimer = async () => {
    if (isTimerRunning) {
      await stopTimer();
    } else {
      if (task) startTimer(taskId, task.title);
    }
  };

  const handleManualLog = async () => {
    const mins = parseInt(manualMinutes);
    if (!isNaN(mins) && mins > 0) {
      await logTime(taskId, mins);
      setManualMinutes('');
      setShowTimeLogModal(false);
    }
  };

  const handleSaveTitle = () => {
    if (!editedTitle.trim() || !canEdit) return;
    updateTask(taskId, { title: editedTitle.trim() });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (!canEdit) return;
    updateTask(taskId, { description: editedDescription });
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
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#/boards?task=${taskId}`;
    navigator.clipboard.writeText(url);
    setShowActionsMenu(false);
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!canEdit || !task) return;
    const newChecklist = task.checklist.map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    const completedCount = newChecklist.filter(i => i.isCompleted).length;
    const progress = Math.round((completedCount / (newChecklist.length || 1)) * 100);
    updateTask(taskId, { checklist: newChecklist, progress });
  };

  const handleAiChecklist = async () => {
    if (!task) return;
    setIsGeneratingChecklist(true);
    const suggestions = await generateTaskChecklist(task.title, task.description);
    const newItems = suggestions.map((s: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      text: s.text,
      isCompleted: false
    }));
    updateTask(taskId, { checklist: [...task.checklist, ...newItems] });
    setIsGeneratingChecklist(false);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    if (!task) return;
    const nextCustomFields = { ...(task.customFields || {}), [fieldId]: value };
    updateTask(taskId, { customFields: nextCustomFields });
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-[#FDFDFD] dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-[2rem] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 dark:border-slate-700">

        {/* Main Content Area (Left) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/50 dark:bg-slate-900/50">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-start gap-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20">
            <div className={`p-3 rounded-xl shadow-sm border border-indigo-100 bg-indigo-50 flex-shrink-0 mt-1`}>
              <ICONS.Trello className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">TASK-{task.id.slice(-4)}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority} Priority
                </span>
              </div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    className="text-2xl font-black text-slate-900 dark:text-white leading-tight bg-transparent border-b-2 border-indigo-500 outline-none w-full placeholder-slate-300"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  />
                  <button onClick={handleSaveTitle} className="text-emerald-600 p-2 hover:bg-emerald-50 rounded-xl"><ICONS.Check className="w-5 h-5" /></button>
                </div>
              ) : (
                <div className="group flex items-start gap-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{task.title}</h2>
                  {canEdit && <button onClick={() => setIsEditingTitle(true)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-indigo-600 transition-all"><ICONS.Edit3 className="w-4 h-4" /></button>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.driveLink && (
                <a href={task.driveLink} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="Open Drive Folder">
                  <ICONS.ExternalLink className="w-5 h-5" />
                </a>
              )}
              <button onClick={() => toggleBookmark(taskId)} className={`p-2.5 rounded-xl transition-all ${user?.bookmarks?.includes(taskId) ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                <ICONS.Bookmark className={`w-5 h-5 ${user?.bookmarks?.includes(taskId) ? 'fill-current' : ''}`} />
              </button>
              <button onClick={onClose} className="p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                <ICONS.X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">

            {/* Description */}
            <section className="group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ICONS.FileText className="w-3.5 h-3.5" /> Description
                </h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && <button onClick={() => {
                    const link = prompt("Enter Drive Link:", task.driveLink || "");
                    if (link !== null) updateTask(taskId, { driveLink: link });
                  }} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wide">Link Drive</button>}
                  {canEdit && !isEditingDescription && <button onClick={() => setIsEditingDescription(true)} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wide">Edit</button>}
                </div>
              </div>
              {isEditingDescription ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <textarea
                    className="w-full p-5 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 min-h-[150px] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all shadow-sm"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditingDescription(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button onClick={handleSaveDescription} className="px-4 py-2 text-xs font-black text-white bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Changes</button>
                  </div>
                </div>
              ) : (
                <div className={`prose prose-sm max-w-none text-slate-600 dark:text-slate-300 leading-relaxed ${!task.description ? 'italic text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-center border-2 border-dashed border-slate-100 dark:border-slate-700' : 'bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm'}`}>
                  {task.description || "No description provided for this task."}
                </div>
              )}
            </section>

            {/* Checklist */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ICONS.ListTodo className="w-3.5 h-3.5" /> Checklist
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold">{Math.round(task.progress || 0)}% Done</span>
                </h3>
                {canEdit && <button onClick={handleAiChecklist} disabled={isGeneratingChecklist} className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50">{isGeneratingChecklist ? 'Generating...' : 'Auto-Generate'}</button>}
              </div>
              <div className="space-y-2">
                {task.checklist.map(item => (
                  <div key={item.id} onClick={() => handleToggleChecklist(item.id)} className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${item.isCompleted ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm'}`}>
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${item.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'}`}>
                        {item.isCompleted && <ICONS.Check className="w-3.5 h-3.5 text-white" />}
                      </div>

                      {editingChecklistId === item.id ? (
                        <div className="flex-1 flex gap-2" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={editingChecklistText}
                            onChange={e => setEditingChecklistText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEditingItem();
                              if (e.key === 'Escape') setEditingChecklistId(null);
                            }}
                            className="flex-1 p-1 bg-white border border-indigo-300 rounded text-sm outline-none"
                          />
                          <button onClick={saveEditingItem} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><ICONS.Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingChecklistId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><ICONS.X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <span className={`text-sm font-medium truncate ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{item.text}</span>
                      )}
                    </div>

                    {/* Actions */}
                    {canEdit && editingChecklistId !== item.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                        <button onClick={(e) => startEditingItem(item, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          <ICONS.Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => handleDeleteChecklistItem(item.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <ICONS.Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {task.checklist.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-700 text-slate-400 text-xs font-medium">No checklist items yet.</div>
                )}

                {canEdit && (
                  <div className="flex gap-2 mt-3 pt-2">
                    <input
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                      placeholder="Add an item..."
                      className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                    />
                    <button onClick={handleAddChecklistItem} className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-black dark:hover:bg-slate-600 transition-all shadow-md">
                      Add
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Comments */}
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ICONS.MessageSquare className="w-3.5 h-3.5" /> Discussion
              </h3>
              <div className="space-y-6">
                {task.comments.map(c => (
                  <div key={c.id} className="flex gap-4 group">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`} className="w-8 h-8 rounded-full bg-slate-100 border border-white shadow-sm" alt="" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{c.userName}</span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-r-2xl rounded-bl-2xl border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 shadow-sm group-hover:shadow-md transition-all">
                        {c.text}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs">{user?.name[0]}</div>
                  <div className="flex-1 relative">
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full text-sm font-medium p-4 pr-12 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/20 transition-all min-h-[60px] resize-none text-slate-900 dark:text-white placeholder-slate-400"
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    />
                    <button onClick={handleAddComment} className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                      <ICONS.ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="w-[350px] bg-slate-50 dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar">

          {/* Status Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
            <select
              value={task.status}
              onChange={(e) => updateTaskStatus(taskId, e.target.value as TaskStatus)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 block appearance-none cursor-pointer"
            >
              {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          {/* Due Date Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ICONS.Calendar className="w-3 h-3" /> Due Date
            </label>
            <input
              type="date"
              value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              onChange={(e) => updateTask(taskId, { dueDate: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 block appearance-none cursor-pointer"
            />
          </div>

          {/* Timer Card */}
          <div className={`p-1 rounded-2xl border transition-all ${isTimerRunning ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'}`}>
            <div className="p-5 flex flex-col items-center text-center space-y-3">
              <div className={`text-3xl font-black font-mono tracking-tighter ${isTimerRunning ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {isTimerRunning ? formatElapsed(elapsed) : '0:00:00'}
              </div>
              <button
                onClick={handleToggleTimer}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isTimerRunning ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-slate-900 dark:bg-slate-950 text-white hover:bg-black dark:hover:bg-slate-900'}`}
              >
                {isTimerRunning ? <><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Stop Timer</> : <><ICONS.Clock className="w-3.5 h-3.5" /> Start Timer</>}
              </button>
            </div>
            {!isTimerRunning && (
              <div className="bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-600 p-3 rounded-b-xl flex gap-2">
                <input
                  type="number"
                  placeholder="Add mins"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  value={manualMinutes}
                  onChange={e => setManualMinutes(e.target.value)}
                />
                <button onClick={handleManualLog} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"><ICONS.Check className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {/* People & Meta */}
          <div className="space-y-6">

            {/* Assignees */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignees</label>
                <button onClick={() => setShowAssigneeSelector(!showAssigneeSelector)} className="text-[10px] font-bold text-indigo-600 hover:underline">Manage</button>
              </div>

              {showAssigneeSelector && (
                <div className="mb-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-lg animate-in fade-in zoom-in-95 leading-none">
                  <div className="max-h-[150px] overflow-y-auto custom-scrollbar space-y-1">
                    {allUsers.filter(u => u.role !== UserRole.CLIENT).map(u => {
                      const isAssigned = task.assignees?.includes(u.email);
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            const current = task.assignees || [];
                            const newAssignees = isAssigned
                              ? current.filter(e => e !== u.email)
                              : [...current, u.email];
                            updateTaskAssignees(taskId, newAssignees);
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all ${isAssigned ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAssigned ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                            {isAssigned && <ICONS.Check className="w-3 h-3 text-white" />}
                          </div>
                          <span>{u.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {task.assignees?.map(email => {
                  const u = allUsers.find(user => user.email === email);
                  return (
                    <div key={email} className="flex items-center gap-2 bg-white dark:bg-slate-800 pl-1 pr-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`} className="w-6 h-6 rounded-full bg-slate-100" alt="" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[80px]">{u ? u.name.split(' ')[0] : email.split('@')[0]}</span>
                    </div>
                  );
                })}
                <button onClick={() => setShowAssigneeSelector(!showAssigneeSelector)} className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all">
                  <ICONS.Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Custom Fields */}
            {fieldDefs.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</label>
                {fieldDefs.map(def => (
                  <div key={def.id}>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">{def.name}</p>
                    {def.type === 'SELECT' ? (
                      <select
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                        value={task.customFields?.[def.id] || ''}
                        onChange={(e) => handleFieldChange(def.id, e.target.value)}
                      >
                        <option value="">Select...</option>
                        {def.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={def.type === 'NUMBER' ? 'number' : def.type === 'DATE' ? 'date' : 'text'}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                        value={task.customFields?.[def.id] || ''}
                        onChange={(e) => handleFieldChange(def.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="mt-auto pt-6 border-t border-slate-200">
            <button onClick={handleDelete} className="w-full py-3 border border-red-100 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2">
              <ICONS.Trash className="w-4 h-4" /> Delete Task
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskModal;
