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
  expiresAt: { type: Date }, // For auto-deletion of unverified users
  accessibleProjects: { type: [String], default: [] }, // Project IDs this user can access
  permissions: {
    billing: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    timeline: { type: Boolean, default: true },
    management: { type: Boolean, default: false }
  },
  publicKey: String,
  lastActive: { type: Date, default: Date.now },
  bookmarks: { type: [String], default: [] }, // Array of resource IDs (task/project/doc)
  drafts: [{
    type: String, // 'task', 'comment', 'message'
    content: Object,
    updatedAt: { type: Date, default: Date.now }
  }],
  boosts: [{
    fromUserId: String,
    fromUserName: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  visitedTasks: [{
    taskId: String,
    visitedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const clientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  company: String,
  createdAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  clientId: { type: String }, // Client email (optional)
  budget: Number,
  currency: String,
  startDate: String,
  endDate: String
});

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: String,
  title: String,
  description: String,
  status: { type: String, enum: ['TO_DO', 'IN_PROGRESS', 'COMPLETED'], default: 'TO_DO' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  assignedTo: String,
  dueDate: String,
  progress: { type: Number, default: 0 },
  checklist: [{ id: String, text: String, isCompleted: Boolean }],
  comments: [{ id: String, userId: String, userName: String, role: String, text: String, createdAt: String }],
  files: [String],
  approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'CHANGES_REQUESTED'] }
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
  payload: { type: Object, required: true }, // { name, password, role, ... }
  expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000), index: { expires: 0 } }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Client = mongoose.model('Client', clientSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const Verification = mongoose.model('Verification', verificationSchema);

const Conversation = mongoose.model('Conversation', new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  participants: [String],
  type: { type: String, enum: ['DIRECT', 'GROUP'], default: 'DIRECT' },
  lastMessage: {
    text: String,
    senderId: String,
    createdAt: Date
  },
  updatedAt: { type: Date, default: Date.now }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  id: { type: String, unique: true },
  conversationId: String,
  senderId: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
}));

const Doc = mongoose.model('Doc', new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  url: String,
  type: { type: String, default: 'google_file' },
  ownerId: String,
  sharedWith: [String], // Array of email/id
  createdAt: { type: Date, default: Date.now }
}));

const activitySchema = new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  userName: String,
  userAvatar: String,
  action: String,
  taskId: String,
  taskTitle: String,
  type: { type: String, enum: ['STATUS', 'COMMENT', 'APPROVAL', 'CREATE'] },
  createdAt: { type: Date, default: Date.now }
});

const Activity = mongoose.model('Activity', activitySchema);

// Helper to get model by resource name
const getModel = (resource) => {
  switch (resource) {
    case 'users': return User;
    case 'clients': return Client;
    case 'projects': return Project;
    case 'tasks': return Task;
    case 'invoices': return Invoice;
    case 'conversations': return Conversation;
    case 'messages': return Message;
    case 'docs': return Doc;
    case 'activities': return Activity;
    default: return null;
  }
};

// --- Connection Logic (Cached for Serverless) ---
let cachedPromise = null;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (cachedPromise) return cachedPromise;

  if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is missing in production environment');
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm';

  try {
    console.log('Attempting to connect to MongoDB...');
    cachedPromise = mongoose.connect(uri, {
      bufferCommands: true,
      serverSelectionTimeoutMS: 15000
    });
    await cachedPromise;
    console.log('MongoDB connected successfully');

    // Seed initial admin if none exists
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
      });
    }

    // Clear legacy index
    try { await User.collection.dropIndex('expiresAt_1'); } catch (e) { }

  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    cachedPromise = null;
    throw err;
  }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  try {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database connection is not ready' });
    }

    // Update online status
    const requesterId = req.headers['x-requester-id'];
    if (requesterId) {
      await User.findOneAndUpdate({ id: requesterId }, { lastActive: new Date() });
    }

    next();
  } catch (err) {
    console.error('Database connection middleware error:', err.message);
    res.status(503).json({
      error: 'Database not connected',
      details: err.message,
      hint: process.env.NODE_ENV === 'production' ? 'Check if MONGODB_URI is set in environment variables' : 'Ensure MongoDB is running locally'
    });
  }
});


