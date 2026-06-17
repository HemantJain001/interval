'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAppState } from '@/context/StateContext';

export default function DashboardLayout({ children }) {
    const { isLoading } = useAppState();

    if (isLoading) {
        // Render a loading state matching the theme
        return (
            <div 
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: 'var(--bg-canvas, #0d0d0d)',
                    color: 'var(--text-secondary, rgba(255,255,255,0.62))',
                    fontFamily: 'var(--font-body, sans-serif)'
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <svg 
                        style={{ animation: 'spin 1s linear infinite', marginBottom: '16px', color: 'var(--primary, #6366f1)' }} 
                        viewBox="0 0 24 24" 
                        width="38" 
                        height="38" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.15"></circle>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                    </svg>
                    <p style={{ letterSpacing: '0.05em', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase' }}>
                        Loading session state...
                    </p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container" id="appContainer">
            <Sidebar />
            <main className="main-content">
                <Header />
                <div className="view-container">
                    {children}
                </div>
            </main>
        </div>
    );
}
