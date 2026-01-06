"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface SectionWrapperProps {
  id: string;
  children: ReactNode;
  className?: string;
  bgAlt?: boolean;
  showDivider?: boolean;
}

export default function SectionWrapper({
  id,
  children,
  className = "",
  bgAlt = false,
  showDivider = false,
}: SectionWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <>
      {showDivider && <div className="section-divider" />}
      <section
        ref={sectionRef}
        id={id}
        className={`section-container ${className} w-full relative z-10 ${
          bgAlt ? "section-bg-alt" : "section-bg"
        }`}
      >
        <div className={`relative z-10 fade-in ${isVisible ? "visible" : ""}`}>
          {children}
        </div>
      </section>
    </>
  );
}

