const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { GoogleGenAI } = require('@google/genai');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.options('*', cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Global Crash Handlers
process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR (Uncaught Exception):', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL ERROR (Unhandled Rejection):', reason);
});

// --- Database Schemas ---

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'TEAM', 'CLIENT'], default: 'TEAM' },
  avatar: String,
  verified: { type: Boolean, default: false },
  verifyToken: String,
  resetToken: String,
  resetExpires: Number,
  accessibleProjects: { type: [String], default: [] },
  permissions: {
    billing: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    timeline: { type: Boolean, default: true },
    management: { type: Boolean, default: false },
    messages: { type: Boolean, default: true },
    docs: { type: Boolean, default: true }
  },
  publicKey: String,
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  bookmarks: [String],
  drafts: [mongoose.Schema.Types.Mixed],
  boosts: [mongoose.Schema.Types.Mixed],
  visitedTasks: [mongoose.Schema.Types.Mixed],
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const clientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  company: String,
  phone: String,
  address: String,
  createdAt: { type: Date, default: Date.now },
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  description: String,
  clientId: { type: String },
  budget: Number,
  currency: String,
  startDate: String,
  endDate: Date,
  status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  members: { type: [String], default: [] },
  driveLink: String,
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: String,
  title: String,
  description: String,
  status: { type: String, enum: ['TO_DO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'], default: 'TO_DO' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  assignedTo: String,
  assignees: { type: [String], default: [] },
  followers: { type: [String], default: [] },
  dueDate: String,
  progress: { type: Number, default: 0 },
  checklist: [{ id: String, text: String, isCompleted: Boolean }],
  comments: [{ id: String, userId: String, userName: String, role: String, text: String, createdAt: String }],
  files: [String],
  approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'CHANGES_REQUESTED'] },
  trackTime: { type: Boolean, default: true },
  totalTimeLogged: { type: Number, default: 0 },
  driveLink: String,
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const invoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: String,
  amount: Number,
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING', 'PAID', 'REJECTED'], default: 'PENDING' },
  date: String,
  dueDate: String
});

const verificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  payload: { type: Object, required: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000), index: { expires: 0 } }
});

const docSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  url: String,
  type: { type: String, default: 'google_file' },
  ownerId: String,
  sharedWith: [String],
  createdAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  email: String,
  phone: String,
  company: String,
  status: { type: String, enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CONVERTED', 'LOST'], default: 'NEW' },
  source: String,
  notes: String,
  assignedTo: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const expenseSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  projectId: String,
  clientId: String,
  title: String,
  amount: Number,
  category: String,
  date: { type: Date, default: Date.now },
  billed: { type: Boolean, default: false },
  status: { type: String, enum: ['PENDING', 'REIMBURSED', 'BILLABLE'], default: 'PENDING' },
  receipt: String
});

const estimateSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  clientId: String,
  projectId: String,
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number,
    cost: Number
  }],
  tax: Number,
  total: Number,
  status: { type: String, enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'INVOICED'], default: 'DRAFT' },
  date: { type: Date, default: Date.now },
  expiryDate: Date
});

const ticketSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  clientId: String,
  projectId: String,
  subject: String,
  description: String,
  createdByName: String,
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
  assignedTo: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const announcementSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  title: String,
  content: String,
  target: { type: String, enum: ['ALL', 'STAFF', 'CLIENTS'], default: 'ALL' },
  authorId: String,
  createdAt: { type: Date, default: Date.now }
});



const User = mongoose.model('User', userSchema);
const Client = mongoose.model('Client', clientSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const Verification = mongoose.model('Verification', verificationSchema);
const Doc = mongoose.model('Doc', docSchema);
const Lead = mongoose.model('Lead', leadSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const Estimate = mongoose.model('Estimate', estimateSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);
const Announcement = mongoose.model('Announcement', announcementSchema);

const TimeEntry = mongoose.model('TimeEntry', new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  taskId: String,
  startTime: Date,
  endTime: Date,
  duration: { type: Number, default: 0 },
  isBillable: { type: Boolean, default: true },
  billed: { type: Boolean, default: false }
}));

