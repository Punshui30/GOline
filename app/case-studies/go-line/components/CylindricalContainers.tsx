export default function CylindricalContainers() {
  const outcomes = [
    { id: "relax", name: "RELAX", color: "#FF8C42" },
    { id: "study", name: "STUDY", color: "#20B2AA" },
    { id: "move", name: "MOVE", color: "#FF6347" },
    { id: "sleep", name: "GO SLEEP", color: "#9370DB" },
    { id: "brainstorm", name: "BRAINSTORM", color: "#32CD32" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <span className="text-xs md:text-sm font-medium text-charcoal/50 uppercase tracking-wider">
          Outcome-Specific Packaging Concepts
        </span>
      </div>
      
      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        {outcomes.map((outcome) => (
          <div key={outcome.id} className="flex flex-col items-center">
            <svg
              viewBox="0 0 120 200"
              className="w-24 h-40 md:w-28 md:h-48"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Black Cylindrical Container */}
              <rect
                x="20"
                y="30"
                width="80"
                height="150"
                rx="8"
                fill="#1F1F1F"
              />
              
              {/* Container Cap */}
              <ellipse
                cx="60"
                cy="30"
                rx="40"
                ry="8"
                fill="#1F1F1F"
              />
              
              {/* GO Logo - Hexagon G and O */}
              <g transform="translate(30, 50)">
                {/* G - Open Hexagon */}
                <path
                  d="M 10 5 L 20 5 L 25 12 L 20 19 L 10 19 L 5 12 Z"
                  fill="none"
                  stroke="#FAFAF7"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <line
                  x1="10"
                  y1="5"
                  x2="8"
                  y2="2"
                  stroke="#FAFAF7"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                
                {/* O - Complete Hexagon */}
                <path
                  d="M 15 12 L 20 7 L 25 12 L 25 17 L 20 22 L 15 17 Z"
                  fill="none"
                  stroke="#FAFAF7"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  transform="translate(15, 0)"
                />
              </g>
              
              {/* Outcome Icon Area */}
              <g transform="translate(40, 75)">
                {outcome.id === "relax" && (
                  <path
                    d="M 10 10 Q 5 15 10 20 Q 15 18 20 20 Q 25 15 20 10 Q 15 12 10 10"
                    fill={outcome.color}
                  />
                )}
                {outcome.id === "study" && (
                  <>
                    <line x1="5" y1="10" x2="35" y2="10" stroke={outcome.color} strokeWidth="4" strokeLinecap="round" />
                    <line x1="5" y1="15" x2="35" y2="15" stroke={outcome.color} strokeWidth="4" strokeLinecap="round" />
                    <line x1="5" y1="20" x2="35" y2="20" stroke={outcome.color} strokeWidth="4" strokeLinecap="round" />
                  </>
                )}
                {outcome.id === "move" && (
                  <>
                    <path d="M 20 5 L 20 25 M 20 5 L 10 15 M 20 5 L 30 15" stroke={outcome.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M 10 10 L 20 5 L 30 10" stroke={outcome.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </>
                )}
                {outcome.id === "sleep" && (
                  <>
                    <path d="M 20 25 L 20 5 M 20 25 L 10 15 M 20 25 L 30 15" stroke={outcome.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M 10 20 L 20 25 L 30 20" stroke={outcome.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </>
                )}
                {outcome.id === "brainstorm" && (
                  <>
                    <path d="M 10 10 L 20 20 L 10 30 L 20 20 L 30 10 L 20 20 L 30 30 Z" fill={outcome.color} />
                    <path d="M 12 12 L 20 20 L 12 28 M 28 12 L 20 20 L 28 28" stroke="#FAFAF7" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </g>
              
              {/* Outcome Name */}
              <text
                x="60"
                y="110"
                fontSize="9"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="600"
                fill={outcome.color}
                textAnchor="middle"
                letterSpacing="0.05em"
              >
                {outcome.name}
              </text>
              
              {/* Product Info */}
              <text
                x="60"
                y="130"
                fontSize="6"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="300"
                fill="#FAFAF7"
                textAnchor="middle"
                letterSpacing="0.02em"
              >
                WOLFE FLOWER CANNABIN
              </text>
              
              <text
                x="60"
                y="140"
                fontSize="6"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="300"
                fill="#FAFAF7"
                textAnchor="middle"
                letterSpacing="0.02em"
              >
                P97-1C01-1 0.5G
              </text>
            </svg>
            
            <div className="mt-3 text-center">
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: outcome.color }}
              >
                {outcome.name}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs md:text-sm text-charcoal/50 italic text-center mt-8">
        Conceptual packaging designs. All product details are illustrative examples.
      </p>
    </div>
  );
}











