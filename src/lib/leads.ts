import "server-only";

import { business } from "@/lib/business";

/**
 * Where funnel leads go. The site has no database: each lead is sent to
 * GoHighLevel (when GHL_API_KEY + GHL_LOCATION_ID are set) and/or posted as
 * JSON to LEAD_WEBHOOK_URL (Zapier, Make, a GHL inbound webhook, etc.).
 * With neither set, leads are only written to the server log.
 */

export type Lead = {
  name: string;
  phone: string;
  email: string;
  address: string;
  vehicle: string;
  addOns?: string[];
};

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

function ghlConfigured() {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

async function upsertGhlContact(lead: Lead, tags: string[]) {
  const [firstName, ...rest] = lead.name.trim().split(/\s+/);
  const res = await fetch(`${GHL_BASE_URL}/contacts/upsert`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GHL_API_KEY}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      locationId: process.env.GHL_LOCATION_ID,
      firstName,
      lastName: rest.join(" ") || undefined,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address1: lead.address,
      tags,
      source: `${business.name} booking funnel`,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GoHighLevel contact upsert failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
}

/**
 * Best-effort: a CRM or webhook outage never blocks the customer, so errors
 * are logged and swallowed.
 */
export async function sendLead(event: "lead_created" | "membership_requested", lead: Lead, extra: Record<string, unknown> = {}) {
  const tags = event === "lead_created" ? ["docmobile-lead"] : ["docmobile-lead", "complete-care-requested"];
  const jobs: Promise<unknown>[] = [];

  if (ghlConfigured()) jobs.push(upsertGhlContact(lead, tags));

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    jobs.push(
      fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, business: business.name, ...lead, ...extra, at: new Date().toISOString() }),
        cache: "no-store",
      }).then((r) => {
        if (!r.ok) throw new Error(`Lead webhook failed (${r.status})`);
      })
    );
  }

  if (jobs.length === 0) console.info(`[leads] ${event} (no GHL or webhook configured)`, { ...lead, ...extra });

  for (const result of await Promise.allSettled(jobs)) {
    if (result.status === "rejected") console.error(`[leads] ${event} delivery failed`, result.reason);
  }
}
