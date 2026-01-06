import HashRosinPresentation from "./HashRosinPresentation";
import PreRollDiagram from "./PreRollDiagram";
import CylindricalContainers from "./CylindricalContainers";

export default function CrossFormatApplication() {
  const formats = [
    {
      format: "Pre-Rolls",
      description: "Pre-rolls utilizing Method 7 processed material in both split and full-spectrum formats",
      note: "Effect profile maintained through whole-plant blending and precise material selection",
    },
    {
      format: "Nitrogen-Processed Rosin",
      description: "Concentrated products produced via Method 7 or Method 18, preserving natural plant compounds",
      note: "Physical form changes, but effect profile remains consistent with pre-roll variants",
    },
    {
      format: "Edibles & Capsules",
      description: "Future formats utilizing the same plant variety selection and processing principles",
      note: "Delivery method differs, but effect approach remains constant",
    },
    {
      format: "Sublinguals",
      description: "Fast-acting formats maintaining effect integrity through controlled extraction",
      note: "Speed of effect differs, but core effect profile aligns with other formats",
    },
  ];

  return (
    <section id="cross-format" className="space-y-6 md:space-y-8">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-charcoal mb-6 leading-tight tracking-tight">
        One Logic, Multiple Formats
      </h2>

      <div className="space-y-4 md:space-y-5 text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
        <p>
          The Guided Outcomes™ system demonstrates that effect-driven product design can work across different product types. When the core approach—plant variety selection, process control, and effect design—is established at the platform level, it can be applied across multiple product formats without losing consistency.
        </p>

        <div className="mt-8">
          <h3 className="text-lg md:text-xl font-semibold text-charcoal mb-6">
            Pre-Roll Format Concepts
          </h3>
          <PreRollDiagram />
        </div>

        <div className="mt-12">
          <h3 className="text-lg md:text-xl font-semibold text-charcoal mb-6">
            Hash / Rosin Presentation Concepts
          </h3>
          <HashRosinPresentation />
        </div>

        <div className="mt-12">
          <h3 className="text-lg md:text-xl font-semibold text-charcoal mb-6">
            Outcome-Specific Container Concepts
          </h3>
          <CylindricalContainers />
        </div>

        <div className="bg-offwhite/50 rounded-xl p-6 md:p-8 border border-lightgray/60 mt-12">
          <div className="space-y-6 md:space-y-8">
            {formats.map((item, idx) => (
              <div key={idx} className="border-b border-lightgray/40 last:border-0 pb-6 last:pb-0">
                <div className="mb-2">
                  <span className="text-xs md:text-sm font-medium text-charcoal/50 uppercase tracking-wider">
                    Format
                  </span>
                </div>
                <h4 className="text-base md:text-lg font-semibold text-charcoal mb-2">
                  {item.format}
                </h4>
                <p className="text-sm md:text-base text-charcoal/70 mb-2">
                  {item.description}
                </p>
                <p className="text-xs md:text-sm text-charcoal/60 italic">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6">
          The critical insight is that the effect approach remains constant even as product form changes. A GO RELAX pre-roll, GO RELAX concentrate, and future GO RELAX edible all derive from the same plant variety selection and process design principles. The consumer experience may vary in speed of effect, duration, and intensity, but the core effect profile—calm, tension release, mental quiet—remains recognizable across formats.
        </p>

        <p>
          This cross-format approach enables product line consistency and simplifies product management. New formats can be introduced without redesigning the underlying effect approach, and existing formats can be refined while maintaining brand consistency. The platform architecture supports scalable product development while preserving effect integrity.
        </p>
      </div>
    </section>
  );
}