// --- Email Helper ---
async function sendMail(to, subject, text, html) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {

    console.log('--- Email Simulated (No SMTP) ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', text);
    console.log('---------------------------------');
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    const from = `"Avocado PM" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`;
    console.log(`[Email] Sending to ${to} from ${from}...`);

    await transporter.verify(); // Check connection before sending
    await transporter.sendMail({ from, to, subject, text, html });
    console.log(`[Email] Successfully sent to ${to}`);
  } catch (err) {
    console.error('[Email Error] Code:', err.code);
    console.error('[Email Error] Response:', err.response);
    throw err;
  }
}

// --- Routes ---

app.get('/api/test-email', async (req, res) => {
  try {
    const email = req.query.email || process.env.SMTP_USER;
    await sendMail(email, 'Test: Avocado PM Gmail Logic', 'This confirms your Gmail is delivering real emails!');
    res.json({ success: true, message: `Check your inbox at ${email}. Also check Spam!` });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});


// Get all
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
        } else if (resource === 'tasks' || resource === 'invoices') {
          const clientProjects = await Project.find({ clientId: user.email });
          query.projectId = { $in: clientProjects.map(p => p.id) };
        }
      } else {
        // TEAM or custom roles
        const allowed = user.accessibleProjects || [];
        const perms = user.permissions || {};

        // Module-level blocking
        if (resource === 'invoices' && perms.billing === false) return res.status(403).json({ error: 'Access denied to Billing' });
        if (resource === 'projects' && perms.projects === false) return res.status(403).json({ error: 'Access denied to Projects' });
        if (resource === 'tasks' && perms.timeline === false) return res.status(403).json({ error: 'Access denied to Timeline' });
        if (resource === 'users' && perms.management === false) {
          // Users can always see themselves, but not others if management is off
          // Wait, 'Get all' on users should be blocked for non-managers
          return res.status(403).json({ error: 'Access denied to Team Directory' });
        }

        if (resource === 'projects') {
          query.id = { $in: allowed };
        } else if (resource === 'tasks' || resource === 'invoices') {
          query.projectId = { $in: allowed };
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
    if (!conv) return res.status(403).json({ error: 'Not a member of this conversation' });
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
    res.status(500).json({ error: err.message });
  }
});

