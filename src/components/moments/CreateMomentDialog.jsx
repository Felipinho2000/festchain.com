import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, Eye, EyeOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const aliases = ["NightOwl", "BassDrop", "NeonVibes", "DanceFloor", "MoonRaver", "BeatSeeker", "GrooveWalker", "SynthPulse", "VelvetNight", "CosmicDancer"];

export default function CreateMomentDialog({ currentUser, onCreated }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ caption: "", isAnonymous: true, image: null });
  const { toast } = useToast();

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
    setPosting(true);
    const alias = aliases[Math.floor(Math.random() * aliases.length)];
    await base44.entities.Moment.create({
      image_url: form.image,
      caption: form.caption,
      is_anonymous: form.isAnonymous,
      author_alias: form.isAnonymous ? alias : (currentUser?.full_name || "User"),
    });
    await base44.entities.FestCoinTransaction.create({
      type: "earned",
      amount: 10,
      description: "Shared a moment",
    });
    // Check badge for first moment
    const existing = await base44.entities.UserBadge.filter({ created_by_id: currentUser?.id, badge_key: "first_moment" });
    if (existing.length === 0) {
      await base44.entities.UserBadge.create({
        badge_key: "first_moment",
        badge_name: "Moment Maker",
        badge_emoji: "📸",
        badge_description: "Shared your first moment",
      });
    }
    setForm({ caption: "", isAnonymous: true, image: null });
    setPosting(false);
    setOpen(false);
    toast({ title: "Moment shared! +10 FTC 🎉", description: "Your moment is now live." });
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-4 font-semibold text-sm">
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
                className="absolute top-2 right-2 w-8 h-8 bg-black/70 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors bg-[#111]">
              {uploading ? (
                <span className="w-6 h-6 border-2 border-[#333] border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[#444]" strokeWidth={1.5} />
                  <span className="text-[#666] text-sm">Upload photo</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}

          <Textarea
            placeholder="Add a caption..."
            value={form.caption}
            onChange={e => setForm(prev => ({ ...prev, caption: e.target.value }))}
            className="rounded-xl resize-none bg-card border-border text-white placeholder:text-[#555]"
            rows={2}
          />

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {form.isAnonymous ? <EyeOff className="w-4 h-4 text-primary" strokeWidth={1.5} /> : <Eye className="w-4 h-4 text-[#888]" strokeWidth={1.5} />}
              <Label className="text-sm text-white">{form.isAnonymous ? "Anonymous" : "Public"}</Label>
            </div>
            <Switch
              checked={form.isAnonymous}
              onCheckedChange={v => setForm(prev => ({ ...prev, isAnonymous: v }))}
            />
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
            <span className="text-primary font-medium">Earn 10 FTC for sharing</span>
          </div>

          <Button
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
            onClick={handlePost}
            disabled={!form.image || posting}
          >
            {posting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Post Moment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}