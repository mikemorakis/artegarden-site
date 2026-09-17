import { json, requireAuth } from "../_lib/auth.js";
import { notifyNewInquiry } from "../_lib/email.js";

export async function onRequestGet(context) {
  const user = await requireAuth(context.request, context.env);
  if (!user) return json({ error: "unauthorized" }, 401);

  const status = context.request.url.includes("status=")
    ? new URL(context.request.url).searchParams.get("status")
    : null;

  let sql = "SELECT * FROM inquiries";
  const binds = [];
  if (status) {
    sql += " WHERE status = ?";
    binds.push(status);
  }
  sql += " ORDER BY created_at DESC LIMIT 200";

  const { results } = await context.env.DB.prepare(sql).bind(...binds).all();
  return json({ inquiries: results || [] });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // Honeypot
  if (body._honey) return json({ ok: true });

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const event_type = String(body.type || body.event_type || "").trim();
  const event_date = String(body.date || body.event_date || "").trim() || null;
  const guests = body.guests ? Number(body.guests) : null;
  const message = String(body.message || "").trim() || null;

  if (!name || !phone || !event_type) {
    return json({ error: "missing_fields" }, 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "invalid_email" }, 400);
  }

  const result = await env.DB.prepare(
    `INSERT INTO inquiries (name, phone, email, event_type, event_date, guests, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(name, phone, email || null, event_type, event_date, guests, message).run();

  const row = {
    id: result.meta.last_row_id,
    name,
    phone,
    email,
    event_type,
    event_date,
    guests,
    message,
  };

  // Fire-and-forget email notify (also keep legacy FormSubmit CC path via notify)
  context.waitUntil(notifyNewInquiry(env, row));

  return json({ ok: true, id: row.id });
}
