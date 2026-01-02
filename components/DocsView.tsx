
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { Doc, UserRole } from '../types';

const DocsView: React.FC = () => {
    const { docs, allUsers, user, addDoc, shareDoc } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState<Doc | null>(null);
    const [newDoc, setNewDoc] = useState({ name: '', url: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.name || !newDoc.url) return;
        await addDoc(newDoc.name, newDoc.url);
        setNewDoc({ name: '', url: '' });
        setShowAddModal(false);
    };

    const toggleShare = async (doc: Doc, userId: string) => {
        const isShared = doc.sharedWith.includes(userId);
        const newSharedWith = isShared
            ? doc.sharedWith.filter(id => id !== userId)
            : [...doc.sharedWith, userId];
        await shareDoc(doc.id, newSharedWith);
        setShowShareModal({ ...doc, sharedWith: newSharedWith });
    };

    const filteredDocs = docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shared Documents</h2>
                    <p className="text-slate-500 font-medium">Collaborate via Google file links and external resources</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                    <ICONS.Plus className="w-4 h-4" />
                    Add Link
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map(doc => {
                    const isOwner = doc.ownerId === user?.id || user?.role === UserRole.ADMIN;
                    return (
                        <div key={doc.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <ICONS.FileText className="w-6 h-6" />
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => setShowShareModal(doc)}
                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                    >
                                        <ICONS.Users className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-1 truncate">{doc.name}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">Google Document</p>

                            <div className="flex items-center gap-2 mb-6">
                                <div className="flex -space-x-2">
                                    {doc.sharedWith.slice(0, 3).map(id => {
                                        const u = allUsers.find(user => user.id === id || user.email === id);
                                        return u ? (
                                            <img key={id} src={u.avatar} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100" title={u.name} />
                                        ) : null;
                                    })}
                                    {doc.sharedWith.length > 3 && (
                                        <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                            +{doc.sharedWith.length - 3}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {doc.sharedWith.length === 0 ? 'Private (Owner only)' : `Shared with ${doc.sharedWith.length} people`}
                                </span>
                            </div>

                            <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                            >
                                Open Resource
                                <ICONS.ArrowRight className="w-3 h-3" />
                            </a>
                        </div>
                    );
                })}
                {filteredDocs.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                            <ICONS.FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold max-w-xs">No documents shared yet. Add your first Google Doc link above.</p>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add New Link</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                <ICONS.Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className="p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Document Name</label>
                                <input
                                    autoFocus
                                    required
                                    placeholder="e.g. Q1 Marketing Plan"
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:ring-4 ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold"
                                    value={newDoc.name}
                                    onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Google/Resource URL</label>
                                <input
                                    required
                                    type="url"
                                    placeholder="https://docs.google.com/..."
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:ring-4 ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold"
                                    value={newDoc.url}
                                    onChange={e => setNewDoc({ ...newDoc, url: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                            >
                                Save Resource
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manage Access</h2>
                                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{showShareModal.name}</p>
                            </div>
                            <button onClick={() => setShowShareModal(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                <ICONS.Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="relative mb-6">
                                <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    placeholder="Search teammates or clients..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:ring-4 ring-emerald-500/5 focus:border-emerald-200 outline-none transition-all font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {allUsers.filter(u => u.id !== user?.id && (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))).map(u => {
                                    const isShared = showShareModal.sharedWith.includes(u.id) || showShareModal.sharedWith.includes(u.email);
                                    return (
                                        <button
                                            key={u.id}
                                            onClick={() => toggleShare(showShareModal, u.id)}
                                            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${isShared ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'hover:bg-slate-50'}`}
                                        >
                                            <img src={u.avatar} className="w-10 h-10 rounded-full border-2 border-slate-100 shadow-sm" alt="" />
                                            <div className="text-left flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">{u.name}</h4>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{u.role}</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isShared ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200' : 'border-slate-200'}`}>
                                                {isShared && <ICONS.Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setShowShareModal(null)}
                                className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocsView;
