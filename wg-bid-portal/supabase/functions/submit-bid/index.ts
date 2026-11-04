// DRAFT for wg-cleaner-portal. Not deployed.
// Deploy with verify_jwt = false (public form; the function does its own validation).
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (this project), PROPDB_URL, PROPDB_SERVICE_ROLE_KEY (hub),
//          ALLOWED_ORIGIN (the Netlify site origin; falls back to * until set).
// Identity: bids from this form are stored with identity_verified = false. When the cleaner portal
// identity model lands (platform_updates, week 6), a signed-in contractor's id replaces 'guest'.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (status: number, code: string, error: string) => json({ error, code }, status);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizePhone(raw: string | null | undefined): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits.length >= 10 ? `+${digits}` : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: cors });
  if (req.method !== "POST") return fail(405, "method", "Method not allowed");

  try {
    const b = await req.json().catch(() => null);
    if (!b || typeof b !== "object") return fail(400, "generic", "Invalid request.");

    const name = String(b.cleaner_name ?? "").trim();
    const email = b.cleaner_email ? String(b.cleaner_email).trim().toLowerCase() : null;
    const phone = normalizePhone(b.cleaner_phone);
    const amount = Number(b.bid_amount);
    const notes = b.notes ? String(b.notes).trim().slice(0, 1000) : null;
    const language = b.language === "es" ? "es" : "en";

    if (!UUID.test(String(b.listing_id)) || !UUID.test(String(b.property_id))) return fail(400, "generic", "Invalid listing.");
    if (name.length < 2 || name.length > 120) return fail(400, "generic", "Name is required.");
    if (!email && !phone) return fail(400, "generic", "A phone number or email is required.");
    if (email && !EMAIL.test(email)) return fail(400, "generic", "Invalid email.");
    if (b.cleaner_phone && !phone) return fail(400, "generic", "Invalid phone.");
    if (!Number.isInteger(amount) || amount <= 0 || amount > 100000) return fail(400, "generic", "Bid must be a whole-dollar amount.");

    // The listing must still be open in the hub, and the property must match it.
    const propKey = Deno.env.get("PROPDB_SERVICE_ROLE_KEY");
    if (!propKey) return fail(500, "generic", "Server misconfigured.");
    const hub = createClient(Deno.env.get("PROPDB_URL") || "https://rqdnzhnjkxkmjafupzmu.supabase.co", propKey, { auth: { persistSession: false } });
    const { data: listing, error: lErr } = await hub
      .from("bid_listings").select("id, property_id, status").eq("id", b.listing_id).maybeSingle();
    if (lErr) return fail(500, "generic", "Could not check the listing.");
    if (!listing || listing.status !== "open" || listing.property_id !== b.property_id) {
      return fail(409, "listing_closed", "This listing is no longer open.");
    }

    const own = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: bid, error: iErr } = await own.from("bids").insert({
      user_id: "guest",
      listing_id: listing.id,
      property_id: listing.property_id,
      bid_amount: amount,
      notes,
      cleaner_name: name,
      cleaner_email: email,
      cleaner_phone: phone,
      preferred_language: language,
      identity_verified: false,
    }).select("id").single();

    if (iErr) {
      // 23505 = unique violation: this contact already has a pending bid on the listing.
      if ((iErr as { code?: string }).code === "23505") return fail(409, "duplicate_bid", "A pending bid already exists.");
      console.error("submit-bid insert failed:", iErr.message);
      return fail(500, "generic", "Could not save the bid.");
    }

    await own.from("bid_events").insert({
      bid_id: bid.id, listing_id: listing.id, event: "submitted", actor: "guest",
      detail: { amount, language, has_email: Boolean(email), has_phone: Boolean(phone) },
    });

    return json({ success: true, bid_id: bid.id });
  } catch (err) {
    console.error("submit-bid error:", String(err));
    return fail(500, "generic", "Unexpected error.");
  }
});
