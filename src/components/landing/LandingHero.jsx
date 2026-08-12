import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY, getWaHref } from "./landingData";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function LandingHero() {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY["pt-BR"];
  const waHref = getWaHref(lang);

  return (
    <section className="relative pt-40 pb-24 px-5 overflow-hidden">
      {/* Animated background orbs */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-primary rounded-full blur-[140px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto text-center relative"
      >
        <motion.div variants={item}>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
            {c.hero.badge}
          </div>
        </motion.div>

        <motion.h1
          variants={item}
          className="font-heading font-bold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.03em] mb-7"
        >
          {c.hero.title1}<br />
          <span className="text-primary">{c.hero.title2}</span>
        </motion.h1>

        <motion.p variants={item} className="text-white/50 text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          {c.hero.sub}
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-2xl font-bold text-base shadow-[0_8px_32px_-8px_rgba(255,101,0,0.5)] hover:shadow-[0_8px_40px_-8px_rgba(255,101,0,0.7)] hover:scale-[1.02] transition-all duration-300">
              <MessageCircle className="w-5 h-5 mr-2" strokeWidth={2} /> {c.hero.ctaPrimary}
            </Button>
          </a>
          <a href="#why">
            <Button variant="outline" className="w-full sm:w-auto h-12 px-7 rounded-2xl font-semibold text-sm border-white/10 text-white hover:bg-white/5 hover:border-white/20 transition-all duration-300">
              {c.hero.ctaSecondary}
            </Button>
          </a>
        </motion.div>

        <motion.p variants={item} className="text-sm text-white/30 flex items-center justify-center gap-2 flex-wrap">
          {c.hero.note.split(" · ").map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-white/20">·</span>}
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} /> {part}
              </span>
            </React.Fragment>
          ))}
        </motion.p>
      </motion.div>
    </section>
  );
}