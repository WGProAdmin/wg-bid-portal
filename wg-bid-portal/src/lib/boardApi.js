import { hub } from './supabase.js';
import { config } from './config.js';

export async function fetchBoard() {
  if (!hub) throw new Error('not_configured');
  const { data, error } = await hub
    .from('bid_board')
    .select('*')
    .order('market_name', { ascending: true })
    .order('property_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Cleaner bids go through the submit-bid Edge Function (see supabase/functions/submit-bid).
// The bids table has no public policies, so nothing writes to it from the browser directly.
export async function submitBid(payload) {
  const res = await fetch(`${config.portalUrl}/functions/v1/submit-bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: config.portalAnonKey },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || 'submit_failed');
    err.code = body.code || 'generic';
    throw err;
  }
  return body;
}
