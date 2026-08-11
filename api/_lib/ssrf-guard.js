// Shared SSRF-hardening helpers -- used wherever the server fetches a URL
// whose domain came from the user rather than a fixed, trusted list.
// Originally written for Canvas's custom-domain token connect
// (api/_lib/canvas.js), then reused by cal-proxy.js's Blackboard
// custom-domain calendar-feed support so both stay in sync instead of
// drifting into two slightly different implementations.
const dns = require('dns').promises;

function ipv4ToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

// Blocks the address ranges an SSRF attempt would actually target: the
// three RFC1918 private blocks, loopback, carrier-grade NAT, and --
// critically -- 169.254.0.0/16, which is where every major cloud
// provider's instance-metadata endpoint lives (the classic SSRF
// jackpot). 224.0.0.0 and above catches multicast/reserved/broadcast,
// none of which a real web server ever answers from.
function isPrivateOrReservedIPv4(ip) {
  const n = ipv4ToInt(ip);
  if (n === null) return true; // malformed -- fail closed
  const inRange = (base, bits) => {
    const mask = (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (ipv4ToInt(base) & mask);
  };
  return inRange('10.0.0.0', 8) || inRange('172.16.0.0', 12) || inRange('192.168.0.0', 16) ||
    inRange('127.0.0.0', 8) || inRange('169.254.0.0', 16) || inRange('0.0.0.0', 8) ||
    inRange('100.64.0.0', 10) || inRange('192.0.0.0', 24) || inRange('198.18.0.0', 15) ||
    n >= ipv4ToInt('224.0.0.0');
}

function isPrivateOrReservedIPv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true; // loopback / unspecified
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // link-local fe80::/10
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // unique local fc00::/7
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateOrReservedIPv4(mapped[1]);
  return false;
}

function isPrivateOrReservedIp(ip) {
  return ip.includes(':') ? isPrivateOrReservedIPv6(ip) : isPrivateOrReservedIPv4(ip);
}

// Confirms a domain actually resolves to a real, public address before
// the server ever fetches it on the user's behalf -- otherwise a hostname
// could be pointed straight at an internal service (localhost, a private
// 10.x/192.168.x address, or a cloud metadata endpoint) and the server
// would fetch it as if it were the real thing. Callers should re-run this
// on every fetch, not just once at connect time, since DNS can change
// after the fact (rebinding).
async function verifyPublicDomain(hostname) {
  let addrs;
  try {
    addrs = await dns.lookup(hostname, { all: true });
  } catch (e) {
    return false;
  }
  return addrs.length > 0 && addrs.every(a => !isPrivateOrReservedIp(a.address));
}

module.exports = { isPrivateOrReservedIp, verifyPublicDomain };
