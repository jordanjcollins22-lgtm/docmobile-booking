"use server";

import { redirect } from "next/navigation";

import { addOns, business, isVehicleSize, membershipPrices } from "@/lib/business";
import { readLead, writeLead } from "@/lib/lead-cookie";
import { sendLead } from "@/lib/leads";
import { normalizePhone } from "@/lib/phone";

export interface LeadFormState {
  error?: string;
  values?: { vehicle: string; name: string; phone: string; email: string; address: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1: save who they are and where the car will be, then go to the plan page. */
export async function createDetailingLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const values = {
    vehicle: String(formData.get("vehicle_size") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
  };

  if (!isVehicleSize(values.vehicle)) return { error: "Pick what we're detailing.", values };
  if (!values.name) return { error: "Please enter your name.", values };
  const phone = normalizePhone(values.phone);
  if (!phone) return { error: "Enter a valid phone number, e.g. (443) 555-0123.", values };
  if (!EMAIL_RE.test(values.email)) return { error: "Enter a valid email address.", values };
  if (values.address.length < 5) return { error: "Enter the address where your car will be.", values };

  const lead = {
    name: values.name,
    phone,
    email: values.email.toLowerCase(),
    address: values.address,
    vehicle: values.vehicle,
  };
  try {
    await writeLead(lead);
  } catch (err) {
    console.error("[funnel] could not save lead cookie", err);
    return { error: `Something went wrong saving your info. Please try again or call ${business.phoneDisplay}.`, values };
  }
  await sendLead("lead_created", lead);

  redirect("/start/plan");
}

/**
 * Step 2: record the membership request with the vehicle and add-ons they
 * picked. Boats and RVs have no set price, so monthlyPrice stays null and the
 * request is a quote request.
 */
export async function requestMembership(formData: FormData) {
  const lead = await readLead();
  if (!lead) redirect("/start");

  const size = formData.get("vehicle_size");
  if (!isVehicleSize(size)) redirect("/start/plan");
  const plan = membershipPrices[size];

  // Prices come from the server-side config, never from the form.
  const picked = addOns.filter((a) => formData.getAll("add_ons").includes(a.id));
  const updated = {
    ...lead,
    vehicle: size,
    monthlyPrice: plan.price,
    addOns: picked.map((a) => a.id),
    addOnsTotal: picked.reduce((sum, a) => sum + a.price, 0),
  };
  await writeLead(updated);

  await sendLead("membership_requested", updated, {
    plan: `Complete Care · ${plan.label}`,
    addOnNames: picked.map((a) => a.name),
  });

  redirect("/start/done");
}
