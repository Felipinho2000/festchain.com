import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Camera, Zap, TrendingUp } from "lucide-react";
import MomentCard from "@/components/moments/MomentCard";
import CreateMomentDialog from "@/components/moments/CreateMomentDialog";

export default function Moments() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const loadMoments = () => {
    base44.entities.Moment.list("-created_date", 50)
      .then(setMoments)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMoments(); }, []);

  const handleLike = async (m) => {
    try {
      const res = await base44.functions.invoke("likeMoment", { moment_id: m.id });
      const data = res.data || res;
      if (data.status === "success") {
        setMoments(prev => prev.map(x => x.id === m.id ? { ...x, likes: data.likes } : x));
      }
    } catch (e) {}
  };

  const totalTips = moments.reduce((s, m) => s + (m.festcoin_tips || 0), 0);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Moments</h1>
          <p className="text-[#666] text-xs mt-0.5">Anonymous party vibes. Earn FTC. Connect.</p>
        </div>
        <CreateMomentDialog currentUser={currentUser} onCreated={loadMoments} />
      </div>

      {/* Stats bar */}
      {moments.length > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-card border border-border rounded-xl p-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#666]" />
            <span className="text-white font-bold text-sm">{moments.length}</span>
            <span className="text-[#666] text-xs">moments</span>
          </div>
          <div className="flex-1 bg-card border border-border rounded-xl p-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary font-bold text-sm">{totalTips.toLocaleString()}</span>
            <span className="text-[#666] text-xs">FTC tipped</span>
          </div>
          <div className="flex-1 bg-card border border-border rounded-xl p-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#666]" />
            <span className="text-white font-bold text-sm">{moments.reduce((s, m) => s + (m.likes || 0), 0)}</span>
            <span className="text-[#666] text-xs">likes</span>
          </div>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-full bg-[#222] animate-pulse" />
                <div className="h-3 w-24 bg-[#222] rounded animate-pulse" />
              </div>
              <div className="aspect-square bg-[#1a1a1a] animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-32 bg-[#222] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : moments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Camera className="w-10 h-10 text-[#333] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[#666] text-sm">No moments yet. Be the first to share!</p>
          <p className="text-[#444] text-xs mt-1">Earn 10 FTC for every moment you post.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {moments.map(m => (
            <MomentCard
              key={m.id}
              m={m}
              currentUser={currentUser}
              onLike={handleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}