
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { UserRole } from '../types';

const ManagementView: React.FC = () => {
  const { projects, clients, team, addProject, addClient, inviteTeamMember, removeTeamMember, user, updateUser, requestEmailUpdate, confirmEmailUpdate } = useApp();
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const isInternal = user && (user.role === UserRole.ADMIN || user.role !== UserRole.CLIENT);

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-black tracking-tight">Workspace Management</h2>
          <p className="text-gray-500 font-medium">Link clients to projects and monitor workspace capacity</p>
        </div>
        {isInternal && (
          <div className="flex gap-3">
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

        {/* Team Directory Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
          <div className="p-6 border-b bg-gray-100/50 flex justify-between items-center">
            <h3 className="font-bold text-black flex items-center gap-2">Team Directory</h3>
            <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full border border-gray-200 text-gray-400 uppercase">{team.length} Members</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-gray-100 border-t">
            {team.map(m => (
              <div key={m.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.email}`} className="w-12 h-12 rounded-2xl bg-gray-100" alt={m.name} />
                  <div>
                    <h4 className="font-bold text-black text-sm">{m.name} {m.id === user?.id && <span className="text-emerald-500 text-[10px] ml-1">(You)</span>}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${m.role === UserRole.ADMIN ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                        {m.role}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">{m.email}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(user?.role === UserRole.ADMIN || user?.id === m.id) && (
                    <button
                      onClick={() => setEditingUser(m)}
                      className="p-2 hover:bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all"
                      title="Edit Profile"
                    >
                      <ICONS.Settings className="w-4 h-4" />
                    </button>
                  )}
                  {user?.role === UserRole.ADMIN && user?.id !== m.id && (
                    <button
                      onClick={() => removeTeamMember(m.id)}
                      className="p-2 hover:bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 transition-all"
                      title="Remove Member"
                    >
                      <ICONS.Trello className="w-4 h-4" /> {/* Should be Trash or CircleX, using Trello as placeholder */}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {team.length === 0 && (
              <div className="col-span-full p-12 text-center text-gray-400 font-bold italic">No team members joined yet.</div>
            )}
          </div>
        </div>
      </div>

      {showClientModal && <ClientModal onClose={() => setShowClientModal(false)} onSave={addClient} />}
      {showProjectModal && <ProjectModal clients={clients} onClose={() => setShowProjectModal(false)} onSave={addProject} />}
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} onSave={inviteTeamMember} />}
      {editingUser && (
        <ProfileEditModal
          user={editingUser}
          currentUser={user}
          onClose={() => setEditingUser(null)}
          onSave={updateUser}
          onRequestEmailUpdate={requestEmailUpdate}
          onConfirmEmailUpdate={confirmEmailUpdate}
        />
      )}
    </div>
  );
};

