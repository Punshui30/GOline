"use client";

import Image from "next/image";
import SectionWrapper from "./SectionWrapper";

export default function AboutSection() {
  return (
    <SectionWrapper id="about" bgAlt={true} showDivider={true}>
      <h2 className="section-title">About</h2>
      <div className="max-w-[750px]">
        <div className="space-y-4 md:space-y-5 text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose">
          <p>
            Founder of Georgetown Hemp and long-time operator in both hemp-derived and regulated cannabis markets. Built Georgetown Hemp into a multi-million dollar retail and wholesale brand with a focus on education, transparent sourcing, and scientifically grounded formulation.
          </p>
          <p>
            Experienced working with labs, extraction facilities, cultivators, processors, and pharmaceutical cannabis manufacturers. Known for bridging the science, business, and cultural sides of cannabis - from formulation and bioavailability to branding and consumer experience.
          </p>
          <p>
            Daniel has also been developing proprietary solventless extraction approaches using controlled nitrogen environments and low-shear fluid dynamics. Early prototypes were independently reviewed by Arendis Labs in November 2025 (independent feasibility study), who confirmed strong feasibility and highlighted unusually high resin integrity and terpene preservation. The underlying mechanics remain confidential, but this work reflects Daniel's ongoing focus on innovation and clean-process engineering within the solventless space.
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
}
