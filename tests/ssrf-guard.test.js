// Regression tests for the shared SSRF-hardening helper (api/_lib/ssrf-guard.js),
// used by both Canvas's custom-domain token connect (api/_lib/canvas.js)
// and cal-proxy.js's Blackboard custom-domain calendar-feed support.
// verifyPublicDomain itself (the DNS-lookup wrapper) is deliberately NOT
// exercised here -- a real lookup would make this suite flaky/slow/
// network-dependent. isPrivateOrReservedIp is the pure, fully-testable
// core of what it decides. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { isPrivateOrReservedIp } = require("../api/_lib/ssrf-guard.js");

describe("isPrivateOrReservedIp (SSRF hardening -- what a user-supplied domain must NOT resolve to)", () => {
  test("blocks all three RFC1918 private ranges", () => {
    assert.equal(isPrivateOrReservedIp("10.0.0.1"), true);
    assert.equal(isPrivateOrReservedIp("172.16.0.1"), true);
    assert.equal(isPrivateOrReservedIp("172.31.255.255"), true);
    assert.equal(isPrivateOrReservedIp("192.168.1.1"), true);
  });
  test("blocks loopback", () => {
    assert.equal(isPrivateOrReservedIp("127.0.0.1"), true);
  });
  test("blocks link-local, including the cloud metadata endpoint every major provider uses", () => {
    assert.equal(isPrivateOrReservedIp("169.254.169.254"), true);
  });
  test("blocks carrier-grade NAT (100.64.0.0/10)", () => {
    assert.equal(isPrivateOrReservedIp("100.64.0.1"), true);
  });
  test("blocks multicast/reserved/broadcast (224.0.0.0 and above)", () => {
    assert.equal(isPrivateOrReservedIp("224.0.0.1"), true);
    assert.equal(isPrivateOrReservedIp("255.255.255.255"), true);
  });
  test("allows real public IPv4 addresses", () => {
    assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
    assert.equal(isPrivateOrReservedIp("1.1.1.1"), false);
  });
  test("blocks IPv6 loopback, link-local, and unique-local", () => {
    assert.equal(isPrivateOrReservedIp("::1"), true);
    assert.equal(isPrivateOrReservedIp("fe80::1"), true);
    assert.equal(isPrivateOrReservedIp("fd00::1"), true);
  });
  test("allows a real public IPv6 address", () => {
    assert.equal(isPrivateOrReservedIp("2606:4700:4700::1111"), false);
  });
  test("blocks an IPv4-mapped IPv6 address pointing at a private range", () => {
    assert.equal(isPrivateOrReservedIp("::ffff:127.0.0.1"), true);
  });
  test("malformed input fails closed (treated as blocked, not allowed)", () => {
    assert.equal(isPrivateOrReservedIp("not-an-ip"), true);
  });
});
