
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Lead, LeadStatus, CustomFieldDefinition } from '../types';
import { ICONS } from '../constants';

const LeadsView: React.FC = () => {
    const { leads, addLead, updateLeadStatus, updateLead, convertLeadToClient, settings } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

    const columns = [
        { id: LeadStatus.NEW, label: 'New', color: 'bg-slate-50 border-slate-200' },
        { id: LeadStatus.CONTACTED, label: 'Contacted', color: 'bg-indigo-50 border-indigo-200' },
        { id: LeadStatus.QUALIFIED, label: 'Qualified', color: 'bg-blue-50 border-blue-200' },
        { id: LeadStatus.PROPOSAL, label: 'Proposal', color: 'bg-amber-50 border-amber-200' },
        { id: LeadStatus.CONVERTED, label: 'Converted', color: 'bg-green-50 border-green-200' },
        { id: LeadStatus.LOST, label: 'Lost', color: 'bg-red-50 border-red-200' },
    ];

    const onDragStart = (e: React.DragEvent, id: string) => {
        setDraggedLeadId(id);
        e.dataTransfer.setData('leadId', id);
    };

    const onDrop = (e: React.DragEvent, status: LeadStatus) => {
        const id = e.dataTransfer.getData('leadId');
        if (id) updateLeadStatus(id, status);
        setDraggedLeadId(null);
    };

    return (
        <div className="h-full flex flex-col p-8 bg-gray-50/50 dark:bg-slate-950/50">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Lead Pipeline</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Track and manage potential business opportunities</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-xl shadow-indigo-100"
                >
                    <ICONS.Plus className="w-4 h-4" /> Add Lead
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
                {columns.map(col => (
                    <div
                        key={col.id}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => onDrop(e, col.id)}
                        className={`flex-1 min-w-[280px] max-w-[320px] flex flex-col rounded-2xl border-2 border-dashed border-transparent transition-colors ${col.id === LeadStatus.LOST ? 'opacity-75' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-widest">{col.label}</h3>
                                <span className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    {leads.filter(l => l.status === col.id).length}
                                </span>
                            </div>
                        </div>

                        <div className={`flex-1 p-2 space-y-3 rounded-2xl border-2 border-dashed ${col.color.replace('bg-', 'dark:bg-opacity-10 dark:border-opacity-20 ')}`}>
                            {leads
                                .filter(l => l.status === col.id)
                                .map(lead => (
                                    <div
                                        key={lead.id}
                                        draggable
                                        onDragStart={e => onDragStart(e, lead.id)}
                                        onClick={() => setSelectedLead(lead)}
                                        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{lead.name}</h4>
                                            <ICONS.MoreVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                                        </div>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase mb-3">{lead.company || 'Private Person'}</p>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-1.5">
                                                <ICONS.MessageSquare className="w-3 h-3 text-gray-400" />
                                                <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">{lead.email}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                                {lead.source}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} onSave={addLead} fieldDefs={settings?.customFieldDefinitions.filter(d => d.resource === 'LEAD') || []} />}
            {selectedLead && (
                <LeadDetailsModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onConvert={convertLeadToClient}
                    onUpdateStatus={updateLeadStatus}
                    onUpdate={updateLead}
                    fieldDefs={settings?.customFieldDefinitions.filter(d => d.resource === 'LEAD') || []}
                />
            )}
        </div>
    );
};

const AddLeadModal = ({ onClose, onSave, fieldDefs }: any) => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: 'Manual', notes: '', customFields: {} });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <form onSubmit={handleSubmit} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Capture New Lead</h3>
                <div className="space-y-4">
                    <input required placeholder="Contact Name" className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-white" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input required type="email" placeholder="Email Address" className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-white" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <input placeholder="Phone Number" className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-white" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    <input placeholder="Company Name" className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-white" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />

                    {fieldDefs.map((def: CustomFieldDefinition) => (
                        <div key={def.id}>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{def.name}</label>
                            {def.type === 'SELECT' ? (
                                <select className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl text-sm outline-none text-slate-900 dark:text-white" value={(form.customFields as any)[def.id] || ''} onChange={e => setForm({ ...form, customFields: { ...form.customFields, [def.id]: e.target.value } })}>
                                    <option value="">Select...</option>
                                    {def.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <input type={def.type === 'NUMBER' ? 'number' : def.type === 'DATE' ? 'date' : 'text'} className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl text-sm outline-none text-slate-900 dark:text-white" value={(form.customFields as any)[def.id] || ''} onChange={e => setForm({ ...form, customFields: { ...form.customFields, [def.id]: e.target.value } })} />
                            )}
                        </div>
                    ))}

                    <textarea placeholder="Notes / Requirement" className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 min-h-[80px] text-slate-900 dark:text-white" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="flex gap-3 mt-8">
                    <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">Save Lead</button>
                </div>
            </form>
        </div>
    );
};

const LeadDetailsModal = ({ lead, onClose, onConvert, onUpdateStatus, onUpdate, fieldDefs }: any) => {
    const handleFieldChange = (fieldId: string, value: any) => {
        const nextCustomFields = { ...(lead.customFields || {}), [fieldId]: value };
        onUpdate(lead.id, { customFields: nextCustomFields });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{lead.name}</h3>
                        <p className="text-gray-500 dark:text-slate-400 font-medium">{lead.company || 'Private Person'}</p>
                    </div>
                    <div className="flex gap-2">
                        {lead.status !== LeadStatus.CONVERTED && (
                            <button
                                onClick={() => { if (confirm('Convert this lead to a Client?')) { onConvert(lead.id); onClose(); } }}
                                className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                            >
                                Convert to Client
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><ICONS.Plus className="w-5 h-5 rotate-45 text-gray-400" /></button>
                    </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Contact Info</label>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{lead.email}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{lead.phone || 'No phone provided'}</p>
                        </div>

                        {fieldDefs.length > 0 && (
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 grid grid-cols-1 gap-4">
                                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Metadata / Custom Details</label>
                                {fieldDefs.map((def: CustomFieldDefinition) => (
                                    <div key={def.id}>
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">{def.name}</label>
                                        {def.type === 'SELECT' ? (
                                            <select className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white" value={lead.customFields?.[def.id] || ''} onChange={e => handleFieldChange(def.id, e.target.value)}>
                                                <option value="">Not set</option>
                                                {def.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type={def.type === 'NUMBER' ? 'number' : def.type === 'DATE' ? 'date' : 'text'}
                                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                                                value={lead.customFields?.[def.id] || ''}
                                                onChange={e => handleFieldChange(def.id, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
                            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                                {lead.notes || 'No notes available.'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Status Management</label>
                            <div className="grid grid-cols-1 gap-2">
                                {Object.values(LeadStatus).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => onUpdateStatus(lead.id, s)}
                                        className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${lead.status === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadsView;
