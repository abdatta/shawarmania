/* Base-path-safe URL for files in public/. Never hardcode leading-/ asset paths:
   the site deploys under /<repo-name>/ on GitHub Pages. */
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}
