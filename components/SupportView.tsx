
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { UserRole, SupportTicket, TicketStatus, TicketPriority, isInternalRole } from '../types';

const SupportView: React.FC = () => {
    const { tickets, addTicket, updateTicketStatus, user, clients, projects } = useApp();
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL');

    const filteredTickets = tickets.filter(t => {
        if (filter !== 'ALL' && t.status !== filter) return false;
        if (isInternalRole(user?.role)) return true;
        return t.clientId === user?.id; // Clients only see their own tickets
    });

    const isInternal = isInternalRole(user?.role);

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-black">Support Helpdesk</h2>
                    <p className="text-gray-500 font-medium">
                        {isInternal ? "Manage customer support requests and issues" : "Need help? Submit a ticket and track its progress"}
                    </p>
                </div>
                <div className="flex gap-2">
                    {!isInternal && (
                        <button onClick={() => setShowNewTicket(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                            <ICONS.Plus className="w-4 h-4" /> New Support Ticket
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-3 bg-gray-100 p-1.5 rounded-2xl w-fit">
                {(['ALL', ...Object.values(TicketStatus)] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                    <div key={ticket.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${ticket.priority === TicketPriority.URGENT ? 'bg-red-500' :
                                ticket.priority === TicketPriority.HIGH ? 'bg-orange-500' :
                                    ticket.priority === TicketPriority.MEDIUM ? 'bg-indigo-500' : 'bg-slate-300'
                            }`} />

                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{ticket.id.slice(-6)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${ticket.priority === TicketPriority.URGENT ? 'bg-red-100 text-red-700' :
                                            ticket.priority === TicketPriority.HIGH ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                                        }`}>{ticket.priority}</span>
                                </div>
                                <h3 className="text-lg font-bold text-black group-hover:text-indigo-600 transition-colors">{ticket.subject}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                            </div>

                            <div className="text-right space-y-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ticket.status === TicketStatus.OPEN ? 'bg-green-100 text-green-700' :
                                        ticket.status === TicketStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                            ticket.status === TicketStatus.RESOLVED ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                                    }`}>{ticket.status}</span>

                                {isInternal && ticket.status !== TicketStatus.RESOLVED && (
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => updateTicketStatus(ticket.id, TicketStatus.IN_PROGRESS)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Mark In Progress"><ICONS.Clock className="w-4 h-4" /></button>
                                        <button onClick={() => updateTicketStatus(ticket.id, TicketStatus.RESOLVED)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors" title="Resolve"><ICONS.Check className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 pt-Underline border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <ICONS.Users className="w-3.5 h-3.5 text-slate-300" />
                                    <span className="text-xs text-slate-500 font-medium">{clients.find(c => c.id === ticket.clientId)?.name || 'Unknown Client'}</span>
                                </div>
                                {ticket.projectId && (
                                    <div className="flex items-center gap-1.5">
                                        <ICONS.Trello className="w-3.5 h-3.5 text-slate-300" />
                                        <span className="text-xs text-slate-500 font-medium">{projects.find(p => p.id === ticket.projectId)?.name}</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                )) : (
                    <div className="p-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <ICONS.AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400">No support tickets found</h3>
                        <p className="text-sm text-gray-400 italic">Everything seems to be running smoothly!</p>
                    </div>
                )}
            </div>

            {showNewTicket && <NewTicketModal onClose={() => setShowNewTicket(false)} projects={projects.filter(p => p.clientId === user?.id)} onSubmit={addTicket} userId={user?.id || ''} />}
        </div>
    );
};

const NewTicketModal = ({ onClose, projects, onSubmit, userId }: any) => {
    const [form, setForm] = useState({ subject: '', description: '', priority: TicketPriority.MEDIUM, projectId: '' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <form onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ ...form, clientId: userId, status: TicketStatus.OPEN });
                onClose();
            }} className="relative bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-2xl font-bold text-black mb-6">Create Support Request</h3>
                <div className="space-y-4">
                    <input required placeholder="Subject / Summary of Issue" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                    <textarea required placeholder="Detailed description of the problem..." rows={4} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

                    <div className="grid grid-cols-2 gap-4">
                        <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TicketPriority })}>
                            {Object.values(TicketPriority).map(p => <option key={p} value={p}>{p} PRIORITY</option>)}
                        </select>
                        <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
                            <option value="">Related Project (Optional)</option>
                            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-8">
                    <button type="button" onClick={onClose} className="flex-1 py-4 text-sm font-bold text-gray-500 uppercase tracking-widest">Discard</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 uppercase tracking-widest">Submit Ticket</button>
                </div>
            </form>
        </div>
    );
};

export default SupportView;
