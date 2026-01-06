export default function GOSystemLogo() {
  return (
    <div className="bg-charcoal rounded-lg p-8 md:p-12 flex items-center justify-center">
      <div className="flex items-center gap-6 md:gap-8">
        {/* Hexagon GO Logo */}
        <svg
          viewBox="0 0 120 120"
          className="w-20 h-20 md:w-24 md:h-24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* G - Open Hexagon with Diagonal */}
          <path
            d="M 30 20 L 70 20 L 90 50 L 70 80 L 30 80 L 10 50 Z"
            fill="none"
            stroke="#FAFAF7"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <line
            x1="30"
            y1="20"
            x2="20"
            y2="10"
            stroke="#FAFAF7"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* O - Complete Hexagon */}
          <path
            d="M 50 50 L 70 30 L 90 50 L 90 70 L 70 90 L 50 70 Z"
            fill="none"
            stroke="#FAFAF7"
            strokeWidth="4"
            strokeLinejoin="round"
            transform="translate(50, 0)"
          />
        </svg>
        
        {/* Tagline */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white text-lg md:text-xl font-semibold">GO</span>
            <span className="text-white text-sm md:text-base">-</span>
            <span className="text-white text-sm md:text-base font-light">GUIDED OUTCOMES™</span>
          </div>
          <div className="h-0.5 w-12 bg-orange-500"></div>
        </div>
      </div>
    </div>
  );
}

