const express = require('express');
const cors = require('cors');
let db;
let JSONFile;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');
const nodemailer = require('nodemailer');


async function loadLow() {
  try {
    // Try CommonJS require first (works if lowdb exposes CJS)
    // eslint-disable-next-line global-require
    const mod = require('lowdb');
    if (mod && mod.Low) return mod.Low;
  } catch (e) {
    // ignore and try dynamic import
  }
  const mod = await import('lowdb');
  return mod.Low;
}

async function init() {
  const Low = await loadLow();
  // dynamically import JSONFile (some lowdb distributions expose this as ESM)
  const nodeMod = await import('lowdb/node');
  JSONFile = nodeMod.JSONFile;
  const file = path.join(__dirname, 'db.json');
  const adapter = new JSONFile(file);
  const defaultData = { projects: [], tasks: [], invoices: [], clients: [], users: [] };
  db = new Low(adapter, defaultData);
  await db.read();
  if (!db.data) db.data = defaultData;
  await db.write();
}

// Simple mail helper: uses SMTP if configured, otherwise logs to console
async function sendMail(to, subject, text, html) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    console.log('No SMTP configured — email preview:');
    console.log({ to, subject, text, html });
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


// Generic helpers
app.get('/api/:resource', async (req, res) => {
  const { resource } = req.params;
  await db.read();
  const data = db.data[resource];
  if (!Array.isArray(data)) return res.status(404).json({ error: 'Resource not found' });
  res.json(data);
});

app.get('/api/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  await db.read();
  const item = (db.data[resource] || []).find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/:resource', async (req, res) => {
  const { resource } = req.params;
  const payload = req.body;
  await db.read();
  if (!Array.isArray(db.data[resource])) return res.status(404).json({ error: 'Resource not found' });
  // Ensure id
  if (!payload.id) payload.id = (Date.now() + Math.floor(Math.random() * 10000)).toString();

  // Special-case users: attach verification token and send email
  if (resource === 'users') {
    const email = (payload.email || '').toLowerCase();
    const existing = (db.data.users || []).find(u => (u.email || '').toLowerCase() === email);
    if (existing) return res.status(409).json({ error: 'User already exists' });
    const verifyToken = Math.random().toString(36).substr(2, 9);
    payload.verified = false;
    payload.verifyToken = verifyToken;
    payload.createdAt = new Date().toISOString();
    db.data[resource].push(payload);
    await db.write();
    try {
      const frontendHost = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`;
      const verifyUrl = `${frontendHost}#/verify?token=${verifyToken}`;
      const subject = 'Verify your Avocado Project Manager account';
      const text = `Hi ${payload.name || ''},\n\nPlease verify your email by visiting: ${verifyUrl}`;
      const html = `<p>Hi ${payload.name || ''},</p><p>Please verify your email by clicking <a href="${verifyUrl}">here</a>.</p>`;
      await sendMail(payload.email, subject, text, html);
    } catch (err) {
      console.error('Failed to send verify email', err);
    }
    const safe = { ...payload };
    delete safe.password;
    return res.status(201).json(safe);
  }

  db.data[resource].push(payload);
  await db.write();
  res.status(201).json(payload);
});

// Email verification endpoint
app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  await db.read();
  const user = (db.data.users || []).find(u => u.verifyToken === token);
  if (!user) return res.status(404).json({ error: 'Invalid token' });
  user.verified = true;
  delete user.verifyToken;
  await db.write();
  const safe = { ...user };
  delete safe.password;
  res.json(safe);
});

// Request password reset
app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  await db.read();
  const user = (db.data.users || []).find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });
  const resetToken = Math.random().toString(36).substr(2, 12);
  const expires = Date.now() + 3600000; // 1 hour
  user.resetToken = resetToken;
  user.resetExpires = expires;
  await db.write();
  try {
    const frontendHost = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`;
    const resetUrl = `${frontendHost}#/reset?token=${resetToken}`;
    const subject = 'Reset your Avocado Project Manager password';
    const text = `To reset your password, visit: ${resetUrl}`;
    const html = `<p>To reset your password, click <a href="${resetUrl}">here</a>.</p>`;
    await sendMail(user.email, subject, text, html);
  } catch (err) {
    console.error('Failed to send reset email', err);
  }
  res.json({ success: true });
});

// Perform password reset
app.post('/api/auth/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Missing token or password' });
  await db.read();
  const user = (db.data.users || []).find(u => u.resetToken === token && u.resetExpires && u.resetExpires > Date.now());
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
  user.password = password;
  delete user.resetToken;
  delete user.resetExpires;
  await db.write();
  res.json({ success: true });
});

app.put('/api/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  const payload = req.body;
  await db.read();
  const list = db.data[resource];
  if (!Array.isArray(list)) return res.status(404).json({ error: 'Resource not found' });
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.data[resource][idx] = { ...db.data[resource][idx], ...payload };
  await db.write();
  res.json(db.data[resource][idx]);
});

app.delete('/api/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  await db.read();
  const list = db.data[resource];
  if (!Array.isArray(list)) return res.status(404).json({ error: 'Resource not found' });
  db.data[resource] = list.filter(i => i.id !== id);
  await db.write();
  res.status(204).end();
});

const PORT = process.env.PORT || 4000;
// start server after DB init completes
init().then(() => {
  app.listen(PORT, () => {
    console.log(`Node ${process.version}`);
    console.log(`Avocado PM server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});

// Server-side Gemini proxy endpoints
app.post('/api/genai/checklist', async (req, res) => {
  try {
    const { title = '', description = '' } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a practical 3-5 item checklist for a task titled "${title}". Description: "${description}"`,
      config: {
        responseMimeType: 'application/json'
      }
    });
    // return raw text under items for the client
    res.json({ items: JSON.parse(response.text || '[]') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI error' });
  }
});

app.post('/api/genai/summary', async (req, res) => {
  try {
    const { tasks = [] } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
    const summaryPrompt = `Summarize the overall progress for a client based on these tasks: ${tasks.map(t => `${t.title} (${t.status})`).join(', ')}. Keep it professional and encouraging.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: summaryPrompt });
    res.json({ text: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI error' });
  }
});
