import SectionWrapper from "./SectionWrapper";

const industrySkills = [
  "Formulation, extraction, pharmacology",
  "Product development & lifecycle management",
  "Compliance, regulatory strategy, expert testimony",
  "Vendor sourcing, supply chain auditing",
];

const creativeSkills = [
  "Brand identity & packaging design",
  "Graphic design",
  "Web & component-based UI experience",
  "Strong fluency in AI/LLM-driven workflows and media automation",
];

export default function SkillsSection() {
  return (
    <SectionWrapper id="skills" bgAlt={true} showDivider={true}>
      <h2 className="section-title">Skills</h2>
      <div className="grid md:grid-cols-2 gap-12 md:gap-16">
        <div>
          <h3 className="text-xl md:text-2xl font-semibold text-charcoal mb-6 leading-tight">Industry</h3>
          <ul className="space-y-3">
            {industrySkills.map((skill, idx) => (
              <li key={idx} className="flex items-start text-base md:text-lg text-charcoal/80 leading-loose">
                <span className="text-sage mr-4 mt-1.5 text-lg">*</span>
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-semibold text-charcoal mb-6 leading-tight">Creative & Digital</h3>
          <ul className="space-y-3">
            {creativeSkills.map((skill, idx) => (
              <li key={idx} className="flex items-start text-base md:text-lg text-charcoal/80 leading-loose">
                <span className="text-sage mr-4 mt-1.5 text-lg">*</span>
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