const settingsSchema = new mongoose.Schema({
  id: { type: String, default: 'current_settings', unique: true },
  logoUrl: String,
  primaryColor: { type: String, default: 'indigo-600' },
  companyName: { type: String, default: 'Avocado Inc' },
  supportEmail: String,
  customFieldDefinitions: [{
    id: String,
    resource: { type: String, enum: ['TASK', 'PROJECT', 'LEAD', 'USER', 'CLIENT'] },
    name: String,
    type: { type: String, enum: ['TEXT', 'NUMBER', 'DATE', 'SELECT'] },
    options: [String],
    required: { type: Boolean, default: false }
  }]
});
const Settings = mongoose.model('Settings', settingsSchema);

const Conversation = mongoose.model('Conversation', new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  participants: [String],
  type: { type: String, enum: ['DIRECT', 'GROUP'], default: 'DIRECT' },
  lastMessage: { text: String, senderId: String, createdAt: Date },
  updatedAt: { type: Date, default: Date.now }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  id: { type: String, unique: true },
  conversationId: String,
  senderId: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
}));

const Activity = mongoose.model('Activity', new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  userName: String,
  userAvatar: String,
  action: String,
  taskId: String,
  taskTitle: String,
  type: { type: String, enum: ['STATUS', 'COMMENT', 'APPROVAL', 'CREATE'] },
  createdAt: { type: Date, default: Date.now }
}));

// Helper to get model by resource name
const getModel = (resource) => {
  const models = {
    users: User,
    clients: Client,
    projects: Project,
    tasks: Task,
    invoices: Invoice,
    conversations: Conversation,
    messages: Message,
    activities: Activity,
    docs: Doc,
    leads: Lead,
    expenses: Expense,
    estimates: Estimate,
    tickets: Ticket,
    announcements: Announcement,
    settings: Settings,
    timeEntry: TimeEntry
  };
  return models[resource];
};

// --- Connection Logic ---
let cachedPromise = null;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (cachedPromise) return cachedPromise;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';

  try {
    console.log('Attempting to connect to MongoDB...');
    cachedPromise = mongoose.connect(uri, {
      bufferCommands: true,
      serverSelectionTimeoutMS: 15000
    });
    await cachedPromise;
    console.log('MongoDB connected successfully');

    // Seed initial admin if none
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount === 0) {
      console.log('Seeding initial admin...');
      await User.create({
        id: 'admin-001',
        name: 'Workspace Admin',
        email: 'avocadoinc790@gmail.com',
        password: 'admin',
        role: 'ADMIN',
        verified: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
      }).catch(e => console.log('Admin already exists.'));
    }
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    cachedPromise = null;
    throw err;
  }
};

// Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    const requesterId = req.headers['x-requester-id'];
    if (requesterId && mongoose.connection.readyState === 1) {
      User.findOneAndUpdate({ id: requesterId }, { lastActive: new Date() }).catch(() => { });
    }
    next();
  } catch (err) {
    console.error('DB Middleware error:', err.message);
    next();
  }
});

// --- Email Helper ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendMail(to, subject, text, html) {
  if (!process.env.SMTP_HOST) {
    console.log('--- Email Simulated ---');
    console.log('To:', to, 'Subject:', subject);
    console.log('Body:', text);
    return;
  }

  console.log(`[Email] Sending to ${to}...`);
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Avocado PM" <avocadoinc790@gmail.com>',
      to,
      subject,
      text,
      html: html || text
    });
    console.log('[Email] Success:', info.messageId);
    return info;
  } catch (err) {
    console.error('[Email Error] Failed:', err.message);
    console.log('--- FALLBACK ---');
    console.log(`To: ${to}, Subject: ${subject}`);
    console.log(`Content: ${text || html}`);
  }
}

// --- SPECIALIZED ROUTES (Order is IMPORTANT) ---

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mail: !!process.env.SMTP_PASS
  });
});

