import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { sendReset, signIn } from '../lib/adminApi.js';
import { Notice } from './States.jsx';

export default function AdminLogin({ notice }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      console.error('Sign-in failed:', err);
      setMessage(err && err.status === 429 ? t('admin.tooMany') : t('admin.badCredentials'));
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    if (!email.trim()) { setMessage(t('admin.enterEmail')); return; }
    try { await sendReset(email.trim()); } catch (err) { console.error(err); }
    setMessage(t('admin.resetSent')); // same message either way so the form never reveals which emails exist
  };

  return (
    <div className="login">
      <div className="panel">
        <h3 style={{ marginBottom: 14 }}>{t('admin.signInTitle')}</h3>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="admin-email">{t('admin.email')}</label>
            <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="admin-password">{t('admin.password')}</label>
            <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={busy}><LogIn size={16} aria-hidden="true" />{busy ? t('admin.signingIn') : t('admin.signIn')}</button>
            <button type="button" className="btn" onClick={onReset}>{t('admin.forgot')}</button>
          </div>
        </form>
        {(message || notice) && <div style={{ marginTop: 14 }}><Notice>{message || notice}</Notice></div>}
      </div>
    </div>
  );
}
