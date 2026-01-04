
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { CMSPage, CMSSection } from '../types';
import { ICONS } from '../constants';
import '../components/LandingPage.css'; // Reuse some landing page styles

const CMSDashboard: React.FC = () => {
    const { cmsPages, saveCMSPage, deleteCMSPage, fetchCMSPages } = useApp();
    const [editingPage, setEditingPage] = useState<Partial<CMSPage> | null>(null);
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

    if (editingPage) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">Edit Landing Page</h2>
                    <div className="space-x-4">
                        <button onClick={() => setEditingPage(null)} className="px-4 py-2 border rounded">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">Save Page</button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Page Title</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={editingPage.title || ''}
                            onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Slug (URL path)</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={editingPage.slug || ''}
                            onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })}
                        />
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Sections</h3>
                        <div className="space-y-4">
                            {editingPage.sections?.map((section, idx) => (
                                <div key={section.id} className="border p-4 rounded bg-gray-50 flex items-start space-x-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-green-700">{section.type} Section</span>
                                            <div className="space-x-2">
                                                <button onClick={() => moveSection(section.id, 'up')} className="text-gray-500 hover:text-black">↑</button>
                                                <button onClick={() => moveSection(section.id, 'down')} className="text-gray-500 hover:text-black">↓</button>
                                                <button onClick={() => removeSection(section.id)} className="text-red-500">Remove</button>
                                            </div>
                                        </div>
                                        {/* Render specific editor based on type */}
                                        {section.type === 'HERO' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <input className="p-2 border rounded" value={section.content.title} onChange={e => {
                                                    const newSections = [...(editingPage.sections || [])];
                                                    newSections[idx].content.title = e.target.value;
                                                    setEditingPage({ ...editingPage, sections: newSections });
                                                }} placeholder="Title" />
                                                <input className="p-2 border rounded" value={section.content.subtitle} onChange={e => {
                                                    const newSections = [...(editingPage.sections || [])];
                                                    newSections[idx].content.subtitle = e.target.value;
                                                    setEditingPage({ ...editingPage, sections: newSections });
                                                }} placeholder="Subtitle" />
                                            </div>
                                        )}
                                        {section.type === 'FEATURES' && (
                                            <div className="space-y-2">
                                                {section.content.items?.map((item: any, itemIdx: number) => (
                                                    <div key={itemIdx} className="flex space-x-2">
                                                        <input className="p-2 border rounded flex-1" value={item.title} onChange={e => {
                                                            const newSections = [...(editingPage.sections || [])];
                                                            newSections[idx].content.items[itemIdx].title = e.target.value;
                                                            setEditingPage({ ...editingPage, sections: newSections });
                                                        }} placeholder="Feature title" />
                                                        <button className="text-red-500" onClick={() => {
                                                            const newSections = [...(editingPage.sections || [])];
                                                            newSections[idx].content.items.splice(itemIdx, 1);
                                                            setEditingPage({ ...editingPage, sections: newSections });
                                                        }}>x</button>
                                                    </div>
                                                ))}
                                                <button onClick={() => {
                                                    const newSections = [...(editingPage.sections || [])];
                                                    if (!newSections[idx].content.items) newSections[idx].content.items = [];
                                                    newSections[idx].content.items.push({ title: 'New Feature', description: '' });
                                                    setEditingPage({ ...editingPage, sections: newSections });
                                                }} className="text-sm text-green-600">+ Add Feature</button>
                                            </div>
                                        )}
                                        {/* Other section types would have similar minimal editors */}
                                        {['PRICING', 'FAQ', 'TESTIMONIALS', 'NARRATIVE'].includes(section.type) && (
                                            <div className="text-gray-500 italic">Editor for {section.type} placeholder</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <button onClick={() => addSection('HERO')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Add Hero</button>
                            <button onClick={() => addSection('FEATURES')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Add Features</button>
                            <button onClick={() => addSection('PRICING')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Add Pricing</button>
                            <button onClick={() => addSection('FAQ')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Add FAQ</button>
                            <button onClick={() => addSection('TESTIMONIALS')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Add Testimonials</button>
                        </div>
                    </div>
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
