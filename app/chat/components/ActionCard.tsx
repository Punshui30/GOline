'use client';

import { ActionCard as ActionCardType } from '@/lib/flow/types';
import { useState } from 'react';

interface ActionCardProps {
  card: ActionCardType;
}

export default function ActionCard({ card }: ActionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(card.say_this_script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">{card.title}</h2>

      {/* Do This Today */}
      {card.do_today && card.do_today.length > 0 && (
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Do This Today</h3>
          <ul className="space-y-2">
            {card.do_today.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span className="text-gray-700 text-base">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Say This Script */}
      {card.say_this_script && (
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Say This</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
            <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
              {card.say_this_script}
            </p>
            <button
              onClick={handleCopyScript}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Script'}
            </button>
          </div>
        </section>
      )}

      {/* Bring This */}
      {card.bring_this && card.bring_this.length > 0 && (
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Bring This</h3>
          <ul className="space-y-2">
            {card.bring_this.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span className="text-gray-700 text-base">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* If They Stall */}
      {card.if_they_stall && card.if_they_stall.length > 0 && (
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-3">If They Stall</h3>
          <ul className="space-y-2">
            {card.if_they_stall.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span className="text-gray-700 text-base">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Local Resources */}
      {card.local_resources && card.local_resources.length > 0 && (
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Local Resources</h3>
          <div className="space-y-3">
            {card.local_resources.map((resource, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="font-medium text-gray-900">{resource.name}</p>
                {resource.phone && (
                  <p className="text-gray-700 text-base mt-1">
                    Phone: <a href={`tel:${resource.phone}`} className="text-blue-600 hover:underline">{resource.phone}</a>
                  </p>
                )}
                {resource.address && (
                  <p className="text-gray-700 text-base mt-1">{resource.address}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimers */}
      {card.disclaimers && card.disclaimers.length > 0 && (
        <section className="pt-4 border-t border-gray-200">
          <ul className="space-y-2">
            {card.disclaimers.map((disclaimer, idx) => (
              <li key={idx} className="text-sm text-gray-600 italic">
                {disclaimer}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Download/Print button (placeholder) */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Print / Save
        </button>
      </div>
    </div>
  );
}















