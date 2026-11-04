import { useState } from 'react';
import { Bath, BedDouble, DollarSign, ExternalLink, MapPin, Maximize2, Users } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { config } from '../lib/config.js';
import { bathCount, money } from '../lib/format.js';
import BidForm from './BidForm.jsx';

function payoutLabel(t, min, max) {
  const lo = money(min);
  const hi = money(max);
  if (lo && hi) return lo === hi ? lo : `${lo} – ${hi}`;
  if (lo) return t('property.payoutFrom', { amount: lo });
  if (hi) return t('property.payoutUpTo', { amount: hi });
  return t('property.payoutNone');
}

export default function PropertyCard({ listing }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const baths = bathCount(listing.full_bathrooms, listing.half_bathrooms);
  const place = [listing.city, listing.state].filter(Boolean).join(', ');
  const where = config.showStreetAddress && listing.address ? `${listing.address}, ${place}` : place;

  return (
    <article className="card">
      <div className="card-head">
        <h3>{listing.property_name}</h3>
        {where && <div className="where"><MapPin size={14} aria-hidden="true" />{where}</div>}
      </div>
      <div className="card-body">
        <div className="pills">
          {listing.market_name && <span className="pill">{listing.market_name}</span>}
          {listing.color_zone && <span className="pill">{t('property.zone', { zone: listing.color_zone })}</span>}
          {listing.sleep_count > 0 && <span className="pill"><Users size={13} aria-hidden="true" />{t('property.sleeps', { n: listing.sleep_count })}</span>}
          {listing.total_beds_made > 0 && <span className="pill"><BedDouble size={13} aria-hidden="true" />{t('property.beds', { n: listing.total_beds_made })}</span>}
          {baths && <span className="pill"><Bath size={13} aria-hidden="true" />{t('property.baths', { n: baths })}</span>}
          {listing.square_footage > 0 && <span className="pill"><Maximize2 size={13} aria-hidden="true" />{t('property.sqft', { n: listing.square_footage.toLocaleString('en-US') })}</span>}
        </div>

        <div className="payout" aria-label={t('property.payoutRange')}>
          <DollarSign size={18} aria-hidden="true" />{payoutLabel(t, listing.target_payout_min, listing.target_payout_max)}
        </div>

        {listing.notes_for_cleaners && (
          <div className="notes-block"><strong>{t('property.notes')}</strong>{listing.notes_for_cleaners}</div>
        )}

        {listing.listing_link && (
          <a className="link-row" href={listing.listing_link} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} aria-hidden="true" />{t('property.listing')}
          </a>
        )}

        {open ? (
          <>
            <BidForm listing={listing} />
            <button type="button" className="btn btn-small" onClick={() => setOpen(false)}>{t('property.hideBid')}</button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>{t('property.placeBid')}</button>
        )}
      </div>
    </article>
  );
}
