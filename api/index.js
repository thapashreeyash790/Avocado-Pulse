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

// Create Models
const User = mongoose.model('User', userSchema);
const Client = mongoose.model('Client', clientSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

// Helper to get model by resource name
const getModel = (resource) => {
  switch (resource) {
    case 'users': return User;
    case 'clients': return Client;
    case 'projects': return Project;
    case 'tasks': return Task;
    case 'invoices': return Invoice;
    default: return null;
  }
};

// --- Connection Logic (Cached for Serverless) ---
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;

  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not defined. Database features will fail.');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/avocado-pm', {
      bufferCommands: false, // Fail fast if not connected
      serverSelectionTimeoutMS: 5000 // Timeout after 5s
    });
    isConnected = true;
    console.log('MongoDB connected');

    // Seed admin if no users exist
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('Seeding default admin...');
      const adminEmail = 'thapa.shreeyash790@gmail.com'.toLowerCase();
      await User.create({
        id: 'admin-001',
        name: 'Avocado Admin',
        email: adminEmail,
        password: 'helloworld1432',
        role: 'ADMIN',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminEmail}`,
        verified: true
      });
    }

  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  next();
});

// --- Email Helper ---
async function sendMail(to, subject, text, html) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    console.log('No SMTP configured — email preview:', { to, subject });
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE || 'false') === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  const from = process.env.EMAIL_FROM || `no-reply@${process.env.SMTP_HOST}`;
  await transporter.sendMail({ from, to, subject, text, html });
}

// --- Routes ---

// Get all
app.get('/api/:resource', async (req, res) => {
  const Model = getModel(req.params.resource);
  if (!Model) return res.status(404).json({ error: 'Resource not found' });
  const items = await Model.find({});
  res.json(items);
});

// Get one
app.get('/api/:resource/:id', async (req, res) => {
  const Model = getModel(req.params.resource);
  if (!Model) return res.status(404).json({ error: 'Resource not found' });
  const item = await Model.findOne({ id: req.params.id });
  if (!item) return res.status(404).json({ error: 'Not found' });
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
    if (existing) return res.status(409).json({ error: 'User already exists' });

    payload.verifyToken = Math.random().toString(36).substr(2, 9);
    payload.verified = false;

    // Send email
    try {
      const frontendHost = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`;
      const verifyUrl = `${frontendHost}#/verify?token=${payload.verifyToken}`;
      await sendMail(email, 'Verify your Avocado Project Manager account',
        `Verify here: ${verifyUrl}`,
        `<a href="${verifyUrl}">Verify Email</a>`
      );
    } catch (e) { console.error('Email failed', e); }

    const created = await User.create(payload);
    const { password, ...safe } = created.toObject();
    return res.status(201).json(safe);
  }

  // Client special logic
  if (resource === 'clients') {
    const clientEmail = (payload.email || '').toLowerCase();
    const existingUser = await User.findOne({ email: clientEmail });
    if (!existingUser && clientEmail) {
      const verifyToken = Math.random().toString(36).substr(2, 9);
      await User.create({
        id: Math.random().toString(36).substr(2, 9),
        name: payload.name,
        email: clientEmail,
        password: Math.random().toString(36).substr(2, 8),
        role: 'CLIENT',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${clientEmail}`,
        verified: false,
        verifyToken
      });
      // Send welcome email logic here...
    }
  }

  try {
    const created = await Model.create(payload);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update
app.put('/api/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  const Model = getModel(resource);
  if (!Model) return res.status(404).json({ error: 'Resource not found' });

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
  const user = await User.findOne({ verifyToken: token });
  if (!user) return res.status(404).json({ error: 'Invalid token' });

  user.verified = true;
  user.verifyToken = undefined;
  await user.save();

  const { password, ...safe } = user.toObject();
  res.json(safe);
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

