(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const loginView = $("#login-view");
  const appView = $("#app-view");
  let current = null;
  let filter = "";

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || res.statusText);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function showLogin() {
    loginView.classList.remove("hidden");
    appView.classList.add("hidden");
  }

  function showApp(user) {
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
    $("#who").textContent = user ? `· ${user}` : "";
  }

  function statusLabel(s) {
    return ({ new: "Νέα", offered: "Προσφορά", closed: "Κλειστή" })[s] || s;
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    if (iso.includes("T") || iso.includes(" ")) {
      const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString("el-GR", { dateStyle: "short", timeStyle: "short" });
      }
    }
    const [y, m, d] = iso.split("-");
    return y && m && d ? `${d}/${m}/${y}` : iso;
  }

  function calcTotal() {
    const f = $("#offer-form");
    const per = Number(f.price_per_person.value) || 0;
    const venue = Number(f.venue_fee.value) || 0;
    const guests = Number(f.guests.value) || 0;
    const total = per * guests + venue;
    $("#offer-total").textContent = guests ? `${total.toFixed(2)}€` : `${venue.toFixed(2)}€ (+ άτομα)`;
  }

  async function loadList() {
    const q = filter ? `?status=${encodeURIComponent(filter)}` : "";
    const { inquiries } = await api(`/api/inquiries${q}`);
    const list = $("#list");
    if (!inquiries.length) {
      list.innerHTML = '<p class="empty">Καμία δήλωση.</p>';
      return;
    }
    list.innerHTML = inquiries.map((i) => `
      <button type="button" class="item ${current && current.id === i.id ? "active" : ""}" data-id="${i.id}">
        <div class="t">${escapeHtml(i.name)}</div>
        <div class="s">${escapeHtml(i.event_type || "")} · ${fmtDate(i.event_date)} · ${i.guests || "?"} άτομα</div>
        <span class="badge ${i.status}">${statusLabel(i.status)}</span>
      </button>
    `).join("");
    $$(".item", list).forEach((btn) => {
      btn.addEventListener("click", () => openInquiry(Number(btn.dataset.id)));
    });
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function openInquiry(id) {
    const { inquiry, offers } = await api(`/api/inquiries/${id}`);
    current = inquiry;
    $("#empty").classList.add("hidden");
    $("#detail").classList.remove("hidden");
    $("#d-name").textContent = inquiry.name;
    $("#d-status").value = inquiry.status;
    $("#d-meta").innerHTML = `
      <dt>Τηλέφωνο</dt><dd><a href="tel:${escapeHtml(inquiry.phone)}">${escapeHtml(inquiry.phone)}</a></dd>
      <dt>Email</dt><dd>${inquiry.email ? `<a href="mailto:${escapeHtml(inquiry.email)}">${escapeHtml(inquiry.email)}</a>` : "—"}</dd>
      <dt>Είδος</dt><dd>${escapeHtml(inquiry.event_type)}</dd>
      <dt>Ημερομηνία</dt><dd>${fmtDate(inquiry.event_date)}</dd>
      <dt>Καλεσμένοι</dt><dd>${inquiry.guests ?? "—"}</dd>
      <dt>Καταχώρηση</dt><dd>${fmtDate(inquiry.created_at)}</dd>
    `;
    $("#d-message").textContent = inquiry.message || "";

    const f = $("#offer-form");
    f.event_date.value = inquiry.event_date || "";
    f.guests.value = inquiry.guests || "";
    f.price_per_person.value = f.price_per_person.value || "15";
    f.venue_fee.value = f.venue_fee.value || "0";
    if (!f.includes.value) {
      f.includes.value = "Απεριόριστα αναψυκτικά & χυμοί\nΤραπεζοκαθίσματα & βασικός εξοπλισμός\nΗχητική κάλυψη & μουσική\nΚαθαριότητα πριν & μετά";
    }
    $("#offer-err").textContent = "";
    $("#offer-ok").textContent = "";
    calcTotal();

    const past = $("#past-offers");
    if (!offers.length) {
      past.innerHTML = '<p class="muted">Δεν έχουν σταλεί προσφορές ακόμα.</p>';
    } else {
      past.innerHTML = offers.map((o) => `
        <div class="past">
          <div><strong>${fmtDate(o.event_date)}</strong> · ${o.price_per_person}€/άτομο + ${o.venue_fee}€ χώρος · σύνολο ${o.total}€</div>
          <div class="s">Στάλθηκε ${fmtDate(o.sent_at)} → ${escapeHtml(o.sent_to || "")}</div>
          <div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(o.includes)}</div>
        </div>
      `).join("");
    }
    await loadList();
  }

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    $("#login-err").textContent = "";
    try {
      const data = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({
          username: fd.get("username"),
          password: fd.get("password"),
        }),
      });
      showApp(data.user);
      await loadList();
    } catch {
      $("#login-err").textContent = "Λάθος στοιχεία σύνδεσης.";
    }
  });

  $("#logout-btn").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST", body: "{}" });
    current = null;
    showLogin();
  });

  $$(".chip").forEach((c) => {
    c.addEventListener("click", async () => {
      $$(".chip").forEach((x) => x.classList.remove("on"));
      c.classList.add("on");
      filter = c.dataset.filter || "";
      await loadList();
    });
  });

  $("#d-status").addEventListener("change", async (e) => {
    if (!current) return;
    await api(`/api/inquiries/${current.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: e.target.value }),
    });
    current.status = e.target.value;
    await loadList();
  });

  $("#offer-form").addEventListener("input", calcTotal);

  $("#offer-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!current) return;
    const err = $("#offer-err");
    const ok = $("#offer-ok");
    err.textContent = "";
    ok.textContent = "";
    if (!current.email) {
      err.textContent = "Η δήλωση δεν έχει email πελάτη — δεν γίνεται αποστολή.";
      return;
    }
    const f = e.target;
    const btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Αποστολή…";
    try {
      const data = await api(`/api/inquiries/${current.id}/offer`, {
        method: "POST",
        body: JSON.stringify({
          event_date: f.event_date.value,
          guests: f.guests.value ? Number(f.guests.value) : null,
          price_per_person: Number(f.price_per_person.value),
          venue_fee: Number(f.venue_fee.value),
          includes: f.includes.value,
          notes: f.notes.value,
        }),
      });
      ok.textContent = `Στάλθηκε στο ${data.sent_to} (σύνολο ${Number(data.total).toFixed(2)}€).`;
      await openInquiry(current.id);
    } catch (ex) {
      err.textContent = ex.data?.detail || ex.message || "Αποτυχία αποστολής.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Αποστολή προσφοράς";
    }
  });

  (async () => {
    try {
      const me = await api("/api/me");
      showApp(me.user);
      await loadList();
    } catch {
      showLogin();
    }
  })();
})();
