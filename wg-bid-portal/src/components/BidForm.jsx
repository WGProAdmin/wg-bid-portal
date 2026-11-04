import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { submitBid } from '../lib/boardApi.js';
import { digitsOnly, looksLikeEmail } from '../lib/format.js';
import { FieldError } from './States.jsx';

const EMPTY = { name: '', phone: '', email: '', amount: '', notes: '' };

export default function BidForm({ listing }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = t('bid.errors.name');
    const hasPhone = form.phone.trim() !== '';
    const hasEmail = form.email.trim() !== '';
    if (!hasPhone && !hasEmail) next.contact = t('bid.errors.contact');
    if (hasPhone && digitsOnly(form.phone).length < 10) next.phone = t('bid.errors.phone');
    if (hasEmail && !looksLikeEmail(form.email)) next.email = t('bid.errors.email');
    const amount = Number(form.amount);
    if (!Number.isInteger(amount) || amount <= 0) next.amount = t('bid.errors.amount');
    return next;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await submitBid({
        listing_id: listing.listing_id,
        property_id: listing.property_id,
        cleaner_name: form.name.trim(),
        cleaner_phone: form.phone.trim() || null,
        cleaner_email: form.email.trim().toLowerCase() || null,
        bid_amount: Number(form.amount),
        notes: form.notes.trim() || null,
        language: lang,
      });
      setDone(true);
      setForm(EMPTY);
    } catch (err) {
      const known = ['listing_closed', 'duplicate_bid'];
      setFormError(t('bid.errors.' + (known.includes(err.code) ? err.code : 'generic')));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="success" role="status">
        <CheckCircle2 size={20} aria-hidden="true" />
        <div>
          <strong>{t('bid.successTitle')}</strong>
          <p>{t('bid.successBody')}</p>
          <button type="button" className="btn btn-small" style={{ marginTop: 10 }} onClick={() => setDone(false)}>{t('bid.another')}</button>
        </div>
      </div>
    );
  }

  const id = (name) => `bid-${listing.listing_id}-${name}`;

  return (
    <form onSubmit={onSubmit} noValidate aria-label={t('bid.title')}>
      <h4 style={{ marginBottom: 10 }}>{t('bid.title')}</h4>
      <div className="field">
        <label htmlFor={id('name')}>{t('bid.name')}</label>
        <input id={id('name')} type="text" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <FieldError>{errors.name}</FieldError>
      </div>
      <div className="field">
        <label htmlFor={id('phone')}>{t('bid.phone')}</label>
        <input id={id('phone')} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <FieldError>{errors.phone}</FieldError>
      </div>
      <div className="field">
        <label htmlFor={id('email')}>{t('bid.email')}</label>
        <input id={id('email')} type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <FieldError>{errors.email || errors.contact}</FieldError>
      </div>
      <div className="field">
        <label htmlFor={id('amount')}>{t('bid.amount')}</label>
        <input id={id('amount')} type="number" inputMode="numeric" min="1" step="1" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
        <FieldError>{errors.amount}</FieldError>
      </div>
      <div className="field">
        <label htmlFor={id('notes')}>{t('bid.notes')}</label>
        <textarea id={id('notes')} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        <div className="hint">{t('bid.notesHint')}</div>
      </div>
      <FieldError>{formError}</FieldError>
      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={busy}>
        <Send size={16} aria-hidden="true" />{busy ? t('bid.submitting') : t('bid.submit')}
      </button>
    </form>
  );
}
