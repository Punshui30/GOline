"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import SectionWrapper from "./SectionWrapper";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <SectionWrapper id="contact" bgAlt={false} showDivider={true}>
      <h2 className="section-title">Contact</h2>
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 bg-offwhite border border-lightgray p-6 md:p-8 lg:p-10 rounded-lg shadow-soft order-2 md:order-1">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-lightgray rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-all duration-300 bg-offwhite text-charcoal placeholder:text-charcoal/40"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-lightgray rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-all duration-300 bg-offwhite text-charcoal placeholder:text-charcoal/40"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-charcoal mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              value={formData.message}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-lightgray rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-all duration-300 bg-offwhite text-charcoal placeholder:text-charcoal/40 resize-none"
            />
          </div>
          
          <button type="submit" className="btn-primary w-full text-sm md:text-base">
            Send Message
          </button>
          
          {submitted && (
            <div className="p-3 md:p-4 bg-sage/10 border border-sage/30 rounded-lg text-sage-dark text-center text-sm md:text-base">
              Thanks, your message has been recorded (demo only).
            </div>
          )}
        </form>
        
        <div className="flex flex-col items-center md:items-start space-y-4 md:space-y-6 order-1 md:order-2">
          <div className="relative w-full max-w-[200px] aspect-[4/3] rounded-xl overflow-hidden shadow-sm bg-lightgray">
            <Image
              src="/images/about/portrait.jpg"
              alt="Daniel Simmonds"
              fill
              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 200px"
              quality={90}
            />
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm md:text-base lg:text-lg text-charcoal/70 mb-3 md:mb-4 leading-relaxed">Or reach out directly:</p>
            <a
              href="mailto:simmonds80@gmail.com"
              className="text-sage hover:text-sage-light font-medium text-base md:text-lg lg:text-xl transition-colors break-all"
            >
              simmonds80@gmail.com
            </a>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
