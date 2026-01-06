
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
            setEditingPage(null);
            setActiveSectionId(null);
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
            <div className="fixed inset-0 z-[60] bg-white overflow-hidden flex flex-col">
                {/* Visual Editor Toolbar */}
                <div className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm z-50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setEditingPage(null)} className="text-gray-500 hover:text-black font-medium">← Back</button>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <input
                            type="text"
                            className="font-bold text-lg bg-transparent border-none focus:ring-0 p-0 w-64"
                            value={editingPage.title || ''}
                            onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                            placeholder="Page Title"
                        />
                        <span className="text-gray-400">/</span>
                        <input
                            type="text"
                            className="text-sm text-gray-600 bg-transparent border-none focus:ring-0 p-0 w-48"
                            value={editingPage.slug || ''}
                            onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })}
                            placeholder="slug"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex rounded-lg bg-gray-100 p-1">
                            <button
                                onClick={() => setViewMode('desktop')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'desktop' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                            >Desktop</button>
                            <button
                                onClick={() => setViewMode('mobile')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'mobile' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                            >Mobile</button>
                        </div>
                        <div className="h-6 w-px bg-gray-200 mx-2"></div>
                        <button onClick={handleSave} className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-all">Save Changes</button>
                    </div>
                </div>

                {/* Editor Surface */}
                <div className="flex-1 overflow-y-auto bg-gray-100 flex">
                    {/* Components Sidebar */}
                    <div className="w-64 bg-white border-r h-full p-6 overflow-y-auto shrink-0 flex flex-col">
                        <div className="flex-1">
                            <h3 className="font-bold text-xs uppercase text-gray-400 mb-4 tracking-wider">Add Sections</h3>
                            <div className="space-y-3">
                                <button onClick={() => addSection('HERO')} className="w-full p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 text-left transition-all group">
                                    <div className="font-bold text-gray-700 group-hover:text-green-700">Hero Section</div>
                                    <div className="text-xs text-gray-400 mt-1">Large header with CTA</div>
                                </button>
                                <button onClick={() => addSection('FEATURES')} className="w-full p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 text-left transition-all group">
                                    <div className="font-bold text-gray-700 group-hover:text-green-700">Features Grid</div>
                                    <div className="text-xs text-gray-400 mt-1">3-column feature list</div>
                                </button>
                                <button onClick={() => addSection('PRICING')} className="w-full p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 text-left transition-all group">
                                    <div className="font-bold text-gray-700 group-hover:text-green-700">Pricing Table</div>
                                    <div className="text-xs text-gray-400 mt-1">Compare plans</div>
                                </button>
                                <button onClick={() => addSection('NARRATIVE')} className="w-full p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 text-left transition-all group">
                                    <div className="font-bold text-gray-700 group-hover:text-green-700">Narrative</div>
                                    <div className="text-xs text-gray-400 mt-1">Text content block</div>
                                </button>
                                <button onClick={() => addSection('FAQ')} className="w-full p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 text-left transition-all group">
                                    <div className="font-bold text-gray-700 group-hover:text-green-700">FAQ</div>
                                    <div className="text-xs text-gray-400 mt-1">Q&A list</div>
                                </button>
                                <button onClick={() => addSection('TESTIMONIALS')} className="w-full p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 text-left transition-all group">
                                    <div className="font-bold text-gray-700 group-hover:text-green-700">Testimonials</div>
                                    <div className="text-xs text-gray-400 mt-1">Social proof</div>
                                </button>
                            </div>

                            <h3 className="font-bold text-xs uppercase text-gray-400 mb-4 tracking-wider mt-8">Page Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                                    <select
                                        value={editingPage.status}
                                        onChange={e => setEditingPage({ ...editingPage, status: e.target.value as any })}
                                        className="w-full p-2 border rounded-lg text-sm"
                                    >
                                        <option value="DRAFT">Draft</option>
                                        <option value="PUBLISHED">Published</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 overflow-y-auto relative flex justify-center bg-gray-100" onClick={() => setActiveSectionId(null)}>
                        <div className={`transition-all duration-300 ease-in-out bg-white shadow-xl ${viewMode === 'mobile' ? 'w-[375px] my-8 border-x border-gray-300 h-[812px] rounded-3xl overflow-y-auto' : 'w-full h-full'}`}>
                            <DynamicLandingPage
                                isEditing={true}
                                pageData={editingPage as CMSPage}
                                onUpdate={(updatedPage) => setEditingPage(updatedPage)}
                                onSelectSection={setActiveSectionId}
                                activeSectionId={activeSectionId}
                            />
                        </div>
                    </div>

                    {/* Properties Panel (Right Sidebar) */}
                    {activeSection && (
                        <div className="w-72 bg-white border-l h-full p-6 overflow-y-auto shrink-0 shadow-xl z-10 transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-sm uppercase text-gray-500 tracking-wider">Properties</h3>
                                <button onClick={() => setActiveSectionId(null)} className="text-gray-400 hover:text-black">✕</button>
                            </div>

                            <div className="mb-6 pb-6 border-b">
                                <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">{activeSection.type}</span>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => moveSection(activeSection.id, 'up')} className="flex-1 py-1 text-xs border rounded hover:bg-gray-50">Move Up</button>
                                    <button onClick={() => moveSection(activeSection.id, 'down')} className="flex-1 py-1 text-xs border rounded hover:bg-gray-50">Move Down</button>
                                </div>
                                <button onClick={() => removeSection(activeSection.id)} className="w-full mt-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50">Remove Section</button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Background Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                            value={activeSection.content.bgColor || '#ffffff'}
                                            onChange={e => updateSection(activeSection.id, { bgColor: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 p-1 border rounded text-sm font-mono"
                                            value={activeSection.content.bgColor || ''}
                                            onChange={e => updateSection(activeSection.id, { bgColor: e.target.value })}
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Text Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                            value={activeSection.content.textColor || '#000000'}
                                            onChange={e => updateSection(activeSection.id, { textColor: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 p-1 border rounded text-sm font-mono"
                                            value={activeSection.content.textColor || ''}
                                            onChange={e => updateSection(activeSection.id, { textColor: e.target.value })}
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Landing Page CMS</h1>
                <button onClick={handleCreatePage} className="px-4 py-2 bg-green-600 text-white rounded">+ Create New Page</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cmsPages.map(page => (
                    <div key={page.id} className="border p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-xl font-bold mb-2">{page.title}</h3>
                        <p className="text-gray-500 mb-4">/{page.slug}</p>
                        <div className="flex justify-between">
                            <span className={`px-2 py-1 rounded text-xs ${page.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {page.status}
                            </span>
                            <div className="space-x-2">
                                <button onClick={() => setEditingPage(page)} className="text-green-600 font-medium">Edit</button>
                                <button onClick={() => deleteCMSPage(page.id)} className="text-red-500 font-medium">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CMSDashboard;
