
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Task, TaskStatus, UserRole, ApprovalStatus, User, Activity, AppNotification, Project, ClientProfile, Invoice, TaskPriority, Conversation, Message, Doc, TimeEntry, Lead, LeadStatus, Expense, Estimate, SupportTicket, TicketStatus, TicketPriority, Announcement, WorkspaceSettings, CustomFieldDefinition } from '../types';
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
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  copyTask: (taskId: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
  requestChanges: (taskId: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  addClient: (client: Omit<ClientProfile, 'id'> & { password?: string }) => Promise<void>;
  updateClient: (id: string, updates: Partial<ClientProfile> & { password?: string }) => Promise<void>;
  generateInvoice: (projectId: string) => Promise<void>;
  payInvoice: (invoiceId: string, amount: number) => Promise<void>;
  updateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => Promise<void>;
  markNotificationsAsRead: () => void;
  dismissNotification: (id: string) => void;
  verifyOTP: (token: string) => Promise<boolean>;
  updateUser: (id: string, payload: Partial<User>) => Promise<void>;
  requestEmailUpdate: (userId: string, newEmail: string) => Promise<void>;
  confirmEmailUpdate: (token: string) => Promise<void>;
  inviteTeamMember: (name: string, email: string, role: string, permissions?: any) => Promise<string | void>;
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
  archiveProject: (projectId: string) => Promise<void>;
  logTime: (taskId: string, minutes: number, date?: string) => Promise<void>;
  toggleTaskFollower: (taskId: string, userId: string) => Promise<void>;
  updateTaskAssignees: (taskId: string, assignees: string[]) => Promise<void>;
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  updateLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  convertLeadToClient: (leadId: string) => Promise<void>;
  expenses: Expense[];
  estimates: Estimate[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  addEstimate: (estimate: Omit<Estimate, 'id'>) => Promise<void>;
  convertEstimateToInvoice: (estimateId: string) => Promise<void>;
  tickets: SupportTicket[];
  addTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
  settings: WorkspaceSettings | null;
  updateSettings: (settings: Partial<WorkspaceSettings>) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  deleteEstimate: (estimateId: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTimer: { taskId: string; startTime: number; taskTitle: string } | null;
  startTimer: (taskId: string, taskTitle: string) => void;
  stopTimer: () => Promise<void>;
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
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('avocado_theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('avocado_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Persistent Timer State
  const [activeTimer, setActiveTimer] = useState<{ taskId: string; startTime: number; taskTitle: string } | null>(() => {
    const saved = localStorage.getItem('avocado_active_timer');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('avocado_active_timer', JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem('avocado_active_timer');
    }
  }, [activeTimer]);


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

  // Cache for preventing unnecessary re-renders
  const lastFetchedRef = useRef<any>({});
  // Ref to prevent overlapping requests without triggering re-renders
  const isFetchingRef = useRef(false);

  const loadAllData = useCallback(async () => {
    console.log('[AppContext] loadAllData triggered. User:', user?.id, 'IsLoading:', isFetchingRef.current);
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    isFetchingRef.current = true;
    setIsLoading(true);

    if (!user) {
      isFetchingRef.current = false;
      setIsLoading(false);
      return;
    }
    const perms = user.permissions || { billing: true, projects: true, timeline: true, management: false, messages: true, docs: true };
    const isAdmin = user.role === UserRole.ADMIN;

    // Helper to safely fetch, logging errors but returning empty array
    const safeRequest = async (promise: Promise<any>, name: string) => {
      try {
        return await promise;
      } catch (e) {
        console.warn(`Failed to load ${name}:`, e);
        return [];
      }
    };

    try {
      const [fProjects, fClients, fInvoices, fTasks, fUsers, fConvs, fDocs, fActivities, fTime, fLeads, fExpenses, fEstimates, fTickets, fAnnouncements, fSettings] = await Promise.all([
        safeRequest((isAdmin || perms.projects !== false) ? api.fetchProjects() : Promise.resolve([]), 'projects'),
        safeRequest((isAdmin || perms.management === true) ? api.fetchClients() : Promise.resolve([]), 'clients'),
        safeRequest((isAdmin || perms.billing !== false) ? api.fetchInvoices() : Promise.resolve([]), 'invoices'),
        safeRequest((isAdmin || perms.timeline !== false) ? api.fetchTasks() : Promise.resolve([]), 'tasks'),
        safeRequest(api.fetchUsers(), 'users'),
        safeRequest(api.fetchConversations(), 'conversations'),
        safeRequest(api.fetchResource('docs'), 'docs'),
        safeRequest(api.fetchResource('activities'), 'activities'),
        safeRequest(api.fetchResource('timeEntry'), 'timeEntry'),
        safeRequest(api.fetchResource('leads'), 'leads'),
        safeRequest(api.fetchResource('expenses'), 'expenses'),
        safeRequest(api.fetchResource('estimates'), 'estimates'),
        safeRequest(api.fetchResource('tickets'), 'tickets'),
        safeRequest(api.fetchResource('announcements'), 'announcements'),
        safeRequest(api.fetchResource('settings'), 'settings')
      ]);

      // Optimize State Updates: Only set state if data changed
      const updateIfChanged = (key: string, newData: any, setter: (data: any) => void) => {
        const str = JSON.stringify(newData);
        if (lastFetchedRef.current[key] !== str) {
          lastFetchedRef.current[key] = str;
          setter(newData);
          return true;
        }
        return false;
      };

      updateIfChanged('projects', fProjects || [], setProjects);
      updateIfChanged('clients', fClients || [], setClients);
      updateIfChanged('invoices', fInvoices || [], setInvoices);
      updateIfChanged('tasks', fTasks || [], setTasks);
      updateIfChanged('users', fUsers || [], setAllUsers);

      // Special handling for Team derived state
      const teamData = fUsers?.filter((u: any) => u.role !== UserRole.CLIENT) || [];
      if (JSON.stringify(teamData) !== lastFetchedRef.current['team']) {
        lastFetchedRef.current['team'] = JSON.stringify(teamData);
        setTeam(teamData);
      }

      // Decrypt Conversation Previews ONLY if conversations changed
      if (fConvs && privateKey) {
        const convsStr = JSON.stringify(fConvs);
        if (lastFetchedRef.current['raw_convs'] !== convsStr) {
          lastFetchedRef.current['raw_convs'] = convsStr;
          const decryptedConvs = await Promise.all(fConvs.map(async (c: any) => {
            if (c.lastMessage && c.lastMessage.text) {
              try {
                const decryptedText = await crypto.decryptForMe(c.lastMessage.text, privateKey, user.id);
                return { ...c, lastMessage: { ...c.lastMessage, text: decryptedText } };
              } catch (e) {
                return c;
              }
            }
            return c;
          }));
          setConversations(decryptedConvs);
        }
      } else {
        updateIfChanged('conversations', fConvs || [], setConversations);
      }

      updateIfChanged('docs', fDocs || [], setDocs);
      updateIfChanged('activities', fActivities?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [], setActivities);
      updateIfChanged('timeEntry', fTime || [], setTimeEntries);
      updateIfChanged('leads', fLeads || [], setLeads);
      updateIfChanged('expenses', fExpenses || [], setExpenses);
      updateIfChanged('estimates', fEstimates || [], setEstimates);
      updateIfChanged('tickets', fTickets || [], setTickets);
      updateIfChanged('announcements', fAnnouncements || [], setAnnouncements);
      if (fSettings && fSettings.length > 0) {
        updateIfChanged('settings', fSettings[0], setSettings);
      } else {
        // Default settings logic...
        const defaultSettings = {
          id: 'current_settings',
          companyName: 'Avocado Inc',
          supportEmail: 'support@avocado.com',
          customFieldDefinitions: []
        };
        updateIfChanged('settings', defaultSettings, setSettings);
      }
    } catch (err: any) {
      console.error('Load failed:', err);
      // Only show error notification if it's NOT a background poll (hard to distinguish here, but preventing spam is good)
      // pushNotification(`Connection failed: ${err.message || err}`, 'error');

      // fallback to previously cached data in localStorage if server unreachable
      const savedProjects = localStorage.getItem('avocado_projects');
      const savedClients = localStorage.getItem('avocado_clients');
      const savedInvoices = localStorage.getItem('avocado_invoices');
      const savedActivities = localStorage.getItem('avocado_activities');
      if (savedProjects) setProjects(JSON.parse(savedProjects));
      if (savedClients) setClients(JSON.parse(savedClients));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedActivities) setActivities(JSON.parse(savedActivities));
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [user, privateKey]); // removed isLoading dependency

  useEffect(() => {
    loadAllData();
    // Poll for real-time updates every 10 seconds (reduced from 3s to improve stability)
    const intervalId = setInterval(() => {
      // Poll even if hidden to ensure data is fresh when returning
      if (user) {
        loadAllData();
      }
    }, 10000);
    return () => clearInterval(intervalId);
  }, [loadAllData, user]);

  // Handle Encryption Keys
  useEffect(() => {
    const initEncryption = async () => {
      if (!user) return;

      let privKey: CryptoKey | null = null;
      const savedPrivKey = localStorage.getItem(`ft_priv_${user.id}`);

      if (savedPrivKey) {
        try {
          privKey = await crypto.importPrivateKey(savedPrivKey);
        } catch (e) {
          console.error('Failed to import saved private key:', e);
        }
      }

      // Key Self-Healing: If we have a public key on server but legacy/missing private key locally, REGENERATE
      if (!privKey && user.publicKey) {
        console.warn('[AppContext] Private key missing but public key exists. Regenerating...');
        const keyPair = await crypto.generateKeyPair();
        const pubKeyStr = await crypto.exportPublicKey(keyPair.publicKey);
        const privKeyStr = await crypto.exportPrivateKey(keyPair.privateKey);

        const updatedUser = await api.updateUser(user.id, { publicKey: pubKeyStr });
        setUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
        localStorage.setItem(`ft_priv_${user.id}`, privKeyStr);
        privKey = keyPair.privateKey;
      }
      else if (!privKey && !user.publicKey) {
        // Normal first-time generation
        const keyPair = await crypto.generateKeyPair();
        const pubKeyStr = await crypto.exportPublicKey(keyPair.publicKey);
        const privKeyStr = await crypto.exportPrivateKey(keyPair.privateKey);

        const updatedUser = await api.updateUser(user.id, { publicKey: pubKeyStr });
        setUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

        localStorage.setItem(`ft_priv_${user.id}`, privKeyStr);
        privKey = keyPair.privateKey;
      }
      setPrivateKey(privKey);
    };
    initEncryption();
  }, [user]);

  // Activity Heartbeat
  useEffect(() => {
    if (!user) return;
    const heartbeat = setInterval(() => {
      api.updateUser(user.id, {}); // PUT to users/:id refreshes lastActive on server
    }, 30000); // Every 30 seconds
    return () => clearInterval(heartbeat);
  }, [user]);

  // Decryption Synchronization Effect
  // Re-decrypt everything when privateKey finally loads (fixes "codes" on login/refresh)
  useEffect(() => {
    if (!privateKey || !user) return;

    const decryptEverything = async () => {
      // 1. Decrypt Messages
      if (messages.some(m => m.text.includes('"ct"'))) {
        const decryptedMsgs = await Promise.all(messages.map(async (m) => {
          if (m.text.includes('"ct"')) {
            try {
              return { ...m, text: await crypto.decryptForMe(m.text, privateKey, user.id) };
            } catch (e) { return m; }
          }
          return m;
        }));
        setMessages(decryptedMsgs);
      }

      // 2. Decrypt Conversation Previews
      if (conversations.some(c => c.lastMessage?.text?.includes('"ct"'))) {
        const decryptedConvs = await Promise.all(conversations.map(async (c) => {
          if (c.lastMessage?.text?.includes('"ct"')) {
            try {
              const decryptedText = await crypto.decryptForMe(c.lastMessage.text, privateKey, user.id);
              return { ...c, lastMessage: { ...c.lastMessage, text: decryptedText } };
            } catch (e) { return c; }
          }
          return c;
        }));
        setConversations(decryptedConvs);
      }
    };

    decryptEverything();
  }, [privateKey, user?.id, messages.length, conversations.length]);

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
      const res = await api.inviteTeamMember(name, email, role, permissions);
      if (res && res.inviteLink) {
        pushNotification(`Invite created. Email failed, use the link provided.`, 'warning');
        logActivity(`invited ${name} (manual link)`, 'CREATE');
        return res.inviteLink;
      }
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

  const addClient = async (client: Omit<ClientProfile, 'id'> & { password?: string }) => {
    try {
      const { password, ...profileData } = client;

      // 1. Create the User account if password is provided
      if (password) {
        await api.signup(profileData.email, password, UserRole.CLIENT, profileData.name);
        pushNotification(`Created client account for ${profileData.email}`, 'success');
      }

      // 2. Create the Client Profile
      const created = await api.createClient(profileData);
      setClients(prev => [...prev, created]);
      pushNotification(`Client profile created for ${profileData.name}`, 'success');
    } catch (err: any) {
      // fallback to local-only client
      const fallback: ClientProfile = { ...client, id: Math.random().toString(36).substr(2, 9) };
      setClients(prev => [...prev, fallback]);
      pushNotification(`Added client locally (offline): ${fallback.name}`, 'info');
    }
  };

  const updateClient = async (id: string, updates: Partial<ClientProfile> & { password?: string }) => {
    try {
      const { password, ...profileData } = updates;

      // 1. Update Client Profile
      const updatedClient = await api.updateResource('clients', id, profileData);
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));

      // 2. Update User Account if exists (sync email/name/password)
      const existingClient = clients.find(c => c.id === id);
      if (existingClient) {
        // Find user by OLD email to ensure we update the right one even if email changes
        const linkedUser = allUsers.find(u => u.email === existingClient.email);
        if (linkedUser) {
          const userUpdates: any = {};
          if (password) userUpdates.password = password;
          if (profileData.email) userUpdates.email = profileData.email;
          if (profileData.name) userUpdates.name = profileData.name;

          if (Object.keys(userUpdates).length > 0) {
            await updateUser(linkedUser.id, userUpdates);
          }
        }
      }
      pushNotification('Client updated successfully', 'success');
    } catch (err: any) {
      pushNotification(`Failed to update client: ${err.message}`, 'error');
    }
  };

  const generateInvoice = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      pushNotification('Error: Project data not found.', 'error');
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
      const created = await api.createInvoice(payload);
      setInvoices(prev => [...prev, created]);
      pushNotification(`Invoice generated for ${project.name}`, 'success');
    } catch (err: any) {
      pushNotification(`Failed to create invoice: ${err.message}`, 'warning');
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

  const isAdmin = user?.role === UserRole.ADMIN;
  const isInternal = user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN;

  const filteredProjects = projects.filter(p => {
    const isVisible = (isAdmin || user?.accessibleProjects?.includes(p.id) || p.clientId === user?.email);
    const isNotArchived = p.status !== 'ARCHIVED';
    return isVisible && isNotArchived;
  });

  const filteredTasks = isInternal
    ? tasks
    : tasks.filter(t => filteredProjects.some(p => p.id === t.projectId));

  const filteredInvoices = isInternal
    ? invoices
    : invoices.filter(inv => filteredProjects.some(p => p.id === inv.projectId));

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const updated = await api.updateResource('tasks', taskId, updates);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      pushNotification('Task updated successfully', 'success');
    } catch (err: any) {
      pushNotification('Failed to update task', 'error');
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    const prevTask = tasks.find(t => t.id === taskId);
    if (!prevTask) return;
    logActivity(`moved "${prevTask.title}" to ${status.replace('_', ' ')}`, 'STATUS', taskId, prevTask.title);
    const updates = { status, progress: status === TaskStatus.COMPLETED ? 100 : prevTask.progress, approvalStatus: status === TaskStatus.COMPLETED ? ApprovalStatus.PENDING : undefined };
    await updateTask(taskId, updates);
  }, [logActivity, tasks, updateTask]);

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

        // ROBUST HANDSHAKE: Only encrypt if BOTH parties have public keys
        // This prevents one user from sending a "code" that the other can't read
        if (pubKeys[user.id] && partnerId && pubKeys[partnerId]) {
          encryptedText = await crypto.encryptForRecipients(text, pubKeys);
        } else {
          console.warn('[AppContext] Missing public keys for encryption. Falling back to plaintext.');
        }
      }

      const msg = await api.sendMessage(conversationId, user.id, encryptedText);

      // Decrypt locally before storing in state if it's our own message
      const decrypted = privateKey ? await crypto.decryptForMe(msg.text, privateKey, user.id) : msg.text;
      setMessages(prev => [...prev, { ...msg, text: decrypted }]);

      // refresh conversations to update lastMessage (with decryption)
      const fConvs = await api.fetchConversations();
      if (fConvs && privateKey) {
        const decryptedConvs = await Promise.all(fConvs.map(async (c: any) => {
          if (c.lastMessage && c.lastMessage.text) {
            try {
              const decryptedText = await crypto.decryptForMe(c.lastMessage.text, privateKey, user.id);
              return { ...c, lastMessage: { ...c.lastMessage, text: decryptedText } };
            } catch (e) { return c; }
          }
          return c;
        }));
        setConversations(decryptedConvs);
      } else {
        setConversations(fConvs || []);
      }
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
          if (privateKey) {
            const decrypted = await Promise.all(msgs.map(async (m: any) => {
              try {
                return { ...m, text: await crypto.decryptForMe(m.text, privateKey, user.id) };
              } catch (e) { return m; }
            }));
            setMessages(decrypted);
          } else {
            setMessages(msgs);
          }
        }

        // Also refresh conversations for sidebar updates (with decryption)
        const fConvs = await api.fetchConversations();
        if (fConvs && privateKey) {
          const decryptedConvs = await Promise.all(fConvs.map(async (c: any) => {
            if (c.lastMessage && c.lastMessage.text) {
              try {
                const decryptedText = await crypto.decryptForMe(c.lastMessage.text, privateKey, user.id);
                return { ...c, lastMessage: { ...c.lastMessage, text: decryptedText } };
              } catch (e) { return c; }
            }
            return c;
          }));
          setConversations(prev => {
            // Only update if something changed to avoid re-renders
            if (JSON.stringify(prev) === JSON.stringify(decryptedConvs)) return prev;
            return decryptedConvs;
          });
        }
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

  const archiveProject = useCallback(async (projectId: string) => {
    try {
      await api.updateResource('projects', projectId, { status: 'ARCHIVED' });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: 'ARCHIVED' } : p));
      pushNotification('Project archived successfully', 'success');
    } catch (err: any) {
      pushNotification(`Failed to archive project: ${err.message}`, 'error');
    }
  }, []);

  const logTime = useCallback(async (taskId: string, minutes: number, date?: string) => {
    if (!user) return;
    try {
      const entry = await api.createResource('timeEntry', {
        userId: user.id,
        taskId,
        duration: minutes,
        startTime: date || new Date().toISOString(),
        isBillable: true,
        billed: false
      });
      setTimeEntries(prev => [...prev, entry]);

      // Update task totalTimeLogged
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const newTotal = (task.totalTimeLogged || 0) + minutes;
        await api.updateTask(taskId, { totalTimeLogged: newTotal });
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, totalTimeLogged: newTotal } : t));
      }
      pushNotification('Time logged successfully', 'success');
    } catch (err: any) {
      pushNotification('Failed to log time', 'error');
    }
  }, [user, tasks]);

  const startTimer = useCallback((taskId: string, taskTitle: string) => {
    setActiveTimer({ taskId, startTime: Date.now(), taskTitle });
  }, []);

  const stopTimer = useCallback(async () => {
    if (!activeTimer) return;
    const elapsed = Date.now() - activeTimer.startTime;
    const minutes = Math.ceil(elapsed / 1000 / 60);

    if (minutes > 0) {
      await logTime(activeTimer.taskId, minutes);
      pushNotification(`Logged ${minutes}m for "${activeTimer.taskTitle}"`, 'success');
    }
    setActiveTimer(null);
  }, [activeTimer, logTime, pushNotification]);

  const toggleTaskFollower = useCallback(async (taskId: string, userId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const followers = [...(task.followers || [])];
      const idx = followers.indexOf(userId);
      if (idx === -1) followers.push(userId);
      else followers.splice(idx, 1);

      await api.updateTask(taskId, { followers });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, followers } : t));
      pushNotification('Task followers updated', 'success');
    } catch (err: any) {
      pushNotification('Failed to update followers', 'error');
    }
  }, [tasks]);

  const saveDraft = useCallback(async (type: string, content: any) => {
    if (!user) return;
    const drafts = [...(user.drafts || [])];
    const existing = drafts.findIndex(d => d.type === type);
    if (existing !== -1) drafts[existing] = { type, content, updatedAt: new Date().toISOString() };
    else drafts.push({ type, content, updatedAt: new Date().toISOString() });
    await updateUser(user.id, { drafts });
  }, [user, updateUser]);

  const updateTaskAssignees = useCallback(async (taskId: string, assignees: string[]) => {
    try {
      await api.updateTask(taskId, { assignees });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignees } : t));
      pushNotification('Assignees updated', 'success');
    } catch (err: any) {
      pushNotification('Failed to update assignees', 'error');
    }
  }, []);

  const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await api.createResource('leads', lead);
      setLeads(prev => [...prev, created]);
      pushNotification('Lead added successfully', 'success');
    } catch (err: any) {
      pushNotification('Failed to add lead', 'error');
    }
  }, []);

  const updateLead = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    try {
      const updated = await api.updateResource('leads', leadId, updates);
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
      pushNotification('Lead updated', 'success');
    } catch (err: any) {
      pushNotification('Failed to update lead', 'error');
    }
  }, []);

  const updateLeadStatus = useCallback(async (leadId: string, status: LeadStatus) => {
    try {
      await updateLead(leadId, { status, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      // already handled in updateLead
    }
  }, [updateLead]);

  const convertLeadToClient = useCallback(async (leadId: string) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      // 1. Create client
      const client = await api.createClient({
        name: lead.name,
        email: lead.email,
        company: lead.company || 'Converted Lead',
        phone: lead.phone,
        address: ''
      });
      setClients(prev => [...prev, client]);

      // 2. Mark lead as converted
      const updatedLead = await api.updateResource('leads', leadId, { status: LeadStatus.CONVERTED, updatedAt: new Date().toISOString() });
      setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));

      pushNotification('Lead successfully converted to client!', 'success');
    } catch (err: any) {
      pushNotification('Conversion failed', 'error');
    }
  }, [leads]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
    try {
      const created = await api.createResource('expenses', expense);
      setExpenses(prev => [...prev, created]);
      pushNotification('Expense recorded', 'success');
    } catch (err: any) {
      pushNotification('Failed to record expense', 'error');
    }
  }, []);

  const addEstimate = useCallback(async (estimate: Omit<Estimate, 'id'>) => {
    try {
      const created = await api.createResource('estimates', estimate);
      setEstimates(prev => [...prev, created]);
      pushNotification('Estimate created', 'success');
    } catch (err: any) {
      pushNotification('Failed to create estimate', 'error');
    }
  }, []);

  const convertEstimateToInvoice = useCallback(async (estimateId: string) => {
    try {
      const est = estimates.find(e => e.id === estimateId);
      if (!est) return;

      const invoicePayload = {
        projectId: est.projectId,
        clientId: est.clientId,
        amount: est.total,
        paidAmount: 0,
        status: 'PENDING',
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 1209600000).toISOString()
      };

      const inv = await api.createInvoice(invoicePayload);
      setInvoices(prev => [...prev, inv]);

      // Mark estimate as invoiced
      const updatedEst = await api.updateResource('estimates', estimateId, { status: 'INVOICED' });
      setEstimates(prev => prev.map(e => e.id === estimateId ? updatedEst : e));

      pushNotification('Estimate converted to invoice!', 'success');
    } catch (err: any) {
      pushNotification('Conversion failed', 'error');
    }
  }, [estimates]);

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.deleteResource('invoices', invoiceId);
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));
      pushNotification('Invoice deleted', 'success');
    } catch (err: any) {
      pushNotification(`Deletion failed: ${err.message}`, 'error');
    }
  }, []);

  const deleteEstimate = useCallback(async (estimateId: string) => {
    if (!window.confirm('Are you sure you want to delete this estimate?')) return;
    try {
      await api.deleteResource('estimates', estimateId);
      setEstimates(prev => prev.filter(e => e.id !== estimateId));
      pushNotification('Estimate deleted', 'success');
    } catch (err: any) {
      pushNotification(`Deletion failed: ${err.message}`, 'error');
    }
  }, []);

  const deleteExpense = useCallback(async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteResource('expenses', expenseId);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      pushNotification('Expense deleted', 'success');
    } catch (err: any) {
      pushNotification(`Deletion failed: ${err.message}`, 'error');
    }
  }, []);

  const addTicket = useCallback(async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await api.createResource('tickets', ticket);
      setTickets(prev => [...prev, created]);
      pushNotification('Ticket submitted', 'success');
    } catch (err: any) {
      pushNotification('Failed to submit ticket', 'error');
    }
  }, []);

  const updateTicketStatus = useCallback(async (ticketId: string, status: TicketStatus) => {
    try {
      const updated = await api.updateResource('tickets', ticketId, { status, updatedAt: new Date().toISOString() });
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
      pushNotification(`Ticket ${status}`, 'success');
    } catch (err: any) {
      pushNotification('Failed to update ticket', 'error');
    }
  }, []);

  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    try {
      const created = await api.createResource('announcements', announcement);
      setAnnouncements(prev => [created, ...prev]);
      pushNotification('Announcement posted', 'success');
    } catch (err: any) {
      pushNotification('Failed to post announcement', 'error');
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<WorkspaceSettings>) => {
    try {
      if (!settings) return;
      // We use a fixed ID for settings
      const updated = await api.updateResource('settings', 'current_settings', newSettings);
      setSettings(updated);
      pushNotification('Workspace settings updated', 'success');
    } catch (err: any) {
      pushNotification('Failed to update settings', 'error');
    }
  }, [settings]);

  return (
    <AppContext.Provider value={{
      tasks: filteredTasks, projects: filteredProjects, clients, invoices: filteredInvoices, activities, notifications, user, isLoading, error,
      team, allUsers, invitedEmail, invitedRole, inviteToken,
      conversations, activeConversation, messages, docs,
      setTasks, login, signup, logout, updateTaskStatus, addTask, deleteTask, copyTask, addComment,
      approveTask, requestChanges, addProject, addClient, updateClient, generateInvoice, payInvoice, updateInvoiceStatus,
      markNotificationsAsRead, dismissNotification, verifyOTP, inviteTeamMember, removeTeamMember, cancelSignup, resendOTP,
      updateUser, requestEmailUpdate, confirmEmailUpdate,
      sendMessage, selectConversation, createConversation, addDoc, shareDoc,
      trackTaskVisit, toggleBookmark, addBoost, saveDraft,
      archiveProject, logTime, toggleTaskFollower, updateTaskAssignees,
      updateTask,
      leads, addLead, updateLead, updateLeadStatus, convertLeadToClient,
      expenses, addExpense, estimates, addEstimate, convertEstimateToInvoice,
      tickets, addTicket, updateTicketStatus, announcements, addAnnouncement,
      settings, updateSettings,
      deleteInvoice,
      deleteEstimate,
      deleteExpense,
      theme,
      toggleTheme,
      activeTimer,
      startTimer,
      stopTimer
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
