import { Check, MapPin, X } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { formatDate, money } from '../lib/format.js';

const Status = ({ value, t }) => <span className={'status status-' + value}>{t('status.' + value)}</span>;

export default function ListingGroup({ listing, busyId, onApprove, onDeny, onCancel }) {
  const { t, lang } = useI18n();
  const place = [listing.property?.city, listing.property?.state].filter(Boolean).join(', ');
  const range = [money(listing.target_payout_min), money(listing.target_payout_max)].filter(Boolean).join(' – ');
  const isOpen = listing.status === 'open';

  return (
    <section className="listing">
      <div className="listing-head">
        <div>
          <h3>{listing.property?.name || listing.property_id}</h3>
          <div className="meta">
            {place && <><MapPin size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {place}</>}
            {range && <> · {range}</>}
            {listing.status === 'filled' && listing.awarded_amount != null && <> · {t('admin.awarded', { amount: money(listing.awarded_amount) })}</>}
          </div>
        </div>
        <div className="btn-row" style={{ alignItems: 'center' }}>
          <Status value={listing.status} t={t} />
          {isOpen && <button className="btn btn-small" disabled={busyId === listing.id} onClick={() => onCancel(listing)}>{t('admin.cancelListing')}</button>}
        </div>
      </div>

      {listing.bids.length === 0 ? (
        <p className="muted" style={{ padding: 16 }}>{t('admin.noBids')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('admin.columns.cleaner')}</th>
                <th>{t('admin.columns.contact')}</th>
                <th>{t('admin.columns.amount')}</th>
                <th>{t('admin.columns.submitted')}</th>
                <th>{t('admin.columns.status')}</th>
                <th>{t('admin.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {listing.bids.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.cleaner_name || <span className="muted">{b.user_id}</span>}
                    {b.notes && <div className="muted" style={{ fontSize: '0.82rem' }}>{b.notes}</div>}
                  </td>
                  <td>
                    {b.cleaner_phone && <div>{b.cleaner_phone}</div>}
                    {b.cleaner_email && <div>{b.cleaner_email}</div>}
                    {b.identity_verified === false && <div className="muted" style={{ fontSize: '0.8rem' }}>{t('admin.unverified')}</div>}
                  </td>
                  <td><strong>{money(b.bid_amount)}</strong></td>
                  <td>{formatDate(b.submitted_at, lang)}</td>
                  <td><Status value={b.status} t={t} /></td>
                  <td>
                    {isOpen && b.status === 'pending' && (
                      <div className="btn-row">
                        <button className="btn btn-primary btn-small" disabled={busyId === b.id} onClick={() => onApprove(listing, b)}><Check size={14} aria-hidden="true" />{t('admin.approve')}</button>
                        <button className="btn btn-small" disabled={busyId === b.id} onClick={() => onDeny(b)}><X size={14} aria-hidden="true" />{t('admin.deny')}</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
