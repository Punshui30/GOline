import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nitrogen-Based Processing Systems",
  description: "Exploratory work on nitrogen-based processing methods for cannabis extraction and product consistency.",
  openGraph: {
    title: "Nitrogen-Based Processing Systems",
    description: "Exploratory work on nitrogen-based processing methods for cannabis extraction and product consistency.",
    images: [
      {
        url: "https://daniel-simmonds.com/og/go-outcomes.jpg",
        width: 1200,
        height: 630,
        alt: "Nitrogen-based processing systems",
        type: "image/jpeg",
      },
    ],
    type: "article",
    url: "https://daniel-simmonds.com/case-studies/nitrogen-systems/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nitrogen-Based Processing Systems",
    description: "Exploratory work on nitrogen-based processing methods for cannabis extraction and product consistency.",
    images: ["https://daniel-simmonds.com/og/go-outcomes.jpg"],
  },
};

export default function NitrogenSystemsCaseStudy() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#0b0c0f]">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0b0c0f]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            <Link
              href="/"
              className="text-lg md:text-xl font-semibold text-white hover:text-white/80 transition-colors"
            >
              Daniel Simmonds
            </Link>
            <Link
              href="/"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Portfolio
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-16 md:pt-28 md:pb-20">
        {/* SECTION 1 — HERO */}
        <section className="py-20 md:py-28 bg-[#0b0c0f]">
          <div className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-white mb-6 tracking-tight leading-none">
              Nitrogen-Based Processing Systems
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl text-white/80 mb-6 font-normal">
              R&D and process exploration work on controlled-environment extraction methods
            </h2>
            <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              This page documents exploratory work on nitrogen-based processing approaches designed to address consistency, preservation, and process control in cannabis extraction.
            </p>
          </div>
        </section>

        {/* SECTION 2 — CONTEXT */}
        <section className="py-0 bg-[#0b0c0f] border-t border-white/10">
          <div className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-10 tracking-tight">
              Context
            </h2>
            <div className="space-y-6 text-base md:text-lg text-white/80 leading-relaxed">
              <p>
                Nitrogen-based processing methods are explored to address fundamental challenges in cannabis extraction: consistency, terpene preservation, and process control.
              </p>
              <p>
                Traditional methods face limitations in maintaining volatile compounds and achieving repeatable outcomes across variable inputs.
              </p>
              <p>
                Controlled nitrogen environments offer potential pathways to improved stability, reduced oxidation, and more predictable process behavior.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3 — SYSTEM OVERVIEW */}
        <section className="py-0 bg-[#0b0c0f] border-t border-white/10">
          <div className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-10 tracking-tight">
              System Overview
            </h2>
            <div className="space-y-6 text-base md:text-lg text-white/80 leading-relaxed">
              <p>
                Nitrogen-based processing operates within controlled, inert environments to minimize oxidation and preserve volatile compounds.
              </p>
              <p>
                Process logic emphasizes repeatability, contamination control, and tunable physical outcomes through controlled gas-material interactions.
              </p>
              <p>
                The approach is designed as a closed-loop, non-reactive framework that can be adapted to various input materials and desired output characteristics.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4 — METHODS */}
        <section className="py-0 bg-[#0b0c0f] border-t border-white/10">
          <div className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-10 tracking-tight">
              Processing Methods
            </h2>
            
            {/* Processing Methods Visual */}
            <div className="mb-10 max-w-[760px] mx-auto">
              <Image
                src="/case-studies/go-line/processing-methods.png"
                alt="Processing methods: Method 7 and Method 18 - nitrogen-based processing implementation"
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                style={{ aspectRatio: '3/2', maxWidth: '760px' }}
              />
              <p className="text-sm text-white/60 italic mt-4 text-left">
                Processing methods validated through independent feasibility study
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-6">
                  Method 7
                </h3>
                <div className="space-y-4 text-base md:text-lg text-white/80 leading-relaxed">
                  <p>
                    A solventless extraction approach designed to preserve volatile aromatics and support outcome-forward profiles without artificial enhancement.
                  </p>
                  <p>
                    Method 7 prioritizes maximum consistency, terpene preservation, and outcome fidelity, with yield treated as a secondary variable.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-6">
                  Method 18
                </h3>
                <div className="space-y-4 text-base md:text-lg text-white/80 leading-relaxed">
                  <p>
                    An advanced solventless architecture emphasizing separation, structure, and post-process outcome tuning.
                  </p>
                  <p>
                    Method 18 maintains outcome consistency and quality standards while intentionally optimizing for increased yield and scalability.
                  </p>
                </div>
              </div>

              <div className="text-base md:text-lg text-white/70 italic leading-relaxed">
                <p>
                  These methods have been independently validated through a formal feasibility study confirming technical viability under controlled conditions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — RELATIONSHIP TO OTHER WORK */}
        <section className="py-0 bg-[#0b0c0f] border-t border-white/10">
          <div className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-10 tracking-tight">
              Relationship to Other Work
            </h2>
            <div className="space-y-6 text-base md:text-lg text-white/80 leading-relaxed">
              <p>
                This processing work is independent and can support multiple product systems.
              </p>
              <p>
                Nitrogen-based methods represent one possible implementation pathway, not a fixed requirement for outcome-driven product design.
              </p>
              <p>
                These processing approaches can be applied to various product systems and are not defined by or limited to any single brand or outcome framework.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6 — NOTE FOR FUTURE EXPANSION */}
        <section className="py-0 bg-[#0b0c0f] border-t border-white/10">
          <div className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-10 tracking-tight">
              Future Expansion
            </h2>
            <div className="space-y-6 text-base md:text-lg text-white/80 leading-relaxed">
              <p>
                This page is evolving and exploratory in nature.
              </p>
              <p>
                Additional methods, technical details, and process documentation will be expanded over time as work develops.
              </p>
            </div>
          </div>
        </section>

        {/* Back Link */}
        <div className="fixed bottom-8 left-8 z-40">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-all backdrop-blur-sm border border-white/10"
          >
            <span>←</span>
            <span className="text-sm">Back to Portfolio</span>
          </Link>
        </div>
      </div>
    </main>
  );
}











