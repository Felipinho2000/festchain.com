import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, Zap, UserPlus, Check, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const TIP_AMOUNTS = [10, 25, 50, 100];

export default function MomentCard({ m, currentUser, onLike }) {
  const [showTip, setShowTip] = useState(false);
  const [tipAmount, setTipAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [tipping, setTipping] = useState(false);
  const [tipped, setTipped] = useState(false);
  const [requested, setRequested] = useState(false);
  const { toast } = useToast();

  const isOwn = m.created_by_id === currentUser?.id;
  const finalAmount = customAmount ? parseInt(customAmount) : tipAmount;

  const handleTip = async () => {
    if (!finalAmount || finalAmount < 1) return;
    setTipping(true);
    try {
      const res = await base44.functions.invoke("sendMomentTip", {
        moment_id: m.id,
        amount: finalAmount,
      });
      const data = res.data || res;
      if (data.status !== "success") {
        toast({ title: "Could not send tip", description: data.message || "Try again", variant: "destructive" });
        return;
      }
      setTipped(true);
      setShowTip(false);
      toast({ title: `⚡ ${finalAmount} FTC sent!`, description: "They can exchange tips for tickets or perks." });
    } catch (e) {
      toast({ title: "Could not send tip", description: e.message, variant: "destructive" });
    } finally {
      setTipping(false);
    }
  };

  const handleConnect = async () => {
    if (isOwn || requested || !m.created_by_id) return;
    const aliases = ["NightOwl", "BassDrop", "NeonVibes", "DanceFloor", "MoonRaver", "BeatSeeker", "GrooveWalker", "SynthPulse"];
    const myAlias = aliases[Math.floor(Math.random() * aliases.length)];
    await base44.entities.FriendRequest.create({
      from_user_id: currentUser.id,
      from_alias: myAlias,
      to_user_id: m.created_by_id,
      status: "pending",
    });
    setRequested(true);
    toast({ title: "Request sent!", description: "They'll see your anonymous connection request." });
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-bold text-xs">
              {(m.author_alias || "?")[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{m.author_alias || "Anonymous"}</p>
            <p className="text-[#555] text-[10px]">{moment(m.created_date).fromNow()}</p>
          </div>
        </div>
        {!isOwn && m.created_by_id && (
          <button
            onClick={handleConnect}
            disabled={requested}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              requested
                ? "bg-emerald-900/30 text-emerald-400"
                : "bg-[#222] text-[#888] hover:bg-primary/20 hover:text-primary"
            }`}
          >
            {requested ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
            {requested ? "Requested" : "Connect"}
          </button>
        )}
      </div>

      {/* Image */}
      <div className="aspect-square bg-[#111] relative overflow-hidden">
        <img src={m.image_url} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Actions */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(m)}
            className="flex items-center gap-1.5 text-[#888] hover:text-red-400 transition-colors"
          >
            <Heart className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">{m.likes || 0}</span>
          </button>

          {!isOwn && (
            <button
              onClick={() => setShowTip(true)}
              className={`flex items-center gap-1.5 transition-colors ${tipped ? "text-primary" : "text-[#888] hover:text-primary"}`}
            >
              <Zap className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm font-medium">{(m.festcoin_tips || 0) > 0 ? `${m.festcoin_tips} FTC` : "Tip FTC"}</span>
            </button>
          )}

          {(m.festcoin_tips || 0) > 0 && isOwn && (
            <span className="flex items-center gap-1 text-primary text-sm">
              <Zap className="w-4 h-4" strokeWidth={1.5} />
              {m.festcoin_tips} FTC received
            </span>
          )}
        </div>

        {m.caption && (
          <p className="text-sm text-[#ccc] leading-relaxed">
            <span className="text-white font-semibold mr-1">{m.author_alias || "Anonymous"}</span>
            {m.caption}
          </p>
        )}
      </div>

      {/* Tip Dialog */}
      <Dialog open={showTip} onOpenChange={setShowTip}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Send FTC Tip
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[#888] text-sm">Tip FestCoin to <span className="text-white font-medium">{m.author_alias || "this raver"}</span>. They earn FTC credits exchangeable for tickets and perks.</p>

            <div className="grid grid-cols-4 gap-2">
              {TIP_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => { setTipAmount(a); setCustomAmount(""); }}
                  className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                    tipAmount === a && !customAmount
                      ? "bg-primary border-primary text-white"
                      : "bg-[#1a1a1a] border-border text-[#888] hover:border-primary/40"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <Input
                placeholder="Custom amount..."
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                className="pl-9 bg-card border-border text-white placeholder:text-[#555] rounded-xl"
                type="number"
                min="1"
              />
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-11"
              onClick={handleTip}
              disabled={tipping || !finalAmount}
            >
              {tipping ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send {finalAmount || 0} FTC</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}