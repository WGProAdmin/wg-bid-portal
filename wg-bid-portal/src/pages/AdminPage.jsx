import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { portalConfigured } from '../lib/config.js';
import { money } from '../lib/format.js';
import { approveBid, cancelListing, currentSession, denyBid, listListings, onAuthChange, signOut } from '../lib/adminApi.js';
import AdminLogin from '../components/AdminLogin.jsx';
import ExportPanel from '../components/ExportPanel.jsx';
import ListingForm from '../components/ListingForm.jsx';
import ListingGroup from '../components/ListingGroup.jsx';
import { Empty, Loading, Notice } from '../components/States.jsx';

export default function AdminPage({ onSignedInChange }) {
  const { t } = useI18n();
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [notice, setNotice] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let live = true;
    currentSession().then((s) => { if (live) setSession(s); });
    const sub = onAuthChange((s) => setSession(s));
    return () => { live = false; sub.unsubscribe(); };
  }, []);

  useEffect(() => { onSignedInChange(Boolean(session)); }, [session, onSignedInChange]);

  const authFailed = useCallback((code) => {
    setNotice(code === 'not_admin' ? t('admin.notAdmin') : t('admin.sessionExpired'));
    signOut();
  }, [t]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setListings(await listListings());
    } catch (err) {
      console.error('Listings load failed:', err);
      if (err.code === 'not_admin' || err.code === 'session_expired') authFailed(err.code); else setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [authFailed]);

  useEffect(() => { if (session) load(); }, [session, load]);

  const run = async (id, fn) => {
    setBusyId(id);
    try { await fn(); await load(); } catch (err) {
      console.error('Admin action failed:', err);
      if (err.code === 'not_admin' || err.code === 'session_expired') authFailed(err.code); else setNotice(t('admin.actionError'));
    } finally { setBusyId(null); }
  };

  const onApprove = (listing, bid) => {
    const msg = t('admin.confirmApprove', { name: bid.cleaner_name || bid.user_id, amount: money(bid.bid_amount) });
    if (window.confirm(msg)) run(bid.id, () => approveBid({ bid_id: bid.id, listing_id: listing.id, payout_amount: bid.bid_amount, awarded_user_id: bid.user_id }));
  };
  const onDeny = (bid) => { if (window.confirm(t('admin.confirmDeny'))) run(bid.id, () => denyBid(bid.id)); };
  const onCancel = (listing) => { if (window.confirm(t('admin.confirmCancel'))) run(listing.id, () => cancelListing(listing.id)); };

  const allBids = useMemo(() => listings.flatMap((l) => l.bids), [listings]);
  const pending = allBids.filter((b) => b.status === 'pending').length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [l.property?.name, l.property?.property_id, ...l.bids.flatMap((b) => [b.cleaner_name, b.cleaner_email, b.cleaner_phone])].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [listings, statusFilter, search]);

  if (!portalConfigured) return <Notice>{t('admin.notConfigured')}</Notice>;
  if (session === undefined) return <Loading label={t('common.loading')} />;
  if (!session) return <AdminLogin notice={notice} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('admin.title')}</h2>
          <div className="gold-rule" />
          <p className="sub">{t('admin.summary', { listings: listings.length, bids: allBids.length, pending })}</p>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={() => setShowExport(!showExport)}><Download size={16} aria-hidden="true" />{t('admin.exportTitle')}</button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} aria-hidden="true" />{t('admin.addListing')}</button>
        </div>
      </div>

      {notice && <Notice>{notice}</Notice>}
      <p className="muted" style={{ marginBottom: 14, fontSize: '0.85rem' }}>{t('admin.legacyNote')}</p>

      {showExport && <ExportPanel listings={listings} />}
      {showForm && <ListingForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} onAuthError={authFailed} />}

      <div className="filter-bar">
        <div className="field">
          <label htmlFor="status-filter">{t('admin.filters')}</label>
          <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t('admin.allStatuses')}</option>
            {['open', 'filled', 'cancelled'].map((s) => <option key={s} value={s}>{t('status.' + s)}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: '1 1 240px' }}>
          <label htmlFor="admin-search">{t('admin.search')}</label>
          <input id="admin-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="filter-count">{t('admin.showing', { shown: visible.length, total: listings.length })}</span>
      </div>

      {loading && listings.length === 0 && <Loading label={t('common.loading')} />}
      {loadError && <Notice>{t('admin.loadError')}</Notice>}
      {!loading && !loadError && visible.length === 0 && <Empty title={t('admin.noListings')} body={t('admin.noListingsBody')} />}
      {visible.map((l) => <ListingGroup key={l.id} listing={l} busyId={busyId} onApprove={onApprove} onDeny={onDeny} onCancel={onCancel} />)}
    </div>
  );
}
