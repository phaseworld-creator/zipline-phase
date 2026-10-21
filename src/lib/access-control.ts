/**
 * Check if the request IP is allowed based on the allowedIps list.
 * Supports CIDR notation and exact IP matching.
 */
export function checkAllowedIps(ip: string, allowedIps: string[]): boolean {
  if (!allowedIps.length) return true; // no restriction

  for (const allowed of allowedIps) {
    if (allowed.includes('/')) {
      // CIDR notation
      if (ipInCidr(ip, allowed)) return true;
    } else if (allowed === ip) {
      // Exact match
      return true;
    }
  }
  return false;
}

/**
 * Check if the referer is blocked.
 * Supports wildcard patterns and exact matching.
 */
export function checkBlockedReferers(referer: string | undefined, blockedReferers: string[]): boolean {
  if (!referer) return true; // no referer = allow (or could be restrictive)
  if (!blockedReferers.length) return false; // no restrictions

  for (const blocked of blockedReferers) {
    if (blocked.includes('*')) {
      // Wildcard pattern
      const regex = new RegExp('^' + blocked.replace(/\*/g, '.*') + '$');
      if (regex.test(referer)) return true;
    } else if (referer.startsWith(blocked)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the file has exceeded max downloads.
 */
export function checkMaxDownloads(downloadCount: number, maxDownloads: number | null | undefined): boolean {
  if (!maxDownloads) return true;
  return downloadCount < maxDownloads;
}

/**
 * Check if an IP address is in a CIDR range.
 */
function ipInCidr(ip: string, cidr: string): boolean {
  const [rangeIp, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);

  if (isNaN(bits) || bits < 0 || bits > 128) return false;

  const ipParts = ip.split('.');
  const rangeParts = rangeIp.split('.');

  if (ipParts.length !== 4 || rangeParts.length !== 4) return false;

  const ipNum =
    (parseInt(ipParts[0]) << 24) |
    (parseInt(ipParts[1]) << 16) |
    (parseInt(ipParts[2]) << 8) |
    parseInt(ipParts[3]);

  const rangeNum =
    (parseInt(rangeParts[0]) << 24) |
    (parseInt(rangeParts[1]) << 16) |
    (parseInt(rangeParts[2]) << 8) |
    parseInt(rangeParts[3]);

  const mask = bits === 0 ? 0 : ~((1 << (32 - bits)) - 1);

  return (ipNum & mask) === (rangeNum & mask);
}
