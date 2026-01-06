import Image from "next/image";
import SectionWrapper from "./SectionWrapper";

const experienceImages = [
  {
    src: "/images/experience/experience-3.jpg",
    alt: "Experience",
  },
  {
    src: "/images/experience/experience-4.jpg",
    alt: "Experience",
  },
  {
    src: "/images/experience/chef-demo-kitchen.jpg",
    alt: "Daniel Simmonds with Celebrity Chef Jose Garces in kitchen demonstration",
  },
  {
    src: "/images/experience/conference-scientist.jpg",
    alt: "Daniel Simmonds in Georgetown Hemp polo next to researcher at conference",
  },
];

export default function ExperienceSection() {
  return (
    <SectionWrapper id="experience" bgAlt={false} showDivider={true}>
      <h2 className="section-title">Experience</h2>

      {/* Experience Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        {experienceImages.map((img, idx) => (
          <div
            key={idx}
            className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-refined bg-lightgray transition-all duration-300 hover:shadow-elevated group"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
              sizes="(max-width: 768px) 50vw, 25vw"
              quality={90}
            />
          </div>
        ))}
      </div>

      <div className="space-y-6 md:space-y-8 lg:space-y-10">
        {/* Card 1 - Georgetown Hemp */}
        <div className="bg-offwhite rounded-xl shadow-refined border border-lightgray/60 p-6 md:p-8 lg:p-10 transition-all duration-300 hover:shadow-elevated hover:border-lightgray">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-charcoal mb-4 md:mb-6 leading-tight">
            Founder & CEO - Georgetown Hemp
          </h3>
          <ul className="space-y-2 md:space-y-3 text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Built the company to $1.5M+ revenue by year two through education-driven retail and wholesale.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Formulated and branded the full GTH Farms product line, including topicals and ingestibles.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Conducted onsite sourcing and qualification of farms, labs, and processors.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Developed new delivery mechanisms and optimized bioavailability with chemists and engineers.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Brokered and sourced bulk CBD and botanical ingredients for national manufacturers.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Collaborated with celebrity chefs, including Celebrity Chef Jose Garces on joint venture products.</span>
            </li>
          </ul>
        </div>

        {/* Card 2 - Functional Health Group */}
        <div className="bg-offwhite rounded-xl shadow-refined border border-lightgray/60 p-6 md:p-8 lg:p-10 transition-all duration-300 hover:shadow-elevated hover:border-lightgray">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-charcoal mb-4 md:mb-6 leading-tight">
            CMO & Lead Formulator - Functional Health Group
          </h3>
          <ul className="space-y-2 md:space-y-3 text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Led product formulation for pharmaceutical-grade cannabinoid lines.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Collaborated with a pharmaceutical cannabis lab and WV medical cannabis grow.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Managed genetics sourcing, including work with Maryland-licensed ForwardGrow.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Developed commercialization, product positioning, and go-to-market strategies.</span>
            </li>
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
