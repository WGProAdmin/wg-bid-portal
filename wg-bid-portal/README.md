# Well & Good Bid Portal (Vite rebuild)

React 18 + Vite, Supabase, lucide-react, Netlify with git deploys. Replaces the single-file Firebase `index.html`.

Status: week 5 starting build (Nov 4, 2026). The cleaner board and admin screens are built against the live hub schema. Backend pieces marked DRAFT are not applied or deployed.

## Run it

```
npm install
cp .env.example .env     # add the two anon keys (public by design)
npm run dev
```

## Deploy

1. Push this folder to a new git repo (suggested name: `wg-bid-portal`).
2. Netlify: New site from Git, build command `npm run build`, publish `dist` (already in `netlify.toml`).
3. Site settings, Environment variables: add the five `VITE_*` values from `.env.example`.
4. Keep the current Firebase site live until the Dec 4 cutover. Use the Netlify deploy preview URL for testing.
5. No deploys Wed Nov 25 to Fri Nov 27 (freeze).

## How the data flows

| Need | Source | Access |
|---|---|---|
| Open listings, payout range, beds, baths, zone, listing link | hub view `bid_board` | anon read |
| Submit a bid | cleaner portal Edge Function `submit-bid` (DRAFT) | public form, validated server side |
| Admin list, approve, deny, create and cancel listing | cleaner portal Edge Function `bids-admin` | Supabase Auth token (needs v4, see below) |
| Approved payout into pricing | hub RPC `approve_bid_listing`, called by `bids-admin` | service role only |

The portal keeps no property data of its own. Markets come from `bid_board.market_name`.

## Parity with the Firebase portal

| Firebase feature | Rebuild |
|---|---|
| Property cards, location filter | Board page, market filter from the hub |
| Bid form (free-text name, amount) | Name, phone or email, whole-dollar amount, notes |
| Admin approve and deny | Approve fills the listing and denies the rest; one approval per listing, enforced in the database |
| Admin password / Firebase Auth | Supabase Auth (cleaner portal project) |
| Export Backup | CSV with contact fields and decision audit columns, plus JSON backup |
| Add property, edit property, bulk CSV upload, location manager | Retired: properties and markets live in the hub. Admins add a listing for an existing hub property |
| Monday.com unlisted property banner | Kept, new-tab link |
| Spanish labels under English labels | Full EN/ES toggle, every string in `src/i18n` |

## Backend dependencies (in `supabase/`, not applied)

1. `migrations/20261104_bids_contact_audit.sql`: contact columns, one approved bid per listing, one pending bid per contact per listing, `bid_events` audit table. Audit `pg_policies` first, run `get_advisors` after.
2. `functions/submit-bid`: deploy with `verify_jwt = false`. Set `ALLOWED_ORIGIN` to the Netlify origin.
3. `bids-admin` v4: accept `Authorization: Bearer <JWT>` and check the caller is an admin, instead of the stored password check in v3. Ships with the cleaner portal auth migration (step 1 is Tue Nov 10). Admin screens cannot be tested end to end before then.

## Open decisions

- Potential and unlisted properties: 29 of the 80 Firebase properties are "potential". `bid_listings.property_id` is required and `search_properties` returns only active hub properties, so these need a hub record (status choice) or stay on the monday.com form.
- Street address: `bid_board` exposes full address and property code to anonymous readers. The UI shows city and state only (`VITE_SHOW_STREET_ADDRESS=false`). Decide whether the view itself should drop those columns.
- Contractor identity: bids from the public form are stored as `guest` with `identity_verified = false`. Week 6 replaces this with the cleaner portal identity.

## Brand

Palette, type and no-gradient rules are tokens in `src/styles/brand.css`. Errors use an icon and message in Midnight with a True Blue marker, since the brand palette has no error color.
