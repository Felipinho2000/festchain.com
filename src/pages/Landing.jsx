import React from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingTrustStrip from "@/components/landing/LandingTrustStrip";
import LandingWedge from "@/components/landing/LandingWedge";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingObjections from "@/components/landing/LandingObjections";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingTrust from "@/components/landing/LandingTrust";
import LandingContact from "@/components/landing/LandingContact";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <LandingNav />
      <LandingHero />
      <LandingTrustStrip />
      <LandingWedge />
      <LandingHowItWorks />
      <LandingObjections />
      <LandingPricing />
      <LandingFAQ />
      <LandingTrust />
      <LandingContact />
      <LandingFooter />
    </div>
  );
}