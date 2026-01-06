
import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { UserRole, CustomFieldDefinition, WorkspaceSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const ManagementView: React.FC = () => {
  const {
    projects, clients, team, addProject, addClient, inviteTeamMember, removeTeamMember,
    user, updateUser, requestEmailUpdate, confirmEmailUpdate, archiveProject,
    settings, updateSettings, leads, invoices
  } = useApp();

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const [activeTab, setActiveTab] = useState<'resources' | 'customization' | 'reports'>('resources');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);

  const isInternal = user && (user.role === UserRole.ADMIN || user.role !== UserRole.CLIENT);
  const isAdmin = user?.role === UserRole.ADMIN;

  // Report Data
  const leadData = [
    { name: 'New', value: leads.filter(l => l.status === 'NEW').length },
    { name: 'Qualified', value: leads.filter(l => l.status === 'QUALIFIED' || l.status === 'PROPOSAL').length },
    { name: 'Converted', value: leads.filter(l => l.status === 'CONVERTED').length },
    { name: 'Lost', value: leads.filter(l => l.status === 'LOST').length },
  ];

  const financialData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const dataByMonth = months.map(m => ({
      name: m,
      revenue: invoices.filter(inv => inv.status === 'PAID' && new Date(inv.date).getFullYear() === currentYear && new Date(inv.date).toLocaleString('default', { month: 'short' }) === m).reduce((s, i) => s + i.paidAmount, 0),
      invoiced: invoices.filter(inv => new Date(inv.date).getFullYear() === currentYear && new Date(inv.date).toLocaleString('default', { month: 'short' }) === m).reduce((s, i) => s + i.amount, 0)
    }));

    return dataByMonth;
  }, [invoices]);

  const revenueData = financialData;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-black tracking-tight">{settings?.companyName || 'Workspace'} Management</h2>
          <p className="text-gray-500 font-medium whitespace-nowrap">Configure your workspace, manage people, and view performance</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button onClick={() => setActiveTab('resources')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === 'resources' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Directory</button>
          {isAdmin && <button onClick={() => setActiveTab('customization')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === 'customization' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Workspace</button>}
          <button onClick={() => setActiveTab('reports')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Analytics</button>
        </div>
      </div>

      {activeTab === 'resources' && (
        <>
          <div className="flex justify-end gap-3">
            {isAdmin && <button onClick={() => setShowInviteModal(true)} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 shadow-sm">Invite Team</button>}
            <button onClick={() => setShowClientModal(true)} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-black hover:bg-gray-50 shadow-sm">Add Client</button>
            <button onClick={() => setShowProjectModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg">New Project</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Projects */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-black">Active Projects</h3>
                <button onClick={() => setShowArchived(!showArchived)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{showArchived ? 'Hide Archived' : 'Show Archived'}</button>
              </div>
              <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                {projects.filter(p => showArchived || p.status !== 'ARCHIVED').map(p => (
                  <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-sm text-black">{p.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium">Budget: {p.currency} {p.budget.toLocaleString()}</p>
                    </div>
                    {p.status !== 'ARCHIVED' && (
                      <button onClick={() => archiveProject(p.id)} className="p-2 text-slate-300 hover:text-amber-500"><ICONS.Archive className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Clients */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center"><h3 className="font-bold text-black">Clients</h3></div>
              <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                {clients.map(c => (
                  <div key={c.id} className="p-4 flex items-center gap-3 hover:bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs font-bold">{c.name.charAt(0)}</div>
                    <div>
                      <h4 className="font-bold text-sm text-black">{c.name}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{c.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
              <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center"><h3 className="font-bold text-black">Team Directory</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-gray-50 border-t">
                {team.map(m => (
                  <div key={m.id} className="p-6 flex items-center justify-between group hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <img src={m.avatar} className="w-10 h-10 rounded-xl" alt="" />
                      <div>
                        <h4 className="text-sm font-bold text-black">{m.name}</h4>
                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-tighter">{m.role}</span>
                      </div>
                    </div>
                    {isAdmin && <button onClick={() => setEditingUser(m)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-indigo-600"><ICONS.Settings className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'customization' && isAdmin && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
          {/* Branding Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-black mb-6">Workspace Branding</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Company Name</label>
                  <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" value={settings.companyName} onChange={e => updateSettings({ companyName: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Support Email</label>
                  <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" value={settings.supportEmail} onChange={e => updateSettings({ supportEmail: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Theme Color</label>
                  <div className="flex gap-2">
                    {['indigo-600', 'emerald-600', 'rose-600', 'amber-600', 'slate-900'].map(color => (
                      <button
                        key={color}
                        onClick={() => updateSettings({ primaryColor: color })}
                        className={`w-8 h-8 rounded-full border-2 ${settings.primaryColor === color ? 'border-black' : 'border-transparent'} bg-current text-${color.includes('900') ? 'slate-900' : color}`}
                        style={{ backgroundColor: color === 'indigo-600' ? '#4f46e5' : color === 'emerald-600' ? '#059669' : color === 'rose-600' ? '#e11d48' : color === 'amber-600' ? '#d97706' : '#0f172a' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-fit">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-black">Custom Dynamic Fields</h3>
              <button onClick={() => setShowFieldModal(true)} className="text-xs font-bold text-indigo-600 hover:underline">+ New Field Definition</button>
            </div>
            <div className="space-y-4">
              {settings.customFieldDefinitions.length > 0 ? settings.customFieldDefinitions.map(field => (
                <div key={field.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-black">{field.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{field.resource} • {field.type}</p>
                  </div>
                  <button className="text-red-400 hover:text-red-600" onClick={() => {
                    const next = settings.customFieldDefinitions.filter(f => f.id !== field.id);
                    updateSettings({ customFieldDefinitions: next });
                  }}><ICONS.Plus className="w-4 h-4 rotate-45" /></button>
                </div>
              )) : <p className="text-sm text-gray-400 italic text-center py-10">Define custom fields for leads, projects, or tasks here.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          {/* Export Controls */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => exportToCSV(projects, 'projects_report')}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50"
            >
              <ICONS.Plus className="w-3 h-3 rotate-45" /> Export Projects
            </button>
            <button
              onClick={() => exportToCSV(invoices, 'financial_report')}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50"
            >
              <ICONS.Plus className="w-3 h-3 rotate-45" /> Export Invoices
            </button>
          </div>

          {/* Reporting Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="font-bold text-black mb-8 flex items-center gap-2"><ICONS.TrendingUp className="w-4 h-4 text-emerald-500" /> Revenue Growth (6m)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="invoiced" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="font-bold text-black mb-8 flex items-center gap-2"><ICONS.Users className="w-4 h-4 text-indigo-500" /> Lead Pipeline Health</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {leadData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#fbbf24', '#10b981', '#ef4444'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4">
                  {leadData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#fbbf24', '#10b981', '#ef4444'][i] }}></span>
                      {d.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClientModal && <ClientModal onClose={() => setShowClientModal(false)} onSave={addClient} />}
      {showProjectModal && <ProjectModal clients={clients} onClose={() => setShowProjectModal(false)} onSave={addProject} />}
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} onSave={async (n: string, e: string, r: string, p: any) => {
        const link = await inviteTeamMember(n, e, r, p);
        if (link) setInviteLink(link);
      }} />}
      {inviteLink && <InviteLinkModal link={inviteLink} onClose={() => setInviteLink(null)} />}
      {editingUser && <ProfileEditModal user={editingUser} currentUser={user} onClose={() => setEditingUser(null)} onSave={updateUser} onRequestEmailUpdate={requestEmailUpdate} onConfirmEmailUpdate={confirmEmailUpdate} />}
      {showFieldModal && (
        <CustomFieldForm
          onClose={() => setShowFieldModal(false)}
          onSubmit={(field) => {
            const next = [...(settings?.customFieldDefinitions || []), { ...field, id: Math.random().toString(36).slice(2) }];
            updateSettings({ customFieldDefinitions: next });
          }}
        />
      )}
    </div>
  );
};

// ... (ClientModal, ProjectModal, InviteModal, ProfileEditModal same as before or slightly refined)
// I will reuse the existing Modals code from previous file but condensed for brevity if needed.
// RESTORING MODALS BELOW...

const CustomFieldForm = ({ onClose, onSubmit }: any) => {
  const [form, setForm] = useState<Partial<CustomFieldDefinition>>({ name: '', resource: 'TASK', type: 'TEXT', required: false });
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); onClose(); }} className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-2xl font-black mb-6 text-black">New Custom Field</h3>
        <div className="space-y-4">
          <input required placeholder="Field Name (e.g. Serial Number)" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold" value={form.resource} onChange={e => setForm({ ...form, resource: e.target.value as any })}>
              <option value="TASK">Tasks</option>
              <option value="PROJECT">Projects</option>
              <option value="LEAD">Leads</option>
              <option value="CLIENT">Clients</option>
            </select>
            <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
              <option value="TEXT">Text</option>
              <option value="NUMBER">Number</option>
              <option value="DATE">Date</option>
              <option value="SELECT">Dropdown</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-sm font-bold text-gray-500 uppercase">Discard</button>
          <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase">Create Field</button>
        </div>
      </form>
    </div>
  );
};

// Re-including these from the original file to maintain functionality
const InviteModal = ({ onClose, onSave }: any) => {
  const [data, setData] = useState({ name: '', email: '', role: UserRole.TEAM, permissions: { billing: true, projects: true, timeline: true, management: false, messages: true, docs: true } });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-2xl font-black mb-6 text-black">Invite Team Member</h3>
        <div className="space-y-4">
          <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black" placeholder="Full Name" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
          <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black" placeholder="Email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} />
          <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black" value={data.role} onChange={e => setData({ ...data, role: e.target.value as UserRole })}>
            <option value={UserRole.TEAM}>Team Member</option>
            <option value={UserRole.ADMIN}>Administrator</option>
          </select>
          <div className="flex gap-3 pt-6">
            <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Cancel</button>
            <button onClick={() => { onSave(data.name, data.email, data.role, data.permissions); onClose(); }} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm">Invite</button>
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
        <h3 className="text-xl font-bold mb-6 text-black">New Client</h3>
        <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-4" placeholder="Name" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
        <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-4" placeholder="Email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} />
        <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-6" placeholder="Company" value={data.company} onChange={e => setData({ ...data, company: e.target.value })} />
        <button onClick={() => { onSave(data); onClose(); }} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">Create Profile</button>
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
        <h3 className="text-xl font-bold mb-6 text-black">New Project</h3>
        <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-4" placeholder="Title" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
        <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-4" value={data.clientId} onChange={e => setData({ ...data, clientId: e.target.value })}>
          <option value="">Select Client...</option>
          {clients.map((c: any) => <option key={c.id} value={c.email}>{c.name}</option>)}
        </select>
        <div className="flex gap-4 mb-6">
          <input type="number" className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={data.budget} onChange={e => setData({ ...data, budget: Number(e.target.value) })} />
          <select className="w-32 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={data.currency} onChange={e => setData({ ...data, currency: e.target.value })}>
            <option value="NPR">NPR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <button onClick={() => { onSave(data); onClose(); }} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">Assign Project</button>
      </div>
    </div>
  );
};

const ProfileEditModal = ({ user, currentUser, onClose, onSave, onRequestEmailUpdate, onConfirmEmailUpdate }: any) => {
  const [data, setData] = useState({ name: user.name, email: user.email, role: user.role });
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-xl font-bold mb-6 text-black">Edit {user.name}</h3>
        <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-4" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
        <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-6" value={data.email} readOnly={currentUser.role !== UserRole.ADMIN} onChange={e => setData({ ...data, email: e.target.value })} />
        <button onClick={() => { onSave(user.id, data); onClose(); }} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold">Update Profile</button>
      </div>
    </div>
  );
}

const InviteLinkModal = ({ link, onClose }: any) => {
  const copy = () => {
    navigator.clipboard.writeText(link);
    alert('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-black mb-4 text-black">Invitation Link</h3>
        <p className="text-sm text-gray-500 mb-4">Email delivery failed. Please copy this link and send it manually.</p>
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl mb-6 break-all text-xs font-mono text-gray-600">
          {link}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Close</button>
          <button onClick={copy} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm">Copy Link</button>
        </div>
      </div>
    </div>
  );
};

export default ManagementView;
