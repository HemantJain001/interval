'use client';

import React from 'react';
import { useAppState } from '@/context/StateContext';

export default function ToastContainer() {
    const { toasts, removeToast } = useAppState();

    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="toast-container" id="toastContainer">
            {toasts.map(toast => {
                let statusClass = 'toast-success';
                if (toast.type === 'danger' || toast.type === 'error') {
                    statusClass = 'toast-danger';
                } else if (toast.type === 'warning') {
                    statusClass = 'toast-warning';
                }

                return (
                    <div key={toast.id} className={`toast ${statusClass}`}>
                        <span>{toast.message}</span>
                        <button 
                            className="btn-close-toast" 
                            onClick={() => removeToast(toast.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                padding: '0 4px',
                                fontSize: '16px',
                                lineHeight: 1,
                                fontWeight: '700',
                                opacity: 0.6
                            }}
                            aria-label="Close notification"
                        >
                            &times;
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
