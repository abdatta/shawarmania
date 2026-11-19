/** Vite's `?raw` import: a file's text, exactly as it is on disk. */
declare module '*.html?raw' {
  const text: string
  export default text
}
