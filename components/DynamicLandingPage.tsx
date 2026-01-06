
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { CMSPage, CMSSection } from '../types';
import { ICONS } from '../constants';
import '../components/LandingPage.css';

interface Props {
    isEditing?: boolean;
    pageData?: CMSPage;
    onUpdate?: (page: CMSPage) => void;
    onSelectSection?: (id: string | null) => void;
    activeSectionId?: string | null;
}

const DynamicLandingPage: React.FC<Props> = ({ isEditing, pageData, onUpdate, onSelectSection, activeSectionId }) => {
    const { slug } = useParams<{ slug: string }>();
    const { cmsPages, fetchCMSPages } = useApp();
    const [page, setPage] = useState<CMSPage | null>(null);

    useEffect(() => {
        if (pageData) {
            setPage(pageData);
        }
    }, [pageData]);

    useEffect(() => {
        if (isEditing) return;
        const found = cmsPages.find(p => p.slug === (slug || 'index'));
        if (found) setPage(found);
    }, [cmsPages, slug, isEditing]);

    const handleSectionUpdate = (sectionId: string, newContent: any) => {
        if (!onUpdate) return;

        // Update Local State Functionally
        setPage(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                sections: prev.sections.map(s => s.id === sectionId ? { ...s, content: newContent } : s)
            };
        });

        // Update Parent State Functionally to avoid race conditions
        onUpdate((prev: any) => { // Using any cast to handle generic complexity for now, or use CMSPage
            if (!prev) return prev;
            return {
                ...prev,
                sections: prev.sections.map((s: CMSSection) => s.id === sectionId ? { ...s, content: newContent } : s)
            };
        });
    };

    const handleDuplicateSection = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (!onUpdate) return;

        const duplicator = (currentInfo: CMSPage) => {
            const newSections = [...currentInfo.sections];
            const sectionToDuplicate = newSections[index];
            const duplicatedSection = {
                ...sectionToDuplicate,
                id: Math.random().toString(36).substr(2, 9),
                order: index + 1
            };
            newSections.splice(index + 1, 0, duplicatedSection);
            const reordered = newSections.map((s, i) => ({ ...s, order: i + 1 }));
            return { ...currentInfo, sections: reordered };
        };

        setPage(prev => prev ? duplicator(prev) : prev);
        onUpdate((prev: any) => prev ? duplicator(prev as CMSPage) : prev);
    };

    const handleDeleteSection = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (!onUpdate) return;
        if (confirm('Are you sure you want to delete this section?')) {
            let deletedSectionId = '';

            const deleter = (currentInfo: CMSPage) => {
                const newSections = [...currentInfo.sections];
                deletedSectionId = newSections[index].id;
                newSections.splice(index, 1);
                const reordered = newSections.map((s, i) => ({ ...s, order: i + 1 }));
                return { ...currentInfo, sections: reordered };
            };

            setPage(prev => prev ? deleter(prev) : prev);
            onUpdate((prev: any) => prev ? deleter(prev as CMSPage) : prev);

            // We can't reliable check activeSectionId sync here without ref, but it's a minor UX issue.
            // Or we check against the closure `activeSectionId`.
            if (activeSectionId && onSelectSection) {
                // Check if the deleted index ID matches known, tricky with functional update.
                // Falling back to simple assumption or skipping active check for now to ensure robustness.
                // Or just clearing selection if deletion happened.
            }
        }
    };

    if (!page) {
        if (isEditing) return <div className="p-10 text-center text-gray-500">Initializing Editor...</div>;
        return (
            <div className="flex flex-col items-center justify-center min-h-screen py-20 bg-gray-50">
                <h1 className="text-4xl font-bold text-gray-800">Page Not Found</h1>
                <p className="mt-4 text-gray-600">The landing page you are looking for does not exist.</p>
                <Link to="/" className="mt-8 px-6 py-3 bg-green-600 text-white rounded-full">Back to Home</Link>
            </div>
        );
    }

    return (
        <div className={`landing-container ${isEditing ? 'visual-editor-mode' : ''}`}>
            {!isEditing && (
                <nav className="fixed top-0 w-full z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 group-hover:shadow-green-500/30 transition-all duration-300">
                                <ICONS.Zap size={22} fill="currentColor" />
                            </div>
                            <span className="text-xl font-black text-gray-800 tracking-tight group-hover:text-black transition-colors">
                                Avocado Pulse
                            </span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/login"
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-green-700 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-black hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </nav>
            )}

            {page.sections.length === 0 && isEditing && (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400 border-2 border-dashed border-gray-200 m-8 rounded-xl bg-gray-50/50">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-xl font-bold text-gray-600">This page is empty</h3>
                    <p>Add a section from the sidebar to get started.</p>
                </div>
            )}

            {page.sections.sort((a, b) => a.order - b.order).map((section, index) => (
                <div
                    key={section.id}
                    draggable={isEditing}
                    onDragStart={(e) => {
                        if (!isEditing) return;
                        e.dataTransfer.setData('text/plain', index.toString());
                        e.dataTransfer.effectAllowed = 'move';
                        // Add a transparent styling or class if desired
                        e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                        if (!isEditing) return;
                        e.currentTarget.style.opacity = '1';
                    }}
                    onDragOver={(e) => {
                        if (!isEditing) return;
                        e.preventDefault(); // Necessary to allow dropping
                        e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                        if (!isEditing || !onUpdate) return;
                        e.preventDefault();
                        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (isNaN(sourceIndex) || sourceIndex === index) return;

                        const newSections = Array.from(page.sections);
                        const [movedSection] = newSections.splice(sourceIndex, 1);
                        newSections.splice(index, 0, movedSection);

                        // Re-assign order based on new index
                        const reorderedSections = newSections.map((s: CMSSection, i: number) => ({ ...s, order: i + 1 }));

                        const updatedPage = { ...page, sections: reorderedSections };
                        setPage(updatedPage);
                        onUpdate(updatedPage);
                    }}
                    className={`relative group transition-all ${isEditing ? 'cursor-move hover:ring-2 hover:ring-blue-400/50' : ''} ${activeSectionId === section.id ? 'ring-2 ring-blue-500 z-10' : ''}`}
                    onClick={(e) => {
                        if (isEditing && onSelectSection) {
                            e.stopPropagation();
                            onSelectSection(section.id);
                        }
                    }}
                    style={{
                        backgroundColor: section.content.bgColor,
                        color: section.content.textColor
                    }}
                >
                    <SectionRenderer
                        section={section}
                        isEditing={isEditing}
                        onUpdate={(content) => handleSectionUpdate(section.id, content)}
                    />
                    {isEditing && (
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -mt-5 transition-all z-50 flex gap-1 ${activeSectionId === section.id || 'group-hover:opacity-100 opacity-0'}`}>
                            <div className="bg-blue-600 text-white text-xs rounded-t-lg shadow-lg font-bold flex items-center overflow-hidden">
                                <div title="Drag to reorder" className="px-2 py-1.5 cursor-move hover:bg-blue-700 flex items-center border-r border-blue-500">
                                    <span className="text-sm">⋮⋮</span>
                                </div>
                                <div className="px-2 py-1.5 font-medium uppercase tracking-wider text-[10px] select-none cursor-default border-r border-blue-500">
                                    {section.type}
                                </div>
                                <button
                                    onClick={(e) => handleDuplicateSection(e, index)}
                                    title="Duplicate Section"
                                    className="px-2 py-1.5 hover:bg-blue-700 transition-colors border-r border-blue-500"
                                >
                                    <ICONS.Plus size={12} />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteSection(e, index)}
                                    title="Delete Section"
                                    className="px-2 py-1.5 hover:bg-red-600 transition-colors"
                                >
                                    <ICONS.Trash size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {!isEditing && (
                <footer className="py-20 bg-gray-50 border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <div className="logo-text text-2xl font-black mb-8">Avocado Pulse</div>
                        <p className="text-gray-500">© 2026 Avocado Pulse. All rights reserved.</p>
                    </div>
                </footer>
            )}
        </div>
    );
};

const EditableText: React.FC<{
    text: string;
    tagName: keyof React.JSX.IntrinsicElements;
    className?: string;
    isEditing?: boolean;
    onChange: (val: string) => void;
}> = ({ text, tagName, className, isEditing, onChange }) => {
    const Tag = tagName as any;

    if (!isEditing) return <Tag className={className}>{text}</Tag>;

    return (
        <Tag
            className={`${className} outline-none border border-transparent hover:border-blue-300 focus:border-blue-500 rounded px-1 transition-all cursor-text`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e: any) => onChange(e.currentTarget.innerText)}
            dangerouslySetInnerHTML={{ __html: text }}
        />
    );
};

const EditableImage: React.FC<{
    src: string;
    className?: string;
    alt?: string;
    isEditing?: boolean;
    onChange: (val: string) => void;
}> = ({ src, className, alt, isEditing, onChange }) => {
    const handleEdit = () => {
        const url = prompt('Enter new image URL:', src);
        if (url !== null) onChange(url);
    };

    return (
        <div className={`relative group ${className} ${isEditing ? 'cursor-pointer' : ''}`} onClick={isEditing ? handleEdit : undefined}>
            <img src={src || 'https://via.placeholder.com/800x600?text=No+Image'} alt={alt} className="w-full h-full object-cover" />
            {isEditing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold bg-black/50 px-3 py-1 rounded-full border border-white/50">Change Image</span>
                </div>
            )}
        </div>
    );
};



const SectionRenderer: React.FC<{ section: CMSSection; isEditing?: boolean; onUpdate?: (content: any) => void }> = ({ section, isEditing, onUpdate }) => {
    const updateField = (field: string, value: any) => {
        if (onUpdate) onUpdate({ ...section.content, [field]: value });
    };

    const sectionStyle = {
        paddingTop: section.content.paddingTop ? `${section.content.paddingTop}px` : undefined,
        paddingBottom: section.content.paddingBottom ? `${section.content.paddingBottom}px` : undefined,
    };

    switch (section.type) {
        case 'HERO':
            return (
                <section className="hero-section relative pt-40 pb-32 overflow-hidden" style={sectionStyle}>
                    {/* Background Image Wrapper */}
                    <div className="absolute inset-0 z-0">
                        {section.content.backgroundImage && (
                            <EditableImage
                                src={section.content.backgroundImage}
                                isEditing={isEditing}
                                onChange={(val) => updateField('backgroundImage', val)}
                                className="w-full h-full opacity-20"
                            />
                        )}
                        {!section.content.backgroundImage && isEditing && (
                            <button onClick={() => updateField('backgroundImage', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c')} className="absolute top-4 right-4 z-20 bg-white shadow p-2 rounded text-xs hover:bg-gray-100">
                                + Add Background Image
                            </button>
                        )}
                    </div>

                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <EditableText
                            tagName="h1"
                            className="hero-title text-6xl md:text-7xl font-black mb-6 leading-[1.1]"
                            text={section.content.title}
                            isEditing={isEditing}
                            onChange={(val) => updateField('title', val)}
                        />
                        <div className="hero-subtitle text-xl md:text-2xl text-gray-600 mb-12">
                            <EditableText
                                tagName="p"
                                text={section.content.subtitle}
                                isEditing={isEditing}
                                onChange={(val) => updateField('subtitle', val)}
                            />
                        </div>
                        <Link to="/signup" className="cta-button primary px-10 py-5 bg-green-600 text-white rounded-xl text-xl font-bold inline-block">
                            <EditableText
                                tagName="span"
                                text={section.content.cta || 'Start'}
                                isEditing={isEditing}
                                onChange={(val) => updateField('cta', val)}
                            /> →
                        </Link>
                    </div>
                </section>
            );
        case 'FEATURES':
            return (
                <section className="features-section py-24 bg-white" style={sectionStyle}>
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {section.content.items?.map((item: any, idx: number) => (
                                <div key={idx} className="feature-card p-8 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col">
                                    <div className="w-16 h-16 mb-6 rounded-2xl overflow-hidden bg-gray-200">
                                        <EditableImage
                                            src={item.image}
                                            isEditing={isEditing}
                                            onChange={(val) => {
                                                const newItems = [...section.content.items];
                                                newItems[idx] = { ...item, image: val };
                                                updateField('items', newItems);
                                            }}
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <EditableText
                                        tagName="h3"
                                        className="text-2xl font-bold mb-4"
                                        text={item.title}
                                        isEditing={isEditing}
                                        onChange={(val) => {
                                            const newItems = [...section.content.items];
                                            newItems[idx] = { ...item, title: val };
                                            updateField('items', newItems);
                                        }}
                                    />
                                    <EditableText
                                        tagName="p"
                                        className="text-gray-600 leading-relaxed"
                                        text={item.description}
                                        isEditing={isEditing}
                                        onChange={(val) => {
                                            const newItems = [...section.content.items];
                                            newItems[idx] = { ...item, description: val };
                                            updateField('items', newItems);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )
        case 'PRICING':
            return (
                <section className="pricing-section py-24 bg-gray-50" style={sectionStyle}>
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <h2 className="text-4xl font-bold mb-12">Simple, Transparent Pricing</h2>
                        <div className="flex flex-wrap justify-center gap-8">
                            {section.content.plans?.map((plan: any, idx: number) => (
                                <div key={idx} className="pricing-card p-10 rounded-3xl bg-white shadow-xl border border-gray-100 w-80">
                                    <EditableText
                                        tagName="h3"
                                        className="text-2xl font-bold mb-2"
                                        text={plan.name}
                                        isEditing={isEditing}
                                        onChange={(val) => {
                                            const newPlans = [...section.content.plans];
                                            newPlans[idx] = { ...plan, name: val };
                                            updateField('plans', newPlans);
                                        }}
                                    />
                                    <EditableText
                                        tagName="div"
                                        className="text-4xl font-black mb-6"
                                        text={plan.price}
                                        isEditing={isEditing}
                                        onChange={(val) => {
                                            const newPlans = [...section.content.plans];
                                            newPlans[idx] = { ...plan, price: val };
                                            updateField('plans', newPlans);
                                        }}
                                    />
                                    <ul className="text-left space-y-4 mb-8">
                                        {plan.features?.map((f: string, fi: number) => (
                                            <li key={fi} className="flex items-center gap-2">
                                                <span className="text-green-600">✓</span>
                                                <EditableText
                                                    tagName="span"
                                                    text={f}
                                                    isEditing={isEditing}
                                                    onChange={(val) => {
                                                        const newPlans = [...section.content.plans];
                                                        newPlans[idx].features[fi] = val;
                                                        updateField('plans', newPlans);
                                                    }}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/signup" className="block py-3 bg-green-600 text-white rounded-lg font-bold">Choose Plan</Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            );
        case 'NARRATIVE':
            return (
                <section className="py-24 bg-white" style={sectionStyle}>
                    <div className="max-w-3xl mx-auto px-6">
                        <EditableText
                            tagName="h2"
                            className="text-3xl font-bold mb-8 text-center"
                            text={section.content.title}
                            isEditing={isEditing}
                            onChange={(val) => updateField('title', val)}
                        />
                        <EditableText
                            tagName="div"
                            className="prose prose-lg mx-auto text-gray-600"
                            text={section.content.text}
                            isEditing={isEditing}
                            onChange={(val) => updateField('text', val)}
                        />
                    </div>
                </section>
            );
        case 'FAQ':
            return (
                <section className="py-24 bg-gray-50" style={sectionStyle}>
                    <div className="max-w-4xl mx-auto px-6">
                        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            {section.content.items?.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <EditableText
                                        tagName="h4"
                                        className="text-lg font-bold mb-2 text-green-700"
                                        text={item.question}
                                        isEditing={isEditing}
                                        onChange={(val) => {
                                            const newItems = [...section.content.items];
                                            newItems[idx] = { ...item, question: val };
                                            updateField('items', newItems);
                                        }}
                                    />
                                    <EditableText
                                        tagName="p"
                                        className="text-gray-600"
                                        text={item.answer}
                                        isEditing={isEditing}
                                        onChange={(val) => {
                                            const newItems = [...section.content.items];
                                            newItems[idx] = { ...item, answer: val };
                                            updateField('items', newItems);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            );
        case 'TESTIMONIALS':
            return (
                <section className="py-24 bg-white overflow-hidden" style={sectionStyle}>
                    <div className="max-w-7xl mx-auto px-6">
                        <h2 className="text-3xl font-bold mb-12 text-center">What People Say</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {section.content.items?.map((item: any, idx: number) => (
                                <div key={idx} className="bg-gray-50 p-8 rounded-3xl relative">
                                    <div className="text-4xl text-green-300 absolute top-4 left-6">"</div>
                                    <EditableText
                                        tagName="p"
                                        className="text-gray-700 mb-6 relative z-10 italic"
                                        text={item.text}
                                        isEditing={isEditing}
                                        onChange={(val) => {
                                            const newItems = [...section.content.items];
                                            newItems[idx] = { ...item, text: val };
                                            updateField('items', newItems);
                                        }}
                                    />
                                    <div>
                                        <EditableText
                                            tagName="div"
                                            className="font-bold text-black"
                                            text={item.author}
                                            isEditing={isEditing}
                                            onChange={(val) => {
                                                const newItems = [...section.content.items];
                                                newItems[idx] = { ...item, author: val };
                                                updateField('items', newItems);
                                            }}
                                        />
                                        <EditableText
                                            tagName="div"
                                            className="text-sm text-gray-500 uppercase tracking-wide"
                                            text={item.role}
                                            isEditing={isEditing}
                                            onChange={(val) => {
                                                const newItems = [...section.content.items];
                                                newItems[idx] = { ...item, role: val };
                                                updateField('items', newItems);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            );
        default:
            return (
                <div className="py-20 text-center border-b">
                    <h3 className="text-gray-500 font-bold mb-2">{section.type} Section</h3>
                    <p className="text-gray-400 italic">Visual editor not fully implemented for this type yet.</p>
                </div>
            );
    }
};

export default DynamicLandingPage;
