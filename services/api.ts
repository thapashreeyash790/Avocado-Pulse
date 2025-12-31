
import { User, UserRole, Task, Project, ClientProfile, Invoice } from '../types';

const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:4000';

async function safeFetch(path: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
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
  async signup(email: string, password: string, role: UserRole, name: string): Promise<User> {
    const payload = { email, password, role, name };
    const created = await safeFetch('/api/users', { method: 'POST', body: JSON.stringify(payload) });
    const { password: _, ...user } = created as any;
    return user as User;
  },

  async login(email: string, password: string): Promise<User> {
    const users = await safeFetch('/api/users') as any[];
    const found = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) throw new Error('Invalid email or password.');
    const { password: _, ...userSafe } = found;
    return userSafe as User;
  },

  // Generic resource helpers
  async fetchResource<T = any>(resource: string): Promise<T[]> {
    const data = await safeFetch(`/api/${resource}`) as T[];
    return data || [];
  },

  async createResource<T = any>(resource: string, payload: any): Promise<T> {
    const created = await safeFetch(`/api/${resource}`, { method: 'POST', body: JSON.stringify(payload) }) as T;
    return created;
  },

  async updateResource<T = any>(resource: string, id: string, payload: any): Promise<T> {
    const updated = await safeFetch(`/api/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) as T;
    return updated;
  },

  async deleteResource(resource: string, id: string): Promise<void> {
    await safeFetch(`/api/${resource}/${id}`, { method: 'DELETE' });
  },

  // Specific convenience wrappers
  async fetchTasks(): Promise<Task[]> { return this.fetchResource<Task>('tasks'); },
  async fetchProjects(): Promise<Project[]> { return this.fetchResource<Project>('projects'); },
  async fetchClients(): Promise<ClientProfile[]> { return this.fetchResource<ClientProfile>('clients'); },
  async fetchInvoices(): Promise<Invoice[]> { return this.fetchResource<Invoice>('invoices'); },

  async createProject(project: Omit<Project, 'id'>) { return this.createResource('projects', project); },
  async createClient(client: Omit<ClientProfile, 'id'>) { return this.createResource('clients', client); },
  async createTask(task: any) { return this.createResource('tasks', task); },
  async updateTask(id: string, payload: any) { return this.updateResource('tasks', id, payload); },
  async deleteTask(id: string) { return this.deleteResource('tasks', id); },
  async createInvoice(invoice: any) { return this.createResource('invoices', invoice); },
  async updateInvoice(id: string, payload: any) { return this.updateResource('invoices', id, payload); }
};
