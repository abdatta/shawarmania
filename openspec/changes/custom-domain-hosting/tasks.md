# Tasks

## 1. Build output
- [ ] 1.1 Default Vite `base` to `/`; keep `VITE_BASE` as the override
- [ ] 1.2 Set `VITE_BASE: /` in the deploy workflow
- [ ] 1.3 Add `public/CNAME` containing `shawarmania.in`

## 2. Absolute URLs
- [ ] 2.1 Canonical + `og:url` + JSON-LD `url` → `https://shawarmania.in/`
- [ ] 2.2 `og:image` / `twitter:image` → absolute (social scrapers reject relative)
- [ ] 2.3 `public/sitemap.xml` + `public/robots.txt` → apex domain
- [ ] 2.4 README live link

## 3. DNS (Hostinger)
- [ ] 3.1 Apex `A` → 185.199.108–111.153
- [ ] 3.2 Apex `AAAA` → 2606:50c0:8000–8003::153
- [ ] 3.3 `www` `CNAME` → `abdatta.github.io`
- [ ] 3.4 Remove any conflicting parking/placeholder records

## 4. GitHub Pages
- [ ] 4.1 Set custom domain `shawarmania.in`
- [ ] 4.2 Wait for DNS check to pass, then enable "Enforce HTTPS"

## 5. Verify
- [ ] 5.1 `npm run build` passes weight gate with base `/`
- [ ] 5.2 `https://shawarmania.in/` loads with assets, favicon, no console errors
- [ ] 5.3 `www.shawarmania.in` and the old github.io URL both redirect to the apex
