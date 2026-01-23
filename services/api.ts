
import { User, UserRole, Task, Project, ClientProfile, Invoice } from '../types';

// Use Vite's import.meta.env with correct typing
// Use empty string to leverage Vite's proxy configuration in vite.config.ts
const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

async function safeFetch(path: string, options?: RequestInit) {
  const currentUserRaw = localStorage.getItem('avocado_current_user');
  const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

  const headers: any = { 'Content-Type': 'application/json' };
  if (currentUser) {
    headers['x-requester-id'] = currentUser.id;
    headers['x-requester-role'] = currentUser.role;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
      cache: 'no-store'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Users
  async signup(email: string, password: string, role: UserRole, name: string): Promise<any> {
    const payload = { email, password, role, name };
    try {
      const res = await safeFetch('/api/users', { method: 'POST', body: JSON.stringify(payload) });
      return res; // Can be User object OR { message: 'OTP sent' }
    } catch (err) {
      // fallback to localStorage-based signup for environments without backend
      const key = 'avocado_users';
      const raw = localStorage.getItem(key);
      let users = raw ? JSON.parse(raw) : [];
      if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('An account with this email already exists.');
      }
      const newUser = { id: Math.random().toString(36).substr(2, 9), name, email, password, role, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, verified: false };
      users.push(newUser);
      localStorage.setItem(key, JSON.stringify(users));
      const { password: _p, ...userSafe } = newUser as any;
      return userSafe as User;
    }
  },

  async inviteTeamMember(name: string, email: string, role: string, permissions?: any, password?: string): Promise<any> {
    return await safeFetch('/api/team/invite', { method: 'POST', body: JSON.stringify({ name, email, role, permissions, password }) });
  },

  async login(email: string, password: string): Promise<User> {
    try {
      const user = await safeFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      return user as User;
    } catch (err: any) {
      // If server fails or returns error, we only fallback to local storage if it's a network error
      // but for "Invalid email or password", we should actually throw.
      if (err.message === 'Invalid email or password' || err.message === 'Email and password required') {
        throw err;
      }

      // Legacy fallback for offline/development without backend
      const key = 'avocado_users';
      const raw = localStorage.getItem(key);
      let users = raw ? JSON.parse(raw) : [];
      if (users.length === 0) {
        const adminEmail = 'thapa.shreeyash790@gmail.com'.toLowerCase();
        users = [{ id: 'admin-001', name: 'Avocado Admin', email: adminEmail, password: 'helloworld1432', role: UserRole.ADMIN, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminEmail}`, verified: true }];
        localStorage.setItem(key, JSON.stringify(users));
      }
      const found = users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found) throw new Error('Invalid email or password.');
      if (found.verified === false) throw new Error('Email not verified. Please check your inbox.');
      const { password: _, ...userSafe } = found;
      return userSafe as User;
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    await safeFetch('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await safeFetch('/api/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) });
  },

  async verifyEmail(token: string): Promise<User> {
    const user = await safeFetch('/api/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }) as User;
    return user;
  },

  async resendOtp(email: string): Promise<void> {
    await safeFetch('/api/auth/resend', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async requestEmailUpdate(userId: string, newEmail: string): Promise<void> {
    await safeFetch('/api/auth/update-email-request', { method: 'POST', body: JSON.stringify({ userId, newEmail }) });
  },

  async confirmEmailUpdate(token: string): Promise<any> {
    return await safeFetch('/api/auth/update-email-confirm', { method: 'POST', body: JSON.stringify({ token }) });
  },

  // Generic resource helpers
  async fetchResource(resource: string): Promise<any[]> {
    const data = await safeFetch(`/api/${resource}`);
    return data || [];
  },

  async createResource(resource: string, payload: any): Promise<any> {
    const created = await safeFetch(`/api/${resource}`, { method: 'POST', body: JSON.stringify(payload) });
    return created;
  },

  async updateResource(resource: string, id: string, payload: any): Promise<any> {
    const updated = await safeFetch(`/api/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return updated;
  },

  async deleteResource(resource: string, id: string): Promise<void> {
    await safeFetch(`/api/${resource}/${id}`, { method: 'DELETE' });
  },

  // Specific convenience wrappers
  async fetchTasks(): Promise<any[]> { return this.fetchResource('tasks'); },
  async fetchProjects(): Promise<any[]> { return this.fetchResource('projects'); },
  async fetchClients(): Promise<any[]> { return this.fetchResource('clients'); },
  async fetchInvoices(): Promise<any[]> { return this.fetchResource('invoices'); },
  async fetchUsers(): Promise<any[]> { return this.fetchResource('users'); },

  async createProject(project: Omit<Project, 'id'>) { return this.createResource('projects', project); },
  async createClient(client: Omit<ClientProfile, 'id'>) { return this.createResource('clients', client); },
  async createTask(task: any) { return this.createResource('tasks', task); },
  async updateTask(id: string, payload: any) { return this.updateResource('tasks', id, payload); },
  async deleteTask(id: string) { return this.deleteResource('tasks', id); },
  async createInvoice(invoice: any) { return this.createResource('invoices', invoice); },
  async updateInvoice(id: string, payload: any) { return this.updateResource('invoices', id, payload); },
  async updateUser(id: string, payload: any) { return this.updateResource('users', id, payload); },
  async recordPayment(invoiceId: string, amount: number, notes?: string) {
    return safeFetch(`/api/invoices/${invoiceId}/payment`, { method: 'POST', body: JSON.stringify({ amount, notes }) });
  },

  // Chat
  async fetchConversations(): Promise<any[]> { return this.fetchResource('conversations'); },
  async fetchMessages(conversationId: string): Promise<any[]> {
    return await safeFetch(`/api/messages?conversationId=${conversationId}`);
  },
  async sendMessage(conversationId: string, senderId: string, text: string): Promise<any> {
    return this.createResource('messages', { conversationId, senderId, text });
  },
  async createConversation(participants: string[], name?: string, type: 'DIRECT' | 'GROUP' = 'DIRECT'): Promise<any> {
    return this.createResource('conversations', { participants, name, type });
  }
};
