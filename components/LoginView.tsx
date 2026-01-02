import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';
import { ICONS } from '../constants';

const LoginView: React.FC = () => {
  const { login, signup, isLoading, error, verifyOTP } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.TEAM);

  // OTP State
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!isLogin && !name) || (!isVerifying && !password)) {
      // Allow empty password if verifying OTP (it's not used then)
      if (!isVerifying) return;
    }

    try {
      if (isVerifying) {
        await verifyOTP(otp);
        return;
      }

      if (isLogin) {
        await login(email, password);
      } else {
        const res = await signup(email, password, role, name);
        if (res && res.requiresOtp) {
          setIsVerifying(true);
          return;
        }
      }
    } catch (err) {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center transform rotate-3">
            <span className="text-3xl">🥑</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-center text-slate-900 mb-2">
          {isVerifying ? 'Verify Email' : (isLogin ? 'Welcome Back' : 'Create Account')}
        </h2>
        <p className="text-center text-slate-500 mb-8 text-sm font-medium">
          {isVerifying ? `Enter the code sent to ${email}` : (isLogin ? 'Enter your credentials to access your workspace' : 'Get started with Avocado PM today')}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email Field */}
          <div className={isVerifying ? 'opacity-50 pointer-events-none' : ''}>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="name@company.com"
            />
          </div>

          {/* OTP Input */}
          {isVerifying && (
            <div className="animate-in slide-in-from-right duration-300">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-white border-2 border-green-500 rounded-xl px-4 py-3 text-2xl font-black text-center text-green-600 tracking-widest focus:outline-none shadow-lg transform scale-105"
                placeholder="000000"
                autoFocus
                maxLength={6}
              />
            </div>
          )}

          {/* Name/Role/Password */}
          {!isVerifying && (
            <>
              {!isLogin && (
                <div className="animate-in slide-in-from-top duration-300">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="animate-in slide-in-from-top duration-300 delay-100">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setRole(UserRole.TEAM)} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${role === UserRole.TEAM ? 'bg-green-50 border-green-500 text-green-700 scale-105 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    Team Member
                  </button>
                  <button type="button" onClick={() => setRole(UserRole.CLIENT)} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${role === UserRole.CLIENT ? 'bg-blue-50 border-blue-500 text-blue-700 scale-105 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                    Client Access
                  </button>
                </div>
              )}
            </>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white rounded-xl py-4 font-bold text-sm hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isVerifying ? 'Verify Code' : (isLogin ? 'Sign In' : 'Create Account'))}
            </button>
          </div>
        </form>

        {!isVerifying && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-slate-400 hover:text-green-600 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        )}

        {isVerifying && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsVerifying(false)}
              className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors"
            >
              Cancel Verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginView;