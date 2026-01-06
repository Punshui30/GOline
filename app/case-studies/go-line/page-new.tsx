"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function GOLineCaseStudy() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#0b0c0f]">
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
        {/* SECTION A — HERO */}
        <section className="relative w-full py-16 md:py-24">
          <div className="absolute inset-0 bg-[#0b0c0f] opacity-90" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}></div>
          <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <img
                src="/brand/go-animated.svg"
                alt="GO Guided Outcomes monogram"
                className="h-24 md:h-32 w-auto mx-auto mb-8"
              />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 tracking-tight">
                GO™ — Guided Outcomes™
              </h1>
              <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-2">
                A Platform-to-Product Cannabis System
              </p>
              <p className="text-sm md:text-base text-white/60 max-w-2xl mx-auto">
                Cannabis, Designed With Intent
              </p>
            </div>
            <div className="relative w-full max-w-[1100px] mx-auto">
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src="/case-studies/go-line/go-brand-board.png"
                  alt="GO LINE brand system board showing GO monogram, outcome icons, jars, and cylindrical containers"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, 1100px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* INTRODUCTION */}
        <section className="py-12 md:py-16 bg-[#0b0c0f] border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 text-white/80 text-sm md:text-base leading-relaxed">
              <p>
                GO™ is a guided-outcomes system for cannabis—designed from cultivar selection through solventless processing to deliver reliable, repeatable effects without artificial terpene manipulation.
              </p>
              <p>
                Rather than asking consumers to decode strain names, terpene charts, or THC percentages, GO™ organizes cannabis around what people actually want to feel—and engineers products to deliver that outcome consistently, naturally, and with integrity.
              </p>
            </div>
          </div>
        </section>

        {/* INITIAL OUTCOMES */}
        <section className="py-16 md:py-24 bg-[#0b0c0f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
              Initial Outcomes
            </h2>
            <div className="space-y-4 text-white/80 text-sm md:text-base leading-relaxed mb-8">
              <p>RELAX • STUDY • MOVE • SLEEP • BRAINSTORM</p>
              <p className="text-white/60 text-xs md:text-sm italic">
                These outcomes represent the first standardized expressions of the Guided Outcomes™ system. Additional outcomes are in development. Custom outcomes can be designed by request.
              </p>
              <p className="font-semibold text-white">
                GO™ is not a fixed SKU list. It is a platform.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION B — OUTCOME FRAMEWORK */}
        <section className="py-16 md:py-24 bg-[#0b0c0f]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-xl mb-8">
              <Image
                src="/case-studies/go-line/guided-outcomes-flow.png"
                alt="Guided Outcomes flow illustration showing streams leading to outcomes with GO monogram origin"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 1100px"
              />
            </div>
            
            {/* THE PROBLEM */}
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-6 text-center tracking-tight">
                The Problem
              </h2>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-6 text-center">
                Cannabis Has a Clarity Problem
              </h3>
              <div className="space-y-4 text-white/80 text-sm md:text-base leading-relaxed">
                <p>
                  Modern cannabis branding optimizes for novelty, hype, and strain mythology. While this appeals to impulse buyers, it fails a large and growing audience.
                </p>
                <div className="bg-white/5 rounded-lg p-6 border border-white/10 my-6">
                  <h4 className="text-white font-semibold mb-4">The Underserved Consumer</h4>
                  <ul className="space-y-2 text-white/70">
                    <li>• Adults 40+</li>
                    <li>• Professionals, creatives, parents, operators</li>
                    <li>• Legacy users and newer adopters alike</li>
                    <li>• Outcome-oriented, not trend-driven</li>
                  </ul>
                </div>
                <p>
                  These consumers don't want to relearn cannabis every time they shop. They want clarity, consistency, and trust.
                </p>
                <p className="font-semibold text-white">
                  Mature consumers don't chase novelty — they repeat what works.
                </p>
                <p className="text-white/90">
                  GO™ is designed for repeat confidence.
                </p>
              </div>
            </div>

            {/* THE STRATEGY */}
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-6 text-center tracking-tight">
                The Strategy
              </h2>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-6 text-center">
                Outcome First, Without Compromise
              </h3>
              <div className="space-y-4 text-white/80 text-sm md:text-base leading-relaxed">
                <p>
                  GO™ inverts the traditional cannabis development process.
                </p>
                <div className="grid md:grid-cols-2 gap-6 my-6">
                  <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                    <h4 className="text-white font-semibold mb-3">Most products start with:</h4>
                    <p className="text-white/70 text-sm">
                      Cultivar → THC → Marketing → Guesswork
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                    <h4 className="text-white font-semibold mb-3">GO™ starts with:</h4>
                    <p className="text-white/70 text-sm">
                      Outcome → Composition → Method → Format
                    </p>
                  </div>
                </div>
                <p>
                  The outcome is defined first. The method is chosen second. The format is chosen last.
                </p>
                <div className="space-y-2 mt-4">
                  <p>This ensures:</p>
                  <ul className="list-none space-y-1 ml-4">
                    <li className="text-white/70">• No product exists without intent</li>
                    <li className="text-white/70">• No process exists without purpose</li>
                    <li className="text-white/70">• No format is treated generically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE PRINCIPLES */}
        <section className="py-16 md:py-24 bg-[#0b0c0f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-8 text-center tracking-tight">
              Core Principles
            </h2>
            <div className="space-y-6 text-white/80 text-sm md:text-base leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Outcome First</h3>
                <p>Every product begins with an intended effect—not a strain name.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Natural Composition</h3>
                <p>Outcomes are achieved through cultivar selection, proportional blending, and physical structuring—not artificial terpene reintroduction.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Format-Aware Design</h3>
                <p>Flower, pre-rolls, hash, and rosin each express outcomes differently. GO™ designs accordingly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* COMPOSITION STRATEGY */}
        <section className="py-16 md:py-24 bg-[#0b0c0f]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4 text-center tracking-tight">
              Composition Strategy
            </h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-8 text-center">
              Blended vs. Stacked
            </h3>
            <div className="max-w-4xl mx-auto mb-8">
              <p className="text-white/80 text-sm md:text-base text-center mb-8">
                GO™ recognizes that how cultivars are combined shapes experience—not just which cultivars are used.
              </p>
            </div>
            <div className="relative w-full max-w-4xl mx-auto aspect-[16/10] rounded-lg overflow-hidden shadow-xl mb-8">
              <Image
                src="/case-studies/go-line/preroll-blended-vs-stacked-relax.png"
                alt="Pre-roll architecture comparison showing BLENDED and STACKED methods for Guided Outcome: RELAX"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 1100px"
              />
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Blended Composition</h4>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li>• Even distribution throughout the product</li>
                    <li>• Unified expression</li>
                    <li>• Predictable, steady effect</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Stacked Composition</h4>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li>• Intentional zones within a single product</li>
                    <li>• Phased or evolving experience</li>
                    <li>• Controlled transitions</li>
                  </ul>
                </div>
              </div>
              <p className="text-white/80 text-sm md:text-base text-center">
                Both approaches serve the same guided outcome, selected based on the desired expression curve.
              </p>
            </div>
          </div>
        </section>

        {/* PROCESSING METHODS */}
        <section className="py-16 md:py-24 bg-[#0b0c0f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-8 text-center tracking-tight">
              Processing Methods
            </h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-6 text-center">
              Method 7 & Method 18
            </h3>
            <div className="space-y-6 text-white/80 text-sm md:text-base leading-relaxed mb-8">
              <p className="font-semibold text-white text-center">
                GO™'s solventless processes are not products themselves. They are tools in service of Guided Outcomes™.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Method 7</h4>
                  <p className="text-white/70 text-sm">
                    A solventless extraction approach designed to preserve volatile aromatics and support outcome-forward rosin profiles without artificial enhancement.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Method 18</h4>
                  <p className="text-white/70 text-sm">
                    An advanced solventless architecture emphasizing separation, structure, and post-process outcome tuning.
                  </p>
                </div>
              </div>
              <p className="text-center font-semibold text-white">
                Both methods exist to answer one question: What processing approach best serves the intended outcome?
              </p>
            </div>
          </div>
        </section>

        {/* BRAND SYSTEM & VISUAL LANGUAGE */}
        <section className="py-16 md:py-24 bg-[#0b0c0f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-8 text-center tracking-tight">
              Brand System & Visual Language
            </h2>
            <div className="space-y-6 text-white/80 text-sm md:text-base leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Why "GO"</h3>
                <p>
                  "GO" functions less like a brand name and more like an instruction.
                </p>
                <p className="text-white/70 italic mt-2">
                  GO RELAX • GO MOVE • GO STUDY
                </p>
                <p className="mt-4">It is:</p>
                <ul className="list-none space-y-1 ml-4 mt-2">
                  <li className="text-white/70">• Short</li>
                  <li className="text-white/70">• Verbal</li>
                  <li className="text-white/70">• Directional</li>
                  <li className="text-white/70">• Outcome-driven</li>
                </ul>
                <p className="mt-4">
                  This replaces strain mythology with intent—making cannabis easier to understand without dumbing it down.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Typography & Tone</h3>
                <p>
                  The GO™ visual system draws from Swiss and modernist traditions:
                </p>
                <p className="text-white/70 italic mt-2">
                  Neutral • Precise • Timeless • Non-performative
                </p>
                <p className="mt-4">
                  This is a deliberate rejection of psychedelic tropes, youth-coded visuals, and counterculture cosplay. The brand behaves more like medical, architectural, or industrial design—aligned with solventless engineering and outcome reliability.
                </p>
                <p className="mt-4 font-semibold text-white">
                  GO™ does not simplify cannabis by removing complexity. It simplifies cannabis by absorbing complexity on behalf of the user.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* THE GO LINE */}
        <section className="py-16 md:py-24 bg-[#0b0c0f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-8 text-center tracking-tight">
              The GO™ Line
            </h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-6 text-center">
              One System, Multiple Expressions
            </h3>
            <div className="space-y-6 text-white/80 text-sm md:text-base leading-relaxed">
              <p>
                Each GO™ outcome is expressed consistently across formats while respecting how different delivery methods shape experience.
              </p>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-white font-semibold mb-3">Example: GO RELAX</h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li>• Calming terpene profiles</li>
                  <li>• Slower onset curves</li>
                  <li>• Reduced overstimulation</li>
                  <li>• Preserved spectrum integrity</li>
                </ul>
              </div>
              <p className="font-semibold text-white text-center">
                Consumers don't shop strains. They shop outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* SYSTEM EXPANDABILITY */}
        <section className="py-16 md:py-24 bg-[#0b0c0f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-8 text-center tracking-tight">
              System Expandability
            </h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-6 text-center">
              Designed to Grow
            </h3>
            <div className="space-y-6 text-white/80 text-sm md:text-base leading-relaxed">
              <p>
                Guided Outcomes™ is intentionally extensible. Beyond the initial outcomes, the system supports:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li className="text-white/70">• New standardized outcomes</li>
                <li className="text-white/70">• Market-specific outcomes</li>
                <li className="text-white/70">• Demographic-specific outcomes</li>
                <li className="text-white/70">• Custom outcomes developed with partners</li>
              </ul>
              <p>
                Because outcomes are engineered through composition and method, not marketing language, new outcomes can be added without breaking the system.
              </p>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10 mt-6">
                <p className="text-white/70 text-sm mb-3">Examples may include:</p>
                <p className="text-white/80">
                  FOCUS (distinct from STUDY) • RECOVER • SOCIAL • CALM BODY • DAYTIME BALANCE • NIGHTTIME RESET
                </p>
                <p className="text-white/70 text-sm mt-4 italic">
                  Each follows the same internal logic: Define the outcome → Select cultivars → Choose composition → Apply method → Select format
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM TO PRODUCT PROOF */}
        <section className="py-16 md:py-24 bg-[#0b0c0f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-8 text-center tracking-tight">
              Platform-to-Product Proof
            </h2>
            <div className="max-w-4xl mx-auto space-y-6 text-white/80 text-sm md:text-base leading-relaxed">
              <p className="text-center">
                GO™ demonstrates how a single philosophy scales across outcomes, formats, methods, and demographics. The result is not just a product line, but a repeatable system that operators, regulators, and consumers can understand.
              </p>
              <p className="text-center font-semibold text-white">
                GO™ is designed to age with the user:
              </p>
              <p className="text-center text-white/70">
                Confident at 45 • Comfortable at 60 • Aspirational at 30
              </p>
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className="py-16 md:py-24 bg-[#0b0c0f] border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/10 rounded-xl p-8 md:p-12 border border-white/20 shadow-xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-6 text-center tracking-tight">
                Guided Outcomes™ Is the Product
              </h2>
              <div className="space-y-4 text-white/80 text-sm md:text-base leading-relaxed">
                <p className="text-center">
                  The GO™ Line represents the first standardized expressions of Guided Outcomes™—not the limits of the system.
                </p>
                <p className="text-center font-semibold text-white mt-6">
                  This is not trend-based branding. It is systems thinking applied to cannabis.
                </p>
              </div>
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











