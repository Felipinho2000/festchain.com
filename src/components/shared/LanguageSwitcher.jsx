import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LanguageSwitcher({ className = "" }) {
  const { lang, setLanguage } = useLanguage();
  const btn = (code, label) => (
    <button
      type="button"
      onClick={() => setLanguage(code)}
      className={
        "px-2.5 h-7 rounded-md text-xs font-bold transition-colors " +
        (lang === code ? "bg-primary text-white" : "text-[#888] hover:text-white hover:bg-[#222]")
      }
      aria-pressed={lang === code}
    >
      {label}
    </button>
  );
  return (
    <div className={"inline-flex items-center gap-1 bg-[#141414] border border-[#2a2a2a] rounded-lg p-1 " + className}>
      {btn("en", "EN")}
      {btn("pt-BR", "PT")}
    </div>
  );
}