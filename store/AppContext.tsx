
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus, UserRole, ApprovalStatus, User, Activity, AppNotification, Project, ClientProfile, Invoice, TaskPriority, Conversation, Message, Doc } from '../types';
import { api } from '../services/api';
import * as crypto from '../services/crypto';

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
  team: User[];
  allUsers: User[];
  invitedEmail: string | null;
  invitedRole: string | null;
  inviteToken: string | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  docs: Doc[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole, name: string) => Promise<any>;
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
  verifyOTP: (token: string) => Promise<boolean>;
  updateUser: (id: string, payload: Partial<User>) => Promise<void>;
  requestEmailUpdate: (userId: string, newEmail: string) => Promise<void>;
  confirmEmailUpdate: (token: string) => Promise<void>;
  inviteTeamMember: (name: string, email: string, role: string, permissions?: any) => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;
  cancelSignup: (email: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  selectConversation: (conv: Conversation | null) => Promise<void>;
  createConversation: (participants: string[], name?: string, type?: 'DIRECT' | 'GROUP') => Promise<any>;
  addDoc: (name: string, url: string) => Promise<void>;
  shareDoc: (docId: string, sharedWith: string[]) => Promise<void>;
  trackTaskVisit: (taskId: string) => Promise<void>;
  toggleBookmark: (resourceId: string) => Promise<void>;
  addBoost: (targetUserId: string, message: string) => Promise<void>;
  saveDraft: (type: string, content: any) => Promise<void>;
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
  const [team, setTeam] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [invitedRole, setInvitedRole] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);

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

  const logActivity = useCallback(async (action: string, type: Activity['type'], taskId?: string, taskTitle?: string) => {
    if (!user) return;
    const newActivity: Partial<Activity> = {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      action,
      type,
      taskId,
      taskTitle,
    };
    try {
      const created = await api.createResource('activities', newActivity);
      setActivities(prev => [created, ...prev].slice(0, 50));
    } catch (err) {
      console.error('Failed to log activity:', err);
      // Fallback to local only
      const fallback: Activity = {
        id: Math.random().toString(36).substr(2, 9),
        ...newActivity,
        createdAt: new Date().toISOString()
      } as Activity;
      setActivities(prev => [fallback, ...prev].slice(0, 50));
    }
  }, [user]);

  const loadAllData = useCallback(async () => {
    if (!user) return;
    const perms = user.permissions || { billing: true, projects: true, timeline: true, management: false };
    const isAdmin = user.role === UserRole.ADMIN;

    try {
      const [fProjects, fClients, fInvoices, fTasks, fUsers, fConvs, fDocs, fActivities] = await Promise.all([
        (isAdmin || perms.projects !== false) ? api.fetchProjects() : Promise.resolve([]),
        (isAdmin || perms.management === true) ? api.fetchClients() : Promise.resolve([]),
        (isAdmin || perms.billing !== false) ? api.fetchInvoices() : Promise.resolve([]),
        (isAdmin || perms.timeline !== false) ? api.fetchTasks() : Promise.resolve([]),
        (isAdmin || perms.management === true) ? api.fetchUsers() : Promise.resolve([user]),
        api.fetchConversations(),
        api.fetchResource('docs'),
        api.fetchResource('activities')
      ]);
      setProjects(fProjects || []);
      setClients(fClients || []);
      setInvoices(fInvoices || []);
      setTasks(fTasks || []);
      setAllUsers(fUsers || []);
      setTeam((fUsers || []).filter((u: any) => u.role !== 'CLIENT'));
      setConversations(fConvs || []);
      setDocs(fDocs || []);
      setActivities(fActivities?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []);
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

  // Handle Encryption Keys
  useEffect(() => {
    const initEncryption = async () => {
      if (!user) return;

      let privKey: CryptoKey | null = null;
      const storedPriv = localStorage.getItem(`ft_priv_${user.id}`);

      if (storedPriv) {
        try {
          privKey = await crypto.importPrivateKey(storedPriv);
        } catch (e) {
          console.error("Failed to import stored private key", e);
        }
      }

      if (!privKey) {
        const keyPair = await crypto.generateKeyPair();
        const pubKeyStr = await crypto.exportPublicKey(keyPair.publicKey);
        const privKeyStr = await crypto.exportPrivateKey(keyPair.privateKey);

        await api.updateUser(user.id, { publicKey: pubKeyStr });
        localStorage.setItem(`ft_priv_${user.id}`, privKeyStr);
        privKey = keyPair.privateKey;
      }
      setPrivateKey(privKey);
    };
    initEncryption();
  }, [user]);

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
    const params = new URLSearchParams(window.location.search);
    if (params.get('invite') === 'true') {
      const email = params.get('email');
      const token = params.get('token');
      const role = params.get('role');
      if (email && token) {
        setInvitedEmail(email);
        setInvitedRole(role);
        setInviteToken(token);
        // Clear params from URL for aesthetic
        window.history.replaceState({}, '', window.location.pathname);
        pushNotification(`Invitation detected for ${email}. Please complete your registration.`, 'info');
      }
    }
  }, [pushNotification]);

  useEffect(() => {
    if (user) {
      // write cache to localStorage as a fallback cache
      localStorage.setItem('avocado_tasks', JSON.stringify(tasks));
      localStorage.setItem('avocado_projects', JSON.stringify(projects));
      localStorage.setItem('avocado_clients', JSON.stringify(clients));
      localStorage.setItem('avocado_invoices', JSON.stringify(invoices));
      localStorage.setItem('avocado_activities', JSON.stringify(activities));
    }
  }, [tasks, projects, clients, invoices, activities, user]);

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
      const res = await api.signup(email, password, role, name);
      // Case 1: Team Signup (returns message only)
      if (res.message === 'OTP sent') {
        setIsLoading(false);
        return { requiresOtp: true, email };
      }
      // Case 2: Client Signup (returns User object with verified: false)
      if (res.verified === false) {
        setIsLoading(false);
        return { requiresOtp: true, email };
      }

      // Case 3: Already verified (unlikely for new signup but possible)
      setUser(res);
      localStorage.setItem('avocado_current_user', JSON.stringify(res));
      pushNotification(`Welcome to Avocado Project Manager!`, 'success');
      return { requiresOtp: false };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSignup = async (email: string) => {
    try {
      await fetch('/api/auth/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (e) {
      console.error('Failed to cancel signup on server', e);
    }
  };

  const resendOTP = async (email: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await api.resendOtp(email);
      pushNotification('New verification code sent to your email.', 'success');
    } catch (err: any) {
      const msg = err.message || 'Failed to resend OTP';
      setError(msg);
      pushNotification(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (token: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await api.verifyEmail(token);
      pushNotification('Email verified! Please sign in with your credentials.', 'success');
      return true; // Indicate success for redirection
    } catch (err: any) {
      const msg = err.message || 'Verification failed';
      setError(msg);
      pushNotification(msg, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const inviteTeamMember = async (name: string, email: string, role: string, permissions?: any) => {
    try {
      await api.inviteTeamMember(name, email, role, permissions);
      pushNotification(`Invitation sent to ${email}`, 'success');
      logActivity(`invited ${name} to the team`, 'CREATE');
    } catch (err: any) {
      pushNotification(`Failed to invite: ${err.message}`, 'error');
    }
  };

  const removeTeamMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      await api.deleteResource('users', id);
      setTeam(prev => prev.filter(m => m.id !== id));
      pushNotification('Member removed from workspace', 'success');
    } catch (err: any) {
      pushNotification(`Removal failed: ${err.message}`, 'error');
    }
  };

  const logout = () => {
    setUser(null);
    setTasks([]);
    setNotifications([]);
    localStorage.removeItem('avocado_current_user');
  };

  const updateUser = async (id: string, payload: Partial<User>) => {
    setIsLoading(true);
    try {
      const updated = await api.updateResource('users', id, payload);
      if (user?.id === id) {
        const newUser = { ...user, ...updated };
        setUser(newUser);
        localStorage.setItem('avocado_current_user', JSON.stringify(newUser));
      }
      setTeam(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
      pushNotification('User updated successfully', 'success');
    } catch (err: any) {
      pushNotification(`Update failed: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestEmailUpdate = async (newEmail: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await api.requestEmailUpdate(user.id, newEmail);
      pushNotification('Verification code sent to your new email', 'success');
    } catch (err: any) {
      pushNotification(`Failed: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEmailUpdate = async (token: string) => {
    setIsLoading(true);
    try {
      const res = await api.confirmEmailUpdate(token);
      if (user) {
        const newUser = { ...user, email: res.email };
        setUser(newUser);
        localStorage.setItem('avocado_current_user', JSON.stringify(newUser));
      }
      setTeam(prev => prev.map(m => m.id === user?.id ? { ...m, email: res.email } : m));
      pushNotification('Email updated successfully', 'success');
    } catch (err: any) {
      pushNotification(`Confirmation failed: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
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

  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    if (!user) return;
    try {
      let encryptedText = text;

      // Attempt Encryption
      const conv = conversations.find(c => c.id === conversationId);
      if (conv && conv.type === 'DIRECT') {
        const pubKeys: Record<string, string> = {};
        // Add sender's pubkey
        const sender = allUsers.find(u => u.id === user.id);
        if (sender?.publicKey) pubKeys[user.id] = sender.publicKey;

        // Add partner's pubkey
        const partnerId = conv.participants.find(p => p !== user.id);
        const partner = allUsers.find(u => u.id === partnerId);
        if (partner?.publicKey) pubKeys[partnerId || ''] = partner.publicKey;

        if (Object.keys(pubKeys).length > 0) {
          encryptedText = await crypto.encryptForRecipients(text, pubKeys);
        }
      }

      const msg = await api.sendMessage(conversationId, user.id, encryptedText);

      // Decrypt locally before storing in state if it's our own message
      const decrypted = privateKey ? await crypto.decryptForMe(msg.text, privateKey, user.id) : msg.text;
      setMessages(prev => [...prev, { ...msg, text: decrypted }]);

      // refresh conversations to update lastMessage
      const convs = await api.fetchConversations();
      setConversations(convs);
    } catch (err: any) {
      pushNotification(`Failed to send message: ${err.message}`, 'error');
    }
  }, [user, conversations, allUsers, privateKey]);

  const selectConversation = useCallback(async (conv: Conversation | null) => {
    setActiveConversation(conv);
    if (conv) {
      try {
        const msgs = await api.fetchMessages(conv.id);
        if (privateKey) {
          const decrypted = await Promise.all(msgs.map(async (m: any) => ({
            ...m,
            text: await crypto.decryptForMe(m.text, privateKey, user.id)
          })));
          setMessages(decrypted);
        } else {
          setMessages(msgs || []);
        }
      } catch (e) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [privateKey]);

  const createConversation = useCallback(async (participants: string[], name?: string, type: 'DIRECT' | 'GROUP' = 'DIRECT') => {
    try {
      const conv = await api.createConversation(participants, name, type);
      setConversations(prev => [conv, ...prev]);
      return conv;
    } catch (err: any) {
      pushNotification(`Failed to create conversation: ${err.message}`, 'error');
    }
  }, []);

  // Polling for new messages
  useEffect(() => {
    if (!user || !activeConversation) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await api.fetchMessages(activeConversation.id);
        if (msgs.length !== messages.length) {
          setMessages(msgs);
        }
        // Also refresh conversations for sidebar updates
        const convs = await api.fetchConversations();
        setConversations(convs);
      } catch (e) { }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, activeConversation, messages.length]);

  const markNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addDoc = useCallback(async (name: string, url: string) => {
    if (!user) return;
    try {
      const newDoc = await api.createResource('docs', { name, url, ownerId: user.id, sharedWith: [] });
      setDocs(prev => [...prev, newDoc]);
      pushNotification('Link shared successfully', 'success');
    } catch (err: any) {
      pushNotification(`Failed to share link: ${err.message}`, 'error');
    }
  }, [user]);

  const shareDoc = useCallback(async (docId: string, sharedWith: string[]) => {
    try {
      const updated = await api.updateResource('docs', docId, { sharedWith });
      setDocs(prev => prev.map(d => d.id === docId ? updated : d));
      pushNotification('Access updated', 'success');
    } catch (err: any) {
      pushNotification(`Failed to update access: ${err.message}`, 'error');
    }
  }, []);

  const trackTaskVisit = useCallback(async (taskId: string) => {
    if (!user) return;
    const history = [...(user.visitedTasks || [])];
    const existing = history.findIndex(h => h.taskId === taskId);
    if (existing !== -1) history.splice(existing, 1);
    history.unshift({ taskId, visitedAt: new Date().toISOString() });
    const limited = history.slice(0, 15);
    await updateUser(user.id, { visitedTasks: limited });
  }, [user, updateUser]);

  const toggleBookmark = useCallback(async (resourceId: string) => {
    if (!user) return;
    const bookmarks = [...(user.bookmarks || [])];
    const idx = bookmarks.indexOf(resourceId);
    if (idx === -1) bookmarks.push(resourceId);
    else bookmarks.splice(idx, 1);
    await updateUser(user.id, { bookmarks });
  }, [user, updateUser]);

  const addBoost = useCallback(async (targetUserId: string, message: string) => {
    if (!user) return;
    const target = allUsers.find(u => u.id === targetUserId);
    if (!target) return;
    const newBoosts = [...(target.boosts || []), {
      fromUserId: user.id,
      fromUserName: user.name,
      message,
      createdAt: new Date().toISOString()
    }];
    await api.updateResource('users', targetUserId, { boosts: newBoosts });
    pushNotification(`Boost sent to ${target.name}!`, 'success');
  }, [user, allUsers, pushNotification]);

  const saveDraft = useCallback(async (type: string, content: any) => {
    if (!user) return;
    const drafts = [...(user.drafts || [])];
    const existing = drafts.findIndex(d => d.type === type);
    if (existing !== -1) drafts[existing] = { type, content, updatedAt: new Date().toISOString() };
    else drafts.push({ type, content, updatedAt: new Date().toISOString() });
    await updateUser(user.id, { drafts });
  }, [user, updateUser]);

  return (
    <AppContext.Provider value={{
      tasks: filteredTasks, projects: filteredProjects, clients, invoices: filteredInvoices, activities, notifications, user, isLoading, error,
      team, allUsers, invitedEmail, invitedRole, inviteToken,
      conversations, activeConversation, messages, docs,
      setTasks, login, signup, logout, updateTaskStatus, addTask, deleteTask, copyTask, addComment,
      approveTask, requestChanges, addProject, addClient, generateInvoice, payInvoice, updateInvoiceStatus,
      markNotificationsAsRead, dismissNotification, verifyOTP, inviteTeamMember, removeTeamMember, cancelSignup, resendOTP,
      updateUser, requestEmailUpdate, confirmEmailUpdate,
      sendMessage, selectConversation, createConversation, addDoc, shareDoc,
      trackTaskVisit, toggleBookmark, addBoost, saveDraft
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
