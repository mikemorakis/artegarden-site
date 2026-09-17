import { json, requireAuth } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const user = await requireAuth(context.request, context.env);
  if (!user) return json({ error: "unauthorized" }, 401);

  const id = context.params.id;
  const inquiry = await context.env.DB.prepare("SELECT * FROM inquiries WHERE id = ?").bind(id).first();
  if (!inquiry) return json({ error: "not_found" }, 404);

  const { results: offers } = await context.env.DB.prepare(
    "SELECT * FROM offers WHERE inquiry_id = ? ORDER BY created_at DESC"
  ).bind(id).all();

  return json({ inquiry, offers: offers || [] });
}

export async function onRequestPatch(context) {
  const user = await requireAuth(context.request, context.env);
  if (!user) return json({ error: "unauthorized" }, 401);

  const id = context.params.id;
  let body;
  try {
    body = await requestJson(context.request);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (body.status && ["new", "offered", "closed"].includes(body.status)) {
    await context.env.DB.prepare("UPDATE inquiries SET status = ? WHERE id = ?").bind(body.status, id).run();
  }
  const inquiry = await context.env.DB.prepare("SELECT * FROM inquiries WHERE id = ?").bind(id).first();
  return json({ inquiry });
}

async function requestJson(request) {
  return request.json();
}
