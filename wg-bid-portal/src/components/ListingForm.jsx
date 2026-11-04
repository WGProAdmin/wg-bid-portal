import { useState } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { createListing, searchProperties } from '../lib/adminApi.js';
import { FieldError } from './States.jsx';

export default function ListingForm({ onCreated, onClose, onAuthError }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState(null);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleError = (err) => {
    if (err.code === 'not_admin' || err.code === 'session_expired') { onAuthError(err.code); return; }
    setError(t('admin.actionError'));
  };

  const runSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSearching(true);
    try { setResults(await searchProperties(query.trim())); } catch (err) { handleError(err); } finally { setSearching(false); }
  };

  const wholeOrBlank = (v) => (v === '' ? null : Number(v));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const lo = wholeOrBlank(min);
    const hi = wholeOrBlank(max);
    const bad = [lo, hi].some((n) => n !== null && (!Number.isInteger(n) || n <= 0)) || (lo !== null && hi !== null && lo > hi);
    if (!picked || bad) { setError(t('bid.errors.amount')); return; }
    setBusy(true);
    try {
      await createListing({ property_id: picked.id, target_payout_min: lo, target_payout_max: hi, notes_for_cleaners: notes.trim() || null });
      onCreated();
    } catch (err) { handleError(err); } finally { setBusy(false); }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{t('admin.addListing')}</h3>
        <button className="btn btn-small" onClick={onClose}>{t('admin.closeForm')}</button>
      </div>

      {!picked && (
        <form onSubmit={runSearch}>
          <div className="field">
            <label htmlFor="property-search">{t('admin.propertySearch')}</label>
            <input id="property-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={searching}><Search size={16} aria-hidden="true" />{searching ? t('admin.searching') : t('admin.searchButton')}</button>
          {results && (results.length === 0
            ? <p className="muted" style={{ marginTop: 10 }}>{t('admin.noResults')}</p>
            : (
              <ul className="result-list">
                {results.map((p) => (
                  <li key={p.id}>
                    <span><strong>{p.name}</strong> <span className="muted">{[p.city, p.state].filter(Boolean).join(', ')}</span></span>
                    <button type="button" className="btn btn-small" onClick={() => setPicked(p)}>{t('admin.selectProperty')}</button>
                  </li>
                ))}
              </ul>
            ))}
        </form>
      )}

      {picked && (
        <form onSubmit={submit}>
          <p style={{ marginBottom: 12 }}><span className="muted">{t('admin.selected')}: </span><strong>{picked.name}</strong> <button type="button" className="btn btn-small" onClick={() => setPicked(null)}>{t('common.cancel')}</button></p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="payout-min">{t('admin.payoutMin')}</label>
              <input id="payout-min" type="number" inputMode="numeric" min="1" step="1" value={min} onChange={(e) => setMin(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="payout-max">{t('admin.payoutMax')}</label>
              <input id="payout-max" type="number" inputMode="numeric" min="1" step="1" value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="cleaner-notes">{t('admin.cleanerNotes')}</label>
            <textarea id="cleaner-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <FieldError>{error}</FieldError>
          <button className="btn btn-primary" type="submit" disabled={busy}>{t('admin.createListing')}</button>
        </form>
      )}
      {!picked && <FieldError>{error}</FieldError>}
    </div>
  );
}
