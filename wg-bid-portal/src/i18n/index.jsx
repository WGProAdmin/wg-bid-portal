import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import en from './en.js';
import es from './es.js';

const dictionaries = { en, es };
const STORAGE_KEY = 'wg-bid-portal-lang';

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch (e) { /* storage can be blocked; fall through */ }
  return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLanguage);

  const setLang = useCallback((next) => {
    setLangState(next);
    document.documentElement.lang = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
  }, []);

  const t = useCallback((key, vars) => {
    const lookup = (dict) => key.split('.').reduce((node, part) => (node == null ? node : node[part]), dict);
    let value = lookup(dictionaries[lang]);
    if (value === undefined) value = lookup(dictionaries.en);
    if (typeof value !== 'string') return key;
    return vars ? value.replace(/\{(\w+)\}/g, (_, name) => (vars[name] === undefined ? '' : String(vars[name]))) : value;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
