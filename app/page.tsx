import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ProductScienceSection from "@/components/ProductScienceSection";
import NitrogenProcessSection from "@/components/NitrogenProcessSection";
import PolicySection from "@/components/PolicySection";
import AwardsMediaSection from "@/components/AwardsMediaSection";
import CertificationsSection from "@/components/CertificationsSection";
import SkillsSection from "@/components/SkillsSection";
import ContactSection from "@/components/ContactSection";

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-offwhite">
      <Navbar />
      <Hero />
      <AboutSection />
      <ExperienceSection />
      <ProductScienceSection />
      <NitrogenProcessSection />
      <PolicySection />
      <AwardsMediaSection />
      <CertificationsSection />
      <SkillsSection />
      <ContactSection />
    </main>
  );
}
