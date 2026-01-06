import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import styles from "./GoLine.module.css";

export const metadata: Metadata = {
  title: "GO — Guided Outcomes",
  description: "An outcome-driven cannabis product system designed around predictable, repeatable effects.",
  openGraph: {
    title: "GO — Guided Outcomes",
    description: "An outcome-driven cannabis product system designed around predictable, repeatable effects.",
    images: [
      {
        url: "https://daniel-simmonds.com/og/go-outcomes.jpg",
        width: 1200,
        height: 630,
        alt: "GO — Guided Outcomes brand system",
        type: "image/jpeg",
      },
    ],
    type: "article",
    url: "https://daniel-simmonds.com/case-studies/go-line/",
  },
  twitter: {
    card: "summary_large_image",
    title: "GO — Guided Outcomes",
    description: "An outcome-driven cannabis product system designed around predictable, repeatable effects.",
    images: ["https://daniel-simmonds.com/og/go-outcomes.jpg"],
  },
};

export default function GOLineCaseStudy() {
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
        <section className={`${styles.heroSection} bg-[#0b0c0f]`}>
          <div className={styles.container}>
            <div className={styles.mediaBlock} style={{ marginTop: 0, marginBottom: 40 }}>
              <Image
                src="/case-studies/go-line/hero-brand-outcome.png"
                alt="GO brand and outcome framing"
                width={1200}
                height={800}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                priority
              />
            </div>
            <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-white ${styles.heading1} tracking-tight leading-none`}>
              GO — Guided Outcomes™
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl text-white/80 mb-6 font-normal">
              An outcome-driven system for intentional, useful cannabis products
            </h2>
            <div className={styles.bodyTextContainer} style={{ margin: '0 auto 24px' }}>
              <p className={`text-sm md:text-base text-white/50 italic ${styles.bodyText} font-medium`}>
                Important Note
              </p>
              <p className={`text-sm md:text-base text-white/50 italic ${styles.bodyText}`}>
                This is not a live product, brand, or commercial offering.
                GO — Guided Outcomes™ is a thought experiment and strategic exercise exploring how outcome-driven cannabis systems could be designed and applied.
              </p>
            </div>
            <p className={`text-base md:text-lg text-white/60 ${styles.bodyTextContainer}`} style={{ margin: '0 auto', lineHeight: '1.7' }}>
              GO demonstrates how branding, UX, and product logic work together to create clarity and usefulness over hype.
            </p>
          </div>
        </section>

        {/* SECTION 2 — WHAT THE GO SYSTEM IS */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-white ${styles.heading2First} tracking-tight`}>
              What the GO System Is
            </h2>
            <div className={styles.mediaBlock}>
              <Image
                src="/case-studies/go-line/system-overview-ai.png"
                alt="GO system overview showing AI core and outcome engine"
                width={1200}
                height={800}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            <div className={`${styles.bodyTextContainer} ${styles.bodyText}`}>
              <p className={`${styles.paragraph} text-white/90`}>
                GO is an outcome-driven system. Outcomes are created by combining cultivars based on terpene interactions and ratios.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                No additives or artificial terpenes are used. Effects emerge from how naturally occurring compounds interact when specific cultivars are combined in precise proportions.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                Formats are flexible—flower, pre-rolls, concentrates—but the outcome logic remains consistent. The proprietary value lies in the decision logic, not in products themselves.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3 — WHY THIS EXISTS */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-white ${styles.heading2} tracking-tight`}>
              Why This Exists
            </h2>
            <div className={`${styles.bodyTextContainer} ${styles.bodyText}`}>
              <p className={`${styles.paragraph} text-white/90`}>
                Outcome branding exists today, but most approaches simply rename single strains. That model is static and fragile—when the strain changes, the promise breaks.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                GO designs outcomes intentionally and adaptively. By organizing around what consumers actually want to feel, rather than what strains happen to be available, the system remains stable even as inputs shift.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                This approach bridges the gap between consumer expectation and operational reality in early-stage cannabis markets where sourcing is inconsistent.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4 — HOW THE SYSTEM WORKS */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-white ${styles.heading2} tracking-tight`}>
              How the System Works
            </h2>
            <div className={styles.mediaBlock}>
              <Image
                src="/case-studies/go-line/multi-cultivar-engine.png"
                alt="Multi-cultivar outcome engine showing layered terpene logic"
                width={1200}
                height={800}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <p className={`${styles.caption} text-white/80 italic`}>
                Multiple cultivars are evaluated together — accounting for all terpene interactions and relative ratios — to intentionally arrive at a target outcome.
              </p>
            </div>
            <div className={`${styles.bodyTextContainer} ${styles.bodyText}`}>
              <p className={`${styles.paragraph} text-white/90`}>
                Cultivars contain many terpenes, not just one or two. Effects emerge from how all terpene interactions play out together.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                Ratios matter. The same two cultivars combined in different proportions produce different outcomes. Multiple cultivars may be combined for one outcome.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                Managing this complexity requires systematic evaluation of cultivar combinations. Computational tools are used as practical aids to analyze interactions and predict outcomes, not as marketing features.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5 — FLEXIBILITY + CUSTOMIZATION */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-white ${styles.heading2} tracking-tight`}>
              Flexibility + Customization
            </h2>
            <div className={`${styles.bodyTextContainer} ${styles.bodyText}`}>
              <p className={`${styles.paragraph} text-white/90`}>
                Outcomes remain consistent even when inputs change. The system can respond to inventory shifts, operator requests, and dispensary-level needs without breaking consumer trust.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                If a specific cultivar becomes unavailable, alternative combinations can achieve the same outcome. The logic is transferable, not locked to specific inputs.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                This adaptability makes the system viable for early-stage operations where sourcing is variable and capital is limited.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6 — OUTCOME CATEGORIES */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-white ${styles.heading2} tracking-tight`}>
              Outcome Categories
            </h2>
            <div className={styles.mediaBlock}>
              <Image
                src="/case-studies/go-line/outcome-icons.png"
                alt="GO outcome icons showing Relax, Study, Move, Sleep"
                width={1200}
                height={800}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            <div className={styles.outcomeGrid}>
              <div>
                <div className="mb-3 text-xl font-semibold tracking-tight" style={{ color: '#FF8C42' }}>RELAX</div>
                <p className="text-sm text-white/95" style={{ lineHeight: '1.6' }}>
                  Calming terpene profiles for evening decompression
                </p>
              </div>
              <div>
                <div className="mb-3 text-xl font-semibold tracking-tight" style={{ color: '#20B2AA' }}>STUDY</div>
                <p className="text-sm text-white/95" style={{ lineHeight: '1.6' }}>
                  Focused compositions for deep work and concentration
                </p>
              </div>
              <div>
                <div className="mb-3 text-xl font-semibold tracking-tight" style={{ color: '#FF6347' }}>MOVE</div>
                <p className="text-sm text-white/95" style={{ lineHeight: '1.6' }}>
                  Energizing profiles for physical activity and recovery
                </p>
              </div>
              <div>
                <div className="mb-3 text-xl font-semibold tracking-tight" style={{ color: '#9370DB' }}>SLEEP</div>
                <p className="text-sm text-white/95" style={{ lineHeight: '1.6' }}>
                  Sedating profiles for sleep onset and wind-down
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — FROM SYSTEM TO PRODUCT (EXAMPLES) */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-white ${styles.heading2} tracking-tight`}>
              From System to Product
            </h2>
            <div className={styles.mediaBlock}>
              <Image
                src="/case-studies/go-line/product-lineup-new.png"
                alt="GO product lineup - illustrative examples only, not offerings"
                width={1200}
                height={800}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            <div className={`${styles.bodyTextContainer} ${styles.bodyText}`}>
              <p className={`${styles.paragraph} text-white/90`}>
                Products shown here are illustrative examples only, not offerings or a fixed SKU strategy.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                The emphasis is on usefulness over novelty, and on differentiation even in simple formats like pre-rolls.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 8 — FORMAT DESIGN */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-white ${styles.heading2} tracking-tight`}>
              Format Design
            </h2>
            <div className={`${styles.bodyTextContainer} ${styles.bodyText}`} style={{ marginBottom: 20 }}>
              <p className={`${styles.paragraph} text-white/90`}>
                Physical implementation of outcome logic varies by format. How cultivars are combined—whether evenly blended or intentionally layered—shapes onset, duration, and effect curve.
              </p>
            </div>
            <div className={styles.mediaBlock}>
              <Image
                src="/case-studies/go-line/preroll-engineering.png"
                alt="Pre-roll construction comparison showing blended vs stacked composition methods"
                width={1200}
                height={800}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            <div className={`${styles.bodyTextContainer} ${styles.bodyText}`}>
              <p className={`${styles.paragraph} text-white/90`}>
                Intentional layering replaces strain mythology with predictable engineering. Effects become reliable through composition logic, not marketing claims.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 9 — BRANDING STRATEGY — THE LONG PLAY */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-white ${styles.heading2} tracking-tight`}>
              Branding Strategy — The Long Play
            </h2>
            <div className={`${styles.bodyTextContainer} ${styles.bodyText}`}>
              <p className={`${styles.paragraph} text-white/90`}>
                GO is designed for long-term users. After novelty fades, users value clarity, predictability, and trust.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                This approach is relevant to mature markets, cannabis tourism, and repeat and wellness-adjacent users who prioritize function over flash.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                Branding decisions reflect this: restrained typography, outcome-first language, and reduced cognitive load all support long-term usability rather than short-term attention.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                The system ages with the user, remaining useful and trustworthy rather than trying to stay trendy.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 10 — POP-CULTURE STRAINS */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-white ${styles.heading2} tracking-tight`}>
              Pop-Culture Strains
            </h2>
            <div className={`${styles.bodyTextContainer} ${styles.bodyText}`}>
              <p className={`${styles.paragraph} text-white/90`}>
                Strain names matter culturally. GO doesn't erase them, but they don't drive expectations.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                The system maintains one foot in pop culture and one in intentional design. Users can reference familiar strain names in conversation while still relying on outcome clarity for purchase decisions.
              </p>
              <p className={`${styles.paragraph} text-white/90`}>
                This acknowledges the cultural reality of cannabis while providing a more reliable interface for actual use.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 11 — VISUAL IDENTITY */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <div className={styles.visualIdentityGrid}>
              <div className={styles.visualIdentityColumn}>
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight`}>
                  Typography
                </h2>
                <div className={styles.bodyText} style={{ maxWidth: '100%' }}>
                  <p className={`${styles.paragraph} text-white/90`}>
                    Typeface chosen for legibility, neutrality, and trust. Avoids counterculture and novelty cues.
                  </p>
                  <p className={`${styles.paragraph} text-white/90`}>
                    Supports clarity across packaging, digital, and compliance needs. Clear hierarchy favors reading over decoration.
                  </p>
                </div>
              </div>
              <div className={styles.visualIdentityColumn}>
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight`}>
                  Color & Iconography
                </h2>
                <div className={styles.bodyText} style={{ maxWidth: '100%' }}>
                  <p className={`${styles.paragraph} text-white/90`}>
                    Dark backgrounds create calm and suggest longevity. Color is used for differentiation, not noise.
                  </p>
                  <p className={`${styles.paragraph} text-white/90`}>
                    Icons enable fast recognition. Typography prioritizes trust and legibility. The visual system functions as infrastructure, not decoration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 12 — REFLECTION */}
        <section className={`${styles.section} bg-[#0b0c0f] border-t border-white/10`}>
          <div className={styles.container}>
            <div className={styles.reflectionContainer}>
              <p className={`text-xl sm:text-2xl md:text-3xl text-white/90 ${styles.bodyText} font-medium mb-6`} style={{ lineHeight: '1.7' }}>
                This is not a prescription. It's an example of how complex product and branding problems are approached.
              </p>
              <p className={`text-base md:text-lg text-white/70 ${styles.bodyText}`} style={{ lineHeight: '1.7' }}>
                Emphasis on constraints, adaptability, and long-term usefulness over short-term appeal. Systems thinking applied to real operational challenges.
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
