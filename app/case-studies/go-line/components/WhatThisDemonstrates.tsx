export default function WhatThisDemonstrates() {
  const demonstrations = [
    {
      title: "Platform Thinking",
      description: "Demonstrates understanding that sustainable product differentiation requires proprietary process capabilities, not just packaging or marketing",
    },
    {
      title: "IP Discipline",
      description: "Shows ability to communicate product concepts and brand strategy without disclosing proprietary technical parameters",
    },
    {
      title: "Regulatory Awareness",
      description: "Visual identity and product positioning reflect understanding of regulated market constraints and compliance requirements",
    },
    {
      title: "Product Lifecycle Planning",
      description: "Demonstrates forward-thinking approach to product development, considering multiple formats and long-term brand coherence",
    },
    {
      title: "Brand Coherence",
      description: "Shows ability to design brand systems that maintain consistency across formats while allowing format-specific expression",
    },
    {
      title: "Technical Credibility Without Disclosure",
      description: "Demonstrates deep process understanding and technical sophistication without revealing proprietary methods or parameters",
    },
  ];

  return (
    <section id="demonstrates" className="space-y-6 md:space-y-8">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-charcoal mb-6 leading-tight tracking-tight">
        What This Case Study Demonstrates
      </h2>

      <div className="space-y-4 md:space-y-5 text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
        <p>
          This conceptual case study illustrates several competencies relevant to product development, brand strategy, and technical innovation in the cannabis industry:
        </p>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-6">
          {demonstrations.map((item, idx) => (
            <div
              key={idx}
              className="bg-offwhite/50 rounded-xl p-5 md:p-6 border border-lightgray/60"
            >
              <h4 className="text-base md:text-lg font-semibold text-sage mb-2">
                {item.title}
              </h4>
              <p className="text-sm md:text-base text-charcoal/70 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6">
          The case study is presented as an illustrative example of methodology, not as a commercial product launch. It demonstrates the type of strategic thinking and technical understanding required to build differentiated product systems in a competitive, regulated market.
        </p>
      </div>
    </section>
  );
}











