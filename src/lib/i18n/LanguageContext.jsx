import React, { createContext, useContext, useEffect, useState } from "react";
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
  const [lang, setLangState] = useState(() => detectInitial());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "pt-BR" ? "pt-BR" : "en";
    }
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