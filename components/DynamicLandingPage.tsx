
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { CMSPage, CMSSection } from '../types';
import '../components/LandingPage.css';

interface Props {
    isEditing?: boolean;
    pageData?: CMSPage;
    onUpdate?: (page: CMSPage) => void;
}

const DynamicLandingPage: React.FC<Props> = ({ isEditing, pageData, onUpdate }) => {
    const { slug } = useParams<{ slug: string }>();
    const { cmsPages, fetchCMSPages } = useApp();
    const [page, setPage] = useState<CMSPage | null>(null);

    useEffect(() => {
        if (isEditing && pageData) {
            setPage(pageData);
            return;
        }
        if (cmsPages.length === 0) {
            fetchCMSPages();
        }
    }, [cmsPages.length, fetchCMSPages, isEditing, pageData]);

    useEffect(() => {
        if (isEditing) return;
        const found = cmsPages.find(p => p.slug === (slug || 'index'));
        if (found) setPage(found);
    }, [cmsPages, slug, isEditing]);

    const handleSectionUpdate = (sectionId: string, newContent: any) => {
        if (!page || !onUpdate) return;
        const updatedSections = page.sections.map(s => s.id === sectionId ? { ...s, content: newContent } : s);
        const updatedPage = { ...page, sections: updatedSections };
        setPage(updatedPage);
        onUpdate(updatedPage);
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
                <nav className="landing-nav fixed top-0 w-full z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <Link to="/" className="logo-text text-2xl font-black flex items-center gap-2">
                            <span className="text-green-600">⚡</span> Avocado Pulse
                        </Link>
                        <div className="flex items-center gap-8">
                            <Link to="/login" className="px-6 py-2 border-2 border-green-600/20 rounded-lg text-green-700 font-bold hover:bg-green-50 transition-all">Sign In</Link>
                            <Link to="/signup" className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">Get Started</Link>
                        </div>
                    </div>
                </nav>
            )}

            {page.sections.sort((a, b) => a.order - b.order).map(section => (
                <div key={section.id} className="relative group">
                    <SectionRenderer
                        section={section}
                        isEditing={isEditing}
                        onUpdate={(content) => handleSectionUpdate(section.id, content)}
                    />
                    {isEditing && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-lg rounded p-2 z-50 flex gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{section.type}</span>
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

const SectionRenderer: React.FC<{ section: CMSSection; isEditing?: boolean; onUpdate?: (content: any) => void }> = ({ section, isEditing, onUpdate }) => {
    const updateField = (field: string, value: any) => {
        if (onUpdate) onUpdate({ ...section.content, [field]: value });
    };

    switch (section.type) {
        case 'HERO':
            return (
                <section className="hero-section pt-40 pb-32">
                    <div className="max-w-4xl mx-auto px-6 text-center">
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
                <section className="features-section py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {section.content.items?.map((item: any, idx: number) => (
                                <div key={idx} className="feature-card p-8 rounded-3xl bg-gray-50 border border-gray-100">
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
                <section className="pricing-section py-24 bg-gray-50">
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
                <section className="py-24 bg-white">
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
                <section className="py-24 bg-gray-50">
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
                <section className="py-24 bg-white overflow-hidden">
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
