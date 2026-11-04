import { LogOut } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { signOut } from '../lib/adminApi.js';

export default function TopBar({ view, onNavigate, signedIn }) {
  const { t, lang, setLang } = useI18n();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">W&amp;G</div>
          <div>
            <div className="brand-title">{t('appTitle')}</div>
            <div className="brand-sub">{t('company')}</div>
          </div>
        </div>
        <nav className="topbar-actions" aria-label="Main">
          <button className="nav-btn" aria-current={view === 'board' ? 'page' : undefined} onClick={() => onNavigate('board')}>{t('nav.properties')}</button>
          <button className="nav-btn" aria-current={view === 'admin' ? 'page' : undefined} onClick={() => onNavigate('admin')}>{t('nav.admin')}</button>
          {signedIn && (
            <button className="nav-btn" onClick={() => signOut().then(() => onNavigate('board'))}>
              <LogOut size={16} aria-hidden="true" />{t('nav.signOut')}
            </button>
          )}
          <div className="lang-toggle" role="group" aria-label={t('lang.label')}>
            <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>{t('lang.en')}</button>
            <button aria-pressed={lang === 'es'} onClick={() => setLang('es')}>{t('lang.es')}</button>
          </div>
        </nav>
      </div>
    </header>
  );
}
