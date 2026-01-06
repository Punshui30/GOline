"use client";

import Image from "next/image";
import SectionWrapper from "./SectionWrapper";
import { useState } from "react";

const certifications = [
  {
    src: "/images/certs/cert-1.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "Cannabis Safety",
  },
  {
    src: "/images/certs/cert-2.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "THC University",
  },
  {
    src: "/images/certs/cert-3.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "Terpenes Training",
  },
  {
    src: "/images/certs/cert-4.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "Regulations",
  },
  {
    src: "/images/certs/cert-5.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "Budtending",
  },
  {
    src: "/images/certs/cert-6.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "Cannabinoid Science",
  },
  {
    src: "/images/certs/cert-7.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "Medical Cannabis",
  },
  {
    src: "/images/certs/cert-8.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "Business Operations",
  },
  {
    src: "/images/certs/cert-9.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "CO Training",
  },
  {
    src: "/images/certs/cert-10.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "WA Training",
  },
  {
    src: "/images/certs/cert-11.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "OR Training",
  },
  {
    src: "/images/certs/cert-12.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "MD Training",
  },
  {
    src: "/images/certs/cert-13.jpg",
    alt: "Certification - Daniel Simmonds",
    label: "Advanced Certification",
  },
];

export default function CertificationsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<number | null>(null);

  // Preview strip shows first 4-5 certifications
  const previewCerts = certifications.slice(0, 5);

  return (
    <SectionWrapper id="certifications" bgAlt={false} showDivider={true}>
      <h2 className="section-title">Certifications & Training</h2>
      <p className="text-base md:text-lg text-charcoal/80 mb-8 max-w-[750px] leading-loose">
        Training across cannabis safety, regulations, budtending, cannabinoid science, medical cannabis therapeutics, and business operations in CO, WA, OR, and MD.
      </p>
      
      {/* Preview Strip */}
      <div className="mb-8">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-4 lg:grid-cols-5 md:overflow-x-visible md:gap-4 md:pb-0">
          {previewCerts.map((cert, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[180px] md:w-full space-y-2 cursor-pointer group"
              onClick={() => {
                setSelectedCert(idx);
                setIsModalOpen(true);
              }}
            >
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-refined bg-lightgray transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-elevated">
                <Image
                  src={cert.src}
                  alt={cert.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 180px, 25vw"
                  quality={90}
                />
              </div>
              <p className="text-xs md:text-sm text-charcoal/70 text-center leading-tight">
                {cert.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* View All Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => {
            setSelectedCert(null);
            setIsModalOpen(true);
          }}
          className="btn-secondary"
        >
          View All Certifications
        </button>
      </div>

      {/* Full Gallery Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setIsModalOpen(false);
            setSelectedCert(null);
          }}
        >
          <div
            className="relative w-full max-w-6xl max-h-[90vh] bg-offwhite rounded-xl shadow-elevated overflow-hidden border border-lightgray/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-lightgray">
              <h3 className="text-2xl font-semibold text-charcoal">
                {selectedCert !== null ? "Certificate Detail" : "All Certifications"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedCert(null);
                }}
                className="text-charcoal/60 hover:text-charcoal text-3xl font-light transition-colors leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {selectedCert !== null ? (
                // Single certificate view
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-3xl aspect-[4/3] rounded-xl overflow-hidden shadow-elevated bg-lightgray mb-4">
                    <Image
                      src={certifications[selectedCert].src}
                      alt={certifications[selectedCert].alt}
                      fill
                      className="object-contain p-4"
                      quality={95}
                    />
                  </div>
                  <p className="text-lg font-medium text-charcoal">
                    {certifications[selectedCert].label}
                  </p>
                  <button
                    onClick={() => setSelectedCert(null)}
                    className="mt-6 btn-secondary"
                  >
                    Back to Gallery
                  </button>
                </div>
              ) : (
                // Grid gallery view
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {certifications.map((cert, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCert(idx)}
                      className="group space-y-2 text-left"
                    >
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-refined bg-lightgray transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-elevated">
                        <Image
                          src={cert.src}
                          alt={cert.alt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          quality={90}
                        />
                      </div>
                      <p className="text-sm text-charcoal/80 text-center">
                        {cert.label}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionWrapper>
  );
}

