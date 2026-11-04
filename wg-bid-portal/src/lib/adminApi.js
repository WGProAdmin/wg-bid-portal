import { portal } from './supabase.js';
import { config } from './config.js';

// Admin calls go to the bids-admin Edge Function with the admin's Supabase Auth token.
// bids-admin v3 still authenticates with a stored password; v4 (JWT check) ships with the
// cleaner portal auth migration. Until then the dashboard cannot be tested end to end.

async function call(action, payload) {
  if (!portal) throw new Error('not_configured');
  const { data } = await portal.auth.getSession();
  const session = data && data.session;
  if (!session) { const e = new Error('session_expired'); e.code = 'session_expired'; throw e; }
  const res = await fetch(`${config.portalUrl}/functions/v1/bids-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: config.portalAnonKey, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action, payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) { const e = new Error(body.error || 'not_admin'); e.code = 'not_admin'; throw e; }
  if (!res.ok) { const e = new Error(body.error || 'request_failed'); e.code = 'request_failed'; throw e; }
  return body;
}

export const listListings = async () => (await call('list_listings')).listings || [];
export const searchProperties = async (query) => (await call('search_properties', { query })).results || [];
export const createListing = (payload) => call('create_listing', payload);
export const cancelListing = (listing_id) => call('cancel_listing', { listing_id });
export const approveBid = ({ bid_id, listing_id, payout_amount, awarded_user_id }) => call('approve_bid', { bid_id, listing_id, payout_amount, awarded_user_id });
export const denyBid = (bid_id) => call('deny_bid', { bid_id });

export async function signIn(email, password) {
  if (!portal) throw new Error('not_configured');
  const { error } = await portal.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export const signOut = () => (portal ? portal.auth.signOut() : Promise.resolve());
export async function sendReset(email) {
  if (!portal) throw new Error('not_configured');
  await portal.auth.resetPasswordForEmail(email);
}
export const onAuthChange = (cb) => (portal ? portal.auth.onAuthStateChange((_event, session) => cb(session)).data.subscription : { unsubscribe() {} });
export async function currentSession() {
  if (!portal) return null;
  const { data } = await portal.auth.getSession();
  return data.session || null;
}
