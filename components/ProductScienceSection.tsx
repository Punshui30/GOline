"use client";

import SectionWrapper from "./SectionWrapper";

export default function ProductScienceSection() {
  return (
    <SectionWrapper id="product" bgAlt={true} showDivider={true}>
      <h2 className="section-title">Science, Formulation & R&D</h2>
      <div className="max-w-[750px]">
        <ul className="space-y-2 md:space-y-3 list-none text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
          <li className="flex items-start">
            <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
            <span>Cannabinoid and terpene formulation</span>
          </li>
          <li className="flex items-start">
            <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
            <span>Solventless and alternative extraction approaches</span>
          </li>
          <li className="flex items-start">
            <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
            <span>Delivery mechanism design and bioavailability optimization</span>
          </li>
          <li className="flex items-start">
            <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
            <span>cGMP-oriented scale-up processes</span>
          </li>
          <li className="flex items-start">
            <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
            <span>Collaboration with global cannabinoid and psychedelic research labs</span>
          </li>
          <li className="flex items-start">
            <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
            <span>Small-batch R&D through large-scale manufacturing workflows</span>
          </li>
        </ul>
      </div>
    </SectionWrapper>
  );
}
