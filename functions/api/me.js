import { json, requireAuth } from "../_lib/auth.js";

export async function onRequestGet(context) {
  const user = await requireAuth(context.request, context.env);
  if (!user) return json({ authenticated: false }, 401);
  return json({ authenticated: true, user });
}
