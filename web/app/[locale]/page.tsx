"use client";

import { useEffect, useState } from "react";
import {
  Navbar,
  Hero,
  Stats,
  Features,
  Pricing,
  CtaSection,
  Faq,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar isScrolled={isScrolled} />
      <Hero />
      <Stats />
      <Features />
      <Pricing />
      <CtaSection />
      <Faq />
      <Footer />
    </div>
  );
}
