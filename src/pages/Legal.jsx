import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FlaskConical, FileText, ShieldCheck, RotateCcw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PILOT = (
  <div className="space-y-4 text-sm text-[#aaa] leading-relaxed">
    <p><span className="text-white font-semibold">FestChain is currently in a private MVP pilot.</span> Access is invite-only and intended for testing with a small group of organizers and attendees.</p>
    <p><span className="text-white font-semibold">FestCoin (FTC) is an in-app loyalty / test credit only.</span> It has no cash value, is not an investment, is not a security, is not a cryptocurrency, and is not guaranteed to have any future value. It cannot be withdrawn, sold, or traded.</p>
    <p>During the pilot there is <span className="text-white font-semibold">no public token sale, no staking, no yield, no NFT marketplace, no resale market, and no real payment processing</span>. Tickets are check-in credentials verified by secure QR — they are not blockchain/NFT assets.</p>
    <p>To request data removal, account changes, or support during the pilot, contact the project owner who invited you. Refund and cancellation handling is manual during the pilot.</p>
  </div>
);

const TERMS = (
  <div className="space-y-3 text-sm text-[#aaa] leading-relaxed">
    <p>By using FestChain during the private MVP pilot you agree to participate for testing purposes only.</p>
    <p>Accounts, tickets, events, and transaction data you create may be processed to operate the pilot and improve the product.</p>
    <p>FestCoin credits are test/loyalty credits with no monetary or investment value. The platform may reset or adjust pilot data, including balances, at any time.</p>
    <p>You may not attempt to manipulate balances, bypass ticket issuing, or forge QR codes. Ticket validation is performed solely by authorized organizers/staff.</p>
    <p>These terms are provided for the pilot and may change. Contact the project owner with questions.</p>
  </div>
);

const PRIVACY = (
  <div className="space-y-3 text-sm text-[#aaa] leading-relaxed">
    <p>We process account, ticket, event, and transaction data necessary to run the private MVP pilot.</p>
    <p>Data is used to issue and validate tickets, show your wallet, and provide organizer dashboards. We do not sell your data.</p>
    <p>To request access to, correction of, or deletion of your data, contact the project owner who invited you to the pilot.</p>
    <p>Pilot data may be reviewed by the FestChain team for support and quality purposes.</p>
  </div>
);

const REFUND = (
  <div className="space-y-3 text-sm text-[#aaa] leading-relaxed">
    <p>During the private pilot, no real payments are processed, so there are no automatic refunds to process.</p>
    <p>If you believe a pilot ticket or credit was issued in error, contact the project owner. Refund and cancellation handling is manual during the pilot.</p>
    <p>FestCoin credits carry no cash value and are therefore not eligible for monetary refund.</p>
  </div>
);

export default function Legal() {
  return (
    <div className="min-h-screen bg-background text-foreground px-5 py-8 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[#888] hover:text-white text-sm mb-5">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to app
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading font-bold text-3xl text-white">Legal &amp; Pilot Info</h1>
        </div>
        <p className="text-[#888] text-sm mb-5">FestChain is currently in a private MVP pilot.</p>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-[#bbb] mb-5">
          <span className="text-primary font-semibold">Short version:</span> FestChain is in private beta. FestCoin is an in-app loyalty/test credit — not cash, not an investment, and not guaranteed to have future value.
        </div>

        <Tabs defaultValue="pilot" className="space-y-4">
          <TabsList className="bg-card border border-border p-1 rounded-xl h-auto gap-1 w-full">
            <TabsTrigger value="pilot" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[#888] text-xs py-2">Pilot</TabsTrigger>
            <TabsTrigger value="terms" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[#888] text-xs py-2">Terms</TabsTrigger>
            <TabsTrigger value="privacy" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[#888] text-xs py-2">Privacy</TabsTrigger>
            <TabsTrigger value="refund" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[#888] text-xs py-2">Refunds</TabsTrigger>
          </TabsList>

          <TabsContent value="pilot" className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><FlaskConical className="w-4 h-4 text-primary" /><h2 className="font-heading font-semibold text-white">Private Pilot / Beta Disclaimer</h2></div>
            {PILOT}
          </TabsContent>
          <TabsContent value="terms" className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-primary" /><h2 className="font-heading font-semibold text-white">Terms of Use</h2></div>
            {TERMS}
          </TabsContent>
          <TabsContent value="privacy" className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-primary" /><h2 className="font-heading font-semibold text-white">Privacy Policy</h2></div>
            {PRIVACY}
          </TabsContent>
          <TabsContent value="refund" className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><RotateCcw className="w-4 h-4 text-primary" /><h2 className="font-heading font-semibold text-white">Refund / Cancellation Policy</h2></div>
            {REFUND}
          </TabsContent>
        </Tabs>

        <p className="text-[#555] text-[11px] mt-6 text-center">© 2026 FestChain · Private MVP Pilot</p>
      </div>
    </div>
  );
}