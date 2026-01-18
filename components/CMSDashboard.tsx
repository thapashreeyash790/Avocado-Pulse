
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { CMSPage, CMSSection, CMSTemplate } from '../types';
import { ICONS } from '../constants';
import '../components/LandingPage.css'; // Reuse some landing page styles
import DynamicLandingPage from './DynamicLandingPage';

const CMSDashboard: React.FC = () => {
    const { cmsPages, saveCMSPage, deleteCMSPage, fetchCMSPages, cmsTemplates, saveCMSTemplate, deleteCMSTemplate } = useApp();
    const [editingPage, setEditingPage] = useState<Partial<CMSPage> | null>(null);
    // History State
    const [history, setHistory] = useState<Partial<CMSPage>[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const ignoreHistoryRef = useState(false)[0]; // Using a stable object or ref. Actually useRef is better but sticking to minimal changes first. 
    // Wait, useState(false)[0] is constant false. I need useRef.
    // Let's use React.useRef if imported, or just useRef if I check imports.
    // 'useState', 'useEffect' are imported. 'useRef' might not be.
    // I see `import React, { useState, useEffect } from 'react';` at top? 
    // Let's check imports.
    // File content shows: import React, { useState, useEffect } from 'react';
    // So I need to add useRef to imports or use React.useRef.
    // Let's use React.useRef.
    const historyRef = React.useRef({ ignore: false });

    // History Effect
    useEffect(() => {
        if (editingPage && !historyRef.current.ignore) {
            // Simple debounce or check to avoid duplicates?
            setHistory(prev => {
                const currentHistory = prev.slice(0, historyIndex + 1);
                const last = currentHistory[currentHistory.length - 1];
                if (JSON.stringify(last) !== JSON.stringify(editingPage)) {
                    const next = [...currentHistory, editingPage];
                    setHistoryIndex(next.length - 1);
                    return next;
                }
                return prev;
            });
        }
        historyRef.current.ignore = false;
    }, [editingPage]); // historyIndex is in closure but setHistory updater uses prev. 
    // Actually setHistoryIndex needs to be synced. UseEffect is tricky with coupled state.

    // Alternative: Just use the `updatePage` function BUT make it support functional updates?
    // User wants "add or write something".
    // If I use the Functional Update for `setEditingPage` in `addSection`, it works.
    // But how to push to history?
    // Inside `addSection`, after `setEditingPage`, we can't easily push to history.

    // Let's stick to the useEffect approach but refine it.
    // We need `historyIndex` in the dependency array?
    // If we add `historyIndex`, it runs on undo/redo.
    // Hence `ignoreHistoryRef`.

    // Correction:
    // const last = history[historyIndex]; // need 'history' and 'historyIndex' in deps.
    // If we add them, we need to ensure we don't loop.

    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCMSPages();
    }, [fetchCMSPages]);

    const handleCreatePage = () => {
        const newPage = {
            title: 'New Page',
            slug: 'new-page',
            status: 'DRAFT',
            sections: []
        };
        // Initial setup
        historyRef.current.ignore = true;
        setEditingPage(newPage);
        setHistory([newPage]);
        setHistoryIndex(0);
    };

    const undo = () => {
        if (historyIndex > 0) {
            historyRef.current.ignore = true;
            setHistoryIndex(historyIndex - 1);
            setEditingPage(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            historyRef.current.ignore = true;
            setHistoryIndex(historyIndex + 1);
            setEditingPage(history[historyIndex + 1]);
        }
    };

    const handleSave = async () => {
        if (editingPage) {
            await saveCMSPage(editingPage);
        }
    };

    const addSection = (type: CMSSection['type']) => {
        if (!editingPage) return;
        const newSection: CMSSection = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: getInitialContent(type),
            order: 9999 // Helper will re-sort
        };

        setEditingPage(prev => {
            if (!prev) return prev;
            const sections = [...(prev.sections || []), newSection];
            // Reassign orders
            const reordered = sections.map((s, i) => ({ ...s, order: i + 1 }));
            return {
                ...prev,
                sections: reordered
            };
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
            case 'CTA': return { title: 'Ready to join?', cta: 'Get Started', bgColor: '#4f46e5', textColor: '#ffffff' };
            case 'IMAGE': return { image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' };
            case 'VIDEO': return { videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' };
            case 'TEAM': return { title: 'Meet Our Team', members: [{ name: 'John Doe', role: 'CEO', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', bio: 'Leading with vision' }] };
            case 'STATS': return { items: [{ label: 'Happy Clients', value: '500+', icon: 'users' }, { label: 'Projects Done', value: '1000+', icon: 'check' }] };
            case 'GALLERY': return { images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80'] };
            case 'CONTACT': return { title: 'Get In Touch', email: 'hello@example.com', phone: '+1 234 567 8900', address: '123 Main St, City' };
            case 'NEWSLETTER': return { title: 'Subscribe to our newsletter', subtitle: 'Get the latest updates', placeholder: 'Enter your email', cta: 'Subscribe' };
            case 'LOGO_CLOUD': return { title: 'Trusted by leading companies', logos: ['https://via.placeholder.com/150x50?text=Logo+1'] };
            default: return {};
        }
    };

    const removeSection = (id: string) => {
        setEditingPage(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                sections: prev.sections?.filter(s => s.id !== id)
            };
        });
        if (activeSectionId === id) setActiveSectionId(null);
    };

    const moveSection = (id: string, direction: 'up' | 'down') => {
        setEditingPage(prev => {
            if (!prev || !prev.sections) return prev;
            const idx = prev.sections.findIndex(s => s.id === id);
            if (idx === -1) return prev;

            const newSections = [...prev.sections];
            if (direction === 'up' && idx > 0) {
                [newSections[idx], newSections[idx - 1]] = [newSections[idx - 1], newSections[idx]];
            } else if (direction === 'down' && idx < newSections.length - 1) {
                [newSections[idx], newSections[idx + 1]] = [newSections[idx + 1], newSections[idx]];
            }
            return { ...prev, sections: newSections.map((s, i) => ({ ...s, order: i + 1 })) };
        });
    };

    const reorderSections = (sourceIndex: number, destinationIndex: number) => {
        setEditingPage(prev => {
            if (!prev || !prev.sections) return prev;
            const newSections = Array.from(prev.sections);
            const [movedSection] = newSections.splice(sourceIndex, 1);

            // Adjust destination if it was after the source
            let actualDest = destinationIndex;
            if (sourceIndex < destinationIndex) {
                actualDest = destinationIndex - 1;
            }

            newSections.splice(actualDest, 0, movedSection);
            return {
                ...prev,
                sections: newSections.map((s: CMSSection, i: number) => ({ ...s, order: i + 1 }))
            };
        });
    };

    const updateSection = (id: string, updates: Partial<CMSSection>) => {
        setEditingPage(prev => {
            if (!prev || !prev.sections) return prev;
            const newSections = prev.sections.map(s => {
                if (s.id === id) {
                    const { content, ...otherUpdates } = updates;
                    return {
                        ...s,
                        ...otherUpdates,
                        content: content ? { ...(s.content as object || {}), ...content } : s.content
                    };
                }
                return s;
            });
            return { ...prev, sections: newSections };
        });
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
                    reorderSections={reorderSections}
                    removeSection={removeSection}
                    updateSection={updateSection}
                    handleSave={handleSave}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onExit={() => setEditingPage(null)}
                    undo={undo}
                    redo={redo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    cmsTemplates={cmsTemplates}
                    saveCMSTemplate={saveCMSTemplate}
                    deleteCMSTemplate={deleteCMSTemplate}
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
                                onUpdate={setEditingPage}
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
    reorderSections: (source: number, dest: number) => void;
    removeSection: (id: string) => void;
    updateSection: (id: string, updates: any) => void;
    handleSave: () => void;
    viewMode: 'desktop' | 'mobile';
    setViewMode: (mode: 'desktop' | 'mobile') => void;
    onExit: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    cmsTemplates: CMSTemplate[];
    saveCMSTemplate: (tpl: Partial<CMSTemplate>) => Promise<void>;
    deleteCMSTemplate: (id: string) => Promise<void>;
}> = ({ editingPage, setEditingPage, activeSection, setActiveSectionId, addSection, moveSection, reorderSections, removeSection, updateSection, handleSave, viewMode, setViewMode, onExit, undo, redo, canUndo, canRedo, cmsTemplates, saveCMSTemplate, deleteCMSTemplate }) => {

    // Internal state for sidebar view
    const [sidebarMode, setSidebarMode] = useState<'WIDGETS' | 'PROPERTIES' | 'SETTINGS' | 'NAVIGATOR' | 'TEMPLATES'>('WIDGETS');
    const [sidebarTab, setSidebarTab] = useState<'content' | 'style' | 'advanced'>('content');

    // Auto-switch to properties when section is selected
    useEffect(() => {
        if (activeSection) {
            setSidebarMode('PROPERTIES');
            setSidebarTab('content'); // Reset to content tab on new selection
        } else if (sidebarMode === 'PROPERTIES') {
            setSidebarMode('WIDGETS');
        }
    }, [activeSection, sidebarMode]);

    const handlePreview = () => {
        if (editingPage) {
            localStorage.setItem('cms_preview_data', JSON.stringify(editingPage));
            window.open('/#/preview', '_blank');
        }
    };

    // Widget Icons Mapping
    const WIDGETS = [
        { type: 'HERO', label: 'Hero', icon: ICONS.Layout },
        { type: 'FEATURES', label: 'Features', icon: ICONS.ListTodo },
        { type: 'PRICING', label: 'Pricing', icon: ICONS.TrendingUp },
        { type: 'NARRATIVE', label: 'Text', icon: ICONS.FileText },
        { type: 'FAQ', label: 'FAQ', icon: ICONS.MessageSquare },
        { type: 'TESTIMONIALS', label: 'Reviews', icon: ICONS.Users },
        { type: 'CTA', label: 'Banner', icon: ICONS.MousePointer2 },
        { type: 'IMAGE', label: 'Image', icon: ICONS.Image },
        { type: 'VIDEO', label: 'Video', icon: ICONS.Youtube },
        { type: 'TEAM', label: 'Team', icon: ICONS.Award },
        { type: 'STATS', label: 'Stats', icon: ICONS.BarChart },
        { type: 'GALLERY', label: 'Gallery', icon: ICONS.Grid },
        { type: 'CONTACT', label: 'Contact', icon: ICONS.Phone },
        { type: 'NEWSLETTER', label: 'Newsletter', icon: ICONS.Mail },
        { type: 'LOGO_CLOUD', label: 'Logos', icon: ICONS.Star },
    ];

    return (
        <div className="w-[300px] flex flex-col bg-white border-r border-gray-300 shadow-xl shrink-0 z-50">
            {/* Header */}
            <div className="h-12 bg-white border-b flex items-center justify-between px-4 shadow-sm relative z-20">
                <button title="Menu" onClick={onExit} className="p-2 text-gray-500 hover:text-red-600 transition-colors">
                    <ICONS.Menu size={20} />
                </button>
                <div className="font-bold text-gray-800 uppercase tracking-widest text-xs">Elementor CMS</div>
                <div className="flex gap-1">
                    <button
                        title="Templates Library"
                        onClick={() => { setActiveSectionId(null); setSidebarMode('TEMPLATES'); }}
                        className={`p-2 transition-colors ${sidebarMode === 'TEMPLATES' ? 'text-blue-600' : 'text-gray-400 hover:text-black'}`}
                    >
                        <ICONS.Bookmark size={20} />
                    </button>
                    <button
                        title="Widgets"
                        onClick={() => { setActiveSectionId(null); setSidebarMode('WIDGETS'); }}
                        className={`p-2 transition-colors ${sidebarMode === 'WIDGETS' ? 'text-green-600' : 'text-gray-400 hover:text-black'}`}
                    >
                        <ICONS.LayoutDashboard size={20} />
                    </button>
                </div>
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
                                onClick={() => setSidebarTab('advanced')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${sidebarTab === 'advanced' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-black'}`}
                            >
                                Advanced
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {sidebarTab === 'content' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                        Edit text and images directly on the canvas. Use this panel for layout actions.
                                    </div>
                                    {['FEATURES', 'FAQ', 'PRICING', 'TESTIMONIALS'].includes(activeSection.type) && (
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Manage Items</label>
                                            <div className="space-y-2 mb-4">
                                                {activeSection.content.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 p-2 bg-white border rounded group">
                                                        <span className="text-[10px] font-mono text-gray-400">#{idx + 1}</span>
                                                        <span className="text-xs font-medium truncate flex-1">{item.title || item.question || item.author || 'Item'}</span>
                                                        <button
                                                            onClick={() => {
                                                                const newItems = [...(activeSection.content.items || [])];
                                                                newItems.splice(idx, 1);
                                                                updateSection(activeSection.id, { items: newItems });
                                                            }}
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            <ICONS.Trash size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {activeSection.content.plans?.map((plan: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 p-2 bg-white border rounded group">
                                                        <span className="text-[10px] font-mono text-gray-400">#{idx + 1}</span>
                                                        <span className="text-xs font-medium truncate flex-1">{plan.name}</span>
                                                        <button
                                                            onClick={() => {
                                                                const newPlans = [...(activeSection.content.plans || [])];
                                                                newPlans.splice(idx, 1);
                                                                updateSection(activeSection.id, { plans: newPlans });
                                                            }}
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            <ICONS.Trash size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (activeSection.type === 'PRICING') {
                                                        const newPlans = [...(activeSection.content.plans || []), { name: 'New Plan', price: '$20', features: ['Feature 1'] }];
                                                        updateSection(activeSection.id, { plans: newPlans });
                                                    } else {
                                                        let newItem = {};
                                                        if (activeSection.type === 'FEATURES') newItem = { title: 'New Feature', description: 'Feature description' };
                                                        if (activeSection.type === 'FAQ') newItem = { question: 'New Question', answer: 'Answer goes here' };
                                                        if (activeSection.type === 'TESTIMONIALS') newItem = { author: 'New Person', text: 'Terrific!', role: 'User' };
                                                        const newItems = [...(activeSection.content.items || []), newItem];
                                                        updateSection(activeSection.id, { items: newItems });
                                                    }
                                                }}
                                                className="w-full py-2 bg-white border border-dashed border-gray-300 rounded text-xs font-bold text-gray-500 hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <ICONS.Plus size={14} /> Add New Item
                                            </button>
                                        </div>
                                    )}

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
                                        <button
                                            onClick={() => {
                                                const name = window.prompt('Save as template:', `${activeSection.type} Template`);
                                                if (name) saveCMSTemplate({ name, type: 'SECTION', data: activeSection });
                                            }}
                                            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 text-xs font-bold shadow-md"
                                        >
                                            <ICONS.Bookmark size={14} /> Save as Template
                                        </button>
                                    </div>
                                </div>
                            )}

                            {sidebarTab === 'advanced' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    {/* Motion Effects */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                                            <ICONS.Zap size={14} /> Motion Effects
                                        </h4>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase mb-1 block">Entrance Animation</label>
                                            <select
                                                className="w-full p-2 border rounded text-xs bg-white"
                                                value={activeSection.advanced?.animation || 'none'}
                                                onChange={e => updateSection(activeSection.id, { advanced: { ...(activeSection.advanced || {}), animation: e.target.value } })}
                                            >
                                                <option value="none">None</option>
                                                <option value="fadeIn">Fade In</option>
                                                <option value="slideUp">Slide Up</option>
                                                <option value="slideDown">Slide Down</option>
                                                <option value="zoomIn">Zoom In</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100"></div>

                                    {/* Layout */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                                            <ICONS.Layout size={14} /> Layout
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Z-Index</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-2 border rounded text-xs"
                                                    value={activeSection.advanced?.zIndex || 0}
                                                    onChange={e => updateSection(activeSection.id, { advanced: { ...(activeSection.advanced || {}), zIndex: parseInt(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100"></div>

                                    {/* Margin & Padding */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                                            <ICONS.Move size={14} /> Spacing
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] text-gray-500 uppercase mb-2 block">Margin (px)</label>
                                                <div className="grid grid-cols-4 gap-1">
                                                    {['top', 'right', 'bottom', 'left'].map((dir) => (
                                                        <div key={dir}>
                                                            <input
                                                                type="number"
                                                                placeholder={dir[0].toUpperCase()}
                                                                className="w-full p-1.5 border rounded text-[10px] text-center"
                                                                value={activeSection.advanced?.margin?.[dir as keyof NonNullable<CMSSection['advanced']>['margin']] || 0}
                                                                onChange={e => updateSection(activeSection.id, {
                                                                    advanced: {
                                                                        ...(activeSection.advanced || {}),
                                                                        margin: { ...(activeSection.advanced?.margin || { top: 0, right: 0, bottom: 0, left: 0 }), [dir]: parseInt(e.target.value) || 0 }
                                                                    }
                                                                })}
                                                            />
                                                            <div className="text-[8px] text-gray-400 text-center mt-1 uppercase">{dir[0]}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 uppercase mb-2 block">Padding (px)</label>
                                                <div className="grid grid-cols-4 gap-1">
                                                    {['top', 'right', 'bottom', 'left'].map((dir) => (
                                                        <div key={dir}>
                                                            <input
                                                                type="number"
                                                                placeholder={dir[0].toUpperCase()}
                                                                className="w-full p-1.5 border rounded text-[10px] text-center"
                                                                value={activeSection.advanced?.padding?.[dir as keyof NonNullable<CMSSection['advanced']>['padding']] || 0}
                                                                onChange={e => updateSection(activeSection.id, {
                                                                    advanced: {
                                                                        ...(activeSection.advanced || {}),
                                                                        padding: { ...(activeSection.advanced?.padding || { top: 0, right: 0, bottom: 0, left: 0 }), [dir]: parseInt(e.target.value) || 0 }
                                                                    }
                                                                })}
                                                            />
                                                            <div className="text-[8px] text-gray-400 text-center mt-1 uppercase">{dir[0]}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100"></div>

                                    {/* Custom CSS */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                                            <ICONS.FileText size={14} /> Custom CSS
                                        </h4>
                                        <p className="text-[10px] text-gray-400 mb-2 italic">Use "selector" to target the current section.</p>
                                        <textarea
                                            className="w-full p-3 bg-gray-900 text-green-400 font-mono text-[10px] rounded h-32 outline-none focus:ring-1 focus:ring-green-500"
                                            placeholder="selector { border: 1px solid red; }"
                                            value={activeSection.advanced?.customCSS || ''}
                                            onChange={e => updateSection(activeSection.id, { advanced: { ...(activeSection.advanced || {}), customCSS: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {sidebarMode === 'TEMPLATES' && (
                    <div className="p-4 h-full flex flex-col">
                        <div className="border-b pb-4 mb-4">
                            <h3 className="font-black text-lg text-gray-800 tracking-tight">Templates Library</h3>
                            <p className="text-[10px] text-gray-400">Insert your saved sections</p>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {cmsTemplates.map(tpl => (
                                <div key={tpl.id} className="p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-800">{tpl.name}</h4>
                                            <span className="text-[9px] text-gray-400 uppercase font-mono">{tpl.type}</span>
                                        </div>
                                        <button
                                            onClick={() => deleteCMSTemplate(tpl.id)}
                                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <ICONS.Trash size={12} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (tpl.type === 'SECTION') {
                                                const section = tpl.data as CMSSection;
                                                const newSection = { ...section, id: Math.random().toString(36).substr(2, 9) };
                                                setEditingPage({
                                                    ...editingPage,
                                                    sections: [...(editingPage.sections || []), newSection].map((s, i) => ({ ...s, order: i + 1 }))
                                                });
                                                setActiveSectionId(newSection.id);
                                            }
                                        }}
                                        className="w-full py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                        Insert
                                    </button>
                                </div>
                            ))}
                            {cmsTemplates.length === 0 && (
                                <div className="text-center py-20">
                                    <ICONS.Bookmark size={40} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-[10px] text-gray-400">No templates saved yet.<br />Save a section to see it here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {sidebarMode === 'SETTINGS' && (
                <div className="p-5 space-y-6">
                    <div className="border-b pb-4 mb-4">
                        <h3 className="font-black text-lg text-gray-800">Page Settings</h3>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Title</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded text-sm"
                            value={editingPage.title || ''}
                            onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Slug</label>
                        <div className="flex items-center border rounded bg-gray-50">
                            <span className="pl-2 text-gray-400 text-xs">/</span>
                            <input
                                type="text"
                                className="w-full p-2 bg-transparent border-none text-sm focus:ring-0"
                                value={editingPage.slug || ''}
                                onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status</label>
                        <select
                            value={editingPage.status}
                            onChange={e => setEditingPage({ ...editingPage, status: e.target.value as any })}
                            className="w-full p-2 border rounded text-sm bg-white"
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                        </select>
                    </div>

                    <div className="h-px bg-gray-200"></div>

                    {/* Global Typography */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                            <ICONS.Type size={14} /> Global Typography
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Heading Font</label>
                                <select
                                    className="w-full p-2 border rounded text-xs bg-white"
                                    value={editingPage.settings?.globalFonts?.heading || 'Inter'}
                                    onChange={e => setEditingPage({
                                        ...editingPage,
                                        settings: {
                                            ...(editingPage.settings || {}),
                                            globalFonts: { ...(editingPage.settings?.globalFonts || { heading: 'Inter', body: 'Inter' }), heading: e.target.value }
                                        }
                                    })}
                                >
                                    <option value="Inter">Inter</option>
                                    <option value="Outfit">Outfit</option>
                                    <option value="Playfair Display">Playfair Display</option>
                                    <option value="Montserrat">Montserrat</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="Poppins">Poppins</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Body Font</label>
                                <select
                                    className="w-full p-2 border rounded text-xs bg-white"
                                    value={editingPage.settings?.globalFonts?.body || 'Inter'}
                                    onChange={e => setEditingPage({
                                        ...editingPage,
                                        settings: {
                                            ...(editingPage.settings || {}),
                                            globalFonts: { ...(editingPage.settings?.globalFonts || { heading: 'Inter', body: 'Inter' }), body: e.target.value }
                                        }
                                    })}
                                >
                                    <option value="Inter">Inter</option>
                                    <option value="Outfit">Outfit</option>
                                    <option value="Open Sans">Open Sans</option>
                                    <option value="Lato">Lato</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="Source Sans Pro">Source Sans Pro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200"></div>

                    {/* Global Colors */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                            <ICONS.Palette size={14} /> Global Colors
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Primary Green</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-10 h-10 border rounded cursor-pointer"
                                        value={editingPage.settings?.globalColors?.primary || '#22c55e'}
                                        onChange={e => setEditingPage({
                                            ...editingPage,
                                            settings: {
                                                ...(editingPage.settings || {}),
                                                globalColors: { ...(editingPage.settings?.globalColors || { primary: '#22c55e', secondary: '#3b82f6', accent: '#f59e0b', background: '#ffffff', text: '#111827' }), primary: e.target.value }
                                            }
                                        })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border rounded text-xs"
                                        value={editingPage.settings?.globalColors?.primary || '#22c55e'}
                                        onChange={e => setEditingPage({
                                            ...editingPage,
                                            settings: {
                                                ...(editingPage.settings || {}),
                                                globalColors: { ...(editingPage.settings?.globalColors || { primary: '#22c55e', secondary: '#3b82f6', accent: '#f59e0b', background: '#ffffff', text: '#111827' }), primary: e.target.value }
                                            }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {sidebarMode === 'NAVIGATOR' && (
                <div className="p-4 h-full flex flex-col">
                    <div className="border-b pb-4 mb-4 flex justify-between items-center">
                        <h3 className="font-black text-lg text-gray-800">Navigator</h3>
                        <span className="text-xs text-gray-400">{editingPage.sections?.length || 0} Sections</span>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto">
                        {editingPage.sections?.map((section, idx) => (
                            <div
                                key={section.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('sourceIndex', idx.toString());
                                    e.currentTarget.style.opacity = '0.5';
                                }}
                                onDragEnd={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                    const items = document.querySelectorAll('.nav-item');
                                    items.forEach(el => el.classList.remove('border-t-4', 'border-blue-500', 'bg-blue-50'));
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const midpoint = rect.top + rect.height / 2;

                                    // Remove existing indicators
                                    e.currentTarget.classList.remove('border-t-4', 'border-b-4', 'border-blue-500');

                                    if (e.clientY < midpoint) {
                                        e.currentTarget.classList.add('border-t-4', 'border-blue-500');
                                        e.currentTarget.dataset.dropPos = 'before';
                                    } else {
                                        e.currentTarget.classList.add('border-b-4', 'border-blue-500');
                                        e.currentTarget.dataset.dropPos = 'after';
                                    }
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('border-t-4', 'border-b-4', 'border-blue-500');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const dropPos = e.currentTarget.dataset.dropPos;
                                    e.currentTarget.classList.remove('border-t-4', 'border-b-4', 'border-blue-500');

                                    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));
                                    let targetIndex = idx;

                                    if (dropPos === 'after' && sourceIndex < idx) {
                                        // No change or handled by splice
                                    } else if (dropPos === 'after' && sourceIndex > idx) {
                                        // targetIndex = idx; // splice will put it after
                                    }

                                    // Simpler logic for splice reordering:
                                    // If 'after', the real target index is idx + 1 (unless it's the source itself)
                                    const finalTarget = dropPos === 'after' ? idx : idx;
                                    // Actually, if we use the existing reorderSections, it splices out source then inserts at target.
                                    // If source was 0 and target is 1, and we say 'after', we want it at index 1.
                                    // Splice(0, 1) -> [1, 2]. Splice(1, 0, 0) -> [1, 0, 2]. Correct.
                                    // If 'before' index 1, Splice(1, 0, 0) -> [1, 0, 2]. Same?
                                    // Wait. If source=0, target=1:
                                    // 'before' 1: splice(1, 0, 0) -> [1, 0, 2].
                                    // 'after' 1: splice(2, 0, 0) -> [1, 2, 0].

                                    let adjustedTarget = idx;
                                    if (dropPos === 'after') adjustedTarget = idx + 1;

                                    if (sourceIndex !== adjustedTarget && sourceIndex !== adjustedTarget - 1) {
                                        reorderSections(sourceIndex, adjustedTarget);
                                    }
                                }}
                                className={`nav-item p-3 rounded border flex items-center gap-3 cursor-pointer transition-all ${activeSection?.id === section.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                onClick={() => setActiveSectionId(section.id)}
                            >
                                <div className="text-gray-400 cursor-move">
                                    <ICONS.Menu size={14} />
                                </div>
                                <span className="text-gray-400 text-xs font-mono w-4">{idx + 1}</span>
                                <ICONS.Layout className="text-gray-400" size={14} />
                                <span className="text-sm font-medium text-gray-700">{section.type}</span>
                                {activeSection?.id === section.id && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>}
                            </div>
                        ))}
                        {(!editingPage.sections || editingPage.sections.length === 0) && (
                            <div className="text-center text-gray-400 text-xs py-10">No sections added yet.</div>
                        )}
                    </div>
                </div>
            )}


            {/* Bottom Toolbar */}
            <div className="border-t bg-white p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
                <div className="flex items-center justify-between mb-3 px-1">
                    <button
                        title="Settings"
                        onClick={() => { setActiveSectionId(null); setSidebarMode('SETTINGS'); }}
                        className={`transition-colors ${sidebarMode === 'SETTINGS' ? 'text-green-600' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                        <ICONS.Settings size={20} />
                    </button>
                    <button
                        title="Navigator"
                        onClick={() => { setActiveSectionId(null); setSidebarMode('NAVIGATOR'); }}
                        className={`transition-colors ${sidebarMode === 'NAVIGATOR' ? 'text-green-600' : 'text-gray-400 hover:text-gray-700'}`}
                    >
                        <ICONS.Trello size={20} />
                    </button>
                    <div className="relative group">
                        <button title="History" className="text-gray-400 hover:text-gray-700"><ICONS.History size={20} /></button>
                        {/* Undo/Redo Popover on Hover (Simple) */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white shadow-xl border rounded-lg p-1 flex hidden group-hover:flex">
                            <button title="Undo" disabled={!canUndo} onClick={undo} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><ICONS.ArrowRight className="-rotate-180" size={16} /></button>
                            <button title="Redo" disabled={!canRedo} onClick={redo} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><ICONS.ArrowRight size={16} /></button>
                        </div>
                    </div>
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
                    <button onClick={handlePreview} title="Preview" className="text-gray-400 hover:text-gray-700"><ICONS.Eye size={20} /></button>
                </div>
                <button onClick={handleSave} className="w-full py-2.5 bg-green-600 text-white font-bold uppercase tracking-wider text-xs rounded hover:bg-green-700 transition-all shadow-sm active:transform active:scale-95">
                    Update
                </button>
            </div>
        </div >
    );
};

export default CMSDashboard;
