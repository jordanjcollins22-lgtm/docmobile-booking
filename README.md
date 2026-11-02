# DocMobile Auto Solutions site

A copy of the Apex Shine Mobile detailing site with the company name changed to
DocMobile Auto Solutions. Next.js app with:

- `/` the marketing page (services, packages, how it works, Instagram, quote form)
- `/start` → `/start/plan` → `/start/done` the Complete Care membership booking funnel
  (vehicle photo cards, monthly prices, add-ons, $20 first-timer discount)

## Edit content

Everything (name, phone, email, Instagram, services, monthly prices, add-ons) lives in
`src/lib/business.ts`. Phone, email and Instagram are still the Apex Shine ones.

## Leads

There's no database. When someone books, the lead is sent to GoHighLevel and/or a
webhook; see `.env.example`. With neither set, leads only show in the Vercel function logs.

## Deploy

Import this repo in Vercel as a new project (framework: Next.js, no settings needed),
then add the env vars from `.env.example` under Settings → Environment Variables.

`mechanic-funnel/` holds the earlier static mechanic booking funnel, kept for reference.
