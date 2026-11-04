import { useEffect, useState } from 'react';
import TopBar from './components/TopBar.jsx';
import BoardPage from './pages/BoardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { useI18n } from './i18n/index.jsx';

// Only a plain #name hash is used for routing, so links stay bookmarkable.
const readView = () => (window.location.hash === '#admin' ? 'admin' : 'board');

export default function App() {
  const { lang } = useI18n();
  const [view, setView] = useState(readView);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const onHash = () => setView(readView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const go = (next) => { window.location.hash = next === 'admin' ? 'admin' : ''; setView(next); };

  return (
    <>
      <TopBar view={view} onNavigate={go} signedIn={signedIn} />
      <main className="page">
        {view === 'admin' ? <AdminPage onSignedInChange={setSignedIn} onLeave={() => go('board')} /> : <BoardPage />}
      </main>
    </>
  );
}
