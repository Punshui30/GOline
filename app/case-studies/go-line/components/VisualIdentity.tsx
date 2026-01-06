import GOSystemLogo from "./GOSystemLogo";
import OutcomeIconSystem from "./OutcomeIcons";

export default function VisualIdentity() {
  const brandElements = [
    {
      outcome: "GO RELAX",
      color: "#6B7D7D",
      colorName: "Sage Muted",
      rationale: "Calming, grounded, natural",
    },
    {
      outcome: "GO STUDY",
      color: "#4A5C6B",
      colorName: "Deep Blue",
      rationale: "Focused, clear, structured",
    },
    {
      outcome: "GO BRAINSTORM",
      color: "#7B6B8C",
      colorName: "Creative Purple",
      rationale: "Innovative, fluid, associative",
    },
    {
      outcome: "GO MOVE",
      color: "#8C7B5A",
      colorName: "Energy Amber",
      rationale: "Active, dynamic, alert",
    },
    {
      outcome: "GO SLEEP",
      color: "#5A6B7D",
      colorName: "Evening Indigo",
      rationale: "Calming, transitional, restful",
    },
  ];

  return (
    <section id="visual-identity" className="space-y-6 md:space-y-8">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-charcoal mb-6 leading-tight tracking-tight">
        Branding System & Visual Language
      </h2>

      <div className="space-y-4 md:space-y-5 text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
        <p>
          The GO LINE visual identity is designed to communicate clarity, precision, and regulatory appropriateness. The system prioritizes legibility and professionalism while maintaining enough distinctiveness to support product differentiation across multiple formats.
        </p>

        <div className="bg-offwhite/50 rounded-xl p-6 md:p-8 border border-lightgray/60 mt-6">
          <h3 className="text-lg md:text-xl font-semibold text-charcoal mb-6">
            Logo System
          </h3>
          <div className="space-y-6 mb-8">
            <div>
              <div className="mb-4">
                <span className="text-xs md:text-sm font-medium text-charcoal/50 uppercase tracking-wider">
                  Primary Logo — Black Background
                </span>
              </div>
              <GOSystemLogo />
              <p className="text-xs md:text-sm text-charcoal/60 text-center mt-4">
                Minimalist geometric typography with Swiss modernist influence. "GO" emphasized; "GUIDED OUTCOMES" provides context without clutter.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {brandElements.map((element) => (
                <div
                  key={element.outcome}
                  className="border border-lightgray/60 rounded-lg p-4 bg-white"
                >
                  <div
                    className="w-full h-16 rounded mb-3"
                    style={{ backgroundColor: element.color }}
                  />
                  <div className="text-xs font-semibold text-charcoal mb-1">
                    {element.outcome}
                  </div>
                  <div className="text-xs text-charcoal/60 mb-1">
                    {element.colorName}
                  </div>
                  <div className="text-xs text-charcoal/50 italic">
                    {element.rationale}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-offwhite/50 rounded-xl p-6 md:p-8 border border-lightgray/60 mt-8">
          <h3 className="text-lg md:text-xl font-semibold text-charcoal mb-6">
            Outcome Icon System
          </h3>
          <OutcomeIconSystem
            outcomes={[
              { id: "relax", name: "GO RELAX" },
              { id: "study", name: "GO STUDY" },
              { id: "brainstorm", name: "GO BRAINSTORM" },
              { id: "move", name: "GO MOVE" },
              { id: "sleep", name: "GO SLEEP" },
            ]}
          />
          <p className="text-xs md:text-sm text-charcoal/60 text-center mt-6">
            Abstract geometric icons for each outcome. Symbolic, non-literal, designed for regulated product platforms.
          </p>
        </div>

        <h3 className="text-lg md:text-xl font-semibold text-charcoal mt-8 mb-4">
          Typography Rationale
        </h3>
        <p>
          The system uses a clean, modern sans-serif typeface appropriate for regulated markets. Headlines employ tight letter spacing for a technical, precise feel, while body text maintains comfortable line height for readability. The typography avoids decorative elements, prioritizing clarity and regulatory compliance.
        </p>

        <h3 className="text-lg md:text-xl font-semibold text-charcoal mt-8 mb-4">
          Color Logic
        </h3>
        <p>
          Each outcome within the GO LINE family uses a distinct but muted color palette that reflects its intended effect while maintaining visual coherence across the system. Colors are desaturated to avoid appearing overly commercial or "lifestyle-branded," instead suggesting scientific precision and thoughtful design.
        </p>

        <p className="text-xs md:text-sm text-charcoal/50 italic mt-6">
          All visual elements shown above are conceptual design studies, not final commercial assets.
        </p>
      </div>
    </section>
  );
}

