
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
import LeadsView from './components/LeadsView';
import SupportView from './components/SupportView';
import MyStuffView from './components/MyStuffView';
import LandingPage from './components/LandingPage';
import CMSDashboard from './components/CMSDashboard';
import DynamicLandingPage from './components/DynamicLandingPage';
import CMSPreview from './components/CMSPreview';
import { AppProvider, useApp } from './store/AppContext';
import { ICONS } from './constants';
import { UserRole } from './types';

const AuthenticatedApp: React.FC = () => {
  const { user } = useApp();

  if (typeof user === 'undefined') {
    return <div style={{ color: 'red', padding: 20 }}>Critical error: user is undefined. Please check AppContext and localStorage. <br />Try clearing browser storage and reloading.</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <Layout>
      <Routes>
        <Route index element={<DashboardView />} />
        <Route path="board" element={<KanbanBoard />} />
        <Route path="mystuff" element={<MyStuffView />} />
        <Route path="timeline" element={<TimelineView />} />
        <Route path="management" element={<ManagementView />} />
        <Route path="sales" element={<SalesView />} />
        <Route path="chat" element={<ChatView />} />
        <Route path="docs" element={<DocsView />} />
        <Route path="leads" element={<LeadsView />} />
        <Route path="support" element={<SupportView />} />
        {isAdmin && <Route path="cms" element={<CMSDashboard />} />}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Layout>
  );
};

const AppRoutes: React.FC = () => {
  const { user } = useApp();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <DynamicLandingPage />} />
      <Route path="/preview" element={<CMSPreview />} />
      <Route path="/p/:slug" element={<DynamicLandingPage />} />
      <Route path="/login" element={<LoginView initialIsLogin={true} />} />
      <Route path="/signup" element={<LoginView initialIsLogin={false} />} />
      <Route path="/verify" element={<VerifyEmailView />} />
      <Route path="/reset-request" element={<ResetRequestView />} />
      <Route path="/reset" element={<ResetPasswordView />} />
      <Route path="/app/*" element={<AuthenticatedApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
