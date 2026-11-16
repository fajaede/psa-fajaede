/**
 * Canonical form of a site URL for projects and scan history, so that
 * "HTTPS://Example.com/" and "https://example.com" are the same site.
 * Lowercases scheme and host, defaults to https, drops trailing slashes,
 * the fragment and default ports. Keeps "www", the path and the query.
 * Returns null for anything that is not an http(s) URL.
 */
export function normalizeSiteUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname || url.username || url.password) return null;

  url.hash = "";
  const path = url.pathname.replace(/\/+$/, "");
  const port = url.port ? `:${url.port}` : "";
  return `${url.protocol}//${url.hostname.toLowerCase()}${port}${path}${url.search}`;
}
