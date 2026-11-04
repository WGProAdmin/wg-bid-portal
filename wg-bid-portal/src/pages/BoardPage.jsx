import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, ExternalLink } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { fetchBoard } from '../lib/boardApi.js';
import { boardConfigured, config } from '../lib/config.js';
import PropertyCard from '../components/PropertyCard.jsx';
import { Empty, Loading, Notice } from '../components/States.jsx';

export default function BoardPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [market, setMarket] = useState('all');
  const [state, setState] = useState(boardConfigured ? 'loading' : 'unconfigured');

  useEffect(() => {
    if (!boardConfigured) return;
    let live = true;
    fetchBoard()
      .then((data) => { if (live) { setRows(data); setState('ready'); } })
      .catch((err) => { console.error('Board load failed:', err); if (live) setState('error'); });
    return () => { live = false; };
  }, []);

  const markets = useMemo(() => [...new Set(rows.map((r) => r.market_name).filter(Boolean))].sort(), [rows]);
  const visible = useMemo(() => rows.filter((r) => market === 'all' || r.market_name === market), [rows, market]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('board.title')}</h2>
          <div className="gold-rule" />
          {state === 'ready' && <p className="sub">{t(visible.length === 1 ? 'board.count_one' : 'board.count_other', { n: visible.length })}</p>}
        </div>
        {state === 'ready' && markets.length > 1 && (
          <div className="field" style={{ margin: 0, minWidth: 220 }}>
            <label htmlFor="market">{t('board.market')}</label>
            <select id="market" value={market} onChange={(e) => setMarket(e.target.value)}>
              <option value="all">{t('board.allMarkets')}</option>
              {markets.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
      </div>

      {config.unlistedFormUrl && (
        <div className="banner">
          <div>
            <div className="banner-title"><ClipboardList size={16} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 6 }} />{t('board.unlistedTitle')}</div>
            <p>{t('board.unlistedBody')}</p>
          </div>
          <a className="btn btn-primary" href={config.unlistedFormUrl} target="_blank" rel="noopener noreferrer">
            {t('board.unlistedLink')}<ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      )}

      {state === 'loading' && <Loading label={t('board.loading')} />}
      {state === 'unconfigured' && <Notice>{t('board.notConfigured')}</Notice>}
      {state === 'error' && <Notice>{t('board.loadError')}</Notice>}
      {state === 'ready' && (visible.length === 0
        ? <Empty title={t('board.emptyTitle')} body={t('board.emptyBody')} />
        : <div className="grid">{visible.map((l) => <PropertyCard key={l.listing_id} listing={l} />)}</div>)}
    </div>
  );
}
