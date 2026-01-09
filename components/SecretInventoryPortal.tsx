'use client';

/**
 * SecretInventoryPortal Component
 * 
 * Hidden operator-only inventory intake portal for dispensaries.
 * Accessible via logo click sequence (6 clicks within 3 seconds).
 * 
 * Isolation: Portal must not affect consumer UI layout or state.
 */

import { useState } from 'react';

export interface InventoryItem {
  strainName: string;
  thcPercent: number;
  cbdPercent: number;
  terpenes?: string;
  batchLotId: string;
  availableQuantity: number;
}

interface SecretInventoryPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (items: InventoryItem[]) => void;
}

type TabMode = 'manual' | 'camera' | 'barcode';

export default function SecretInventoryPortal({ isOpen, onClose, onSave }: SecretInventoryPortalProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('manual');
  const [items, setItems] = useState<InventoryItem[]>([]);

  // Manual entry form state
  const [formData, setFormData] = useState<InventoryItem>({
    strainName: '',
    thcPercent: 0,
    cbdPercent: 0,
    terpenes: '',
    batchLotId: '',
    availableQuantity: 0,
  });

  // Camera/OCR state
  const [cameraActive, setCameraActive] = useState(false);
  const [ocrResult, setOcrResult] = useState<Partial<InventoryItem> | null>(null);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.strainName && formData.batchLotId) {
      setItems([...items, formData]);
      setFormData({
        strainName: '',
        thcPercent: 0,
        cbdPercent: 0,
        terpenes: '',
        batchLotId: '',
        availableQuantity: 0,
      });
    }
  };

  const handleCameraCapture = async () => {
    // Placeholder for camera capture and OCR
    // In production, this would:
    // 1. Access device camera
    // 2. Capture photo
    // 3. Send to OCR service
    // 4. Parse results

    setCameraActive(true);

    // Simulated OCR result (requires manual confirmation)
    setTimeout(() => {
      setOcrResult({
        thcPercent: 23.5,
        cbdPercent: 0.8,
        terpenes: 'Myrcene, Limonene, Pinene',
        batchLotId: 'BATCH-2024-001',
      });
      setCameraActive(false);
    }, 1500);
  };

  const handleOcrConfirm = () => {
    if (ocrResult && formData.strainName) {
      const confirmedItem: InventoryItem = {
        ...formData,
        ...ocrResult,
      } as InventoryItem;

      setItems([...items, confirmedItem]);
      setOcrResult(null);
      setFormData({
        strainName: '',
        thcPercent: 0,
        cbdPercent: 0,
        terpenes: '',
        batchLotId: '',
        availableQuantity: 0,
      });
    }
  };

  const handleSave = () => {
    if (onSave && items.length > 0) {
      onSave(items);
      setItems([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-[#111216] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0b0e]">
          <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest">Admin Inventory</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'manual'
              ? 'text-white border-b-2 border-[#D4AF37]'
              : 'text-white/60 hover:text-white/80'
              }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'camera'
              ? 'text-white border-b-2 border-[#D4AF37]'
              : 'text-white/60 hover:text-white/80'
              }`}
          >
            Camera Scan
          </button>
          <button
            onClick={() => setActiveTab('barcode')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'barcode'
              ? 'text-white border-b-2 border-[#D4AF37]'
              : 'text-white/60 hover:text-white/80'
              }`}
          >
            Barcode / QR Scan
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab 1: Manual Entry */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Strain Name *</label>
                <input
                  type="text"
                  value={formData.strainName}
                  onChange={(e) => setFormData({ ...formData, strainName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/80 mb-2">THC % *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.thcPercent}
                    onChange={(e) => setFormData({ ...formData, thcPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">CBD % *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.cbdPercent}
                    onChange={(e) => setFormData({ ...formData, cbdPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Terpenes (optional)</label>
                <input
                  type="text"
                  value={formData.terpenes}
                  onChange={(e) => setFormData({ ...formData, terpenes: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  placeholder="Myrcene, Limonene, Pinene"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Batch / Lot ID *</label>
                <input
                  type="text"
                  value={formData.batchLotId}
                  onChange={(e) => setFormData({ ...formData, batchLotId: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Available Quantity *</label>
                <input
                  type="number"
                  value={formData.availableQuantity}
                  onChange={(e) => setFormData({ ...formData, availableQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-[#D4AF37] text-[#1A1A1A] font-medium text-sm rounded hover:bg-[#B8860B] transition-colors"
              >
                Add to Inventory
              </button>
            </form>
          )}

          {/* Tab 2: Camera Scan */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {!ocrResult ? (
                <>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
                    {cameraActive ? (
                      <div className="space-y-4">
                        <div className="animate-pulse text-white/60">Capturing and processing...</div>
                        <div className="text-xs text-white/40">Camera access required</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-white/60 mb-4">Camera scan functionality</div>
                        <button
                          onClick={handleCameraCapture}
                          className="px-6 py-3 bg-[#D4AF37] text-[#1A1A1A] font-medium rounded hover:bg-[#B8860B] transition-colors"
                        >
                          Open Camera & Capture
                        </button>
                        <div className="text-xs text-white/40 mt-4">
                          Note: OCR results require manual confirmation
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-white/80 mb-4">OCR Results (Please confirm):</div>
                  <form onSubmit={(e) => { e.preventDefault(); handleOcrConfirm(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/80 mb-2">Strain Name *</label>
                      <input
                        type="text"
                        value={formData.strainName}
                        onChange={(e) => setFormData({ ...formData, strainName: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/80 mb-2">THC %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={ocrResult.thcPercent || 0}
                          readOnly
                          className="w-full px-4 py-2 bg-[#0A0A0A]/50 border border-white/10 rounded text-white/60 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/80 mb-2">CBD %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={ocrResult.cbdPercent || 0}
                          readOnly
                          className="w-full px-4 py-2 bg-[#0A0A0A]/50 border border-white/10 rounded text-white/60 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-2">Terpenes</label>
                      <input
                        type="text"
                        value={ocrResult.terpenes || ''}
                        readOnly
                        className="w-full px-4 py-2 bg-[#0A0A0A]/50 border border-white/10 rounded text-white/60 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-2">Batch / Lot ID</label>
                      <input
                        type="text"
                        value={ocrResult.batchLotId || ''}
                        readOnly
                        className="w-full px-4 py-2 bg-[#0A0A0A]/50 border border-white/10 rounded text-white/60 text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-[#D4AF37] text-[#1A1A1A] font-medium text-sm rounded hover:bg-[#B8860B] transition-colors"
                      >
                        Confirm & Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setOcrResult(null)}
                        className="px-6 py-2 bg-white/10 text-white font-medium text-sm rounded hover:bg-white/20 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Barcode / QR Scan */}
          {activeTab === 'barcode' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
                <div className="text-white/60 mb-4">Barcode / QR scan functionality</div>
                <button
                  onClick={() => {
                    // Placeholder for barcode/QR scan
                    alert('Barcode/QR scan functionality - In production, this would:\n1. Access device camera\n2. Scan barcode/QR code\n3. If QR resolves to COA URL, parse values\n4. Pre-fill editable fields');
                  }}
                  className="px-6 py-3 bg-[#D4AF37] text-[#1A1A1A] font-medium rounded hover:bg-[#B8860B] transition-colors"
                >
                  Scan Barcode / QR
                </button>
                <div className="text-xs text-white/40 mt-4">
                  If QR resolves to COA URL, values will be parsed and pre-filled
                </div>
              </div>
            </div>
          )}

          {/* Inventory List */}
          {items.length > 0 && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-4">Current Inventory ({items.length} items)</h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded text-sm">
                    <div>
                      <div className="text-white font-medium">{item.strainName}</div>
                      <div className="text-white/60 text-xs">{item.batchLotId} • {item.availableQuantity} units</div>
                    </div>
                    <div className="text-white/60 text-xs">
                      THC: {item.thcPercent}% • CBD: {item.cbdPercent}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-[#0a0b0e]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-white/40 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={items.length === 0}
            className="px-6 py-2 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-[#b5952f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Inventory
          </button>
        </div>
      </div>
    </div>
  );
}






