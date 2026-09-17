import { json, requireAuth } from "../../../_lib/auth.js";
import { buildOfferEmail, sendOfferEmail } from "../../../_lib/email.js";

export async function onRequestPost(context) {
  const user = await requireAuth(context.request, context.env);
  if (!user) return json({ error: "unauthorized" }, 401);

  const id = Number(context.params.id);
  const inquiry = await context.env.DB.prepare("SELECT * FROM inquiries WHERE id = ?").bind(id).first();
  if (!inquiry) return json({ error: "not_found" }, 404);
  if (!inquiry.email) return json({ error: "no_customer_email" }, 400);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const event_date = String(body.event_date || inquiry.event_date || "").trim();
  const price_per_person = Number(body.price_per_person);
  const venue_fee = Number(body.venue_fee);
  const guests = body.guests != null && body.guests !== "" ? Number(body.guests) : (inquiry.guests || null);
  const includes = String(body.includes || "").trim();
  const notes = String(body.notes || "").trim() || null;

  if (!event_date || Number.isNaN(price_per_person) || Number.isNaN(venue_fee) || !includes) {
    return json({ error: "missing_fields" }, 400);
  }

  const peopleTotal = price_per_person * (guests || 0);
  const total = peopleTotal + venue_fee;

  const offer = {
    event_date,
    price_per_person,
    venue_fee,
    guests,
    includes,
    notes,
    total,
  };

  const email = buildOfferEmail({ inquiry, offer });
  const sent = await sendOfferEmail(context.env, {
    to: inquiry.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    inquiry,
    offer,
  });

  if (!sent.ok) {
    return json({ error: "send_failed", detail: sent.error }, 502);
  }

  const insert = await context.env.DB.prepare(
    `INSERT INTO offers (inquiry_id, event_date, price_per_person, venue_fee, guests, includes, notes, total, sent_at, sent_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`
  ).bind(id, event_date, price_per_person, venue_fee, guests, includes, notes, total, inquiry.email).run();

  await context.env.DB.prepare("UPDATE inquiries SET status = 'offered' WHERE id = ?").bind(id).run();

  return json({
    ok: true,
    offer_id: insert.meta.last_row_id,
    total,
    via: sent.via,
    sent_to: inquiry.email,
  });
}
