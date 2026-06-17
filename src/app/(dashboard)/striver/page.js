'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/StateContext';
import { STRIVER_A2Z_DATA } from '@/data/striver_data';

export default function StriverPage() {
    const router = useRouter();
    const { state, toggleStriverProblem, showToast } = useAppState();

    // ─── Component States ────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSteps, setExpandedSteps] = useState(new Set());
    const [expandedSubsteps, setExpandedSubsteps] = useState(new Set());

    // ─── Question Tracker Count ──────────────────────────────────────────────
    let totalQuestions = 0;
    let totalCompleted = 0;

    STRIVER_A2Z_DATA.forEach(step => {
        step.substeps.forEach(sub => {
            sub.problems.forEach(prob => {
                totalQuestions++;
                if (state.striverCompleted?.[prob.title]) {
                    totalCompleted++;
                }
            });
        });
    });

    // ─── Accordion Click Toggles ─────────────────────────────────────────────
    const toggleStep = (stepIdx) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(stepIdx)) {
                next.delete(stepIdx);
            } else {
                next.add(stepIdx);
            }
            return next;
        });
    };

    const toggleSubstep = (stepIdx, subIdx) => {
        const key = `${stepIdx}-${subIdx}`;
        setExpandedSubsteps(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // ─── Search Filtering and Rendering Logic ─────────────────────────────────
    const query = searchQuery.toLowerCase().trim();

    return (
        <section className="view-section active" id="view-striver">
            <div className="card striver-card">
                <div className="col-header-row">
                    <h2 className="section-title">Striver A2Z DSA Sheet</h2>
                    <span className="question-tracker-badge" id="striverTrackerCount">
                        {totalCompleted} / {totalQuestions} Completed
                    </span>
                </div>
                <p className="section-desc">
                    Browse chapters, check off problems, watch explanations, and log problems to your spaced repetition scheduler.
                </p>
                
                <div className="search-box">
                    <input 
                        type="text" 
                        id="striverSearchInput" 
                        className="form-control search-input" 
                        placeholder="Search problems, topics or sub-steps..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="striver-steps-accordion" id="striverAccordion">
                    {STRIVER_A2Z_DATA.map((stepData, stepIdx) => {
                        let stepCompletedCount = 0;
                        let stepTotalCount = 0;
                        let stepHasVisibleProblem = false;

                        // Calculate progress & visibility
                        const renderedSubsteps = stepData.substeps.map((sub, subIdx) => {
                            const matchingProblems = sub.problems.filter(prob => {
                                stepTotalCount++;
                                if (state.striverCompleted?.[prob.title]) {
                                    stepCompletedCount++;
                                }
                                return prob.title.toLowerCase().includes(query);
                            });

                            const isSubVisible = query === '' || matchingProblems.length > 0;
                            if (isSubVisible && query !== '') {
                                stepHasVisibleProblem = true;
                            }

                            const key = `${stepIdx}-${subIdx}`;
                            const isSubExpanded = query !== '' || expandedSubsteps.has(key);

                            return {
                                subData: sub,
                                subIdx,
                                matchingProblems,
                                isVisible: isSubVisible,
                                isExpanded: isSubExpanded
                            };
                        });

                        const isStepVisible = query === '' || stepHasVisibleProblem;
                        const isStepExpanded = query !== '' || expandedSteps.has(stepIdx);

                        if (!isStepVisible) return null;

                        return (
                            <div 
                                key={stepIdx} 
                                className={`striver-step-card ${isStepExpanded ? 'expanded' : ''}`}
                                id={`striver-step-${stepIdx}`}
                            >
                                <button 
                                    className="striver-step-header" 
                                    onClick={() => toggleStep(stepIdx)}
                                >
                                    <span className="striver-step-title">{stepData.step}</span>
                                    <span className="striver-step-progress">
                                        {stepCompletedCount} / {stepTotalCount} Done
                                    </span>
                                </button>
                                <div className="striver-step-content">
                                    {renderedSubsteps.map(({ subData, subIdx, matchingProblems, isVisible, isExpanded }) => {
                                        if (!isVisible) return null;

                                        return (
                                            <div 
                                                key={subIdx} 
                                                className={`striver-substep-wrap ${isExpanded ? 'expanded' : ''}`}
                                                data-step-idx={stepIdx}
                                                data-sub-idx={subIdx}
                                            >
                                                <div 
                                                    className="striver-substep-header"
                                                    onClick={() => toggleSubstep(stepIdx, subIdx)}
                                                >
                                                    <span className="striver-substep-title">{subData.name}</span>
                                                    <svg className="substep-chevron" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                                                        <polyline points="6 9 12 15 18 9"></polyline>
                                                    </svg>
                                                </div>
                                                <div className="striver-problems-list">
                                                    {(query === '' ? subData.problems : matchingProblems).map((prob, probIdx) => {
                                                        const isCompleted = state.striverCompleted?.[prob.title];
                                                        
                                                        return (
                                                            <div 
                                                                key={probIdx} 
                                                                className={`striver-problem-row ${isCompleted ? 'completed' : ''}`}
                                                            >
                                                                <div className="striver-prob-left">
                                                                    <button 
                                                                        className="chk-striver-problem" 
                                                                        onClick={() => toggleStriverProblem(prob.title)}
                                                                        aria-label={`Mark "${prob.title}" as completed`}
                                                                    />
                                                                    {prob.link ? (
                                                                        <a href={prob.link} target="_blank" rel="noopener noreferrer" className="striver-prob-link">
                                                                            {prob.title}
                                                                        </a>
                                                                    ) : (
                                                                        <span className="striver-prob-title">{prob.title}</span>
                                                                    )}
                                                                </div>
                                                                <div className="striver-prob-right">
                                                                    {prob.video && (
                                                                        <a href={prob.video} target="_blank" rel="noopener noreferrer" className="striver-btn-video" title="Watch Video Tutorial">
                                                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                                                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                                                            </svg>
                                                                        </a>
                                                                    )}
                                                                    <button 
                                                                        className="striver-btn-log" 
                                                                        title="Add to Spaced Repetition"
                                                                        onClick={() => router.push(`/?add=${encodeURIComponent(prob.title)}`)}
                                                                    >
                                                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                                            <line x1="12" y1="9" x2="12" y2="15"></line>
                                                                            <line x1="9" y1="12" x2="15" y2="12"></line>
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
