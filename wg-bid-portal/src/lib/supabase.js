import { createClient } from '@supabase/supabase-js';
import { config, boardConfigured, portalConfigured } from './config.js';

// Property database: public, read-only board data (anon key, no session).
export const hub = boardConfigured
  ? createClient(config.hubUrl, config.hubAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

// Cleaner portal: owns contractor identity, bids and the Edge Functions. Admin sign-in lives here.
export const portal = portalConfigured
  ? createClient(config.portalUrl, config.portalAnonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