const InviteModal = ({ onClose, onSave }: any) => {
  const [data, setData] = useState({
    name: '',
    email: '',
    role: UserRole.TEAM,
    permissions: { billing: true, projects: true, timeline: true, management: false }
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-2xl font-black mb-6 text-black">Invite Team Member</h3>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
            <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-green-500" placeholder="Alex Smith" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</label>
            <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-green-500" placeholder="alex@flowtrack.co" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Base Access</label>
            <select
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black focus:ring-2 focus:ring-green-500 outline-none"
              value={data.role}
              onChange={e => setData({ ...data, role: e.target.value as UserRole })}
            >
              <option value={UserRole.TEAM}>Team Member</option>
              <option value={UserRole.ADMIN}>Administrator</option>
            </select>
          </div>

          {data.role !== UserRole.ADMIN && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Module Access</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.permissions).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors capitalize">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={val}
                      onChange={(e) => setData({ ...data, permissions: { ...data.permissions, [key]: e.target.checked } })}
                    />
                    <span className="text-xs font-bold text-slate-700">{key}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 sticky bottom-0 bg-white">
            <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Cancel</button>
            <button onClick={() => { onSave(data.name, data.email, data.role, data.permissions); onClose(); }} className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm transition-all hover:bg-green-700 shadow-lg shadow-green-100">Send Invite</button>
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

const ProfileEditModal = ({ user, currentUser, onClose, onSave, onRequestEmailUpdate, onConfirmEmailUpdate }: any) => {
  const { projects } = useApp();
  const [data, setData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    accessibleProjects: user.accessibleProjects || [],
    permissions: user.permissions || { billing: true, projects: true, timeline: true, management: false }
  });
  const [otp, setOtp] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isSelf = currentUser?.id === user.id;

  const handleSave = async () => {
    // If email changed and is self, need OTP
    if (isSelf && data.email !== user.email && !isVerifyingEmail) {
      await onRequestEmailUpdate(data.email);
      setIsVerifyingEmail(true);
      return;
    }

    // Direct save for name/role (or admin saving email)
    const payload: any = {
      name: data.name,
      role: data.role,
      accessibleProjects: data.accessibleProjects,
      permissions: data.permissions
    };
    if (isAdmin) payload.email = data.email;

    await onSave(user.id, payload);
    onClose();
  };

  const handleVerifyOtp = async () => {
    await onConfirmEmailUpdate(otp);
    // After email confirm, save other fields
    await onSave(user.id, {
      name: data.name,
      role: data.role,
      accessibleProjects: data.accessibleProjects,
      permissions: data.permissions
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-black mb-1 text-black">Edit Profile</h3>
        <p className="text-sm text-gray-500 mb-6">{isSelf ? "Update your personal information" : `Managing ${user.name}'s account`}</p>

        <div className="space-y-4">
          {!isVerifyingEmail ? (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-emerald-500" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    className={`w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-emerald-500 ${!isAdmin && !isSelf ? 'opacity-50' : ''}`}
                    value={data.email}
                    readOnly={!isAdmin && !isSelf}
                    onChange={e => setData({ ...data, email: e.target.value })}
                  />
                  {isSelf && data.email !== user.email && (
                    <span className="absolute right-3 top-3.5 text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md uppercase">Requires OTP</span>
                  )}
                </div>
                {!isAdmin && isSelf && <p className="text-[9px] text-slate-400 mt-1 font-medium">Changing your email will require verification.</p>}
                {!isAdmin && !isSelf && <p className="text-[9px] text-red-400 mt-1 font-medium italic">Only Admins can change team member emails.</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Job Title / Workspace Role</label>
                <div className="space-y-2">
                  <input
                    className={`w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-black outline-none focus:ring-2 focus:ring-emerald-500 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={data.role}
                    placeholder="e.g. Writer, Designer, Developer"
                    readOnly={!isAdmin}
                    onChange={e => setData({ ...data, role: e.target.value })}
                  />
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setData({ ...data, role: 'Writer' })} className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold hover:bg-emerald-100 transition-colors">Writer</button>
                      <button type="button" onClick={() => setData({ ...data, role: 'Designer' })} className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100 font-bold hover:bg-blue-100 transition-colors">Designer</button>
                      <button type="button" onClick={() => setData({ ...data, role: 'Developer' })} className="text-[10px] px-2 py-1 rounded bg-purple-50 text-purple-600 border border-purple-100 font-bold hover:bg-purple-100 transition-colors">Developer</button>
                      {isAdmin && data.role !== UserRole.ADMIN && (
                        <button type="button" onClick={() => setData({ ...data, role: UserRole.ADMIN })} className="text-[10px] px-2 py-1 rounded bg-slate-800 text-white font-bold hover:bg-black transition-colors shadow-sm">ADMIN</button>
                      )}
                    </div>
                  )}
                </div>
                {!isAdmin && <p className="text-[9px] text-slate-400 mt-1 font-medium italic">Only Admins can modify workspace roles.</p>}
              </div>

              {isAdmin && data.role !== UserRole.ADMIN && (
                <div className="pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Project Permissions</label>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {projects.map((p: any) => (
                      <label key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={data.accessibleProjects.includes(p.id)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...data.accessibleProjects, p.id]
                              : data.accessibleProjects.filter((id: string) => id !== p.id);
                            setData({ ...data, accessibleProjects: next });
                          }}
                        />
                        <span className="text-xs font-bold text-slate-700">{p.name}</span>
                      </label>
                    ))}
                    {projects.length === 0 && <p className="text-[10px] italic text-slate-400 text-center py-4">No projects created yet.</p>}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-medium">Team members can only see projects (and their tasks/invoices) selected above.</p>
                </div>
              )}

              {isAdmin && data.role !== UserRole.ADMIN && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Module Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(data.permissions).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors capitalize">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={val as boolean}
                          onChange={(e) => setData({ ...data, permissions: { ...data.permissions, [key]: e.target.checked } })}
                        />
                        <span className="text-xs font-bold text-slate-700">{key}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ICONS.Bell className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg mb-2">Verify New Email</h4>
              <p className="text-xs text-slate-500 mb-6">Enter the code sent to <b>{data.email}</b></p>
              <input
                className="w-full p-4 bg-slate-50 border-2 border-emerald-100 rounded-2xl text-center text-2xl font-black tracking-[1em] outline-none focus:border-emerald-500 transition-all"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
              <button onClick={() => setIsVerifyingEmail(false)} className="mt-4 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600">Wrong email? Go back</button>
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Cancel</button>
            {isVerifyingEmail ? (
              <button
                onClick={handleVerifyOtp}
                disabled={otp.length < 6}
                className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 disabled:opacity-50"
              >
                Confirm Update
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-black transition-all"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default ManagementView;
