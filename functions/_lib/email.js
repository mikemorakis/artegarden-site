function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDateGr(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function buildOfferEmail({ inquiry, offer }) {
  const guests = offer.guests || inquiry.guests || 0;
  const per = Number(offer.price_per_person) || 0;
  const venue = Number(offer.venue_fee) || 0;
  const peopleTotal = per * guests;
  const total = offer.total != null ? Number(offer.total) : peopleTotal + venue;
  const includesHtml = esc(offer.includes).replace(/\n/g, "<br>");

  const subject = `Προσφορά Arte Garden — ${formatDateGr(offer.event_date)}`;

  const html = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;color:#1e3a2b;line-height:1.55;max-width:640px;margin:0 auto;padding:24px">
  <h1 style="color:#4a1220;font-size:1.5rem;margin:0 0 8px">Arte Garden</h1>
  <p style="color:#5a6b5e;margin:0 0 24px">Προσφορά για την εκδήλωσή σας</p>
  <p>Αγαπητή/έ ${esc(inquiry.name)},</p>
  <p>Σας ευχαριστούμε για το ενδιαφέρον σας. Ακολουθεί η ενδεικτική προσφορά μας:</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <tr><td style="padding:8px 0;border-bottom:1px solid #e6ebe3">Ημερομηνία</td><td style="padding:8px 0;border-bottom:1px solid #e6ebe3;text-align:right;font-weight:700">${esc(formatDateGr(offer.event_date))}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e6ebe3">Είδος</td><td style="padding:8px 0;border-bottom:1px solid #e6ebe3;text-align:right">${esc(inquiry.event_type || "—")}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e6ebe3">Καλεσμένοι</td><td style="padding:8px 0;border-bottom:1px solid #e6ebe3;text-align:right">${guests || "—"}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e6ebe3">Τιμή ανά άτομο</td><td style="padding:8px 0;border-bottom:1px solid #e6ebe3;text-align:right">${per.toFixed(2)}€</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e6ebe3">Χρέωση χώρου</td><td style="padding:8px 0;border-bottom:1px solid #e6ebe3;text-align:right">${venue.toFixed(2)}€</td></tr>
    <tr><td style="padding:12px 0;font-size:1.1rem">Σύνολο (ενδεικτικά)</td><td style="padding:12px 0;text-align:right;font-size:1.2rem;font-weight:800;color:#4a1220">${total.toFixed(2)}€</td></tr>
  </table>
  <h2 style="font-size:1.05rem;color:#4a1220">Τι περιλαμβάνει</h2>
  <p>${includesHtml}</p>
  ${offer.notes ? `<p style="color:#5a6b5e"><em>${esc(offer.notes)}</em></p>` : ""}
  <p style="margin-top:28px">Οι τιμές είναι ενδεικτικές και οριστικοποιούνται με γραπτή επιβεβαίωση. Για κράτηση απαιτείται προκαταβολή 40%.</p>
  <p>Με εκτίμηση,<br><strong>Arte Garden</strong><br>Ναυσικάς 62, Παλαιό Φάληρο<br>211 409 9700<br>artegardenathens@gmail.com</p>
</body></html>`;

  const text = [
    `Arte Garden — Προσφορά`,
    ``,
    `Αγαπητή/έ ${inquiry.name},`,
    ``,
    `Ημερομηνία: ${formatDateGr(offer.event_date)}`,
    `Είδος: ${inquiry.event_type || "—"}`,
    `Καλεσμένοι: ${guests || "—"}`,
    `Τιμή ανά άτομο: ${per.toFixed(2)}€`,
    `Χρέωση χώρου: ${venue.toFixed(2)}€`,
    `Σύνολο (ενδεικτικά): ${total.toFixed(2)}€`,
    ``,
    `Τι περιλαμβάνει:`,
    offer.includes,
    offer.notes ? `\nΣημειώσεις: ${offer.notes}` : "",
    ``,
    `Οι τιμές είναι ενδεικτικές. Προκαταβολή 40% για κράτηση.`,
    ``,
    `Arte Garden · Ναυσικάς 62, Παλαιό Φάληρο`,
    `211 409 9700 · artegardenathens@gmail.com`,
  ].filter((x) => x !== undefined).join("\n");

  return { subject, html, text, total };
}

/**
 * Send offer to customer.
 * 1) Resend if RESEND_API_KEY is set (HTML email)
 * 2) Else FormSubmit to venue inbox + _autoresponse to customer email field
 */
export async function sendOfferEmail(env, { to, subject, html, text, inquiry, offer }) {
  if (env.RESEND_API_KEY) {
    const from = env.MAIL_FROM || "Arte Garden <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        cc: env.MAIL_CC ? [env.MAIL_CC] : ["artegardenathens@gmail.com"],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || `resend_${res.status}` };
    }
    return { ok: true, via: "resend" };
  }

  // FormSubmit: venue gets the record; customer gets _autoresponse
  const venue = env.NOTIFY_EMAIL || "artegardenathens@gmail.com";
  const guests = offer.guests || inquiry.guests || 0;
  const res = await fetch(`https://formsubmit.co/ajax/${venue}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: subject,
      _template: "table",
      _captcha: "false",
      _autoresponse: text,
      name: inquiry.name,
      email: to,
      phone: inquiry.phone || "",
      event_type: inquiry.event_type || "",
      event_date: offer.event_date,
      guests,
      price_per_person: offer.price_per_person,
      venue_fee: offer.venue_fee,
      includes: offer.includes,
      notes: offer.notes || "",
      total: offer.total,
      message: text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || `formsubmit_${res.status}` };
  }
  return { ok: true, via: "formsubmit" };
}

export async function notifyNewInquiry(env, row) {
  const targets = [
    env.NOTIFY_EMAIL || "artegardenathens@gmail.com",
    "michalismorakis@gmail.com",
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const payload = {
    _subject: `Νέα δήλωση — Arte Garden${row.event_type ? ` (${row.event_type})` : ""}`,
    _template: "table",
    _captcha: "false",
    name: row.name,
    phone: row.phone,
    email: row.email || "",
    type: row.event_type,
    date: row.event_date || "",
    guests: row.guests || "",
    message: row.message || "",
    admin: "https://artegarden.gr/admin/",
  };

  await Promise.all(
    targets.map(async (venue) => {
      try {
        await fetch(`https://formsubmit.co/ajax/${venue}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        /* non-fatal */
      }
    })
  );
}
