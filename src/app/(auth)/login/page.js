'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import '@/app/landing.css';

export default function LoginPage() {
    const { status } = useSession();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    // Handle scroll state for navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer for scroll reveal animations
    useEffect(() => {
        const reveals = document.querySelectorAll('.reveal');
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReduced) {
            reveals.forEach((el) => {
                el.classList.add('will-reveal');
                el.classList.add('stagger-child');
            });

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -40px 0px'
            });

            reveals.forEach(el => observer.observe(el));
            return () => observer.disconnect();
        }
    }, []);

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/' });
    };

    const heatmapLevels = [0, 0, 1, 0, 2, 1, 0, 1, 2, 0, 0, 1, 2, 2, 0, 1, 0, 2, 1, 0, 1, 2, 0, 0, 1, 2, 1, 0, 2, 1, 2, 0];

    return (
        <div className="login-page-root" style={{ backgroundColor: 'var(--bg-canvas)', minHeight: '100vh', color: 'var(--text-primary)' }}>
            
            {/* Header Navigation */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
                <div className="container navbar-inner">
                    <Link href="#" className="nav-logo" aria-label="Interval home">
                        <div className="nav-logo-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <span className="nav-logo-text">Interval</span>
                    </Link>

                    <div className="nav-links">
                        <a href="#how-it-works" className="nav-link-ghost">How it works</a>
                        <a href="#features" className="nav-link-ghost">Features</a>
                        <Link href="/?bypass=true" className="nav-link-ghost">
                            Bypass Auth (Offline)
                        </Link>
                        <button onClick={handleGoogleSignIn} className="btn-nav-cta">
                            Sign In
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" aria-hidden="true">
                                <line x1="7" y1="17" x2="17" y2="7"></line>
                                <polyline points="7 7 17 7 17 17"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero" id="hero" aria-labelledby="hero-headline">
                <div className="container hero-inner">
                    
                    {/* Left Column: Heading & Value Prop */}
                    <div className="hero-text-block">
                        <div className="hero-badge reveal" style={{ '--i': 0 }}>
                            <span className="hero-badge-dot" aria-hidden="true"></span>
                            Spaced Repetition · Habit Tracking
                        </div>
                        <h1 className="hero-headline reveal" style={{ '--i': 1 }} id="hero-headline">
                            Master anything.<br />
                            <em>One review</em> at a time.
                        </h1>
                        <p className="hero-sub reveal" style={{ '--i': 2 }}>
                            Interval combines a spaced repetition scheduler, 455-problem DSA tracker, and daily habit logging into one focused dashboard. Built for learners who mean it.
                        </p>
                        <div className="hero-actions reveal" style={{ '--i': 3 }}>
                            <button onClick={handleGoogleSignIn} className="btn-primary">
                                Try it free
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" aria-hidden="true">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="13 6 19 12 13 18"></polyline>
                                </svg>
                            </button>
                            <a href="#how-it-works" className="btn-secondary-outline">
                                See how it works
                            </a>
                            <Link href="/?bypass=true" className="btn-secondary-outline">
                                Run Offline
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Google Login Card & Interface Preview */}
                    <div className="hero-visual-group reveal" style={{ '--i': 2 }}>
                        <div className="mockup-glow" aria-hidden="true"></div>
                        
                        {/* Login Card */}
                        <div className="hero-login-card" id="loginCard">
                            <h2 className="login-card-title">Sign In</h2>
                            <p className="login-card-desc">
                                Sync your spaced repetition schedules and habits across all your devices.
                            </p>
                            
                            <button onClick={handleGoogleSignIn} className="btn-google-login" id="googleLoginBtn">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ flexShrink: 0 }} aria-hidden="true">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </button>

                            <div className="login-card-footer">
                                <span className="security-badge">
                                    <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ flexShrink: 0 }}>
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    Secure OAuth via Supabase
                                </span>
                            </div>
                        </div>

                        {/* Interactive UI Mockup */}
                        <div className="mockup-window" aria-hidden="true">
                            <div className="mockup-titlebar">
                                <span className="titlebar-dot dot-red"></span>
                                <span className="titlebar-dot dot-amber"></span>
                                <span className="titlebar-dot dot-green"></span>
                                <span className="titlebar-label">interval — dashboard</span>
                            </div>
                            <div className="mockup-body">
                                <div className="mockup-sidebar">
                                    <div className="mock-nav-item active">
                                        <span className="mock-nav-dot"></span> Dashboard
                                    </div>
                                    <div className="mock-nav-item">
                                        <span className="mock-nav-dot"></span> DSA Sheet
                                    </div>
                                    <div className="mock-nav-item">
                                        <span className="mock-nav-dot"></span> Settings
                                    </div>
                                </div>
                                <div className="mockup-content">
                                    <div className="mock-section-label">Due Today — 3 cards</div>
                                    
                                    <div className="mock-card">
                                        <div className="mock-card-row">
                                            <span className="mock-card-title">Binary Search Tree — Insert</span>
                                            <span className="mock-badge badge-red">HARD</span>
                                        </div>
                                        <div className="mock-rate-row">
                                            <button className="mock-rate-btn mock-rate-easy" disabled>Easy (7d)</button>
                                            <button className="mock-rate-btn mock-rate-medium" disabled>Medium (3d)</button>
                                            <button className="mock-rate-btn mock-rate-hard" disabled>Hard (1d)</button>
                                        </div>
                                    </div>

                                    <div className="mock-card">
                                        <div className="mock-card-row">
                                            <span className="mock-card-title">Two Sum — HashMap approach</span>
                                            <span className="mock-badge badge-amber">MEDIUM</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mock-section-label" style={{ marginTop: '4px' }}>Habit Consistency — 28 days</div>
                                    <div className="mock-heatmap">
                                        {heatmapLevels.map((level, idx) => (
                                            <div key={idx} className={`mock-heatmap-cell hcell-${level}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Statistics Strip */}
            <div className="stats-strip" role="region" aria-label="Product statistics">
                <div className="container">
                    <div className="stats-inner">
                        <div className="stat-item reveal" style={{ '--i': 0 }}>
                            <div className="stat-number"><span>455</span></div>
                            <div className="stat-label">DSA problems</div>
                        </div>
                        <div className="stat-item reveal" style={{ '--i': 1 }}>
                            <div className="stat-number"><span>5</span></div>
                            <div className="stat-label">Spaced intervals</div>
                        </div>
                        <div className="stat-item reveal" style={{ '--i': 2 }}>
                            <div className="stat-number">
                                <span>28</span>
                                <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)' }}>d</span>
                            </div>
                            <div className="stat-label">Habit heatmap</div>
                        </div>
                        <div className="stat-item reveal" style={{ '--i': 3 }}>
                            <div className="stat-number"><span>∞</span></div>
                            <div className="stat-label">Day streaks</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <section className="section" id="how-it-works" aria-labelledby="how-it-works-heading">
                <div className="container">
                    <div className="section-header reveal" style={{ '--i': 0 }}>
                        <h2 className="section-heading" id="how-it-works-heading">
                            A focused loop for serious learning
                        </h2>
                        <p className="section-sub">
                            Spaced repetition is proven neuroscience. Interval makes the method frictionless — log once, then follow the schedule.
                        </p>
                    </div>

                    <div className="steps-grid">
                        <div className="step-item reveal" style={{ '--i': 0 }}>
                            <div className="step-number" aria-label="Step 1">1</div>
                            <h3 className="step-title">Log it</h3>
                            <p className="step-desc">
                                Solve a DSA problem from the Striver sheet or add any custom topic. Tag the difficulty and add key recall notes.
                            </p>
                        </div>
                        <div className="step-item reveal" style={{ '--i': 1 }}>
                            <div className="step-number" aria-label="Step 2">2</div>
                            <h3 class="step-title">Schedule it</h3>
                            <p className="step-desc">
                                Interval automatically queues your next review across 5 intervals: 1, 3, 7, 14, and 30 days — adapting to how well you recalled it.
                            </p>
                        </div>
                        <div className="step-item reveal" style={{ '--i': 2 }}>
                            <div className="step-number" aria-label="Step 3">3</div>
                            <h3 className="step-title">Review it</h3>
                            <p className="step-desc">
                                Open the dashboard each day, see exactly what's due, rate your recall as Easy / Medium / Hard, and watch the schedule update instantly.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Grid Section */}
            <section className="section features-section" id="features" aria-labelledby="features-heading">
                <div className="container">
                    <div className="section-header reveal" style={{ '--i': 0 }}>
                        <h2 className="section-heading" id="features-heading">
                            Everything a serious learner needs
                        </h2>
                        <p className="section-sub">
                            No fluff. Just the tools that map directly to your daily study loop.
                        </p>
                    </div>

                    <div className="features-grid">
                        {/* Wide: Striver DSA */}
                        <div className="feature-card feature-card-wide reveal" style={{ '--i': 0 }}>
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                    <path d="M18 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path>
                                    <path d="M8 7h8M8 11h8M8 15h5"></path>
                                </svg>
                            </div>
                            <h3 className="feature-title">Striver A2Z DSA Sheet</h3>
                            <p className="feature-desc">
                                All 455 problems from Striver's famous A2Z curriculum — organised into 25 steps and searchable. Check off problems, watch tutorials, and send anything directly to your spaced repetition queue with one click.
                            </p>
                            <div className="feature-tag">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
                                    <path d="M9 18V5l12-2v13"></path>
                                    <circle cx="6" cy="18" r="3"></circle>
                                    <circle cx="18" cy="16" r="3"></circle>
                                </svg>
                                Arrays · Linked Lists · Trees · Graphs · DP
                            </div>
                        </div>

                        {/* Smart Intervals */}
                        <div className="feature-card reveal" style={{ '--i': 1 }}>
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                            <h3 className="feature-title">Smart Intervals</h3>
                            <p className="feature-desc">
                                A proven 5-bucket system (1 → 3 → 7 → 14 → 30 days). Hard resets, medium holds, easy advances. Built-in forgiveness logic so a missed day doesn't break your streak.
                            </p>
                            <div className="feature-tag">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                </svg>
                                Spaced repetition algorithm
                            </div>
                        </div>

                        {/* Habit Tracker */}
                        <div className="feature-card reveal" style={{ '--i': 0 }}>
                            <div className="feature-icon feature-icon-green">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                    <path d="M12 2C9.5 6.5 12 9.5 12 11.5C12 12.5 11.3 13.3 10.3 13.3C9.3 13.3 8.7 12.5 8.7 11.5C8.7 8.5 6 7 6 7C4.5 9.5 4 12.2 4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14C20 9.8 16 4 12 2Z"></path>
                                </svg>
                            </div>
                            <h3 className="feature-title">Daily Habit Tracker</h3>
                            <p className="feature-desc">
                                Log your gym workouts (Push / Pull / Legs / Cardio) and speaking practice sessions daily. Each entry is timestamped and linked to your streak.
                            </p>
                            <div className="feature-tag">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Gym · Communication practice
                            </div>
                        </div>

                        {/* Heatmap */}
                        <div className="feature-card reveal" style={{ '--i': 1 }}>
                            <div className="feature-icon feature-icon-green">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                </svg>
                            </div>
                            <h3 className="feature-title">Habit Heatmap</h3>
                            <p className="feature-desc">
                                A GitHub-style 28-day consistency grid. See your habit completion at a glance and find gaps before they turn into streaks of nothing.
                            </p>
                            <div className="feature-tag">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
                                    <path d="M3 3v18h18"></path>
                                    <polyline points="7 12 10 9 13 12 16 8 20 12"></polyline>
                                </svg>
                                4-week rolling view
                            </div>
                        </div>

                        {/* Cloud Sync */}
                        <div className="feature-card feature-card-wide reveal" style={{ '--i': 0 }}>
                            <div className="feature-icon feature-icon-amber">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                    <polyline points="16 16 12 12 8 16"></polyline>
                                    <line x1="12" y1="12" x2="12" y2="21"></line>
                                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                                </svg>
                            </div>
                            <h3 className="feature-title">Instant Cloud Sync</h3>
                            <p className="feature-desc">
                                Sign in with your Google account to sync your entire revision schedule and habit history across devices. All progress is saved automatically so you never lose your streaks.
                            </p>
                            <div className="feature-tag">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                Secure sync · JSON backup options
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technology Stack Strip */}
            <div className="tech-strip" role="region" aria-label="Technology stack">
                <div className="container">
                    <div className="tech-strip-inner">
                        <div className="tech-item reveal" style={{ '--i': 0 }}>
                            <svg className="tech-icon" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }}>
                                <circle cx="90" cy="90" r="90" fill="black" />
                                <path d="M149.508 157.52L69.142 54H54V126H65.817V70.686L135.263 160.279C140.297 159.529 145.071 158.588 149.508 157.52Z" fill="white" />
                                <rect x="115" y="54" width="12" height="72" fill="white" />
                            </svg>
                            <span className="tech-name">Next.js 16</span>
                            <span className="tech-desc">— hybrid rendering</span>
                        </div>
                        <div className="tech-item reveal" style={{ '--i': 1 }}>
                            <svg className="tech-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', backgroundColor: '#000', borderRadius: '4px', padding: '2px', color: '#fff' }}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span className="tech-name">NextAuth</span>
                            <span className="tech-desc">— secure sessions</span>
                        </div>
                        <div className="tech-item reveal" style={{ '--i': 2 }}>
                            <svg className="tech-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '20px', height: '20px' }}>
                                <rect width="24" height="24" rx="4" fill="#3ECF8E" />
                                <path d="M13.28 3.5L5.5 14.1h6.3L10.7 20.5l7.8-10.6H12.2L13.28 3.5z" fill="white" />
                            </svg>
                            <span className="tech-name">Supabase</span>
                            <span className="tech-desc">— postgres sync &amp; RLS</span>
                        </div>
                        <div className="tech-item reveal" style={{ '--i': 3 }}>
                            <svg className="tech-icon" viewBox="-11.5 -10.23174 23 20.46348" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', backgroundColor: '#20232a', borderRadius: '4px', padding: '2px' }}>
                                <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
                                <g stroke="#61dafb" strokeWidth="1" fill="none">
                                    <ellipse rx="11" ry="4.2"/>
                                    <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
                                    <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
                                </g>
                            </svg>
                            <span className="tech-name">React 19</span>
                            <span className="tech-desc">— dynamic app state</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final CTA Section */}
            <section className="cta-section" aria-labelledby="cta-heading">
                <div className="container">
                    <div className="cta-inner">
                        <h2 className="cta-headline reveal" style={{ '--i': 1 }} id="cta-heading">
                            Stop forgetting.<br />Start building streaks.
                        </h2>
                        <p className="cta-sub reveal" style={{ '--i': 2 }}>
                            Sign in with Google to access your spaced repetition dashboard and save your learning streaks.
                        </p>
                        <div className="cta-actions reveal" style={{ '--i': 3 }}>
                            <button onClick={handleGoogleSignIn} className="btn-cta-large" id="ctaPrimaryBtn">
                                Try Interval free
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" aria-hidden="true">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="13 6 19 12 13 18"></polyline>
                                </svg>
                            </button>
                        </div>
                        <p className="cta-note reveal" style={{ '--i': 4 }}>No credit card · Instantly ready · JSON export anytime</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer" role="contentinfo">
                <div className="container">
                    <div className="footer-inner">
                        <div>
                            <div className="footer-logo">
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--indigo)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span className="footer-logo-text">Interval</span>
                            </div>
                            <p className="footer-tagline">Spaced repetition + habit tracking for serious learners.</p>
                        </div>

                        <nav className="footer-links" aria-label="Footer navigation">
                            <a href="#how-it-works" class="footer-link">How it works</a>
                            <a href="#features" class="footer-link">Features</a>
                            <Link href="/?bypass=true" className="footer-link">Bypass Auth (Offline)</Link>
                            <Link href="/" className="footer-link">Open App</Link>
                        </nav>

                        <p className="footer-copy">© 2026 Interval. Built with focus.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
