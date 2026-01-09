'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryStore, InventoryItem } from '@/lib/inventoryStore';

interface AdminInventoryCaptureProps {
    onClose: () => void;
}

type ViewState = 'LIST' | 'CAMERA' | 'PARSE';

export default function AdminInventoryCapture({ onClose }: AdminInventoryCaptureProps) {
    const [view, setView] = useState<ViewState>('LIST');
    const [items, setItems] = useState<InventoryItem[]>(inventoryStore.getItems());

    // Capture state
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        cannabinoids: { THC: 0, CBD: 0, CBG: 0 },
        terpenes: { Myrcene: 0, Limonene: 0, Pinene: 0, Caryophyllene: 0, Linalool: 0 },
        type: 'flower',
        active: true
    });

    useEffect(() => {
        // Subscribe to store updates
        const unsub = inventoryStore.subscribe(() => {
            setItems(inventoryStore.getItems());
        });
        return unsub;
    }, []);

    const handleCapture = (image: string) => {
        setCapturedImage(image);
        setView('PARSE');
        // In a real app, we would send 'image' to OCR here.
        // For now, valid defaults or simulated "ocr"
        setFormData(prev => ({
            ...prev,
            productName: '',
            strainName: '',
            source: 'camera'
        }));
    };

    const handleSave = () => {
        if (!formData.productName || !formData.strainName) return;

        inventoryStore.addItem({
            productName: formData.productName,
            strainName: formData.strainName,
            type: formData.type as any,
            cannabinoids: formData.cannabinoids || {},
            terpenes: formData.terpenes || {},
            source: capturedImage ? 'camera' : 'manual',
            imageUrl: capturedImage || undefined,
            active: true
        });

        // Reset and return to list
        setCapturedImage(null);
        setFormData({
            cannabinoids: { THC: 0, CBD: 0, CBG: 0 },
            terpenes: { Myrcene: 0, Limonene: 0, Pinene: 0, Caryophyllene: 0, Linalool: 0 },
            type: 'flower',
            active: true
        });
        setView('LIST');
    };

    return (
        <div className="flex flex-col h-full overflow-hidden text-white font-sans bg-black/50">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                <div>
                    <h2 className="text-xl font-medium tracking-tighter text-white">Inventory Intake</h2>
                    <p className="text-sm text-gray-400">Manage dispensary inventory availability</p>
                </div>
                {view === 'LIST' && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('CAMERA')}
                            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg text-sm font-medium hover:bg-[#B5952F] transition-colors"
                        >
                            <span className="text-lg">📷</span> Add via Cam
                        </button>
                        <button
                            onClick={() => { setCapturedImage(null); setView('PARSE'); }}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white border border-white/10 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                        >
                            Manual Entry
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto relative p-6">
                <AnimatePresence mode="wait">
                    {view === 'LIST' && (
                        <ListView key="list" items={items} onToggle={(id) => inventoryStore.toggleActive(id)} onDelete={(id) => inventoryStore.removeItem(id)} />
                    )}
                    {view === 'CAMERA' && (
                        <CameraView key="camera" onCapture={handleCapture} onCancel={() => setView('LIST')} />
                    )}
                    {view === 'PARSE' && (
                        <ParseView
                            key="parse"
                            image={capturedImage}
                            formData={formData}
                            setFormData={setFormData}
                            onSave={handleSave}
                            onCancel={() => setView('LIST')}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- SUBVIEWS ---

function ListView({ items, onToggle, onDelete }: { items: InventoryItem[], onToggle: (id: string) => void, onDelete: (id: string) => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {items.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-sm">No items in inventory.<br />Add via Camera or Manual Entry.</div>
            ) : (
                items.map(item => (
                    <div key={item.id} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors group relative">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h3 className="font-bold text-white text-sm leading-tight">{item.productName}</h3>
                                <p className="text-xs text-[#D4AF37] mt-0.5">{item.strainName} <span className="opacity-50 mx-1">|</span> <span className="capitalize text-white/60">{item.type}</span></p>
                            </div>
                            <div className="flex items-center gap-2 pl-2">
                                <button
                                    onClick={() => onToggle(item.id)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-gray-500 border border-white/5'}`}
                                >
                                    {item.active ? 'LIVE' : 'OFF'}
                                </button>
                                <button onClick={() => onDelete(item.id)} className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                            </div>
                        </div>

                        {/* Mini Data Visualization */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">THC</span>
                                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-white/60" style={{ width: `${Math.min(item.cannabinoids.THC * 3, 100)}%` }} />
                                </div>
                                <span className="text-[10px] font-mono text-white/80">{item.cannabinoids.THC}%</span>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Source</span>
                                <span className="text-[10px] text-white/40">{item.source === 'camera' ? '📷 OCR' : '⌨️ Man'}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </motion.div>
    );
}

function CameraView({ onCapture, onCancel }: { onCapture: (img: string) => void, onCancel: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        let mounted = true;
        const startCamera = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                if (mounted && videoRef.current) {
                    videoRef.current.srcObject = s;
                    setStream(s);
                }
            } catch (err) {
                console.error("Camera access denied", err);
            }
        };
        startCamera();
        return () => {
            mounted = false;
            // Cleanup stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const takeSnapshot = () => {
        if (videoRef.current && canvasRef.current) {
            const vid = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(vid, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // Stop stream immediately
            if (stream) stream.getTracks().forEach(track => track.stop());

            onCapture(dataUrl);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-black flex flex-col">
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="absolute w-full h-full object-cover opacity-80" />

                {/* Reticle Overlay */}
                <div className="relative z-10 w-[80%] aspect-[3/4] border-2 border-[#D4AF37]/50 rounded-xl shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#D4AF37] -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#D4AF37] -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#D4AF37] -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#D4AF37] -mb-1 -mr-1" />
                    <div className="absolute top-1/2 left-0 right-0 text-center text-[#D4AF37] text-xs font-medium uppercase tracking-widest mt-4">
                        Align Label
                    </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="h-24 bg-black border-t border-white/10 flex items-center justify-around px-8 shrink-0">
                <button onClick={onCancel} className="text-gray-400 text-sm font-medium">Cancel</button>
                <button
                    onClick={takeSnapshot}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <div className="w-12 h-12 rounded-full bg-white" />
                </button>
                <div className="w-10" />
            </div>
        </motion.div>
    );
}

function ParseView({
    image,
    formData,
    setFormData,
    onSave,
    onCancel
}: {
    image: string | null,
    formData: any,
    setFormData: any,
    onSave: () => void,
    onCancel: () => void
}) {
    // Helper to update nested fields
    const updateNested = (category: 'cannabinoids' | 'terpenes', key: string, val: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: parseFloat(val) || 0
            }
        }));
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full bg-black/60">
            {/* Top: Image Preview (Collapsible/Small) */}
            <div className="h-48 bg-black/80 relative flex-shrink-0 border-b border-white/10">
                {image ? (
                    <img src={image} alt="Label Capture" className="w-full h-full object-contain opacity-80" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-[10px] text-gray-400 uppercase tracking-widest border border-white/10">
                    Source Image
                </div>
            </div>

            {/* Bottom: Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <label className="block text-xs uppercase text-gray-500 mb-1">Product Name</label>
                    <input
                        type="text"
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37] outline-none"
                        placeholder="e.g. Premium Blue Dream 3.5g"
                        value={formData.productName || ''}
                        onChange={e => setFormData({ ...formData, productName: e.target.value })}
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Strain Name</label>
                        <input
                            type="text"
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            placeholder="e.g. Blue Dream"
                            value={formData.strainName || ''}
                            onChange={e => setFormData({ ...formData, strainName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Type</label>
                        <select
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white appearance-none"
                            value={formData.type || 'flower'}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="flower">Flower</option>
                            <option value="preroll">Pre-Roll</option>
                            <option value="blend">Blend</option>
                        </select>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                    <h4 className="text-sm font-medium text-[#D4AF37] mb-3">Cannabinoids (%)</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {['THC', 'CBD', 'CBG'].map(key => (
                            <div key={key}>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase">{key}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="w-full bg-black/50 border border-white/10 rounded px-2 py-2 text-white font-mono text-sm"
                                    value={formData.cannabinoids?.[key] || 0}
                                    onChange={e => updateNested('cannabinoids', key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-white/10 pt-4 pb-20">
                    <h4 className="text-sm font-medium text-[#D4AF37] mb-3">Terpenes (%)</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {['Myrcene', 'Limonene', 'Pinene', 'Caryophyllene', 'Linalool'].map(key => (
                            <div key={key}>
                                <label className="block text-[10px] text-gray-500 mb-1 truncate">{key}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-black/50 border border-white/10 rounded px-2 py-2 text-white font-mono text-sm"
                                    value={formData.terpenes?.[key] || 0}
                                    onChange={e => updateNested('terpenes', key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating Footer */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-black/80 border-t border-white/10 backdrop-blur-md flex gap-3 z-10">
                <button
                    onClick={onCancel}
                    className="px-4 py-3 border border-white/10 text-gray-400 font-medium rounded-lg hover:bg-white/5 text-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={onSave}
                    className="flex-1 py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#B5952F] shadow-lg shadow-[#D4AF37]/20 text-sm uppercase tracking-wide"
                >
                    Confirm Inventory
                </button>
            </div>
        </motion.div>
    );
}
