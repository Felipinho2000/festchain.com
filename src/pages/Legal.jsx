import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FlaskConical, FileText, ShieldCheck, RotateCcw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

const SECTIONS = [
  { key: "pilot", icon: FlaskConical, paraKey: "pilotPara" },
  { key: "terms", icon: FileText, paraKey: "termsPara" },
  { key: "privacy", icon: ShieldCheck, paraKey: "privacyPara" },
  { key: "refund", icon: RotateCcw, paraKey: "refundPara" },
];

export default function Legal() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground px-5 py-8 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <Link to="/" className="inline-flex items-center gap-2 text-[#888] hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> {t("legal.back")}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading font-bold text-3xl text-white">{t("legal.title")}</h1>
        </div>
        <p className="text-[#888] text-sm mb-5">{t("legal.intro")}</p>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-[#bbb] mb-5">
          <span className="text-primary font-semibold">{t("legal.shortLabel")}</span> {t("legal.short")}
        </div>

        <Tabs defaultValue="pilot" className="space-y-4">
          <TabsList className="bg-card border border-border p-1 rounded-xl h-auto gap-1 w-full">
            {SECTIONS.map(s => (
              <TabsTrigger key={s.key} value={s.key} className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[#888] text-xs py-2">
                {t(`legal.tabs.${s.key}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {SECTIONS.map(s => {
            const Icon = s.icon;
            const paras = t(`legal.${s.paraKey}`);
            return (
              <TabsContent key={s.key} value={s.key} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                  <h2 className="font-heading font-semibold text-white">{t(`legal.sec.${s.key}.title`)}</h2>
                </div>
                <div className="space-y-3 text-sm text-[#aaa] leading-relaxed">
                  {paras.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        <p className="text-[#555] text-[11px] mt-6 text-center">{t("legal.copyright")}</p>
      </div>
    </div>
  );
}