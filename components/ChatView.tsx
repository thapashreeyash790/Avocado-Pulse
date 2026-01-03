
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { ICONS } from '../constants';
import { Conversation, User, UserRole } from '../types';

const ChatView: React.FC = () => {
    const { conversations, activeConversation, messages, user, allUsers, selectConversation, sendMessage, createConversation } = useApp();
    const [inputText, setInputText] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeConversation) return;
        sendMessage(activeConversation.id, inputText.trim());
        setInputText('');
    };

    const getPartner = (conv: Conversation): User | undefined => {
        if (conv.type === 'GROUP') return undefined;
        const partnerId = conv.participants.find(id => id !== user?.id);
        return allUsers.find(u => u.id === partnerId);
    };

    const isOnline = (targetUser?: User) => {
        if (!targetUser?.lastActive) return false;
        const diff = Date.now() - new Date(targetUser.lastActive).getTime();
        return diff < 3.5 * 60 * 1000; // 3.5 minutes (heartbeat is 2m)
    };

    const filteredUsers = allUsers.filter(u =>
        u.id !== user?.id &&
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        if (showNewChat) {
            console.log('[ChatView] allUsers count:', allUsers.length);
            console.log('[ChatView] Admin found?:', allUsers.some(u => u.role === UserRole.ADMIN));
        }
    }, [showNewChat, allUsers]);

    const startChat = async () => {
        if (selectedUsers.length === 1) {
            const partnerId = selectedUsers[0];
            const existing = conversations.find(c => c.type === 'DIRECT' && c.participants.includes(partnerId));
            if (existing) {
                selectConversation(existing);
            } else {
                const newConv = await createConversation([user!.id, partnerId], undefined, 'DIRECT');
                selectConversation(newConv);
            }
        } else if (selectedUsers.length > 1) {
            const newConv = await createConversation([user!.id, ...selectedUsers], groupName || 'New Group', 'GROUP');
            selectConversation(newConv);
        }
        setShowNewChat(false);
        setSelectedUsers([]);
        setGroupName('');
    };

    const toggleUser = (id: string) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden animate-in fade-in duration-500">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Messages</h2>
                    <button
                        onClick={() => setShowNewChat(true)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                        <ICONS.Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {conversations.map(conv => {
                        const partner = getPartner(conv);
                        const active = activeConversation?.id === conv.id;
                        return (
                            <button
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${active ? 'bg-emerald-50 ring-1 ring-emerald-100 shadow-sm shadow-emerald-100' : 'hover:bg-slate-50'
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold overflow-hidden ${active ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400'
                                        }`}>
                                        {conv.type === 'GROUP' ? <ICONS.Users className="w-6 h-6 text-emerald-600" /> : (partner?.avatar ? <img src={partner.avatar} alt="" /> : (partner?.name || '?').charAt(0))}
                                    </div>
                                    {partner && isOnline(partner) && (
                                        <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="font-bold text-slate-900 truncate text-sm">
                                            {conv.type === 'GROUP' ? conv.name : partner?.name || 'Deleted User'}
                                        </span>
                                        {conv.lastMessage && (
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate font-medium">
                                        {conv.lastMessage ? conv.lastMessage.text : 'Start a conversation'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Chat area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeConversation ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between shadow-sm bg-white/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {activeConversation.type === 'GROUP' ? <ICONS.Users className="w-5 h-5 text-emerald-600" /> : (getPartner(activeConversation)?.avatar ? <img src={getPartner(activeConversation)?.avatar} alt="" /> : getPartner(activeConversation)?.name?.charAt(0))}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{activeConversation.type === 'GROUP' ? activeConversation.name : getPartner(activeConversation)?.name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${activeConversation.type !== 'GROUP' && isOnline(getPartner(activeConversation)) ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                                            {activeConversation.type === 'GROUP' ? `${activeConversation.participants.length} Participants` : (isOnline(getPartner(activeConversation)) ? 'Online' : 'Offline')}
                                        </span>
                                        {activeConversation.type === 'DIRECT' && (
                                            <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                                                <ICONS.AlertCircle className="w-2.5 h-2.5 text-emerald-600" />
                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">End-to-End Encrypted</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                    <ICONS.MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user?.id;
                                const sender = allUsers.find(u => u.id === msg.senderId);
                                const showSender = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2`}>
                                        <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            {showSender && <span className="text-[10px] font-bold text-slate-400 ml-1 mb-1 block uppercase tracking-wider">{sender?.name}</span>}
                                            <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md ${isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                                                }`}>
                                                {msg.text}
                                            </div>
                                            <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <span className="text-[9px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && <ICONS.Check className="w-3 h-3 text-emerald-400" />}
                                                {activeConversation?.type === 'DIRECT' && (
                                                    <ICONS.AlertCircle className="w-2.5 h-2.5 text-slate-300 ml-1" title="Encrypted" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
                            <div className="relative flex items-center bg-slate-50 rounded-2xl border border-slate-200 p-1 focus-within:ring-2 ring-emerald-500/20 transition-all focus-within:bg-white focus-within:border-emerald-200">
                                <button type="button" className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors">
                                    <ICONS.Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-3 placeholder:text-slate-400 outline-none"
                                />
                                <button
                                    disabled={!inputText.trim()}
                                    type="submit"
                                    className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                                >
                                    <ICONS.ArrowRight className="w-5 h-5 flex-shrink-0" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                        <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-8 ring-8 ring-emerald-500/5 pulse">
                            <ICONS.MessageSquare className="w-12 h-12 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your Direct Workspace</h3>
                        <p className="text-slate-500 text-sm max-w-xs mt-3 font-medium leading-relaxed">Select a teammate or client to start chatting or create a group for team coordination.</p>
                        <button
                            onClick={() => setShowNewChat(true)}
                            className="mt-10 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95"
                        >
                            Start New Conversion
                        </button>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight text-sm">New Conversation</h2>
                            <button onClick={() => { setShowNewChat(false); setSelectedUsers([]); }} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <ICONS.Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <div className="p-6">
                            {selectedUsers.length > 1 && (
                                <div className="mb-4 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 block ml-1">Group Name</label>
                                    <input
                                        placeholder="e.g. Project Alpha Strike"
                                        className="w-full px-4 py-3.5 bg-indigo-50/30 border-2 border-indigo-100 rounded-2xl text-sm focus:ring-4 ring-indigo-500/10 focus:border-indigo-300 outline-none transition-all placeholder:text-indigo-300 font-bold"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="relative mb-6">
                                <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    placeholder="Search for people..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:ring-4 ring-emerald-500/5 focus:border-emerald-200 outline-none transition-all font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredUsers.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => toggleUser(u.id)}
                                        className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${selectedUsers.includes(u.id) ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="relative">
                                            <div className="w-11 h-11 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                                {u.avatar ? <img src={u.avatar} alt="" /> : u.name.charAt(0)}
                                            </div>
                                            {isOnline(u) && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">{u.name}</h4>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{u.role}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedUsers.includes(u.id) ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200' : 'border-slate-200'}`}>
                                            {selectedUsers.includes(u.id) && <ICONS.Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </button>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="py-10 text-center text-slate-400 text-xs italic font-medium">No matches found for "{searchTerm}"</div>
                                )}
                            </div>

                            <button
                                disabled={selectedUsers.length === 0}
                                onClick={startChat}
                                className="w-full mt-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {selectedUsers.length > 1 ? (
                                    <>
                                        <ICONS.Users className="w-4 h-4" />
                                        Create Group ({selectedUsers.length})
                                    </>
                                ) : (
                                    <>
                                        <ICONS.MessageSquare className="w-4 h-4" />
                                        Start Direct Chat
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatView;
