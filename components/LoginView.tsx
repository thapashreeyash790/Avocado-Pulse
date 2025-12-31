import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';
import { ICONS } from '../constants';

type LoginMode = 'LOGIN' | 'SIGNUP';

const LoginView: React.FC = () => {
  const { login, signup, isLoading, error } = useApp();
  const [mode, setMode] = useState<LoginMode>('LOGIN');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: UserRole.TEAM
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'SIGNUP') {
        await signup(formData.email, formData.password, formData.role, formData.name);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50 via-white to-slate-50">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 md:p-10 border border-white relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-200">
            <ICONS.CheckCircle2 className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Avocado Project manager</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Transparent Project Management</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button onClick={() => setMode('LOGIN')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'LOGIN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Login</button>
          <button onClick={() => setMode('SIGNUP')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'SIGNUP' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Signup</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
              <input required type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <input required type="email" placeholder="name@company.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <input required type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Register As</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                <option value={UserRole.TEAM}>Internal Team</option>
                <option value={UserRole.CLIENT}>Client / Stakeholder</option>
                <option value={UserRole.ADMIN}>Administrator</option>
              </select>
            </div>
          )}
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all mt-4 active:scale-95 disabled:opacity-50">
            {isLoading ? 'Processing...' : (mode === 'SIGNUP' ? 'Join Avocado Project manager' : 'Access Workspace')}
          </button>
        </form>
        {error && <p className="mt-4 text-xs text-red-500 font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
      </div>
    </div>
  );
};

export default LoginView;