
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import KanbanBoard from './components/KanbanBoard';
import DashboardView from './components/DashboardView';
import TimelineView from './components/TimelineView';
import ManagementView from './components/ManagementView';
import SalesView from './components/SalesView';
import LoginView from './components/LoginView';
import VerifyEmailView from './components/VerifyEmailView';
import ResetRequestView from './components/ResetRequestView';
import ResetPasswordView from './components/ResetPasswordView';
import ChatView from './components/ChatView';
import DocsView from './components/DocsView';
import MyStuffView from './components/MyStuffView';
import { AppProvider, useApp } from './store/AppContext';
import { ICONS } from './constants';

const AuthenticatedApp: React.FC = () => {

  const { user } = useApp();
  console.log('[AuthenticatedApp] user:', user, typeof user);
  if (typeof user === 'undefined') {
    return <div style={{ color: 'red', padding: 20 }}>Critical error: user is undefined. Please check AppContext and localStorage. <br />Try clearing browser storage and reloading.</div>;
  }
  if (!user) {
    return <LoginView />;
  }


  return (
    <Layout>
      <Routes>
        <Route index element={<DashboardView />} />
        <Route path="board" element={<KanbanBoard />} />
        <Route path="timeline" element={<TimelineView />} />
        <Route path="management" element={<ManagementView />} />
        <Route path="sales" element={<SalesView />} />
        <Route path="chat" element={<ChatView />} />
        <Route path="docs" element={<DocsView />} />
        <Route path="mystuff" element={<MyStuffView />} />
        <Route path="team" element={
          <div className="p-8 flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ICONS.Users className="w-8 h-8 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Team Directory</h2>
              <p className="text-slate-500 text-sm mt-2">Manage workspace members and permissions. Feature fully active in management tab.</p>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/verify" element={<VerifyEmailView />} />
          <Route path="/reset-request" element={<ResetRequestView />} />
          <Route path="/reset" element={<ResetPasswordView />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
