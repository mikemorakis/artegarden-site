/**
 * Thin email sender Worker for Arte Garden.
 * Pages Functions call this via service binding (Pages cannot bind send_email directly).
 */
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const {
      to,
      from,
      fromName,
      subject,
      html,
      text,
      cc,
      replyTo,
    } = body;

    if (!to || !from || !subject || (!html && !text)) {
      return Response.json({ error: "missing_fields" }, { status: 400 });
    }

    try {
      const result = await env.EMAIL.send({
        from: fromName ? { email: from, name: fromName } : from,
        to,
        cc: cc || undefined,
        replyTo: replyTo || undefined,
        subject,
        html: html || undefined,
        text: text || undefined,
      });
      return Response.json({ ok: true, result: result || null });
    } catch (e) {
      return Response.json(
        { ok: false, error: String(e && e.message ? e.message : e) },
        { status: 502 }
      );
    }
  },
};
