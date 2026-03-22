import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, SkipForward } from 'lucide-react';

interface TourStep {
    target: string;
    title: string;
    description: string;
    emoji: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        target: 'tour-brand',
        title: 'เลือกยี่ห้อสินค้า',
        description: 'เลือกยี่ห้อของสินค้าที่ต้องการเคลม\nถ้าไม่มีในรายการ เลือก "อื่นๆ"',
        emoji: '🏷️',
    },
    {
        target: 'tour-model-serial',
        title: 'กรอกรุ่น & Serial Number',
        description: 'พิมพ์รุ่นสินค้า และ Serial Number\nหรือกดไอคอน 📷 เพื่อสแกนบาร์โค้ดได้เลย!',
        emoji: '📱',
    },
    {
        target: 'tour-accessories',
        title: 'อุปกรณ์เสริมที่ส่งมาด้วย',
        description: 'เลือกอุปกรณ์ที่ส่งมาพร้อมเครื่อง\n(ไม่จำเป็นต้องเลือก ถ้าไม่มีข้ามไปได้เลย)',
        emoji: '🔧',
    },
    {
        target: 'tour-issue',
        title: 'อธิบายอาการเสีย',
        description: 'บอกอาการเสียที่พบ เช่น\n"ภาพมืด", "เชื่อมต่อไม่ได้", "มีเสียงดัง"',
        emoji: '📝',
    },
    {
        target: 'tour-add-button',
        title: 'กดเพิ่มสินค้า!',
        description: 'กดปุ่มนี้เพื่อเพิ่มสินค้าเข้ารายการ\nสามารถเพิ่มได้หลายชิ้นในครั้งเดียว!',
        emoji: '➕',
    },
];

const STORAGE_KEY = 'sec_tour_done';

export const OnboardingTour: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [spotRect, setSpotRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

    // Check localStorage
    useEffect(() => {
        const done = localStorage.getItem(STORAGE_KEY);
        if (!done) {
            const timer = setTimeout(() => setIsVisible(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    // Calculate spotlight position
    const calcPosition = useCallback(() => {
        const step = TOUR_STEPS[currentStep];
        if (!step) return;
        const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setSpotRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, [currentStep]);

    // When step changes or tour becomes visible, scroll to target and calculate
    useEffect(() => {
        if (!isVisible) return;
        const step = TOUR_STEPS[currentStep];
        if (!step) return;

        const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement;
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Wait for scroll animation to complete before measuring
        const t = setTimeout(calcPosition, 600);
        return () => clearTimeout(t);
    }, [isVisible, currentStep, calcPosition]);

    // Keep position updated on scroll/resize
    useEffect(() => {
        if (!isVisible) return;
        window.addEventListener('scroll', calcPosition, true);
        window.addEventListener('resize', calcPosition);
        return () => {
            window.removeEventListener('scroll', calcPosition, true);
            window.removeEventListener('resize', calcPosition);
        };
    }, [isVisible, calcPosition]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setSpotRect(null); // reset to force recalc
            setCurrentStep(prev => prev + 1);
        } else {
            handleDone();
        }
    };

    const handleDone = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    if (!isVisible || !spotRect) return null;

    const step = TOUR_STEPS[currentStep];
    const isLast = currentStep === TOUR_STEPS.length - 1;
    const pad = 12;

    // Tooltip: prefer below spotlight, fallback above
    const tooltipW = 340;
    const spaceBelow = window.innerHeight - (spotRect.top + spotRect.height + pad);
    const showBelow = spaceBelow > 240;
    const tooltipTop = showBelow
        ? spotRect.top + spotRect.height + pad + 8
        : spotRect.top - pad - 220;
    let tooltipLeft = spotRect.left + (spotRect.width / 2) - (tooltipW / 2);
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipW - 16));

    // Use createPortal so the tour renders at body level, not inside overflow:hidden containers
    return createPortal(
        <>
            {/* Fixed overlay layer */}
            <div
                onClick={handleDone}
                style={{ position: 'fixed', inset: 0, zIndex: 99990 }}
            >
                {/* Spotlight hole: this div IS the hole, box-shadow creates darkness around it */}
                <div
                    style={{
                        position: 'fixed',
                        top: spotRect.top - pad,
                        left: spotRect.left - pad,
                        width: spotRect.width + pad * 2,
                        height: spotRect.height + pad * 2,
                        borderRadius: 16,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                        transition: 'top 0.4s, left 0.4s, width 0.4s, height 0.4s',
                        pointerEvents: 'none',
                    }}
                />
                {/* Blue glow ring */}
                <div
                    style={{
                        position: 'fixed',
                        top: spotRect.top - pad,
                        left: spotRect.left - pad,
                        width: spotRect.width + pad * 2,
                        height: spotRect.height + pad * 2,
                        borderRadius: 16,
                        border: '2px solid rgba(59, 130, 246, 0.7)',
                        boxShadow: '0 0 24px rgba(59, 130, 246, 0.3)',
                        transition: 'top 0.4s, left 0.4s, width 0.4s, height 0.4s',
                        pointerEvents: 'none',
                    }}
                />
            </div>

            {/* Tooltip card */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'fixed',
                    top: tooltipTop,
                    left: tooltipLeft,
                    width: tooltipW,
                    zIndex: 99991,
                }}
            >
                <div style={{
                    background: 'white',
                    borderRadius: 20,
                    boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                    animation: 'tourSlideIn 0.3s ease-out',
                }}>
                    {/* Header */}
                    <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 28 }}>{step.emoji}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: '#1d1d1f' }}>{step.title}</div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#0071e3', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                                    ขั้นตอน {currentStep + 1} / {TOUR_STEPS.length}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleDone} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: '50%', color: '#999' }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Description */}
                    <div style={{ padding: '0 20px 12px' }}>
                        <p style={{ fontSize: 13, color: '#555', whiteSpace: 'pre-line' as const, lineHeight: 1.6, margin: 0 }}>
                            {step.description}
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div style={{ padding: '0 20px 12px' }}>
                        <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
                                background: 'linear-gradient(90deg, #0071e3, #34aadc)',
                                borderRadius: 2,
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={handleDone} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <SkipForward size={14} /> ข้ามทั้งหมด
                        </button>
                        <button
                            onClick={handleNext}
                            style={{
                                background: '#0071e3', color: 'white', border: 'none', borderRadius: 20,
                                padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 4px 12px rgba(0,113,227,0.3)',
                            }}
                        >
                            {isLast ? 'เข้าใจแล้ว! ✨' : <>ถัดไป <ArrowRight size={16} /></>}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes tourSlideIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>,
        document.body
    );
};
