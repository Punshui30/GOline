"use client";

import SectionWrapper from "./SectionWrapper";

export default function NitrogenProcessSection() {
  return (
    <SectionWrapper id="nitrogen-process" bgAlt={false} showDivider={true}>
      <div className="max-w-[750px]">
        <div className="border-l-4 border-sage/40 pl-4 md:pl-6 py-2 mb-6">
          <span className="text-xs md:text-sm font-medium text-charcoal/60 uppercase tracking-wide">
            Controlled Disclosure
          </span>
        </div>
        <h2 className="section-title">Validated Nitrogen-Based Process (Controlled Disclosure)</h2>
        <div className="space-y-4 md:space-y-5 text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
          <p>
            Daniel has developed a proprietary nitrogen-based extraction process that represents a new approach to solventless hash production. This method delivers significantly enhanced flavor profiles compared to conventional dry-ice and other atmospheric extraction techniques, effectively creating a new product category in the solventless space.
          </p>
          <p>
            This process has been independently evaluated through a formal feasibility study validating its technical viability under controlled conditions.
          </p>
          <p>
            The system operates within an inert nitrogen environment and leverages controlled gas-material interactions and low-shear fluid dynamics to influence dispersion, surface contact, and thermal behavior without oxidative exposure. The approach is designed as a closed-loop, non-reactive framework emphasizing repeatability, contamination control, and tunable physical outcomes.
          </p>
          <p>
            The feasibility assessment confirms:
          </p>
          <ul className="space-y-2 md:space-y-3 list-none ml-4 md:ml-6">
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Technical plausibility of the underlying physical mechanisms</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Repeatable system behavior within defined (undisclosed) operating ranges</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Clear differentiation from conventional solventless and atmospheric methods</span>
            </li>
          </ul>
          <p>
            Key implementation parameters, sequencing logic, and mechanical configurations are intentionally withheld. These elements constitute protected intellectual property and are disclosed only under NDA, formal partnership, or legal engagement.
          </p>
          <p>
            This overview is provided to establish validation and conceptual legitimacy-not to disclose process mechanics.
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
}

