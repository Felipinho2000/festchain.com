import React from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingTrustStrip from "@/components/landing/LandingTrustStrip";
import LandingWedge from "@/components/landing/LandingWedge";
import LandingEcosystem from "@/components/landing/LandingEcosystem";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingForCrowd from "@/components/landing/LandingForCrowd";
import LandingTrust from "@/components/landing/LandingTrust";
import LandingContact from "@/components/landing/LandingContact";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-body">
      <LandingNav />
      <LandingHero />
      <LandingTrustStrip />
      <LandingWedge />
      <LandingEcosystem />
      <LandingHowItWorks />
      <LandingForCrowd />
      <LandingTrust />
      <LandingContact />
      <LandingFooter />
    </div>
  );
}