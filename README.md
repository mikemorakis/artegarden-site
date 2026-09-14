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
cd dist && zip -r ../artegarden.zip .
```
Cloudflare dashboard → Workers & Pages → artegarden → Create deployment →
ανέβασμα του zip → Save and deploy. Το `_headers` και το 404.html
περιλαμβάνονται στο build.

## Δομή

- `gen.py`: περιεχόμενο (EVENTS, τιμές, FAQ) στην κορυφή, templates από κάτω
- `assets/styles.css`: παλέτα σε CSS variables στο `:root`
- `assets/main.js`: drawer, lightbox, ημερολόγιο, φόρμα FormSubmit
- `assets/fonts/`: Ysabeau Infant variable (greek + latin), self-hosted
- `assets/img/`: WebP σε responsive μεγέθη (δες make_images.py στο template kit)

## Σημειώσεις

- Ενιαία τιμολόγηση 15€/άτομο: μπλοκ «ενιαία τιμολόγηση» μέσα στο gen.py
- Κολοφώνας: /syntelestes/ κατά το πρότυπο _symbols-colophon-template
- Emails φόρμας: base64 μέσα στο main.js, δεν εμφανίζονται πουθενά ως κείμενο
- PageSpeed 100/100/100/100 mobile: inline CSS, self-hosted fonts, preload hero
