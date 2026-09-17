import { json, signSession, sessionCookie, timingSafeEqual } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!env.ADMIN_USER || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: "auth_not_configured" }, 500);
  }
  if (!timingSafeEqual(username, env.ADMIN_USER) || !timingSafeEqual(password, env.ADMIN_PASSWORD)) {
    return json({ error: "invalid_credentials" }, 401);
  }
  const token = await signSession(username, env.SESSION_SECRET);
  return json({ ok: true, user: username }, 200, {
    "Set-Cookie": sessionCookie(token),
  });
}
