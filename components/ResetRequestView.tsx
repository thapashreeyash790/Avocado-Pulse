import React, { useState } from 'react';
import { api } from '../services/api';

const ResetRequestView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sent'|'error'|'loading'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.requestPasswordReset(email);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
        <p className="text-sm text-slate-500 mb-6">Enter your account email and we'll send a reset link.</p>
        {status === 'sent' ? (
          <div className="text-sm text-green-600 font-bold">If the email exists, a reset link has been sent.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            <button type="submit" disabled={status === 'loading'} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">{status === 'loading' ? 'Sending...' : 'Send reset link'}</button>
            {status === 'error' && <div className="text-sm text-red-500">Failed to send reset email.</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetRequestView;
