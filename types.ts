
export enum UserRole {
  TEAM = 'TEAM',
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN'
}

export enum TaskStatus {
  TODO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
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
  publicKey?: string;
  lastActive?: string;
  permissions?: {
    billing: boolean;
    projects: boolean;
    timeline: boolean;
    management: boolean;
    messages: boolean;
    docs: boolean;
  };
  bookmarks?: string[];
  drafts?: {
    type: string;
    content: any;
    updatedAt: string;
  }[];
  boosts?: {
    fromUserId: string;
    fromUserName: string;
    message: string;
    createdAt: string;
  }[];
  visitedTasks?: {
    taskId: string;
    visitedAt: string;
  }[];
  customFields?: Record<string, any>;
}

export interface Conversation {
  id: string;
  name?: string;
  participants: string[];
  type: 'DIRECT' | 'GROUP';
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
  };
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  customFields?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string; // Client email
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'ARCHIVED';
  members: string[]; // User IDs
  customFields?: Record<string, any>;
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

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  source: string;
  notes: string;
  assignedTo?: string; // User ID
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, any>;
}

export interface Expense {
  id: string;
  projectId?: string;
  clientId?: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  billed: boolean;
  status: 'PENDING' | 'REIMBURSED' | 'BILLABLE';
  receipt?: string;
}

export interface Estimate {
  id: string;
  clientId: string;
  projectId?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  tax: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'INVOICED';
  date: string;
  expiryDate: string;
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface SupportTicket {
  id: string;
  clientId: string;
  projectId?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string; // Staff ID
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: 'ALL' | 'STAFF' | 'CLIENTS';
  authorId: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  taskId: string;
  startTime: string; // ISO
  endTime?: string; // ISO
  duration: number; // minutes
  isBillable: boolean;
  billed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string; // Primary lead
  assignees: string[]; // Multiple staff members
  followers: string[]; // View only users
  dueDate: string;
  progress: number;
  checklist: ChecklistItem[];
  comments: Comment[];
  approvalStatus?: ApprovalStatus;
  cost?: number;
  files: string[];
  trackTime?: boolean;
  totalTimeLogged?: number; // minutes
  customFields?: Record<string, any>;
}

export interface Doc {
  id: string;
  name: string;
  url: string;
  type: 'google_file';
  ownerId: string;
  sharedWith: string[]; // email or id
  createdAt: string;
}

export interface CustomFieldDefinition {
  id: string;
  resource: 'TASK' | 'PROJECT' | 'LEAD' | 'USER' | 'CLIENT';
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
  options?: string[]; // for SELECT
  required: boolean;
}

export interface WorkspaceSettings {
  id: 'current_settings';
  logoUrl?: string;
  primaryColor?: string; // e.g. indigo-600
  companyName: string;
  supportEmail: string;
  customFieldDefinitions: CustomFieldDefinition[];
}
