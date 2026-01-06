import React from "react";

interface OutcomeIconProps {
  outcome: string;
  size?: number;
}

function OutcomeIcon({ outcome, size = 80 }: OutcomeIconProps) {
  const IconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
    relax: RelaxIcon,
    study: StudyIcon,
    brainstorm: BrainstormIcon,
    move: MoveIcon,
    sleep: SleepIcon,
  };

  const IconComponent = IconComponents[outcome.toLowerCase()] || RelaxIcon;

  return (
    <div className="transition-transform duration-300 hover:scale-105">
      <IconComponent />
    </div>
  );
}

interface OutcomeIconSystemProps {
  outcomes: Array<{ id: string; name: string }>;
}

export default function OutcomeIconSystem({ outcomes }: OutcomeIconSystemProps) {
  const outcomeColors: Record<string, string> = {
    relax: "#FF8C42",
    study: "#20B2AA",
    brainstorm: "#32CD32",
    move: "#FF6347",
    sleep: "#9370DB",
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-8 md:gap-12">
      {outcomes.map((outcome) => (
        <div key={outcome.id} className="flex flex-col items-center space-y-3">
          <div className="bg-offwhite rounded-lg p-6 border border-lightgray/60 w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
            <OutcomeIcon outcome={outcome.id} size={80} />
          </div>
          <div className="text-center">
            <div 
              className="text-xs md:text-sm font-medium mb-1"
              style={{ color: outcomeColors[outcome.id] || "#5B6E5A" }}
            >
              {outcome.name}
            </div>
            <div className="text-xs text-charcoal/50 uppercase tracking-wider">
              {outcome.id}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Colorful geometric icons matching the design
export function RelaxIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Orange leaf-like/teardrop shapes */}
      <path
        d="M 30 40 Q 20 50 30 60 Q 40 55 50 60 Q 60 55 70 60 Q 80 50 70 40 Q 60 45 50 40 Q 40 45 30 40"
        fill="#FF8C42"
        stroke="#FF8C42"
        strokeWidth="2"
      />
      <path
        d="M 35 45 Q 30 50 35 55 Q 40 52 45 55 Q 50 52 55 55 Q 60 50 55 45 Q 50 48 45 45 Q 40 48 35 45"
        fill="#FFA366"
      />
    </svg>
  );
}

export function StudyIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Teal three horizontal lines */}
      <line x1="20" y1="40" x2="80" y2="40" stroke="#20B2AA" strokeWidth="6" strokeLinecap="round" />
      <line x1="20" y1="50" x2="80" y2="50" stroke="#20B2AA" strokeWidth="6" strokeLinecap="round" />
      <line x1="20" y1="60" x2="80" y2="60" stroke="#20B2AA" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function BrainstormIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Lime green VS or broken square/diamond */}
      <path
        d="M 30 30 L 50 50 L 30 70 L 50 50 L 70 30 L 50 50 L 70 70 Z"
        fill="#32CD32"
        stroke="#32CD32"
        strokeWidth="2"
      />
      <path
        d="M 35 35 L 50 50 L 35 65 M 65 35 L 50 50 L 65 65"
        stroke="#FAFAF7"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoveIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Orange-red upward arrow with double-pronged head */}
      <path
        d="M 50 20 L 50 60 M 50 20 L 35 35 M 50 20 L 65 35"
        stroke="#FF6347"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 30 30 L 50 20 L 70 30"
        stroke="#FF6347"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function SleepIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Purple downward arrow with double-pronged head */}
      <path
        d="M 50 80 L 50 40 M 50 80 L 35 65 M 50 80 L 65 65"
        stroke="#9370DB"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 30 70 L 50 80 L 70 70"
        stroke="#9370DB"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

