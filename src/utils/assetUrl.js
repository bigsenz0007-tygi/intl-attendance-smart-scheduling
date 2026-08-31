export function assetUrl(path) {
  const clean = String(path || '').replace(/^\/+/, '')
  const relative = clean.startsWith('assets/') ? clean : `assets/${clean}`
  return `${process.env.BASE_URL}${relative}`
}