// Get one
app.get('/api/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  const Model = getModel(resource);
  if (!Model) return res.status(404).json({ error: 'Resource not found' });

  const requesterId = req.headers['x-requester-id'];
  const requesterRole = req.headers['x-requester-role'];

  const item = await Model.findOne({ id });
  if (!item) return res.status(404).json({ error: 'Not found' });

  // Visibility check
  if (requesterRole !== 'ADMIN' && requesterId) {
    const user = await User.findOne({ id: requesterId });
    if (user) {
      if (user.role === 'CLIENT') {
        if (resource === 'projects' && item.clientId !== user.email) {
          return res.status(403).json({ error: 'Access denied' });
        }
        if (resource === 'tasks' || resource === 'invoices') {
          const project = await Project.findOne({ id: item.projectId });
          if (!project || project.clientId !== user.email) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }
      } else {
        const allowed = user.accessibleProjects || [];
        const perms = user.permissions || {};

        if (resource === 'invoices' && perms.billing === false) return res.status(403).json({ error: 'Access denied' });
        if (resource === 'projects' && perms.projects === false) return res.status(403).json({ error: 'Access denied' });
        if (resource === 'tasks' && perms.timeline === false) return res.status(403).json({ error: 'Access denied' });
        if (resource === 'users' && perms.management === false && item.id !== requesterId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        if (resource === 'projects' && !allowed.includes(item.id)) {
          return res.status(403).json({ error: 'Access denied' });
        }
        if ((resource === 'tasks' || resource === 'invoices') && !allowed.includes(item.projectId)) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
    }
  }

  res.json(item);
});

// Create
app.post('/api/:resource', async (req, res) => {
  const { resource } = req.params;
  const Model = getModel(resource);
  if (!Model) return res.status(404).json({ error: 'Resource not found' });

  const payload = req.body;
  if (!payload.id) payload.id = (Date.now() + Math.floor(Math.random() * 10000)).toString();

  // User special logic
  if (resource === 'users') {
    const email = (payload.email || '').toLowerCase();
    const existing = await User.findOne({ email });

    // Internal (Team/Admin/Custom) Signup Logic (Must be invited)
    if (payload.role !== 'CLIENT') {
      if (!existing) {
        return res.status(403).json({ error: 'Team members must be invited by an Admin.' });
      }
      if (existing.verified) {
        return res.status(409).json({ error: 'User already exists. Please login.' });
      }
      const verifyToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

      try {
        await sendMail(email, 'Verify your Team Account',
          `Your verification code is: ${verifyToken}`,
          `<h2>Your Verification Code: ${verifyToken}</h2>`
        );
        // Store verification session with the new data from signup
        await Verification.deleteMany({ email });
        await Verification.create({
          email,
          token: verifyToken,
          payload: { ...payload, id: existing.id } // payload from request body (name, password, role)
        });
        return res.status(200).json({ message: 'OTP sent', email, requiresOtp: true });
      } catch (e) {
        console.error('Email failed', e);
        return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
      }
    }

    // CLIENT Signup Logic
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const verifyToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Send email
    try {
      await sendMail(email, 'Verify your Account',
        `Your verification code is: ${verifyToken}`,
        `<h2>Your Verification Code: ${verifyToken}</h2>`
      );
      // Store verification session WITHOUT creating user yet
      await Verification.deleteMany({ email });
      await Verification.create({ email, token: verifyToken, payload });
      return res.status(201).json({ message: 'OTP sent', email, requiresOtp: true });
    } catch (e) {
      console.error('Email failed', e);
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }
  }

  // Client Resource (Added by Team)
  if (resource === 'clients') {
    // ... no changes needed here mostly ...
    const clientEmail = (payload.email || '').toLowerCase();
    // ... existing logic ...
  }

  // Chat special logic
  if (resource === 'messages') {
    const { conversationId, senderId, text } = payload;
    const conv = await Conversation.findOne({ id: conversationId, participants: senderId });
    if (!conv) return res.status(403).json({ error: 'Not authorized to send messages here' });

    // Update conversation last activity
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
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/team/invite', async (req, res) => {
  const { name, email, role = 'TEAM', permissions } = req.body;
  const lowerEmail = email.toLowerCase();

  const existing = await User.findOne({ email: lowerEmail });
  if (existing) return res.status(409).json({ error: 'User already exists.' });

  // Create unverified user first so signup can find it
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

  // Use the same Verification logic but for an invite
  const verifyToken = Math.random().toString(36).substr(2, 12);
  await Verification.deleteMany({ email: lowerEmail });
  await Verification.create({
    email: lowerEmail,
    token: verifyToken,
    payload: { name, role, id: userId, permissions }
  });

  const inviteLink = `http://localhost:3010/?invite=true&email=${lowerEmail}&token=${verifyToken}&role=${encodeURIComponent(role)}`;

  try {
    await sendMail(lowerEmail, 'You are invited to Avocado PM',
      `Welcome ${name}! Please register here: ${inviteLink}`,
      `<h2>Welcome ${name}!</h2><p>You have been invited to join the team as a <b>${role}</b>.</p><p><a href="${inviteLink}" style="padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; rounded: 8px;">Accept Invitation & Register</a></p>`
    );
    res.status(201).json({ success: true, message: 'Invite sent' });
  } catch (e) {
    console.error('Invite email failed', e);
    res.status(500).json({ error: 'Failed to send invite email' });
  }
});

// Update
app.put('/api/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  const Model = getModel(resource);
  if (!Model) return res.status(404).json({ error: 'Resource not found' });

  // User permission logic
  if (resource === 'users') {
    const requesterId = req.headers['x-requester-id'];
    const requesterRole = req.headers['x-requester-role'];
    const targetUser = await User.findOne({ id });

    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Role check: Only Admin can change roles
    if (req.body.role && req.body.role !== targetUser.role) {
      if (requesterRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Only Admins can change workspace roles.' });
      }
    }

    // Permission check: Only Admin can change project access
    if (req.body.accessibleProjects || req.body.permissions) {
      if (requesterRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Only Admins can modify user permissions.' });
      }
    }

    // Email check: Only Admin can directly update emails
    if (req.body.email && req.body.email.toLowerCase() !== (targetUser.email || '').toLowerCase()) {
      if (requesterRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Only Admins can directly update emails. Team members must use the OTP flow.' });
      }
    }

    // Ensure email is lowercased if update is allowed
    if (req.body.email) req.body.email = req.body.email.toLowerCase();
  }

  const updated = await Model.findOneAndUpdate({ id }, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// Delete
app.delete('/api/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  const Model = getModel(resource);
  if (!Model) return res.status(404).json({ error: 'Resource not found' });

  await Model.findOneAndDelete({ id });
  res.status(204).end();
});

// Auth endpoints
app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body;
  const ver = await Verification.findOne({ token });
  if (!ver) return res.status(404).json({ error: 'Invalid or expired token' });

  const { email, payload } = ver;
  let user = await User.findOne({ email });

  if (user) {
    // Update existing (Invited Team member)
    user.name = payload.name;
    user.password = payload.password;
    user.role = payload.role || user.role;
    if (payload.permissions) user.permissions = payload.permissions;
    user.verified = true;
    await user.save();
  } else {
    // Create new (Client)
    user = await User.create({
      ...payload,
      email,
      verified: true
    });
  }

  await Verification.deleteOne({ _id: ver._id });

  const { password, ...safe } = user.toObject();
  res.json(safe);
});

app.post('/api/auth/cancel', async (req, res) => {
  const { email } = req.body;
  await Verification.deleteOne({ email: email.toLowerCase() });
  res.json({ success: true, message: 'Verification session canceled.' });
});

app.post('/api/auth/resend', async (req, res) => {
  const { email } = req.body;
  const ver = await Verification.findOne({ email: email.toLowerCase() });
  if (!ver) return res.status(404).json({ error: 'No active signup session found. Please try signing up again.' });

  const newToken = Math.floor(100000 + Math.random() * 900000).toString();
  ver.token = newToken;
  ver.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Reset for another 5 mins
  await ver.save();

  try {
    await sendMail(email, 'Verify your Account (Resend)',
      `Your new verification code is: ${newToken}`,
      `<h2>Your New Verification Code: ${newToken}</h2>`
    );
    res.json({ success: true, message: 'New OTP sent' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// OTP-based Email Update
app.post('/api/auth/update-email-request', async (req, res) => {
  const { userId, newEmail } = req.body;
  const lowerEmail = newEmail.toLowerCase();

  const existing = await User.findOne({ email: lowerEmail });
  if (existing) return res.status(400).json({ error: 'This email is already taken' });

  const verifyToken = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await sendMail(lowerEmail, 'Confirm your new email',
      `Your verification code to update your email is: ${verifyToken}`,
      `<h2>Verify your new email address</h2><p>Use the code below to complete the update:</p><h3>${verifyToken}</h3>`
    );

    await Verification.deleteMany({ email: lowerEmail });
    await Verification.create({
      email: lowerEmail,
      token: verifyToken,
      payload: { type: 'EMAIL_UPDATE', userId, newEmail: lowerEmail }
    });

    res.json({ success: true, message: 'OTP sent to new email' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/auth/update-email-confirm', async (req, res) => {
  const { token } = req.body;
  const ver = await Verification.findOne({ token });
  if (!ver || ver.payload?.type !== 'EMAIL_UPDATE') {
    return res.status(404).json({ error: 'Invalid or expired verification code' });
  }

  const { userId, newEmail } = ver.payload;
  const user = await User.findOne({ id: userId });
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.email = newEmail;
  await user.save();

  await Verification.deleteOne({ _id: ver._id });
  res.json({ success: true, message: 'Email updated successfully', email: newEmail });
});

app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.resetToken = Math.random().toString(36).substr(2, 12);
  user.resetExpires = Date.now() + 3600000;
  await user.save();

  // Send email logic...
  res.json({ success: true });
});

app.post('/api/auth/reset', async (req, res) => {
  const { token, newPassword } = req.body;
  // Note: Client might send 'password' or 'newPassword', check types.ts or previous implementation
  const pass = newPassword || req.body.password;

  const user = await User.findOne({
    resetToken: token,
    resetExpires: { $gt: Date.now() }
  });
  if (!user) return res.status(400).json({ error: 'Invalid or expired' });

  user.password = pass;
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();

  res.json({ success: true });
});

// Gemini
app.post('/api/genai/checklist', async (req, res) => {
  // ... keep existing logic, just wrapping in try-catch
  try {
    const { title = '', description = '' } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a practical 3-5 item checklist for a task titled "${title}". Description: "${description}"`,
      config: { responseMimeType: 'application/json' }
    });
    res.json({ items: JSON.parse(response.text || '[]') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/genai/summary', async (req, res) => {
  // ... similar logic
  try {
    const { tasks = [] } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const summaryPrompt = `Summarize: ${tasks.map(t => `${t.title} (${t.status})`).join(', ')}`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: summaryPrompt });
    res.json({ text: response.text });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

module.exports = app; // Export for Vercel

