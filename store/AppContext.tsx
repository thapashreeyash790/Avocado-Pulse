
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus, UserRole, ApprovalStatus, User, Activity, AppNotification, Project, ClientProfile, Invoice, TaskPriority } from '../types';
import { api } from '../services/api';

interface AppContextType {
  tasks: Task[];
  projects: Project[];
  clients: ClientProfile[];
  invoices: Invoice[];
  activities: Activity[];
  notifications: AppNotification[];
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole, name: string) => Promise<void>;
  logout: () => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  copyTask: (taskId: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
  requestChanges: (taskId: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  addClient: (client: Omit<ClientProfile, 'id'>) => Promise<void>;
  generateInvoice: (projectId: string) => Promise<void>;
  payInvoice: (invoiceId: string, amount: number) => Promise<void>;
  updateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => Promise<void>;
  markNotificationsAsRead: () => void;
  dismissNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {


  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('avocado_current_user');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed !== 'object') throw new Error('Corrupt user in localStorage');
      return parsed;
    } catch (e) {
      console.error('Failed to load user from localStorage:', e, saved);
      localStorage.removeItem('avocado_current_user');
      return null;
    }
  });

  useEffect(() => {
    console.log('[AppProvider] user state:', user, typeof user);
  }, [user]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [fProjects, fClients, fInvoices, fTasks] = await Promise.all([
        api.fetchProjects(),
        api.fetchClients(),
        api.fetchInvoices(),
        api.fetchTasks()
      ]);
      setProjects(fProjects || []);
      setClients(fClients || []);
      setInvoices(fInvoices || []);
      setTasks(fTasks || []);
    } catch (err: any) {
      console.error('Load failed:', err);
      pushNotification(`Connection failed: ${err.message || err}`, 'error');
      // fallback to previously cached data in localStorage if server unreachable
      const savedProjects = localStorage.getItem('avocado_projects');
      const savedClients = localStorage.getItem('avocado_clients');
      const savedInvoices = localStorage.getItem('avocado_invoices');
      const savedActivities = localStorage.getItem('avocado_activities');
      if (savedProjects) setProjects(JSON.parse(savedProjects));
      if (savedClients) setClients(JSON.parse(savedClients));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedActivities) setActivities(JSON.parse(savedActivities));
    }
  }, [user]);

  useEffect(() => {
    loadAllData();
    // Poll for real-time updates every 3 seconds
    const intervalId = setInterval(() => {
      // Poll even if hidden to ensure data is fresh when returning
      if (user) {
        loadAllData();
      }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [loadAllData, user]);

  // Shared Data Sync (Cross-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('avocado_')) {
        loadAllData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadAllData]);

  useEffect(() => {
    if (user) {
      // write cache to localStorage as a fallback cache
      localStorage.setItem('avocado_projects', JSON.stringify(projects));
      localStorage.setItem('avocado_clients', JSON.stringify(clients));
      localStorage.setItem('avocado_invoices', JSON.stringify(invoices));
      localStorage.setItem('avocado_activities', JSON.stringify(activities));
    }
  }, [tasks, projects, clients, invoices, activities, user]);

  const pushNotification = useCallback((message: string, type: AppNotification['type'] = 'info') => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
  }, []);

  const logActivity = useCallback((action: string, type: Activity['type'], taskId?: string, taskTitle?: string) => {
    if (!user) return;
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      action,
      type,
      taskId,
      taskTitle,
      createdAt: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
  }, [user]);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const loggedUser = await api.login(email, password);
      setUser(loggedUser);
      localStorage.setItem('avocado_current_user', JSON.stringify(loggedUser));
      pushNotification(`Welcome back to Avocado PM, ${loggedUser.name}!`, 'success');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, role: UserRole, name: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const newUser = await api.signup(email, password, role, name);
      setUser(newUser);
      localStorage.setItem('avocado_current_user', JSON.stringify(newUser));
      pushNotification(`Welcome to Avocado Project Manager!`, 'success');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTasks([]);
    setNotifications([]);
    localStorage.removeItem('avocado_current_user');
  };

  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      const created = await api.createProject(project);
      setProjects(prev => [...prev, created]);
      logActivity(`created project "${created.name}"`, 'CREATE');
    } catch (err: any) {
      // fallback to local-only project when backend is unreachable
      const fallback: Project = { ...project, id: Math.random().toString(36).substr(2, 9) };
      setProjects(prev => [...prev, fallback]);
      pushNotification(`Sync failed: Project created locally only.`, 'warning');
      logActivity(`created project "${fallback.name}" (local)`, 'CREATE');
    }
  };

  const addClient = async (client: Omit<ClientProfile, 'id'>) => {
    try {
      const created = await api.createClient(client);
      setClients(prev => [...prev, created]);
    } catch (err: any) {
      // fallback to local-only client
      const fallback: ClientProfile = { ...client, id: Math.random().toString(36).substr(2, 9) };
      setClients(prev => [...prev, fallback]);
      pushNotification(`Added client locally (offline): ${fallback.name}`, 'info');
    }
  };

  const generateInvoice = async (projectId: string) => {
    console.log('[generateInvoice] Request for project:', projectId);
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('[generateInvoice] Project not found in state:', projectId);
      pushNotification('Error: Project data not found. Try refreshing.', 'error');
      return;
    }
    try {
      const payload = {
        projectId,
        amount: project.budget,
        paidAmount: 0,
        status: 'PENDING',
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 1209600000).toISOString()
      };
      console.log('[generateInvoice] Creating payload:', payload);
      const created = await api.createInvoice(payload);
      setInvoices(prev => [...prev, created]);
      pushNotification(`Invoice generated for ${project.name}`, 'success');
    } catch (err: any) {
      pushNotification(`Failed to create invoice: ${err.message || err}`, 'warning');
    }
  };

  const payInvoice = async (invoiceId: string, payAmount: number) => {
    try {
      const inv = invoices.find(i => i.id === invoiceId);
      if (!inv) return;
      const newPaid = Math.min(inv.paidAmount + payAmount, inv.amount);
      const status = newPaid >= inv.amount ? 'PAID' : 'PENDING';
      const updated = await api.updateInvoice(invoiceId, { paidAmount: newPaid, status });
      setInvoices(prev => prev.map(i => i.id === invoiceId ? updated : i));
    } catch (err: any) {
      pushNotification(`Payment failed: ${err.message || err}`, 'warning');
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: Invoice['status']) => {
    try {
      const inv = invoices.find(i => i.id === invoiceId);
      if (!inv) return;
      const updated = await api.updateInvoice(invoiceId, { status });
      setInvoices(prev => prev.map(i => i.id === invoiceId ? updated : i));
      if (status === 'REJECTED') pushNotification(`Invoice ${invoiceId} marked as Rejected.`, 'info');
    } catch (err: any) {
      pushNotification(`Failed to update invoice: ${err.message || err}`, 'warning');
    }
  };

  const isInternal = user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN;

  const filteredProjects = isInternal
    ? projects
    : projects.filter(p => p.clientId?.toLowerCase() === user?.email?.toLowerCase());

  const filteredTasks = isInternal
    ? tasks
    : tasks.filter(t => filteredProjects.some(p => p.id === t.projectId));

  const filteredInvoices = isInternal
    ? invoices
    : invoices.filter(inv => filteredProjects.some(p => p.id === inv.projectId));

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    const prevTask = tasks.find(t => t.id === taskId);
    if (!prevTask) return;
    logActivity(`moved "${prevTask.title}" to ${status.replace('_', ' ')}`, 'STATUS', taskId, prevTask.title);
    const updatedTask = { ...prevTask, status, progress: status === TaskStatus.COMPLETED ? 100 : prevTask.progress, approvalStatus: status === TaskStatus.COMPLETED ? ApprovalStatus.PENDING : undefined };
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    try {
      await api.updateTask(taskId, updatedTask);
    } catch (err: any) {
      pushNotification(`Failed to update task on server: ${err.message || err}`, 'warning');
    }
  }, [logActivity, tasks]);

  const addTask = useCallback(async (task: Partial<Task>) => {
    // Only allow clients to add tasks, not edit/delete/update
    if (user?.role !== UserRole.TEAM && user?.role !== UserRole.ADMIN && user?.role !== UserRole.CLIENT) return;
    const payload = {
      projectId: task.projectId || '',
      title: task.title || 'Untitled Task',
      description: task.description || '',
      status: task.status || TaskStatus.TODO,
      priority: task.priority || TaskPriority.MEDIUM,
      assignedTo: user?.name || 'Unassigned',
      dueDate: task.dueDate || new Date().toISOString().split('T')[0],
      progress: 0,
      checklist: task.checklist || [],
      comments: [],
      files: [],
      ...task
    } as any;
    try {
      const created = await api.createTask(payload);
      setTasks(prev => [...prev, created]);
      logActivity(`created task "${created.title}"`, 'CREATE', created.id, created.title);
    } catch (err: any) {
      // fallback to local-only task when backend is unreachable
      const fallback: Task = { ...payload, id: Math.random().toString(36).substr(2, 9) } as Task;
      setTasks(prev => [...prev, fallback]);
      pushNotification(`Created task locally (offline): ${fallback.title}`, 'info');
      logActivity(`created task "${fallback.title}" (local)`, 'CREATE', fallback.id, fallback.title);
    }
  }, [user, logActivity]);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await api.deleteTask(taskId);
    } catch (err: any) {
      pushNotification(`Failed to delete task on server: ${err.message || err}`, 'warning');
    }
  }, []);

  const copyTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const copy = { ...task, title: `${task.title} (Copy)` };
    try {
      const created = await api.createTask(copy);
      setTasks(prev => [...prev, created]);
    } catch (err: any) {
      pushNotification(`Failed to copy task: ${err.message || err}`, 'warning');
    }
  }, [tasks]);

  const addComment = useCallback(async (taskId: string, text: string) => {
    if (!user) return;
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      role: user.role,
      text,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, comments: [...task.comments, newComment] } : task
    ));
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const updated = { ...task, comments: [...task.comments, newComment] };
        await api.updateTask(taskId, updated);
      }
    } catch (err: any) {
      pushNotification(`Failed to save comment: ${err.message || err}`, 'warning');
    }
  }, [user, tasks]);

  const approveTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, approvalStatus: ApprovalStatus.APPROVED } : task
    ));
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) await api.updateTask(taskId, { ...task, approvalStatus: ApprovalStatus.APPROVED });
    } catch (err: any) {
      pushNotification(`Failed to approve task: ${err.message || err}`, 'warning');
    }
  }, [tasks]);

  const requestChanges = useCallback(async (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, approvalStatus: ApprovalStatus.CHANGES_REQUESTED, status: TaskStatus.IN_PROGRESS } : task
    ));
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) await api.updateTask(taskId, { ...task, approvalStatus: ApprovalStatus.CHANGES_REQUESTED, status: TaskStatus.IN_PROGRESS });
    } catch (err: any) {
      pushNotification(`Failed to request changes: ${err.message || err}`, 'warning');
    }
  }, [tasks]);

  const markNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      tasks: filteredTasks, projects: filteredProjects, clients, invoices: filteredInvoices, activities, notifications, user, isLoading, error,
      setTasks, login, signup, logout, updateTaskStatus, addTask, deleteTask, copyTask, addComment,
      approveTask, requestChanges, addProject, addClient, generateInvoice, payInvoice, updateInvoiceStatus,
      markNotificationsAsRead, dismissNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
