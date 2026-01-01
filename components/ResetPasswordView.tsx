import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function useQuery() { return new URLSearchParams(useLocation().search); }

const ResetPasswordView: React.FC = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.resetPassword(token, password);
      setStatus('success');
      setTimeout(() => navigate('#/'), 1200);
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => { if (!token) setStatus('error'); }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
        {status === 'success' ? (
          <>
            <h2 className="text-2xl font-bold">Password reset</h2>
            <p className="mt-2 text-sm text-slate-600">Your password was updated. You can now sign in.</p>
            <div className="mt-4"><Link to="#/" className="text-emerald-600 font-bold">Back to login</Link></div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold">Choose a new password</h2>
            <input required minLength={6} type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            <button type="submit" disabled={status === 'loading'} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">{status === 'loading' ? 'Updating...' : 'Update password'}</button>
            {status === 'error' && <div className="text-sm text-red-500">Failed to reset password. Token may be invalid or expired.</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordView;
