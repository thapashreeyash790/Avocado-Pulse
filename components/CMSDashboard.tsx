
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { CMSPage, CMSSection } from '../types';
import { ICONS } from '../constants';
import '../components/LandingPage.css'; // Reuse some landing page styles
import DynamicLandingPage from './DynamicLandingPage';

const CMSDashboard: React.FC = () => {
    const { cmsPages, saveCMSPage, deleteCMSPage, fetchCMSPages } = useApp();
    const [editingPage, setEditingPage] = useState<Partial<CMSPage> | null>(null);
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCMSPages();
    }, [fetchCMSPages]);

    const handleCreatePage = () => {
        setEditingPage({
            title: 'New Page',
            slug: 'new-page',
            status: 'DRAFT',
            sections: []
        });
    };

    const handleSave = async () => {
        if (editingPage) {
            await saveCMSPage(editingPage);
            // Don't close editor on save, mimic "Update" button
            // setEditingPage(null); 
        }
    };

    const addSection = (type: CMSSection['type']) => {
        if (!editingPage) return;
        const newSection: CMSSection = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: getInitialContent(type),
            order: (editingPage.sections?.length || 0) + 1
        };
        setEditingPage({
            ...editingPage,
            sections: [...(editingPage.sections || []), newSection]
        });
        setActiveSectionId(newSection.id);
    };

    const getInitialContent = (type: CMSSection['type']) => {
        switch (type) {
            case 'HERO': return { title: 'Headline', subtitle: 'Sub-headline', cta: 'Get Started' };
            case 'NARRATIVE': return { title: 'The Story', text: 'Once upon a time...' };
            case 'PRICING': return { plans: [{ name: 'Basic', price: '$10', features: ['Feature 1'] }] };
            case 'FAQ': return { items: [{ question: 'What is it?', answer: 'It is Avocado Pulse.' }] };
            case 'TESTIMONIALS': return { items: [{ author: 'John Doe', text: 'Great tool!', role: 'CEO' }] };
            case 'FEATURES': return { items: [{ title: 'Feature 1', description: 'Does stuff' }] };
            default: return {};
        }
    };

    const removeSection = (id: string) => {
        if (!editingPage) return;
        setEditingPage({
            ...editingPage,
            sections: editingPage.sections?.filter(s => s.id !== id)
        });
        if (activeSectionId === id) setActiveSectionId(null);
    };

    const moveSection = (id: string, direction: 'up' | 'down') => {
        if (!editingPage || !editingPage.sections) return;
        const idx = editingPage.sections.findIndex(s => s.id === id);
        if (idx === -1) return;

        const newSections = [...editingPage.sections];
        if (direction === 'up' && idx > 0) {
            [newSections[idx], newSections[idx - 1]] = [newSections[idx - 1], newSections[idx]];
        } else if (direction === 'down' && idx < newSections.length - 1) {
            [newSections[idx], newSections[idx + 1]] = [newSections[idx + 1], newSections[idx]];
        }
        setEditingPage({ ...editingPage, sections: newSections });
    };

    const updateSection = (id: string, updates: any) => {
        if (!editingPage || !editingPage.sections) return;
        const newSections = editingPage.sections.map(s => s.id === id ? { ...s, content: { ...s.content, ...updates } } : s);
        setEditingPage({ ...editingPage, sections: newSections });
    };

    const activeSection = editingPage?.sections?.find(s => s.id === activeSectionId);

    if (editingPage) {
        return (
            <div className="fixed inset-0 z-[60] bg-gray-200 overflow-hidden flex font-sans text-gray-800">
                {/* Unified Left Sidebar */}
                <ElementorSidebar
                    editingPage={editingPage}
                    setEditingPage={setEditingPage}
                    activeSection={activeSection}
                    setActiveSectionId={setActiveSectionId}
                    addSection={addSection}
                    moveSection={moveSection}
                    removeSection={removeSection}
                    updateSection={updateSection}
                    handleSave={handleSave}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                {/* Canvas Area */}
                <div className="flex-1 h-full flex flex-col relative transition-all duration-300">
                    {/* Canvas Header/Top Bar (Optional, can be empty or breadcrumbs) */}

                    {/* Main Canvas */}
                    <div
                        className="flex-1 overflow-y-auto flex justify-center items-start pt-8 pb-20 cursor-default"
                        onClick={() => setActiveSectionId(null)}
                    >
                        <div
                            className={`transition-all duration-300 ease-in-out bg-white shadow-2xl ${viewMode === 'mobile'
                                ? 'w-[375px] min-h-[812px] my-4 rounded-3xl overflow-hidden'
                                : 'w-full min-h-screen my-4 mx-8 rounded-md'
                                }`}
                            onClick={(e) => e.stopPropagation()} // Prevent deselecting when clicking canvas background
                        >
                            <DynamicLandingPage
                                isEditing={true}
                                pageData={editingPage as CMSPage}
                                onUpdate={(updatedPage) => setEditingPage(updatedPage)}
                                onSelectSection={setActiveSectionId}
                                activeSectionId={activeSectionId}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Landing Pages</h1>
                        <p className="text-gray-500">Manage your marketing pages</p>
                    </div>
                    <button onClick={handleCreatePage} className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2">
                        <ICONS.Plus size={20} /> Create New Page
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cmsPages.map(page => (
                        <div key={page.id} className="group border border-gray-200 p-6 rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <ICONS.Layout size={24} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${page.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {page.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-1 text-gray-900">{page.title}</h3>
                            <p className="text-gray-400 text-sm mb-6 font-mono">/{page.slug}</p>
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button onClick={() => setEditingPage(page)} className="flex-1 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors">Edit</button>
                                <button onClick={() => deleteCMSPage(page.id)} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <ICONS.Trash size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ElementorSidebar: React.FC<{
    editingPage: Partial<CMSPage>;
    setEditingPage: (page: Partial<CMSPage>) => void;
    activeSection: CMSSection | undefined;
    setActiveSectionId: (id: string | null) => void;
    addSection: (type: CMSSection['type']) => void;
    moveSection: (id: string, dir: 'up' | 'down') => void;
    removeSection: (id: string) => void;
    updateSection: (id: string, updates: any) => void;
    handleSave: () => void;
    viewMode: 'desktop' | 'mobile';
    setViewMode: (mode: 'desktop' | 'mobile') => void;
}> = ({ editingPage, setEditingPage, activeSection, setActiveSectionId, addSection, moveSection, removeSection, updateSection, handleSave, viewMode, setViewMode }) => {

    // Internal state for sidebar view
    const [sidebarMode, setSidebarMode] = useState<'WIDGETS' | 'PROPERTIES'>('WIDGETS');
    const [sidebarTab, setSidebarTab] = useState<'content' | 'style'>('content');

    // Auto-switch to properties when section is selected
    useEffect(() => {
        if (activeSection) {
            setSidebarMode('PROPERTIES');
            setSidebarTab('content'); // Reset to content tab on new selection
        } else {
            setSidebarMode('WIDGETS');
        }
    }, [activeSection]);

    // Widget Icons Mapping
    const WIDGETS = [
        { type: 'HERO', label: 'Hero', icon: ICONS.Layout },
        { type: 'FEATURES', label: 'Features', icon: ICONS.ListTodo },
        { type: 'PRICING', label: 'Pricing', icon: ICONS.TrendingUp },
        { type: 'NARRATIVE', label: 'Text', icon: ICONS.FileText },
        { type: 'FAQ', label: 'FAQ', icon: ICONS.MessageSquare },
        { type: 'TESTIMONIALS', label: 'Reviews', icon: ICONS.Users },
    ];

    return (
        <div className="w-[300px] flex flex-col bg-white border-r border-gray-300 shadow-xl shrink-0 z-50">
            {/* Header */}
            <div className="h-12 bg-white border-b flex items-center justify-between px-4 shadow-sm relative z-20">
                <button title="Menu" onClick={() => setEditingPage(null)} className="p-2 text-gray-500 hover:text-red-600 transition-colors">
                    <ICONS.Menu size={20} />
                </button>
                <div className="font-bold text-gray-800 uppercase tracking-widest text-xs">Elementor CMS</div>
                <button
                    title="Widgets"
                    onClick={() => { setActiveSectionId(null); setSidebarMode('WIDGETS'); }}
                    className={`p-2 transition-colors ${sidebarMode === 'WIDGETS' ? 'text-green-600' : 'text-gray-400 hover:text-black'}`}
                >
                    <ICONS.LayoutDashboard size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
                {sidebarMode === 'WIDGETS' && (
                    <div className="p-4">
                        <div className="mb-4">
                            <div className="relative">
                                <ICONS.Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input type="text" placeholder="Search Widget..." className="w-full pl-10 pr-4 py-2 bg-white border rounded shadow-sm text-sm focus:ring-2 focus:ring-green-500" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {WIDGETS.map(widget => (
                                <button
                                    key={widget.type}
                                    onClick={() => addSection(widget.type as CMSSection['type'])}
                                    className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all group"
                                >
                                    <div className="text-gray-400 group-hover:text-green-600 mb-2">
                                        <widget.icon size={28} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">{widget.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {sidebarMode === 'PROPERTIES' && activeSection && (
                    <div className="flex flex-col h-full">
                        <div className="bg-white border-b px-6 py-4">
                            <h3 className="font-black text-lg text-gray-800 capitalize">{activeSection.type.toLowerCase()}</h3>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b bg-white">
                            <button
                                onClick={() => setSidebarTab('content')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${sidebarTab === 'content' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-black'}`}
                            >
                                Content
                            </button>
                            <button
                                onClick={() => setSidebarTab('style')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${sidebarTab === 'style' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-black'}`}
                            >
                                Style
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {sidebarTab === 'content' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                        Edit text and images directly on the canvas. Use this panel for layout actions.
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Structure</label>
                                        <div className="flex gap-2 mb-2">
                                            <button onClick={() => moveSection(activeSection.id, 'up')} className="flex-1 py-2 bg-white border rounded hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-bold text-gray-600">
                                                <ICONS.ArrowRight className="-rotate-90" size={12} /> Move Up
                                            </button>
                                            <button onClick={() => moveSection(activeSection.id, 'down')} className="flex-1 py-2 bg-white border rounded hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-bold text-gray-600">
                                                <ICONS.ArrowRight className="rotate-90" size={12} /> Move Down
                                            </button>
                                        </div>
                                        <button onClick={() => removeSection(activeSection.id)} className="w-full py-2 border border-red-200 text-red-600 bg-red-50 rounded hover:bg-red-100 flex items-center justify-center gap-2 text-xs font-bold">
                                            <ICONS.Trash size={14} /> Delete Section
                                        </button>
                                    </div>
                                </div>
                            )}

                            {sidebarTab === 'style' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                                            <ICONS.Type size={14} /> Typography
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                                                value={activeSection.content.textColor || '#000000'}
                                                onChange={e => updateSection(activeSection.id, { textColor: e.target.value })}
                                            />
                                            <div>
                                                <label className="text-xs text-gray-500 block">Text Color</label>
                                                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{activeSection.content.textColor || '#000000'}</code>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-200"></div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                                            <ICONS.Layout size={14} /> Background
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                                                value={activeSection.content.bgColor || '#ffffff'}
                                                onChange={e => updateSection(activeSection.id, { bgColor: e.target.value })}
                                            />
                                            <div>
                                                <label className="text-xs text-gray-500 block">BG Color</label>
                                                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{activeSection.content.bgColor || '#ffffff'}</code>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-200"></div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                                            <ICONS.MoreVertical size={14} /> Spacing
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <label className="text-xs text-gray-500">Top Padding</label>
                                                    <span className="text-xs font-mono text-gray-400">{activeSection.content.paddingTop || 0}px</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="200" step="4"
                                                    value={activeSection.content.paddingTop || 0}
                                                    onChange={e => updateSection(activeSection.id, { paddingTop: parseInt(e.target.value) })}
                                                    className="w-full accent-green-600"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <label className="text-xs text-gray-500">Bottom Padding</label>
                                                    <span className="text-xs font-mono text-gray-400">{activeSection.content.paddingBottom || 0}px</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="200" step="4"
                                                    value={activeSection.content.paddingBottom || 0}
                                                    onChange={e => updateSection(activeSection.id, { paddingBottom: parseInt(e.target.value) })}
                                                    className="w-full accent-green-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Toolbar */}
            <div className="border-t bg-white p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
                <div className="flex items-center justify-between mb-3 px-1">
                    <button title="Settings" className="text-gray-400 hover:text-gray-700"><ICONS.Settings size={20} /></button>
                    <button title="Navigator" className="text-gray-400 hover:text-gray-700"><ICONS.Trello size={20} /></button>
                    <button title="History" className="text-gray-400 hover:text-gray-700"><ICONS.History size={20} /></button>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <button
                        title="Desktop Mode"
                        onClick={() => setViewMode('desktop')}
                        className={viewMode === 'desktop' ? 'text-green-600' : 'text-gray-400 hover:text-black'}
                    >
                        <ICONS.Layout size={20} />
                    </button>
                    <button
                        title="Mobile Mode"
                        onClick={() => setViewMode('mobile')}
                        className={viewMode === 'mobile' ? 'text-green-600' : 'text-gray-400 hover:text-black'}
                    >
                        <ICONS.Zap size={20} />
                    </button>
                    <button title="Preview" className="text-gray-400 hover:text-gray-700"><ICONS.Search size={20} /></button>
                </div>
                <button onClick={handleSave} className="w-full py-2.5 bg-green-600 text-white font-bold uppercase tracking-wider text-xs rounded hover:bg-green-700 transition-all">
                    Update
                </button>
            </div>
        </div>
    );
};

export default CMSDashboard;
