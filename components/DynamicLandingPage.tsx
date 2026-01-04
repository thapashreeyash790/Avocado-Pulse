
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { CMSPage, CMSSection } from '../types';
import '../components/LandingPage.css';

const DynamicLandingPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { cmsPages, fetchCMSPages } = useApp();
    const [page, setPage] = useState<CMSPage | null>(null);

    useEffect(() => {
        if (cmsPages.length === 0) {
            fetchCMSPages();
        }
    }, [cmsPages.length, fetchCMSPages]);

    useEffect(() => {
        const found = cmsPages.find(p => p.slug === (slug || 'index'));
        if (found) setPage(found);
    }, [cmsPages, slug]);

    if (!page) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen py-20 bg-gray-50">
                <h1 className="text-4xl font-bold text-gray-800">Page Not Found</h1>
                <p className="mt-4 text-gray-600">The landing page you are looking for does not exist.</p>
                <Link to="/" className="mt-8 px-6 py-3 bg-green-600 text-white rounded-full">Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="landing-container">
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

            {page.sections.sort((a, b) => a.order - b.order).map(section => (
                <SectionRenderer key={section.id} section={section} />
            ))}

            <footer className="py-20 bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="logo-text text-2xl font-black mb-8">Avocado Pulse</div>
                    <p className="text-gray-500">© 2026 Avocado Pulse. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

const SectionRenderer: React.FC<{ section: CMSSection }> = ({ section }) => {
    switch (section.type) {
        case 'HERO':
            return (
                <section className="hero-section pt-40 pb-32">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h1 className="hero-title text-6xl md:text-7xl font-black mb-6 leading-[1.1]">
                            {section.content.title?.split(' ').map((word: string, i: number) => (
                                word.toLowerCase().includes('chaotic') ? <span key={i} className="highlight">{word} </span> : word + ' '
                            ))}
                        </h1>
                        <p className="hero-subtitle text-xl md:text-2xl text-gray-600 mb-12">
                            {section.content.subtitle}
                        </p>
                        <Link to="/signup" className="cta-button primary px-10 py-5 bg-green-600 text-white rounded-xl text-xl font-bold">
                            {section.content.cta || 'Start your free trial'} →
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
                                    <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
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
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <div className="text-4xl font-black mb-6">{plan.price}</div>
                                    <ul className="text-left space-y-4 mb-8">
                                        {plan.features?.map((f: string, fi: number) => (
                                            <li key={fi} className="flex items-center gap-2">
                                                <span className="text-green-600">✓</span> {f}
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
        default:
            return (
                <div className="py-20 text-center border-b">
                    <p className="text-gray-400 italic">Section type {section.type} renderer not fully implemented</p>
                </div>
            );
    }
};

export default DynamicLandingPage;
