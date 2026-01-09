'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import AdminInventoryCapture from '@/components/AdminInventoryCapture';

type PortalPanel = 'WHY' | 'USE_CASES' | 'ROI' | 'DATA' | 'INVENTORY' | 'DEMO';

export default function IndustryModePortal() {
    const [isOpen, setIsOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<PortalPanel>('WHY');

    useEffect(() => {
        const handleUnlock = () => setIsOpen(true);
        window.addEventListener('go-admin-unlock', handleUnlock);
        return () => window.removeEventListener('go-admin-unlock', handleUnlock);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed top-0 bottom-0 right-0 z-[100] w-[480px] max-w-full bg-black/90 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col font-sans"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                        <div>
                            <h2 className="text-lg font-medium text-white tracking-tight">Admin & Industry</h2>
                            <p className="text-xs text-gray-500">Real-time operations</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Nav (Compact) */}
                    <div className="flex overflow-x-auto gap-1 p-2 border-b border-white/10 shrink-0">
                        <NavButton active={activePanel === 'INVENTORY'} onClick={() => setActivePanel('INVENTORY')} label="Inventory" variant="accent" />
                        <NavButton active={activePanel === 'WHY'} onClick={() => setActivePanel('WHY')} label="Why GO" />
                        <NavButton active={activePanel === 'USE_CASES'} onClick={() => setActivePanel('USE_CASES')} label="Use Cases" />
                        <NavButton active={activePanel === 'ROI'} onClick={() => setActivePanel('ROI')} label="ROI Model" />
                        <NavButton active={activePanel === 'DATA'} onClick={() => setActivePanel('DATA')} label="Data" />
                        <NavButton active={activePanel === 'DEMO'} onClick={() => setActivePanel('DEMO')} label="Demo" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto relative bg-black/20">
                        {activePanel === 'INVENTORY' ? (
                            <AdminInventoryCapture onClose={() => setActivePanel('WHY')} />
                        ) : (
                            <div className="p-6">
                                {activePanel === 'WHY' && <WhyPanel />}
                                {activePanel === 'USE_CASES' && <UseCasesPanel />}
                                {activePanel === 'ROI' && <ROIPanel />}
                                {activePanel === 'DATA' && <DataPanel />}
                                {activePanel === 'DEMO' && <DemoPanel onClose={() => setIsOpen(false)} />}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function NavButton({ active, onClick, label, variant = 'default' }: { active: boolean; onClick: () => void; label: string; variant?: 'default' | 'accent' }) {
    return (
        <button
            onClick={onClick}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${active
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${variant === 'accent' && !active ? 'text-[#D4AF37] border border-[#D4AF37]/20' : ''}`}
        >
            {label}
        </button>
    );
}

// --- PANELS ---

function WhyPanel() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-light tracking-tight leading-tight">
                    Turn subjective selection into <span className="text-[#D4AF37]">measurable outcomes</span>.
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl font-light">
                    GO replaces budtender guesswork with deterministic math, modeling formulation effects before a single gram is sold.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card title="Problem">
                    <ul className="space-y-3 text-gray-400">
                        <li>• Inconsistent advice across staff</li>
                        <li>• "Strain Hype" driving low-satisfaction purchases</li>
                        <li>• High returns due to effect mismatch</li>
                        <li>• Compliance risks with medical claims</li>
                    </ul>
                </Card>
                <Card title="Solution">
                    <ul className="space-y-3 text-gray-300">
                        <li>• <strong className="text-white">Deterministic Math</strong>: Same input = Same output</li>
                        <li>• <strong className="text-white">Inventory Agnostic</strong>: Works with what you have</li>
                        <li>• <strong className="text-white">Role-Based Blending</strong>: Driver, Modulator, Anchor</li>
                        <li>• <strong className="text-white">Compliance Safe</strong>: No medical promises, just chemistry</li>
                    </ul>
                </Card>
            </div>
        </motion.div>
    );
}

function UseCasesPanel() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <h1 className="text-4xl font-light">Deployment Scenarios</h1>
            <div className="grid md:grid-cols-3 gap-6">
                <Card title="Retail POS" highlight>
                    <p className="text-gray-400 mb-4">Empower staff with a formulation genius bar.</p>
                    <ul className="text-sm space-y-2 text-gray-500">
                        <li>• Reduce transaction time</li>
                        <li>• Upsell slow-moving inventory as "Modulators"</li>
                        <li>• Standardize customer education</li>
                    </ul>
                </Card>
                <Card title="House Brands">
                    <p className="text-gray-400 mb-4">Create effect-based SKUs that sell.</p>
                    <ul className="text-sm space-y-2 text-gray-500">
                        <li>• Blend pre-rolls targeting "Sleep" or "Focus"</li>
                        <li>• Validate formulations pre-production</li>
                        <li>• Consistent effects despite crop variance</li>
                    </ul>
                </Card>
                <Card title="Kiosk / E-Comm">
                    <p className="text-gray-400 mb-4">Self-service decision engine.</p>
                    <ul className="text-sm space-y-2 text-gray-500">
                        <li>• 24/7 guided selling</li>
                        <li>• Zero staff overhead</li>
                        <li>• Captures user intent data</li>
                    </ul>
                </Card>
            </div>
        </motion.div>
    );
}

function ROIPanel() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <h1 className="text-4xl font-light">ROI Model</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Metric value="+22%" label="Basket Size" sub="Via dual-strain blending" />
                <Metric value="-15%" label="Returns" sub="Due to effect dissatisfaction" />
                <Metric value="3.5x" label="Repeat Purchase" sub="On named outcome blends" />
                <Metric value="-40%" label="Training Hours" sub="Staff ramp-up time" />
            </div>
            <p className="text-xs text-gray-500 italic border-t border-white/10 pt-4">
                * Modeled metrics based on pilot deployments. Results vary by inventory turnover and implementation depth.
            </p>
        </motion.div>
    );
}

function DataPanel() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <h1 className="text-4xl font-light">Data Layer Integrity</h1>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h3 className="text-xl text-[#D4AF37]">Active Inputs</h3>
                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <span className="font-mono text-xs text-gray-500 pt-1">01</span>
                            <div>
                                <strong className="block text-white">Terpene Profiling</strong>
                                <span className="text-gray-400 text-sm">Full vector analysis of 40+ terpenes.</span>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-xs text-gray-500 pt-1">02</span>
                            <div>
                                <strong className="block text-white">Cannabinoid Ratios</strong>
                                <span className="text-gray-400 text-sm">THC:CBD:Minor cannabinoid interplay.</span>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-xs text-gray-500 pt-1">03</span>
                            <div>
                                <strong className="block text-white">Inventory State</strong>
                                <span className="text-gray-400 text-sm">Real-time availability constraints.</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl text-gray-500">Excluded (Safety)</h3>
                    <ul className="space-y-4 opacity-60">
                        <li className="flex gap-4">
                            <span className="font-mono text-xs text-gray-600 pt-1">X</span>
                            <div>
                                <strong className="block text-gray-400">Medical Diagnosis</strong>
                                <span className="text-gray-500 text-sm">We do not diagnose or treat conditions.</span>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-xs text-gray-600 pt-1">X</span>
                            <div>
                                <strong className="block text-gray-400">PII Storage</strong>
                                <span className="text-gray-500 text-sm">No personal health data is retained.</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </motion.div>
    );
}

function DemoPanel({ onClose }: { onClose: () => void }) {
    const runDemo = (intent: string) => {
        // Dispatch event for page.tsx to pick up
        window.dispatchEvent(new CustomEvent('go-demo-run', { detail: { intent } }));
        onClose();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <h1 className="text-4xl font-light">Live Simulations</h1>
            <p className="text-xl text-gray-400 max-w-2xl font-light">
                Trigger live calculation scenarios to demonstrate the engine's speed and logic.
            </p>

            <div className="grid gap-4 max-w-md">
                <button
                    onClick={() => runDemo("I need deep sleep without anxiety")}
                    className="bg-white text-black p-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-left flex justify-between group"
                >
                    <span>Sleep & Anxiety</span>
                    <span className="text-gray-400 group-hover:text-black">→</span>
                </button>
                <button
                    onClick={() => runDemo("Creative energy for social situations")}
                    className="bg-zinc-800 text-white p-4 rounded-lg font-medium hover:bg-zinc-700 transition-colors text-left flex justify-between border border-white/10"
                >
                    <span>Social Creativity</span>
                    <span className="text-gray-500">→</span>
                </button>
                <button
                    onClick={() => runDemo("Heavy body relief for pain management")}
                    className="bg-zinc-800 text-white p-4 rounded-lg font-medium hover:bg-zinc-700 transition-colors text-left flex justify-between border border-white/10"
                >
                    <span>Pain & Body Load</span>
                    <span className="text-gray-500">→</span>
                </button>
            </div>
        </motion.div>
    );
}

// --- UI HELPERS ---

function Card({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
    return (
        <div className={`p-6 rounded-xl border ${highlight ? 'bg-white/5 border-[#D4AF37]/30' : 'bg-white/5 border-white/10'}`}>
            <h3 className={`text-lg font-medium mb-4 ${highlight ? 'text-[#D4AF37]' : 'text-white'}`}>{title}</h3>
            {children}
        </div>
    );
}

function Metric({ value, label, sub }: { value: string; label: string; sub: string }) {
    return (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="text-3xl lg:text-4xl font-light text-white mb-2">{value}</div>
            <div className="text-sm font-medium text-gray-300">{label}</div>
            <div className="text-xs text-gray-500 mt-1">{sub}</div>
        </div>
    );
}
