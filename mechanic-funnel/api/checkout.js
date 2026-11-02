// Vercel serverless function: POST /api/checkout
// Creates a Stripe Checkout Session for either the deposit or the flat diagnosis fee.
// Needs env var STRIPE_SECRET_KEY. Optional: SITE_URL (defaults to the request host).
// The amount is recomputed here from pricing.js, so the browser can't change the price.

const PRICING = require("../pricing.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: "Payments are not set up yet (missing STRIPE_SECRET_KEY)." });

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const c = b.contact || {}, a = b.address || {}, v = b.vehicle || {};
  if (!c.name || !c.phone || !c.email || !a.street || !a.zip) {
    return res.status(400).json({ error: "Missing contact or address details." });
  }

  let amount, label;
  if (b.payment === "diagnosis") {
    amount = PRICING.diagnosisFee;
    label = "Mobile diagnosis fee";
  } else {
    const est = PRICING.estimate({ services: v.services, addons: v.addons, size: v.size });
    if (!est) return res.status(400).json({ error: "Pick at least one service, or choose the diagnosis option." });
    amount = est.deposit;
    label = "Deposit on estimated $" + est.estimate + " repair";
  }

  const site = process.env.SITE_URL || "https://" + req.headers.host;
  const clip = (s) => String(s == null ? "" : s).slice(0, 490); // Stripe metadata values max 500 chars
  const params = new URLSearchParams({
    mode: "payment",
    customer_email: c.email,
    success_url: site + "/?paid=1&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: site + "/?canceled=1",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(amount * 100),
    "line_items[0][price_data][product_data][name]": PRICING.business.name + ": " + label,
    "payment_intent_data[description]": label,
    "metadata[payment_type]": b.payment === "diagnosis" ? "diagnosis" : "deposit",
    "metadata[name]": clip(c.name),
    "metadata[phone]": clip(c.phone),
    "metadata[preferred_date]": clip(c.date),
    "metadata[preferred_time]": clip(c.time),
    "metadata[contact_via]": clip(c.via),
    "metadata[address]": clip([a.street, a.unit, a.city, a.state, a.zip].filter(Boolean).join(", ")),
    "metadata[location_notes]": clip(a.notes),
    "metadata[vehicle]": clip([v.year, v.make, v.model, v.engine].filter(Boolean).join(" ")),
    "metadata[mileage]": clip(v.mileage),
    "metadata[vehicle_type]": clip(v.size),
    "metadata[drivable]": clip(v.drivable),
    "metadata[symptoms]": clip((v.symptoms || []).join(", ")),
    "metadata[services]": clip((v.services || []).concat(v.addons || []).join(", ")),
    "metadata[notes]": clip(v.notes),
  });

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const data = await r.json();
  if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || "Stripe error" });
  return res.status(200).json({ url: data.url });
};
