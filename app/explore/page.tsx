'use client';

/**
 * Label-Driven Outcome Exploration Page
 * 
 * Users input product labels and explore which outcomes are achievable.
 * No recommendations - only enumeration.
 */

import { useState } from 'react';
import { parseLabelText, ParsedLabel, ParsedInventory } from '@/lib/labelParser';
import { exploreOutcomes, OutcomeEvaluation } from '@/lib/outcomeExplorer';
import ResolutionPanel, { ResolvedBlend } from '@/components/ResolutionPanel';
import { OutcomeIntent } from '@/lib/goOutcomeEngine';

type InputMethod = 'text' | 'ocr' | 'barcode' | 'manual';

export default function ExplorePage() {
  const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
  const [labelText, setLabelText] = useState('');
  const [parsedInventory, setParsedInventory] = useState<ParsedInventory | null>(null);
  const [evaluations, setEvaluations] = useState<OutcomeEvaluation[] | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeEvaluation | null>(null);

  const handleParseLabel = () => {
    if (!labelText.trim()) return;
    
    const parsed = parseLabelText(labelText);
    if (!parsed) {
      alert('Could not parse label. Please ensure cultivar name is included.');
      return;
    }
    
    setParsedInventory({
      items: [parsed],
      confirmed: false,
    });
  };

  const handleConfirmInventory = () => {
    if (!parsedInventory) return;
    
    setParsedInventory({
      ...parsedInventory,
      confirmed: true,
    });
  };

  const handleExploreOutcomes = () => {
    if (!parsedInventory || !parsedInventory.confirmed) return;
    
    const results = exploreOutcomes(parsedInventory.items);
    setEvaluations(results);
  };

  const handleOutcomeClick = (evaluation: OutcomeEvaluation) => {
    if (evaluation.status === 'achievable' && evaluation.resolution) {
      setSelectedOutcome(evaluation);
    }
  };

  // Step 1: Input Method Selection
  if (!inputMethod) {
    return (
      <div className="min-h-screen bg-[#0a0b0e] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-medium mb-8">Add what you have</h1>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setInputMethod('text')}
              className="p-6 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-colors text-left"
            >
              <div className="text-sm font-medium mb-2">Paste label text</div>
              <div className="text-xs text-white/50">Copy and paste product label information</div>
            </button>
            
            <button
              onClick={() => setInputMethod('ocr')}
              className="p-6 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-colors text-left"
            >
              <div className="text-sm font-medium mb-2">Scan label</div>
              <div className="text-xs text-white/50">Use camera to scan product label</div>
            </button>
            
            <button
              onClick={() => setInputMethod('barcode')}
              className="p-6 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-colors text-left"
            >
              <div className="text-sm font-medium mb-2">Scan barcode / QR</div>
              <div className="text-xs text-white/50">Scan product barcode or QR code</div>
            </button>
            
            <button
              onClick={() => setInputMethod('manual')}
              className="p-6 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-colors text-left"
            >
              <div className="text-sm font-medium mb-2">Manual entry</div>
              <div className="text-xs text-white/50">Enter product information manually</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Label Input
  if (!parsedInventory) {
    return (
      <div className="min-h-screen bg-[#0a0b0e] text-white p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setInputMethod(null)}
            className="text-sm text-white/50 hover:text-white mb-6"
          >
            ← Back
          </button>
          
          <h1 className="text-2xl font-medium mb-6">Enter label information</h1>
          
          {inputMethod === 'text' && (
            <div className="space-y-4">
              <textarea
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                placeholder="Paste label text here..."
                className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/30"
              />
              <button
                onClick={handleParseLabel}
                disabled={!labelText.trim()}
                className="px-6 py-2 bg-white text-[#0a0b0e] font-medium rounded-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Parse Label
              </button>
            </div>
          )}
          
          {inputMethod === 'ocr' && (
            <div className="text-center py-12">
              <div className="text-sm text-white/50 mb-4">Camera OCR coming soon</div>
              <button
                onClick={() => setInputMethod('text')}
                className="text-sm text-white/70 hover:text-white underline"
              >
                Use text input instead
              </button>
            </div>
          )}
          
          {inputMethod === 'barcode' && (
            <div className="text-center py-12">
              <div className="text-sm text-white/50 mb-4">Barcode scanning coming soon</div>
              <button
                onClick={() => setInputMethod('text')}
                className="text-sm text-white/70 hover:text-white underline"
              >
                Use text input instead
              </button>
            </div>
          )}
          
          {inputMethod === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cultivar Name</label>
                <input
                  type="text"
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  placeholder="e.g., Blue Dream"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/30"
                />
              </div>
              <button
                onClick={handleParseLabel}
                disabled={!labelText.trim()}
                className="px-6 py-2 bg-white text-[#0a0b0e] font-medium rounded-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Inventory
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Inventory Confirmation
  if (!parsedInventory.confirmed) {
    return (
      <div className="min-h-screen bg-[#0a0b0e] text-white p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setParsedInventory(null)}
            className="text-sm text-white/50 hover:text-white mb-6"
          >
            ← Back
          </button>
          
          <h1 className="text-2xl font-medium mb-6">Confirm Inventory</h1>
          
          <div className="bg-white/5 border border-white/10 rounded-sm p-6 mb-6">
            <div className="text-sm font-medium mb-4">We found:</div>
            {parsedInventory.items.map((item, idx) => (
              <div key={idx} className="mb-4 last:mb-0">
                <div className="text-base font-medium text-white mb-1">
                  {item.cultivarName}
                </div>
                {item.thc && (
                  <div className="text-sm text-white/60">
                    {item.thc}% THC
                  </div>
                )}
                {item.cbd && (
                  <div className="text-sm text-white/60">
                    {item.cbd}% CBD
                  </div>
                )}
                {item.terpenes && item.terpenes.length > 0 && (
                  <div className="text-sm text-white/60">
                    Terpenes: {item.terpenes.join(', ')}
                  </div>
                )}
                {item.formFactor && (
                  <div className="text-sm text-white/60">
                    Form: {item.formFactor}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setParsedInventory(null)}
              className="px-6 py-2 bg-white/10 border border-white/20 rounded-sm text-white hover:bg-white/15"
            >
              Edit
            </button>
            <button
              onClick={handleConfirmInventory}
              className="px-6 py-2 bg-white text-[#0a0b0e] font-medium rounded-sm hover:bg-white/90"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Outcome Grid
  if (!evaluations) {
    return (
      <div className="min-h-screen bg-[#0a0b0e] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setParsedInventory({ ...parsedInventory!, confirmed: false })}
            className="text-sm text-white/50 hover:text-white mb-6"
          >
            ← Back
          </button>
          
          <h1 className="text-2xl font-medium mb-6">Explore Achievable Outcomes</h1>
          
          <button
            onClick={handleExploreOutcomes}
            className="px-6 py-2 bg-white text-[#0a0b0e] font-medium rounded-sm hover:bg-white/90 mb-8"
          >
            Explore achievable outcomes
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Outcome Grid Display
  if (!selectedOutcome) {
    return (
      <div className="min-h-screen bg-[#0a0b0e] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setEvaluations(null)}
            className="text-sm text-white/50 hover:text-white mb-6"
          >
            ← Back
          </button>
          
          <h1 className="text-2xl font-medium mb-8">Outcome Exploration</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation.outcome.id}
                onClick={() => handleOutcomeClick(evaluation)}
                className={`p-6 border rounded-sm cursor-pointer transition-colors ${
                  evaluation.status === 'achievable'
                    ? 'bg-white/5 border-white/20 hover:bg-white/10'
                    : 'bg-white/5 border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-base font-medium text-white mb-1">
                      {evaluation.outcome.label}
                    </div>
                    <div className="text-xs text-white/50">
                      {evaluation.outcome.description}
                    </div>
                  </div>
                  <div className="text-2xl">
                    {evaluation.status === 'achievable' ? '✔' : '✖'}
                  </div>
                </div>
                
                <div className="text-sm text-white/70 mb-2">
                  {evaluation.status === 'achievable' ? (
                    <span className="text-white/80">Tap to view blend</span>
                  ) : (
                    <span>Not achievable</span>
                  )}
                </div>
                
                {evaluation.status === 'not_achievable' && evaluation.reason && (
                  <div className="text-xs text-white/50 mb-2">
                    Reason: {evaluation.reason}
                  </div>
                )}
                
                {evaluation.status === 'not_achievable' && (
                  <div className="text-xs text-white/40 italic mt-2">
                    Requires ≥1 additional distinct cultivar
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 6: Drill-In (ResolutionPanel)
  if (selectedOutcome && selectedOutcome.resolution) {
    // Derive intent from outcome for adjustment controls
    const intent: OutcomeIntent = selectedOutcome.outcome.intent;
    
    return (
      <div className="min-h-screen bg-[#0a0b0e] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedOutcome(null)}
            className="text-sm text-white/50 hover:text-white mb-6"
          >
            ← Back to outcomes
          </button>
          
          <h1 className="text-2xl font-medium mb-6">{selectedOutcome.outcome.label}</h1>
          
          <ResolutionPanel
            blend={selectedOutcome.resolution}
            intent={{
              activationTarget: intent.activationTarget,
              cognitiveEndurance: intent.cognitiveEndurance,
              anxietySensitivity: intent.anxietySensitivity,
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}



