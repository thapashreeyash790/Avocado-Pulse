import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    Clock,
    ShieldCheck,
    Users,
    Zap,
    ArrowRight,
    Play
} from 'lucide-react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-logo">
                    <Zap size={28} fill="currentColor" />
                    <span>Avocado Pulse</span>
                </div>
                <div className="nav-links">
                    <a href="#how-it-works" className="nav-link">How it Works</a>
                    <a href="#features" className="nav-link">Features</a>
                    <button className="btn-signin btn-outline" onClick={() => navigate('/login')}>Sign In</button>
                    <button className="btn-signin btn-solid" onClick={() => navigate('/signup')}>Get Started</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1>
                        Wrestling with <span className="highlight">chaotic</span> projects?
                    </h1>
                    <p className="hero-subtitle">
                        The world's most delightfully simple project management tool.
                        No bloat, no confusion, just progress.
                    </p>
                    <div className="hero-btns">
                        <button className="btn-signin btn-solid btn-large" onClick={() => navigate('/signup')}>
                            Start your free trial <ArrowRight style={{ marginLeft: '8px', display: 'inline' }} />
                        </button>
                    </div>
                </div>
                <div className="hero-image-container">
                    <img
                        src="/assets/hero.png"
                        alt="Avocado Dashboard Preview"
                        className="hero-image"
                    />
                </div>
            </section>

            {/* Narrative Section */}
            <section className="narrative-section">
                <h2>Before & After Avocado</h2>
                <div className="narrative-grid">
                    <div className="narrative-card">
                        <h3>Without Avocado</h3>
                        <p>Scattered emails, lost files, "Wait, who's doing what?", and endless Slack pings. Total chaos.</p>
                    </div>
                    <div className="narrative-card solution">
                        <h3>With Avocado Pulse</h3>
                        <p>One place for everything. Clear assignments, real-time progress, and high-fives all around.</p>
                    </div>
                </div>
            </section>

            {/* Video Walkthrough Section */}
            <section className="video-section" id="how-it-works">
                <h2>See it in action</h2>
                <p className="hero-subtitle">Take a 2-minute tour of how Avocado Pulse transforms your team's workflow.</p>
                <div className="video-container">
                    <img
                        src="/assets/video_thumb.png"
                        alt="Video Walkthrough Thumbnail"
                        className="video-thumb"
                    />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(44, 140, 51, 0.9)',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 0 30px rgba(0,0,0,0.3)'
                    }}>
                        <Play size={48} fill="currentColor" />
                    </div>
                </div>
            </section>

            {/* Feature Section */}
            <section className="features-section" id="features">
                <div className="feature-item">
                    <div className="feature-text">
                        <div className="feature-icon-box"><Clock /></div>
                        <h2>Smart Scheduling</h2>
                        <p>Never miss a deadline. Our visual timelines keep everyone synchronized and aware of what's coming next.</p>
                    </div>
                    <div className="feature-visual">
                        <CheckCircle2 size={300} color="#2c8c33" opacity={0.1} />
                    </div>
                </div>

                <div className="feature-item">
                    <div className="feature-text">
                        <div className="feature-icon-box"><Users /></div>
                        <h2>Team Transparency</h2>
                        <p>Know exactly who is working on what. Real-time activity logs provide the visibility you need without the micromanagement.</p>
                    </div>
                    <div className="feature-visual">
                        <ShieldCheck size={300} color="#ffd700" opacity={0.1} />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="footer-section">
                <div className="footer-cta">
                    <h2>Ready to get organized?</h2>
                    <button className="btn-signin btn-solid btn-large" onClick={() => navigate('/signup')}>
                        Join 10,000+ happy teams
                    </button>
                    <p style={{ marginTop: '1.5rem', opacity: 0.7 }}>No credit card required. Cancel anytime.</p>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
