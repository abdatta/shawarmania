# Custom domain hosting — shawarmania.in

## Why

The site currently lives at the project-page URL `https://abdatta.github.io/shawarmania/`. The
owner has registered **shawarmania.in** (DNS at Hostinger). A branded apex domain is what goes on
packaging, flyers, Instagram bio and franchise decks — the github.io path is not shareable as a
brand asset, and it also splits SEO signals.

## What Changes

- Serve the production build from the **apex root** (`/`) instead of `/shawarmania/`.
- Ship a `public/CNAME` file so the deployed artifact declares the custom domain, alongside the
  Pages custom-domain setting.
- Point every absolute URL (canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD `url`,
  `sitemap.xml`, `robots.txt`) at `https://shawarmania.in/`.
- Configure Hostinger DNS: apex `A` records to the four GitHub Pages IPs, `AAAA` records for the
  IPv6 equivalents, and `www` `CNAME` → `abdatta.github.io`.
- Set the custom domain in repo Settings → Pages and enforce HTTPS once the certificate issues.

## Impact

- Affected specs: `pages-deployment`
- Affected code: `vite.config.ts`, `.github/workflows/deploy.yml`, `index.html`,
  `public/CNAME` (new), `public/sitemap.xml`, `public/robots.txt`, `README.md`
- External config: Hostinger DNS zone for `shawarmania.in`, GitHub Pages settings
- The old `abdatta.github.io/shawarmania/` URL 301-redirects to the custom domain once set, so
  links already shared keep working.
