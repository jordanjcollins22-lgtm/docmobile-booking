# Doc Auto Detailing booking site

A one-page booking funnel: **Address → Contact → Your car & the work → Payment**.
At the payment step the customer picks either a **deposit** (25% of the estimate, min $50)
or a flat **$120 diagnosis visit**, then pays through Stripe Checkout.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole site and funnel (no build step) |
| `pricing.js` | Services, prices, size/condition multipliers, deposit rules, business info. **Edit this to change prices.** |
| `api/checkout.js` | Serverless function that creates the Stripe Checkout session. Recomputes the price server-side. |

## Fill in before launch

All in `pricing.js` unless noted:

- Real phone, email, and service area (`business`)
- Real service menu and prices (`services`, `addons`) — current ones are placeholders
- Size/condition multipliers, deposit % and minimum
- Logo: replace the "D" mark in `index.html` (`.brand .mark`) with an `<img>`
- Cancellation wording in step 4 of `index.html` (search for "non-refundable")

## Deploy (Vercel)

1. Put these files in a GitHub repo and import it in Vercel (no framework, no build command).
2. In Vercel → Project → Settings → Environment Variables add:
   - `STRIPE_SECRET_KEY` = your Stripe secret key (`sk_test_...` to test, `sk_live_...` to go live)
   - `SITE_URL` (optional) = `https://yourdomain.com`
3. Deploy. Test with card `4242 4242 4242 4242`, any future date, any CVC.

## Where bookings show up

Every payment lands in the Stripe Dashboard → Payments. Open one and the **metadata** has the
full booking: name, phone, address, parking/water/power, date & time window, vehicle,
services, and notes. Turn on Stripe's email receipts and "successful payment" notifications
so Doc gets an email for each booking.

Without a backend (e.g. opening `index.html` directly), the pay button shows a preview
screen instead of charging.