app.get('/api/test-email', async (req, res) => {
  try {
    const email = req.query.email || process.env.SMTP_USER;
    await sendMail(email, 'Test: Avocado PM', 'Gmail logic is verified!');
    res.json({ success: true, message: `Check ${email}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/team/invite', async (req, res) => {
  const { name, email, role = 'TEAM', permissions } = req.body;
  const lowerEmail = email.toLowerCase();

  const existing = await User.findOne({ email: lowerEmail });
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const userId = Math.random().toString(36).substr(2, 9);
  await User.create({
    id: userId,
    email: lowerEmail,
    name,
    role,
    password: 'PENDING_INVITE',
    verified: false,
    permissions: permissions || { billing: true, timeline: true, projects: true, management: false }
  });

  if (req.body.password) {
    try {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(req.body.password, 10);
      await User.findOneAndUpdate({ id: userId }, { password: hashed, verified: true });
    } catch (e) { console.warn('Bcrypt failed', e); }
  }

  const verifyToken = Math.random().toString(36).substr(2, 12);
  await Verification.deleteMany({ email: lowerEmail });
  await Verification.create({
    email: lowerEmail,
    token: verifyToken,
    payload: { name, role, id: userId, permissions }
  });

  const baseUrl = process.env.APP_URL || 'http://localhost:3010';
  const inviteLink = `${baseUrl}/?invite=true&email=${lowerEmail}&token=${verifyToken}&role=${encodeURIComponent(role)}`;

  let emailSent = false;
  try {
    await sendMail(lowerEmail, 'Invitation to join Avocado PM',
      `Welcome ${name}! Register here: ${inviteLink}`,
      `<h2>Join the Team</h2><p>Click <a href="${inviteLink}">here</a> to join as ${role}.</p>`
    );
    emailSent = true;
  } catch (err) {
    console.error('[Invite Error] Failed to send email:', err.message);
  }

  res.status(201).json({
    success: true,
    message: emailSent ? 'Invite sent' : 'Invite created but email failed',
    inviteLink: emailSent ? undefined : inviteLink
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.verified === false) return res.status(403).json({ error: 'Email not verified' });

    let isValid = false;
    try {
      const bcrypt = require('bcryptjs');
      isValid = await bcrypt.compare(password, user.password);
    } catch (e) {
      // bcrypt might not be available or password might not be a hash
    }

    // Fallback for legacy plain text passwords (e.g. admin seed)
    if (!isValid && user.password === password) {
      isValid = true;
    }

    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

    const { password: _, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body;
  let record;

  if (token === '000000') {
    // Master bypass: Find the latest verification record
    record = await Verification.findOne({}).sort({ _id: -1 });
    console.log(`[AUTH] Master bypass (000000) used for: ${record?.email || 'unknown'}`);
  } else {
    record = await Verification.findOne({ token });
  }

  if (!record) return res.status(400).json({ error: 'Invalid or expired code (Try 000000 for bypass)' });

  const { email, payload } = record;
  let user = await User.findOne({ email });

  if (user) {
    if (payload.password) user.password = payload.password;
    if (payload.name) user.name = payload.name;
    user.verified = true;
    await user.save();
  } else {
    user = await User.create({ ...payload, email, verified: true });
  }

  await Verification.deleteOne({ _id: record._id });
  const { password, ...safe } = user.toObject();
  res.json(safe);
});

app.post('/api/auth/resend', async (req, res) => {
  const { email } = req.body;
  const lowerEmail = email.toLowerCase();
  const ver = await Verification.findOne({ email: lowerEmail });
  if (!ver) return res.status(404).json({ error: 'No session found' });

  const newToken = Math.floor(100000 + Math.random() * 900000).toString();
  ver.token = newToken;
  await ver.save();

  await sendMail(lowerEmail, 'Your Verification Code', `Code: ${newToken}`);
  res.json({ success: true });
});

app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'Not found' });

  const token = Math.random().toString(36).substr(2, 12);
  user.resetToken = token;
  user.resetExpires = Date.now() + 3600000;
  await user.save();

  const resetLink = `http://localhost:3010/reset?token=${token}`;
  await sendMail(user.email, 'Password Reset', `Reset here: ${resetLink}`);
  res.json({ success: true });
});

app.post('/api/auth/reset', async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({ resetToken: token, resetExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ error: 'Invalid or expired link' });

  user.password = password;
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();
  res.json({ success: true });
});

app.post('/api/auth/update-email-request', async (req, res) => {
  const { userId, newEmail } = req.body;
  const lowerEmail = newEmail.toLowerCase();
  const existing = await User.findOne({ email: lowerEmail });
  if (existing) return res.status(400).json({ error: 'Email already taken' });

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  await Verification.deleteMany({ email: lowerEmail });
  await Verification.create({
    email: lowerEmail,
    token,
    payload: { type: 'EMAIL_UPDATE', userId, newEmail: lowerEmail }
  });

  await sendMail(lowerEmail, 'Confirm your new email', `Code: ${token}`);
  res.json({ success: true });
});

app.post('/api/auth/update-email-confirm', async (req, res) => {
  const { token } = req.body;
  const ver = await Verification.findOne({ token });
  if (!ver || ver.payload?.type !== 'EMAIL_UPDATE') return res.status(404).json({ error: 'Invalid code' });

  const { userId, newEmail } = ver.payload;
  await User.findOneAndUpdate({ id: userId }, { email: newEmail });
  await Verification.deleteOne({ _id: ver._id });
  res.json({ success: true, email: newEmail });
});

// AI Routes
app.post('/api/genai/checklist', async (req, res) => {
  try {
    const { title, description } = req.body;
    const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || process.env.API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`Task: ${title}. ${description}. Return a JSON array of 5 checklist items.`);
    res.json({ items: JSON.parse(result.response.text().replace(/```json|```/g, '').trim()) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Payment Route
app.post('/api/invoices/:id/payment', async (req, res) => {
  const { id } = req.params;
  const { amount, notes } = req.body;

  try {
    const invoice = await Invoice.findOne({ id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const newPaidAmount = (invoice.paidAmount || 0) + Number(amount);
    const newStatus = newPaidAmount >= invoice.amount ? 'PAID' : 'SENT'; // Logic: Partial payment keeps it SENT (or PARTIAL if we had it), full makes PAID.

    await Invoice.findOneAndUpdate({ id }, {
      paidAmount: newPaidAmount,
      status: newStatus
    });

    // Log payment? Could add expenses/revenue log here if needed.

    res.json({ success: true, paidAmount: newPaidAmount, status: newStatus });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- GENERIC CRUD ROUTES ---

app.get('/api/:resource', async (req, res) => {
  const { resource } = req.params;
  const Model = getModel(resource);
  if (!Model) return res.status(404).json({ error: 'Resource not found' });

  const requesterId = req.headers['x-requester-id'];
  const requesterRole = req.headers['x-requester-role'];

  let query = {};

  // Visibility filtering
  if (requesterRole !== 'ADMIN' && requesterId) {
    const user = await User.findOne({ id: requesterId });
    if (user) {
      if (user.role === 'CLIENT') {
        if (resource === 'projects') {
          query.clientId = user.email;
        } else if (resource === 'tasks' || resource === 'invoices' || resource === 'tickets' || resource === 'estimates' || resource === 'expenses') {
          // Attempt to filter by clientId first if it exists on the schema
          const model = getModel(resource);
          const hasClientId = model && model.schema.path('clientId');

          if (hasClientId) {
            query.clientId = user.email;
          } else {
            // Fallback to projectId lookup
            const clientProjects = await Project.find({ clientId: user.email });
            query.projectId = { $in: clientProjects.map(p => p.id) };
          }
        }
      } else {
        // TEAM or custom roles
        const allowed = user.accessibleProjects || [];
        const perms = user.permissions || {};

        // Force strict project filtering for TEAM members
        if (resource === 'projects') {
          if (perms.projects === false) return res.status(403).json({ error: 'Access denied' });

          // If NOT a manager, restrict to membership
          if (!perms.management) {
            console.log(`[API] Filtering projects for ${requesterId} (Team). Checking members array.`);
            query.members = requesterId;
          }
        }

        // Filter TASKS based on accessible projects
        if (resource === 'tasks') {
          if (perms.timeline === false) return res.status(403).json({ error: 'Access denied' });

          // 1. Get projects this user is part of
          const myProjects = await Project.find({ members: requesterId }, 'id');
          const myProjectIds = myProjects.map(p => p.id);

          // 2. Return tasks that are in those projects OR assigned to this user specifically
          // Check BOTH ID and Email for robustness
          const myEmail = user.email || '';

          query.$or = [
            { projectId: { $in: myProjectIds } },
            { assignees: requesterId },
            { assignees: myEmail },
            { assignees: { $in: [requesterId, myEmail] } },
            { assignedTo: requesterId },
            { assignedTo: myEmail }
          ];
        }

        // Module-level blocking
        if (resource === 'invoices' && perms.billing === false) return res.status(403).json({ error: 'Access denied' });
        if (resource === 'projects' && perms.projects === false) return res.status(403).json({ error: 'Access denied' });
        if (resource === 'tasks' && perms.timeline === false) return res.status(403).json({ error: 'Access denied' });
        if (resource === 'users') {
          // Allow fetching users but strip sensitive info if they aren't managers
          // This enables chat discovery for everyone (Admin, Team, Clients)
          const allUsers = await User.find({}).sort({ name: 1 });

          if (perms.management === true || requesterRole === 'ADMIN') {
            return res.json(allUsers);
          }

          console.log(`[API] Discovery fetch by ${requesterId} (Role: ${requesterRole}): found ${allUsers.length} users`);
          const stripped = allUsers.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role,
            avatar: u.avatar,
            email: u.email,
            publicKey: u.publicKey,
            lastActive: u.lastActive
          }));
          return res.json(stripped);
        }

        if (resource === 'projects') {
          // Fix: Do NOT overwrite if we already set query.members (for Team members)
          // valid scan: if allowed is empty but we set members, we keep members.
          if (!query.members) {
            query.id = { $in: allowed };
          }
        } else if (resource === 'invoices') {
          query.projectId = { $in: allowed };
        } else if (resource === 'leads') {
          // Allow team to see leads assigned to them specifically
          // Check both ID and Email match to be safe
          const myEmail = user.email || '';
          query.$or = [
            { assignedTo: requesterId },
            { assignedTo: myEmail }
          ];
          // If we want them to see ALL leads, we'd skip this. But "only assigned" is safer default.
          // However based on "Company" visibility issue, maybe they need to see leads they created?
          // For now, let's allow them to see leads assigned to them.
        }
      }
    }
  }

  // Chat filtering
  if (resource === 'conversations' && requesterId) {
    query.participants = requesterId;
  }
  if (resource === 'messages' && requesterId) {
    const { conversationId } = req.query;
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    const conv = await Conversation.findOne({ id: conversationId, participants: requesterId });
    if (!conv) return res.status(403).json({ error: 'Not authorized' });
    query.conversationId = conversationId;
  }

  // Doc filtering
  if (resource === 'docs' && requesterId && requesterRole !== 'ADMIN') {
    const user = await User.findOne({ id: requesterId });
    const userEmail = user?.email || '';
    query.$or = [
      { ownerId: requesterId },
      { sharedWith: requesterId },
      { sharedWith: userEmail }
    ];
  }

  try {
    const sort = resource === 'messages' ? { createdAt: 1 } : { updatedAt: -1 };
    const items = await Model.find(query).sort(sort);
    res.json(items);
  } catch (err) {
    console.error('GET Error:', err.message);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/:resource/:id', async (req, res) => {
  const Model = getModel(req.params.resource);
  const item = await Model?.findOne({ id: req.params.id });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/:resource', async (req, res) => {
  const { resource } = req.params;
  const Model = getModel(resource);
  if (!Model) return res.status(404).json({ error: 'Not found' });

  const payload = req.body;
  if (!payload.id) payload.id = (Date.now() + Math.floor(Math.random() * 10000)).toString();

  // Signup Logic
  if (resource === 'users' && !payload.verified) {
    const requesterRole = req.headers['x-requester-role'];
    const email = payload.email.toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) return res.status(409).json({ error: 'User exists' });

    // Admin bypass: allow creating verified users directly
    if (requesterRole === 'ADMIN') {
      payload.verified = true;
      try {
        const created = await User.create(payload);
        const { password: _, ...safe } = created.toObject();
        return res.status(201).json(safe);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    await Verification.deleteMany({ email });
    await Verification.create({ email, token, payload });
    await sendMail(email, 'Verify your account', `Your code: ${token}`);
    return res.status(201).json({ message: 'OTP sent', email, requiresOtp: true });
  }

  // Chat special logic
  if (resource === 'messages') {
    const { conversationId, senderId, text } = payload;
    await Conversation.findOneAndUpdate(
      { id: conversationId },
      {
        lastMessage: { text, senderId, createdAt: new Date() },
        updatedAt: new Date()
      }
    );
  }

  try {
    const created = await Model.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error('POST Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  const Model = getModel(resource);
  if (!Model) return res.status(404).json({ error: 'Not found' });

  const payload = req.body;
  if (resource === 'users') {
    payload.lastActive = new Date();
    // Hash password if updating
    if (payload.password) {
      // Import bcrypt if not available, or use existing method.
      // Checking login implementation first...
      // Proceeding with bcrypt assumption or simple check.
      try {
        const bcrypt = require('bcryptjs');
        payload.password = await bcrypt.hash(payload.password, 10);
        payload.verified = true;
      } catch (e) {
        console.warn('bcryptjs not found, saving plain text (INSECURE - DEV ONLY)');
      }
    }
  }

  try {
    const updated = await Model.findOneAndUpdate({ id }, payload, { new: true, upsert: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/:resource/:id', async (req, res) => {
  const Model = getModel(req.params.resource);
  await Model?.findOneAndDelete({ id: req.params.id });
  res.status(204).end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));

module.exports = app;
