"use client";

import Image from "next/image";
import SectionWrapper from "./SectionWrapper";

export default function PolicySection() {
  return (
    <SectionWrapper id="policy" bgAlt={false} showDivider={true}>
      <h2 className="section-title">Policy & Advocacy</h2>
      <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 items-start">
        <div className="md:col-span-2 space-y-4 md:space-y-6 text-sm sm:text-base md:text-lg text-charcoal/80 leading-relaxed md:leading-loose order-2 md:order-1">
          <ul className="space-y-2 md:space-y-3 list-none">
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Court-recognized expert in cannabis chemistry, pharmacology, and identification.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Testified before the Maryland General Assembly on cannabinoid safety.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Participated in a legislative summer study on Delta-8 THC with state regulators.</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Founder & President of the Maryland Healthy Alternatives Association (501c6).</span>
            </li>
            <li className="flex items-start">
              <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
              <span>Experienced in how regulated, gray, and illicit markets interact across MD, DC, and VA.</span>
            </li>
          </ul>
          
          {/* International Projects subsection */}
          <div className="pt-4 md:pt-6 border-t border-lightgray">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-charcoal mb-3 md:mb-4">
              International Projects
            </h3>
            <ul className="space-y-2 md:space-y-3 list-none">
              <li className="flex items-start">
                <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
                <span>Supported an international RFP response to the Government of Grenada focused on the rollout of its national medical cannabis program, including product standards, compliance systems, and regulated commercial framework.</span>
              </li>
              <li className="flex items-start">
                <span className="text-sage mr-3 md:mr-4 mt-1 md:mt-1.5 text-base md:text-lg flex-shrink-0">*</span>
                <span>Collaborated with Sensi Seeds Amsterdam as a core contributor to the legal and regulatory strategy enabling heritage cannabis genetics to be positioned for first-of-kind export into North America.</span>
              </li>
            </ul>
          </div>
        </div>
        {/* Policy image */}
        <div className="relative w-full max-w-[240px] mx-auto md:mx-0 h-[280px] sm:h-[320px] rounded-xl overflow-hidden shadow-sm bg-lightgray order-1 md:order-2">
          <Image
            src="/images/policy/policy-image.jpg"
            alt="Policy & Advocacy"
            fill
            className="object-contain transition-transform duration-300 hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 240px"
            quality={90}
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
