/*
 * DocMobile Auto Solutions: services and pricing.
 * PLACEHOLDER PRICES. Replace with Doc's real menu.
 * This one file is used by the booking page AND the checkout endpoint,
 * so the price a customer sees is the price they're charged.
 */
(function (root) {
  var PRICING = {
    business: {
      name: "DocMobile Auto Solutions",
      legalName: "DocMobile Auto Solutions LLC",
      phone: "(555) 555-0123",          // TODO: real phone
      email: "book@docmobileauto.com",  // TODO: real email
      serviceArea: "Mobile service: we come to you", // TODO: real area
      facebook: "https://www.facebook.com/docautodetailing",
    },

    // Services the customer already knows they need (estimate = parts + labor, placeholder)
    services: [
      { id: "oil", name: "Oil & Filter Change", desc: "Synthetic blend, up to 5 qts, multi-point check", price: 89 },
      { id: "brakes", name: "Brake Pads (per axle)", desc: "Pads, hardware, inspect rotors", price: 220 },
      { id: "battery", name: "Battery Replacement", desc: "Test, new battery, terminal clean", price: 180 },
      { id: "alternator", name: "Alternator Replacement", desc: "Part + install, charging test", price: 450 },
      { id: "starter", name: "Starter Replacement", desc: "Part + install", price: 400 },
      { id: "tuneup", name: "Spark Plugs / Tune-Up", desc: "Plugs, inspect coils & air filter", price: 180 },
      { id: "ac", name: "A/C Recharge", desc: "Evacuate, recharge, leak check", price: 160 },
      { id: "inspection", name: "Pre-Purchase Inspection", desc: "Full inspection before you buy a used car", price: 150 },
      { id: "detail", name: "Auto Detail", desc: "Interior + exterior detail", price: 200 },
    ],

    // Small add-ons while we're there
    addons: [
      { id: "wipers", name: "Wiper Blades", price: 35 },
      { id: "cabin", name: "Cabin Air Filter", price: 45 },
      { id: "airfilter", name: "Engine Air Filter", price: 45 },
      { id: "rotation", name: "Tire Rotation", price: 40 },
    ],

    // Problems the customer can describe. Any of these suggests a diagnosis visit.
    symptoms: [
      "Check engine light", "Won't start / no crank", "Strange noise", "Brakes squeal or grind",
      "Overheating", "Leaking fluid", "A/C not cold", "Shaking / vibration", "Electrical issue", "Something else",
    ],

    sizes: [
      { id: "small", name: "Car / Sedan / Coupe", mult: 1.0 },
      { id: "mid", name: "SUV / Crossover", mult: 1.1 },
      { id: "large", name: "Truck / Van", mult: 1.2 },
    ],

    depositPercent: 0.25, // 25% of the estimate
    depositMinimum: 50,   // never less than $50
    diagnosisFee: 120,    // flat diagnosis fee, credited toward the repair
  };

  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // Returns { estimate, deposit, lines } or null if no priced service picked.
  PRICING.estimate = function (sel) {
    sel = sel || {};
    var size = find(PRICING.sizes, sel.size) || PRICING.sizes[0];
    var lines = [], base = 0, addonTotal = 0;
    (sel.services || []).forEach(function (id) {
      var s = find(PRICING.services, id);
      if (s) { base += s.price; lines.push(s.name); }
    });
    (sel.addons || []).forEach(function (id) {
      var a = find(PRICING.addons, id);
      if (a) { addonTotal += a.price; lines.push(a.name); }
    });
    if (!base) return null; // add-ons alone don't make a booking
    var estimate = Math.round(base * size.mult + addonTotal);
    var deposit = Math.min(estimate, Math.max(PRICING.depositMinimum, Math.round(estimate * PRICING.depositPercent)));
    return { estimate: estimate, deposit: deposit, lines: lines };
  };

  if (typeof module !== "undefined" && module.exports) module.exports = PRICING;
  else root.PRICING = PRICING;
})(this);
