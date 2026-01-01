import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const VerifyEmailView: React.FC = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  useEffect(() => {
    if (!token) return setStatus('error');
    setStatus('loading');
    api.verifyEmail(token).then(() => setStatus('success')).catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
        {status === 'loading' && <p className="font-semibold">Verifying your email...</p>}
        {status === 'success' && <>
          <h2 className="text-2xl font-bold">Email Verified</h2>
          <p className="mt-2 text-sm text-slate-600">You can now return to the app and sign in.</p>
          <div className="mt-6"><Link to="#/" className="text-emerald-600 font-bold">Go to Login</Link></div>
        </>}
        {status === 'error' && <>
          <h2 className="text-xl font-bold text-red-600">Verification Failed</h2>
          <p className="mt-2 text-sm text-slate-600">The token may be invalid or expired.</p>
          <div className="mt-4"><Link to="#/" className="text-emerald-600 font-bold">Back to Login</Link></div>
        </>}
      </div>
    </div>
  );
};

export default VerifyEmailView;
