export default function PreRollDiagram() {
  return (
    <div className="bg-offwhite rounded-xl p-8 md:p-12 border border-lightgray/60">
      <div className="text-center mb-8">
        <span className="text-xs md:text-sm font-medium text-charcoal/50 uppercase tracking-wider">
          Product Architecture Concept
        </span>
      </div>
      
      <div className="space-y-12 md:space-y-16">
        {/* Split-Spectrum Concept */}
        <div>
          <div className="mb-6">
            <h4 className="text-base md:text-lg font-semibold text-charcoal mb-2">
              Split-Spectrum Format
            </h4>
            <p className="text-xs md:text-sm text-charcoal/60">
              Distinct cannabinoid and terpene zones
            </p>
          </div>
          
          <svg
            viewBox="0 0 400 120"
            className="w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Pre-Roll Body */}
            <rect
              x="50"
              y="40"
              width="300"
              height="40"
              rx="20"
              fill="none"
              stroke="#1F1F1F"
              strokeWidth="2"
            />
            
            {/* Split Zone 1 - Cannabinoid */}
            <rect
              x="60"
              y="50"
              width="130"
              height="20"
              rx="8"
              fill="#5B6E5A"
              opacity="0.2"
            />
            <line
              x1="130"
              y1="50"
              x2="130"
              y2="70"
              stroke="#5B6E5A"
              strokeWidth="1.5"
            />
            
            {/* Split Zone 2 - Terpene */}
            <rect
              x="200"
              y="50"
              width="130"
              height="20"
              rx="8"
              fill="#8B5CF6"
              opacity="0.15"
            />
            
            {/* Labels */}
            <text
              x="125"
              y="45"
              fontSize="8"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="500"
              fill="#5B6E5A"
              textAnchor="middle"
            >
              CANNABINOID
            </text>
            
            <text
              x="265"
              y="45"
              fontSize="8"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="500"
              fill="#8B5CF6"
              textAnchor="middle"
            >
              TERPENE
            </text>
            
            {/* Filter End */}
            <rect
              x="30"
              y="45"
              width="20"
              height="30"
              rx="10"
              fill="#1F1F1F"
              opacity="0.3"
            />
            
            {/* Tip End */}
            <rect
              x="370"
              y="50"
              width="20"
              height="20"
              rx="2"
              fill="#1F1F1F"
              opacity="0.5"
            />
            
            {/* Symbolic Icons */}
            <circle cx="90" cy="60" r="4" fill="#5B6E5A" opacity="0.6" />
            <circle cx="240" cy="60" r="4" fill="#8B5CF6" opacity="0.6" />
          </svg>
        </div>

        {/* Full-Spectrum Concept */}
        <div>
          <div className="mb-6">
            <h4 className="text-base md:text-lg font-semibold text-charcoal mb-2">
              Full-Spectrum Format
            </h4>
            <p className="text-xs md:text-sm text-charcoal/60">
              Integrated whole-flower composition
            </p>
          </div>
          
          <svg
            viewBox="0 0 400 120"
            className="w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Pre-Roll Body */}
            <rect
              x="50"
              y="40"
              width="300"
              height="40"
              rx="20"
              fill="none"
              stroke="#1F1F1F"
              strokeWidth="2"
            />
            
            {/* Integrated Content */}
            <rect
              x="60"
              y="50"
              width="280"
              height="20"
              rx="8"
              fill="#5B6E5A"
              opacity="0.15"
            />
            
            {/* Blend Indicators */}
            <circle cx="120" cy="60" r="3" fill="#5B6E5A" opacity="0.4" />
            <circle cx="200" cy="60" r="3" fill="#5B6E5A" opacity="0.4" />
            <circle cx="280" cy="60" r="3" fill="#5B6E5A" opacity="0.4" />
            
            {/* Label */}
            <text
              x="200"
              y="45"
              fontSize="8"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="500"
              fill="#5B6E5A"
              textAnchor="middle"
              letterSpacing="0.05em"
            >
              INTEGRATED COMPOSITION
            </text>
            
            {/* Filter End */}
            <rect
              x="30"
              y="45"
              width="20"
              height="30"
              rx="10"
              fill="#1F1F1F"
              opacity="0.3"
            />
            
            {/* Tip End */}
            <rect
              x="370"
              y="50"
              width="20"
              height="20"
              rx="2"
              fill="#1F1F1F"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>
      
      <div className="mt-12 pt-8 border-t border-lightgray/40">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-charcoal opacity-10"></div>
            <div className="text-xs text-charcoal/60">Filter</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-sage opacity-20"></div>
            <div className="text-xs text-charcoal/60">Content Zone</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-purple-500 opacity-15"></div>
            <div className="text-xs text-charcoal/60">Terpene Profile</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-charcoal opacity-20"></div>
            <div className="text-xs text-charcoal/60">Tip</div>
          </div>
        </div>
      </div>
      
      <p className="text-xs md:text-sm text-charcoal/50 italic text-center mt-8">
        Abstract product architecture diagrams. No measurements or manufacturing instructions.
      </p>
    </div>
  );
}











