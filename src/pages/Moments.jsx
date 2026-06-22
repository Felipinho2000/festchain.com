import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Camera, Heart, Zap, Upload, X, Eye, EyeOff, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import FestCoinBadge from "@/components/shared/FestCoinBadge";
import moment from "moment";

const aliases = ["NightOwl", "BassDrop", "NeonVibes", "DanceFloor", "MoonRaver", "BeatSeeker", "GrooveWalker", "SynthPulse", "VelvetNight", "CosmicDancer"];

export default function Moments() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ caption: "", isAnonymous: true, image: null });
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.Moment.list("-created_date", 50)
      .then(setMoments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, image: file_url }));
    setUploading(false);
  };

  const handlePost = async () => {
    if (!form.image) return;
    const alias = aliases[Math.floor(Math.random() * aliases.length)];
    await base44.entities.Moment.create({
      image_url: form.image,
      caption: form.caption,
      is_anonymous: form.isAnonymous,
      author_alias: form.isAnonymous ? alias : (currentUser?.full_name || "User")
    });

    await base44.entities.FestCoinTransaction.create({
      type: "earned",
      amount: 10,
      description: "Shared a moment"
    });

    setForm({ caption: "", isAnonymous: true, image: null });
    setCreateOpen(false);
    toast({ title: "Moment shared!", description: "You earned 10 FestCoins for sharing." });

    const updated = await base44.entities.Moment.list("-created_date", 50);
    setMoments(updated);
  };

  const handleLike = async (m) => {
    await base44.entities.Moment.update(m.id, { likes: (m.likes || 0) + 1 });
    setMoments(prev => prev.map(x => x.id === m.id ? { ...x, likes: (x.likes || 0) + 1 } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Moments</h1>
          <p className="text-warmgray text-sm">Share your party experiences — anonymous or public. Earn FestCoin.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-foreground hover:bg-foreground/90 text-white rounded-xl h-10 px-4 font-semibold text-sm">
              <Camera className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Share
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Share a Moment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {form.image ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={form.image} alt="" className="w-full aspect-square object-cover" />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, image: null }))}
                    className="absolute top-2 right-2 w-8 h-8 bg-foreground/80 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                  {uploading ? (
                    <span className="w-6 h-6 border-2 border-warmgray/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-warmgray/40" strokeWidth={1.5} />
                      <span className="text-warmgray text-sm">Upload photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}

              <Textarea
                placeholder="Add a caption..."
                value={form.caption}
                onChange={e => setForm(prev => ({ ...prev, caption: e.target.value }))}
                className="rounded-xl resize-none"
                rows={2}
              />

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  {form.isAnonymous ? <EyeOff className="w-4 h-4 text-primary" strokeWidth={1.5} /> : <Eye className="w-4 h-4 text-warmgray" strokeWidth={1.5} />}
                  <Label className="text-sm">{form.isAnonymous ? "Anonymous" : "Public"}</Label>
                </div>
                <Switch
                  checked={form.isAnonymous}
                  onCheckedChange={v => setForm(prev => ({ ...prev, isAnonymous: v }))}
                />
              </div>

              <div className="bg-amber/10 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
                <Zap className="w-3.5 h-3.5 text-amber" strokeWidth={1.5} />
                <span className="text-amber font-medium">Earn 10 FestCoin for sharing</span>
              </div>

              <Button
                className="w-full h-11 bg-foreground hover:bg-foreground/90 text-white font-semibold rounded-xl"
                onClick={handlePost}
                disabled={!form.image}
              >
                Post Moment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : moments.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Camera className="w-10 h-10 text-warmgray/40 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-warmgray text-sm">No moments yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {moments.map(m => (
            <div key={m.id} className="group relative rounded-xl overflow-hidden bg-secondary aspect-square">
              <img src={m.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {m.caption && <p className="text-white text-xs mb-2 line-clamp-2">{m.caption}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-[10px]">
                      {m.is_anonymous ? m.author_alias || "Anonymous" : m.author_alias} · {moment(m.created_date).fromNow()}
                    </span>
                    <button
                      onClick={() => handleLike(m)}
                      className="flex items-center gap-1 text-white text-xs hover:text-red-400 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {m.likes || 0}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}