
import { Task } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch { return null; }
}

export async function generateTaskChecklist(title: string, description: string) {
  if (!API_BASE) {
    // no backend configured — return a safe fallback
    return [{ text: 'Break down this task into sub-steps' }];
  }
  try {
    const res = await fetch(`${API_BASE}/api/genai/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    if (!res.ok) return [{ text: 'Break down this task into sub-steps' }];
    const json = await safeJson(res);
    if (!json || !json.items) return [{ text: 'Break down this task into sub-steps' }];
    return json.items;
  } catch (err) {
    console.error('Gemini proxy error', err);
    return [{ text: 'Break down this task into sub-steps' }];
  }
}

export async function summarizeProjectProgress(tasks: Task[]) {
  if (!API_BASE) {
    return 'Project is moving along as planned. Check the board for specific task updates.';
  }
  try {
    const res = await fetch(`${API_BASE}/api/genai/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks })
    });
    if (!res.ok) return 'Progress summary unavailable at this time.';
    const json = await safeJson(res);
    return (json && json.text) || 'Progress summary unavailable at this time.';
  } catch (err) {
    console.error('Gemini proxy error', err);
    return 'Progress summary unavailable at this time.';
  }
}
