export default function GoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        {/* Left angular shape */}
        <path d="M30 20 L90 20 L60 60 L90 100 L30 100 Z" />
        {/* Inner connector */}
        <path d="M90 60 L120 80" />
        {/* Right hexagon */}
        <path d="M160 20 L200 40 L200 80 L160 100 L120 80 L120 40 Z" />
      </g>
    </svg>
  );
}

