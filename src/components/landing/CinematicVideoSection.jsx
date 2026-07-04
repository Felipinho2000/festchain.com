import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, ArrowRight } from "lucide-react";

const VIDEO_URL = "https://media.base44.com/videos/public/6a397da94e9321ecf0c31364/768db42f9_FestChain_Launch_Hero.mp4";

export default function CinematicVideoSection() {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <section className="py-16 px-5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-4xl mx-auto relative">
        <div className="text-center mb-8">
          <p className="text-primary text-xs uppercase tracking-widest font-bold mb-3">See it in motion</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-3 tracking-tight">
            The operating system for live events.
          </h2>
          <p className="text-[#888] text-sm sm:text-base max-w-xl mx-auto">
            From discovering an event to entering the venue to rewarding your crowd — one seamless experience.
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-2xl group">
          <video
            ref={videoRef}
            src={VIDEO_URL}
            playsInline
            loop
            muted
            preload="metadata"
            onClick={handlePlay}
            className="w-full aspect-video object-cover bg-black cursor-pointer"
          />
          {!playing && (
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity group-hover:bg-black/30"
              aria-label="Play launch video"
            >
              <div className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all hover:scale-105 shadow-xl">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </button>
          )}
        </div>

        <div className="flex justify-center mt-8">
          <Link to="/register">
            <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white h-12 px-7 rounded-xl font-bold text-base transition-colors">
              Join the Pilot Program <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}