const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const money = (value) => (value === null || value === undefined || value === '' || Number.isNaN(Number(value)) ? '' : usd.format(Number(value)));

export function bathCount(full, half) {
  const total = (Number(full) || 0) + (Number(half) || 0) * 0.5;
  return total > 0 ? String(total) : '';
}

export function formatDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const digitsOnly = (s) => String(s || '').replace(/\D/g, '');
export const looksLikeEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
export const todayStamp = () => new Date().toISOString().slice(0, 10);
