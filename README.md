# artegarden.gr — source

Στατικός ιστότοπος του Arte Garden (χώρος εκδηλώσεων, Παλαιό Φάληρο).
Custom Python static site generator, deploy σε Cloudflare Pages (project: artegarden).

## Build

```
pip install pillow
python3 gen.py          # χτίζει το site στο dist/
```

## Deploy

```
py -3 gen.py
npx wrangler pages deploy dist --project-name=artegarden
```

## Admin προσφορές

- URL: https://artegarden.gr/admin/
- Οι δηλώσεις φόρμας μπαίνουν σε D1· από το admin στέλνεις προσφορά (τιμή/άτομο, χώρος, includes, ημερομηνία).
- Secrets: `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `NOTIFY_EMAIL`

## Δομή

- `gen.py`: περιεχόμενο (EVENTS, τιμές, FAQ) στην κορυφή, templates από κάτω
- `assets/styles.css`: παλέτα σε CSS variables στο `:root`
- `assets/main.js`: drawer, lightbox, ημερολόγιο, φόρμα → `/api/inquiries`
- `functions/`: Pages Functions (auth, inquiries, offers)
- `admin/`: UI προσφορών
- `assets/fonts/`: Ysabeau Infant variable (greek + latin), self-hosted
- `assets/img/`: WebP σε responsive μεγέθη
