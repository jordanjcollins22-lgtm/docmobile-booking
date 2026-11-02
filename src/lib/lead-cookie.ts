import "server-only";

import { cookies } from "next/headers";

import { isVehicleSize, type VehicleSize } from "@/lib/business";
import type { Lead } from "@/lib/leads";

// The funnel keeps the customer's answers in an httpOnly cookie between steps,
// so personal details never go in the URL.
const COOKIE = "docmobile_lead";

export type StoredLead = Lead & { vehicle: VehicleSize; monthlyPrice?: number | null; addOnsTotal?: number };

export async function readLead(): Promise<StoredLead | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const lead = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as StoredLead;
    return typeof lead.name === "string" && isVehicleSize(lead.vehicle) ? lead : null;
  } catch {
    return null;
  }
}

export async function writeLead(lead: StoredLead) {
  (await cookies()).set(COOKIE, Buffer.from(JSON.stringify(lead), "utf8").toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
