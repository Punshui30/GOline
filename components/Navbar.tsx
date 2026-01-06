"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Determine active section based on scroll position
      const sections = [
        "hero",
        "about",
        "experience",
        "product",
        "nitrogen-process",
        "policy",
        "awards",
        "certifications",
        "skills",
        "contact",
      ];

      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll(); // Initial call
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const elementPosition = (element as HTMLElement).offsetTop;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "auto",
      });
    }
  };

  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#experience", label: "Experience" },
    { href: "#product", label: "Product & R&D" },
    { href: "/case-studies/go-line/", label: "Case Studies", isExternal: true },
    { href: "#policy", label: "Policy" },
    { href: "#awards", label: "Awards" },
    { href: "#skills", label: "Skills" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full bg-offwhite ${
        isScrolled
          ? "shadow-refined border-b border-lightgray/60"
          : ""
      }`}
      style={{ backgroundColor: '#FAFAF7' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Link
            href="#hero"
            onClick={(e) => handleLinkClick(e, "#hero")}
            className="text-lg md:text-xl font-semibold text-charcoal hover:text-sage transition-colors"
          >
            Daniel Simmonds
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const sectionId = link.href.substring(1);
              const isActive = activeSection === sectionId;
              if (link.isExternal) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium transition-all duration-200 text-charcoal/70 hover:text-sage hover:font-medium"
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={`text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-sage border-b-2 border-sage pb-1 font-semibold"
                      : "text-charcoal/70 hover:text-sage hover:font-medium"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="/Daniel_Simmonds_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              Download PDF
            </a>
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, "#contact")}
              className="btn-secondary text-sm"
            >
              Contact
            </a>
          </div>

          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-charcoal hover:text-sage transition-colors p-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <a
              href="/Daniel_Simmonds_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs px-4 py-2"
            >
              PDF
            </a>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-lightgray/60 bg-offwhite">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
              {navLinks.map((link) => {
                if (link.isExternal) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-medium text-charcoal/70 hover:text-sage transition-colors py-2"
                    >
                      {link.label}
                    </Link>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      handleLinkClick(e, link.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block text-sm font-medium text-charcoal/70 hover:text-sage transition-colors py-2"
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a
                href="#contact"
                onClick={(e) => {
                  handleLinkClick(e, "#contact");
                  setIsMobileMenuOpen(false);
                }}
                className="block text-sm font-medium text-charcoal/70 hover:text-sage transition-colors py-2"
              >
                Contact
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
