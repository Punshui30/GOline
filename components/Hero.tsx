import Image from "next/image";

export default function Hero() {
  return (
    <section id="hero" className="pt-24 pb-12 md:pt-28 md:pb-20 lg:pt-32 lg:pb-24 w-full overflow-x-hidden bg-offwhite">
      <div className="section-container">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          <div className="space-y-4 md:space-y-6 lg:space-y-8 order-2 md:order-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-charcoal leading-tight tracking-tight">
              Daniel Simmonds
            </h1>
            <div className="space-y-4 md:space-y-5">
              <p className="text-base sm:text-lg md:text-xl text-charcoal font-medium leading-relaxed">
                I work in the gaps.
              </p>
              <div className="text-sm sm:text-base md:text-lg text-charcoal/90 leading-relaxed font-mono tracking-wide">
                <div className="whitespace-pre-line">
Regulation  ↔  Execution  
Product     ↔  Reality  
Strategy    ↔  Machinery  
Narrative   ↔  Numbers
                </div>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-charcoal/70 leading-relaxed italic">
                Where ideas either break — or become real.
              </p>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
              Operator and product innovator with hands-on experience across formulation, sourcing, product development, and regulated market strategy. Combines real-world R&D, cannabinoid science, and industry-standard manufacturing practices with a deep understanding of consumer culture and market behavior.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
              <a
                href="/Daniel_Simmonds_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-center text-sm md:text-base"
              >
                Download Resume (PDF)
              </a>
            </div>
          </div>
          <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] md:min-h-[400px] md:max-h-[600px] rounded-xl overflow-hidden shadow-refined bg-lightgray order-1 md:order-2 transition-all duration-300 hover:shadow-elevated">
            <Image
              src="/images/media/hero-image.jpeg"
              alt="Daniel Simmonds"
              fill
              className="object-contain p-3 sm:p-4 md:p-6 transition-transform duration-300 hover:scale-[1.02]"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 50vw"
              quality={90}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
