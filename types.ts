
export enum UserRole {
  TEAM = 'TEAM',
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN'
}

export enum TaskStatus {
  TODO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED'
}

// Helper to check if a custom role is internal
export const isInternalRole = (role: string) => role !== UserRole.CLIENT;
export const isAdminRole = (role: string) => role === UserRole.ADMIN;

export interface User {
  id: string;
  name: string;
  role: string; // Allow any string for job titles
  avatar: string;
  email: string;
  verified?: boolean;
  accessibleProjects?: string[];
  permissions?: {
    billing: boolean;
    projects: boolean;
    timeline: boolean;
    management: boolean;
  };
}

export interface ClientProfile {
  id: string;
  name: string;
  company: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string; // Client email
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'PENDING' | 'REJECTED';
  date: string;
  dueDate: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  taskId?: string;
  taskTitle?: string;
  createdAt: string;
  type: 'STATUS' | 'COMMENT' | 'APPROVAL' | 'CREATE';
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  dueDate: string;
  progress: number;
  checklist: ChecklistItem[];
  comments: Comment[];
  approvalStatus?: ApprovalStatus;
  cost?: number;
  files: string[];
}
