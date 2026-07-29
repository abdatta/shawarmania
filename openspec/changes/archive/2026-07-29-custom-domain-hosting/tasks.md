# Tasks

## 1. Build output
- [x] 1.1 Default Vite `base` to `/`; keep `VITE_BASE` as the override
- [x] 1.2 Set `VITE_BASE: /` in the deploy workflow
- [x] 1.3 Add `public/CNAME` containing `shawarmania.in`

## 2. Absolute URLs
- [x] 2.1 Canonical + `og:url` + JSON-LD `url` → `https://shawarmania.in/`
- [x] 2.2 `og:image` / `twitter:image` → absolute (social scrapers reject relative)
- [x] 2.3 `public/sitemap.xml` + `public/robots.txt` → apex domain
- [x] 2.4 README live link

## 3. DNS (Hostinger)
- [x] 3.1 Apex `A` → 185.199.108–111.153
- [x] 3.2 Apex `AAAA` → 2606:50c0:8000–8003::153
- [x] 3.3 `www` `CNAME` → `abdatta.github.io`
- [x] 3.4 Remove any conflicting parking/placeholder records
      (deleted `ALIAS @ → shawarmania.in.cdn.hstgr.net`; email records —
      MX ×2, SPF, DMARC, 3× DKIM, autoconfig, autodiscover — left untouched)

## 4. GitHub Pages
- [x] 4.1 Set custom domain `shawarmania.in`
- [x] 4.2 Wait for DNS check to pass, then enable "Enforce HTTPS"

## 5. Verify
- [x] 5.1 `npm run build` passes weight gate with base `/` (616 kB initial / 1.5 MB budget)
- [x] 5.2 `https://shawarmania.in/` loads with assets, favicon, no console errors
- [x] 5.3 `www.shawarmania.in` and the old github.io URL both redirect to the apex
