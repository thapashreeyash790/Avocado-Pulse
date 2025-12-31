const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');


const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const defaultData = { projects: [], tasks: [], invoices: [], clients: [], users: [] };
const db = new Low(adapter, defaultData);

async function init() {
  await db.read();
  if (!db.data) db.data = defaultData;
  await db.write();
}

init();

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
  db.data[resource].push(payload);
  await db.write();
  res.status(201).json(payload);
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
app.listen(PORT, () => {
  console.log(`Node ${process.version}`);
  console.log(`Avocado PM server running on http://localhost:${PORT}`);
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
