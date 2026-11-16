// Requests created on the server for a logged-in dashboard user (e.g. "rescan now").
// They reuse the public scan route handlers but skip the Turnstile check, because
// the user is already authenticated. Only server code can add a Request object to
// this WeakSet, so it cannot be forged from outside.
const trustedRequests = new WeakSet<Request>();

export function markTrustedInternalRequest<T extends Request>(request: T): T {
  trustedRequests.add(request);
  return request;
}

export function isTrustedInternalRequest(request: Request): boolean {
  return trustedRequests.has(request);
}
