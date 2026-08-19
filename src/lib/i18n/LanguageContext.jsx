import React, { createContext, useContext, useEffect, useState } from "react";
import moment from "moment";
import "moment/locale/pt-br";
import { translations } from "./translations";

const LanguageContext = createContext(null);
const STORAGE_KEY = "fc_lang";

function detectInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pt-BR") return stored;
  } catch {}
  return "pt-BR";
}

export function LanguageProvider({ children }) {
  // Every date on the site is rendered with moment(...).format(...), and
  // moment defaults to English month/day names regardless of what language
  // the rest of the UI is in — so without this, a pt-BR screen full of
  // Portuguese copy still showed "Jan", "Feb", "Mon" next to it. moment's
  // locale is a single global, so it's set here, once, wherever lang changes.
  const [lang, setLangState] = useState(() => {
    const initial = detectInitial();
    moment.locale(initial === "pt-BR" ? "pt-br" : "en");
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "pt-BR" ? "pt-BR" : "en";
    }
    moment.locale(lang === "pt-BR" ? "pt-br" : "en");
  }, [lang]);

  const resolve = (key, dictionary) => {
    const parts = key.split(".");
    let node = dictionary;
    for (const p of parts) {
      if (node == null) return undefined;
      node = node[p];
    }
    return node;
  };

  const t = (key) => {
    let node = resolve(key, translations[lang]);
    if (node === undefined) node = resolve(key, translations.en);
    return node === undefined ? key : node;
  };

  const setLanguage = (l) => {
    if (l === "en" || l === "pt-BR") setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}