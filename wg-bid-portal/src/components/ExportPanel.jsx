import { Download } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { downloadFile, toCsv } from '../lib/csv.js';
import { todayStamp } from '../lib/format.js';

const flatten = (listings) => listings.flatMap((l) =>
  (l.bids.length ? l.bids : [null]).map((b) => ({ l, b })));

const COLUMNS = [
  { label: 'listing_id', value: ({ l }) => l.id },
  { label: 'property_code', value: ({ l }) => l.property?.property_id },
  { label: 'property_name', value: ({ l }) => l.property?.name },
  { label: 'city', value: ({ l }) => l.property?.city },
  { label: 'state', value: ({ l }) => l.property?.state },
  { label: 'listing_status', value: ({ l }) => l.status },
  { label: 'payout_min', value: ({ l }) => l.target_payout_min },
  { label: 'payout_max', value: ({ l }) => l.target_payout_max },
  { label: 'awarded_amount', value: ({ l }) => l.awarded_amount },
  { label: 'bid_id', value: ({ b }) => b?.id },
  { label: 'cleaner_name', value: ({ b }) => b?.cleaner_name },
  { label: 'cleaner_phone', value: ({ b }) => b?.cleaner_phone },
  { label: 'cleaner_email', value: ({ b }) => b?.cleaner_email },
  { label: 'identity_verified', value: ({ b }) => (b ? String(Boolean(b.identity_verified)) : '') },
  { label: 'bid_amount', value: ({ b }) => b?.bid_amount },
  { label: 'bid_status', value: ({ b }) => b?.status },
  { label: 'submitted_at', value: ({ b }) => b?.submitted_at },
  { label: 'decided_at', value: ({ b }) => b?.decided_at },
  { label: 'decided_by', value: ({ b }) => b?.decided_by },
  { label: 'notes', value: ({ b }) => b?.notes },
];

export default function ExportPanel({ listings }) {
  const { t } = useI18n();
  const allBids = listings.flatMap((l) => l.bids);
  const counts = ['pending', 'approved', 'denied'].map((s) => [s, allBids.filter((b) => b.status === s).length]);

  return (
    <div className="panel">
      <div className="panel-head"><h3>{t('admin.exportTitle')}</h3></div>
      <p className="muted" style={{ marginBottom: 10 }}>{t('admin.exportCounts')}</p>
      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="stat"><strong>{listings.length}</strong>{t('admin.listings')}</div>
        {counts.map(([s, n]) => <div className="stat" key={s}><strong>{n}</strong>{t('status.' + s)}</div>)}
      </div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => downloadFile(`wg-bids-${todayStamp()}.csv`, toCsv(COLUMNS, flatten(listings)), 'text/csv;charset=utf-8')}>
          <Download size={16} aria-hidden="true" />{t('admin.exportCsv')}
        </button>
        <button className="btn" onClick={() => downloadFile(`wg-bid-portal-backup-${todayStamp()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), listings }, null, 2), 'application/json')}>
          <Download size={16} aria-hidden="true" />{t('admin.exportJson')}
        </button>
      </div>
    </div>
  );
}
