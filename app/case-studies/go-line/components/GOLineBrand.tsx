import OutcomeIconSystem from "./OutcomeIcons";

export default function GOLineBrand() {
  const goOutcomes = [
    {
      id: "relax",
      name: "GO RELAX",
      description: "Outcome: Calm, tension release, mental quiet",
      approach: "Blend using plant varieties rich in calming compounds with balanced active ingredient profiles",
    },
    {
      id: "study",
      name: "GO STUDY",
      description: "Outcome: Sustained focus, mental clarity, reduced distraction",
      approach: "Profile using plant varieties with focus-enhancing compounds and supportive natural combinations",
    },
    {
      id: "brainstorm",
      name: "GO BRAINSTORM",
      description: "Outcome: Creative flow, associative thinking, ideation support",
      approach: "Complex blend balancing multiple natural compound families for cognitive flexibility",
    },
    {
      id: "move",
      name: "GO MOVE",
      description: "Outcome: Energy support, physical readiness, alertness",
      approach: "Profile using plant varieties with energizing natural compounds",
    },
    {
      id: "sleep",
      name: "GO SLEEP",
      description: "Outcome: Relaxation, transition support, rest preparation",
      approach: "Blend using plant varieties with sleep-supporting natural compounds and calming profiles",
    },
  ];

  return (
    <section id="go-line-brand" className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-charcoal mb-2 leading-tight tracking-tight">
          GO LINE — Guided Outcomes™
        </h2>
        <p className="text-xs md:text-sm font-medium text-charcoal/50 uppercase tracking-wider mb-6">
          Illustrative Brand System
        </p>
      </div>

      <div className="space-y-4 md:space-y-5 text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
        <p>
          GO LINE represents a product line that sits on top of the core processing platform. It demonstrates how proprietary processing methods enable differentiated products that deliver specific, reproducible effects without adding compounds after processing.
        </p>

        <p>
          The line operates on a simple principle: by selecting appropriate plant varieties and applying controlled processing (Method 7 or Method 18 as appropriate), specific effect profiles can be reliably achieved. These effects are then delivered through multiple product formats, from pre-rolls to concentrates to future edible and sublingual formats.
        </p>

        <div className="bg-offwhite/50 rounded-xl p-6 md:p-8 border border-lightgray/60 mt-6">
          <h3 className="text-lg md:text-xl font-semibold text-charcoal mb-6">
            Outcome Icons
          </h3>
          <OutcomeIconSystem
            outcomes={goOutcomes.map((o) => ({ id: o.id, name: o.name }))}
          />
          <p className="text-xs md:text-sm text-charcoal/60 text-center mt-6 italic">
            Geometric icon system for outcome identification. Minimalist, symbolic, format-agnostic.
          </p>
        </div>

        <div className="bg-offwhite/50 rounded-xl p-6 md:p-8 border border-lightgray/60 mt-6">
          <h3 className="text-lg md:text-xl font-semibold text-charcoal mb-4">
            Illustrative Outcome Framework
          </h3>
          <div className="space-y-6 md:space-y-8">
            {goOutcomes.map((outcome) => (
              <div key={outcome.id} className="border-b border-lightgray/40 last:border-0 pb-6 last:pb-0">
                <div className="mb-2">
                  <span className="text-xs md:text-sm font-medium text-charcoal/50 uppercase tracking-wider">
                    Concept Outcome
                  </span>
                </div>
                <h4 className="text-base md:text-lg font-semibold text-sage mb-2">
                  {outcome.name}
                </h4>
                <p className="text-sm md:text-base text-charcoal/70 mb-3">
                  {outcome.description}
                </p>
                <p className="text-xs md:text-sm text-charcoal/60 italic">
                  Approach: {outcome.approach}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 pt-4 border-t border-lightgray/40 text-xs md:text-sm text-charcoal/50 italic">
            All outcomes listed above are illustrative examples. Actual cultivar selection, blending ratios, and process parameters remain proprietary.
          </p>
        </div>

        <p className="mt-6">
          The GO LINE framework demonstrates that effect-driven product design is possible when process control is sufficient to preserve and express natural plant chemistry. Each outcome leverages the platform's core capabilities—natural compound preservation, repeatability, and adjustable product properties—to deliver a consistent experience aligned with the intended use case.
        </p>
      </div>
    </section>
  );
}

