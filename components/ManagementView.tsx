
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { UserRole } from '../types';

const ManagementView: React.FC = () => {
  const { projects, clients, addProject, addClient, inviteTeamMember, user } = useApp();
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const isInternal = user?.role === UserRole.TEAM || user?.role === UserRole.ADMIN;

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-black tracking-tight">Workspace Management</h2>
          <p className="text-gray-500 font-medium">Link clients to projects and monitor workspace capacity</p>
        </div>
        {isInternal && (
          <div className="flex gap-3">
            {/* Only Admins can invite team (for now let all Team do it? Requirement said "Admin") */}
            {user?.role === UserRole.ADMIN && (
              <button onClick={() => setShowInviteModal(true)} className="px-5 py-2.5 bg-slate-800 text-white border border-slate-800 rounded-xl font-bold text-sm hover:bg-slate-900 transition-all shadow-sm">Invite Team</button>
            )}
            <button onClick={() => setShowClientModal(true)} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-black hover:bg-gray-50 transition-all shadow-sm">Add Client</button>
            <button onClick={() => setShowProjectModal(true)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg">New Project</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-black flex items-center gap-2">Active Projects</h3>
          </div>
          <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {projects.map(p => (
              <div key={p.id} className="p-6 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <h4 className="font-bold text-black">{p.name}</h4>
                  <p className="text-xs text-gray-500">Client: {p.clientId}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-black">{p.currency} {p.budget.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-black flex items-center gap-2">Client Directory</h3>
          </div>
          <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {clients.map(c => (
              <div key={c.id} className="p-6 flex items-center gap-4 hover:bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">{c.name.charAt(0)}</div>
                <div>
                  <h4 className="font-bold text-black">{c.name}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{c.company} • {c.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showClientModal && <ClientModal onClose={() => setShowClientModal(false)} onSave={addClient} />}
      {showProjectModal && <ProjectModal clients={clients} onClose={() => setShowProjectModal(false)} onSave={addProject} />}
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} onSave={inviteTeamMember} />}
    </div>
  );
};

const InviteModal = ({ onClose, onSave }: any) => {
  const [data, setData] = useState({ name: '', email: '' });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-2xl font-black mb-6 text-black">Invite Team Member</h3>
        <p className="text-sm text-gray-500 mb-6">They will receive an email to join the workspace.</p>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
            <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-green-500" placeholder="Alex Smith" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
            <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-green-500" placeholder="alex@flowtrack.co" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-6">
            <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Cancel</button>
            <button onClick={() => { onSave(data.name, data.email); onClose(); }} className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm">Send Invite</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientModal = ({ onClose, onSave }: any) => {
  const [data, setData] = useState({ name: '', email: '', company: '' });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-2xl font-black mb-6 text-black">New Client Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
            <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Jane Doe" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
            <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-green-500" placeholder="jane@company.com" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Company</label>
            <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-green-500" placeholder="Acme Inc" value={data.company} onChange={e => setData({ ...data, company: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-6">
            <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Cancel</button>
            <button onClick={() => { onSave(data); onClose(); }} className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm">Add Client</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectModal = ({ clients, onClose, onSave }: any) => {
  const [data, setData] = useState({ name: '', clientId: '', budget: 1000, currency: 'NPR', startDate: '', endDate: '' });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold text-black mb-6">Assign Project</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Project Title</label>
            <input className="w-full p-4 bg-white text-black border border-slate-200 rounded-2xl font-bold text-sm" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Link Client</label>
            <select className="w-full p-4 bg-white text-black border border-slate-200 rounded-2xl font-bold text-sm" value={data.clientId} onChange={e => setData({ ...data, clientId: e.target.value })}>
              <option value="">Select Client...</option>
              {clients.map((c: any) => <option key={c.id} value={c.email}>{c.name} ({c.company})</option>)}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Budget</label>
              <input type="number" className="w-full p-4 bg-white text-black border border-slate-200 rounded-2xl font-bold text-sm" value={data.budget} onChange={e => setData({ ...data, budget: Number(e.target.value) })} />
            </div>
            <div className="w-32">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Curr</label>
              <select className="w-full p-4 bg-white text-black border border-slate-200 rounded-2xl font-bold text-sm" value={data.currency} onChange={e => setData({ ...data, currency: e.target.value })}>
                <option value="NPR">NPR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-6">
            <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancel</button>
            <button onClick={() => { onSave(data); onClose(); }} disabled={!data.name} className={`flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold text-sm ${!data.name ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}>Create Project</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementView;
