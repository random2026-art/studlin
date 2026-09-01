// api/chat.js's validateMessageImages -- the shape/size guard on any
// image(s) attached to a chat request, run before the credit transaction
// or the Anthropic call. Exercised directly here (a pure function attached
// to the exported handler) rather than through the handler itself, which
// would need auth/Firestore/fetch mocking this repo has no existing
// pattern for -- see the export's own comment in api/chat.js.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { validateMessageImages } = require("../api/chat.js");

function img(overrides) {
  return { mediaType: "image/png", data: "a".repeat(100), ...overrides };
}

describe("validateMessageImages", () => {
  test("a text-only message (no image/images field) is valid", () => {
    assert.equal(validateMessageImages([{ r: "user", t: "hi" }]), null);
  });

  test("a single valid m.image is valid", () => {
    assert.equal(validateMessageImages([{ r: "user", t: "scan this", image: img() }]), null);
  });

  test("m.image missing data or mediaType is rejected", () => {
    assert.match(validateMessageImages([{ image: { mediaType: "image/png" } }]), /missing required fields/);
    assert.match(validateMessageImages([{ image: { data: "abc" } }]), /missing required fields/);
  });

  test("m.image with an unsupported media type is rejected", () => {
    assert.match(validateMessageImages([{ image: img({ mediaType: "image/bmp" }) }]), /Unsupported image type/);
  });

  test("m.image over the per-image size cap is rejected", () => {
    const oversized = img({ data: "a".repeat(3.5 * 1024 * 1024 + 1) });
    assert.match(validateMessageImages([{ image: oversized }]), /too large/);
  });

  test("m.image exactly at the per-image size cap is accepted", () => {
    const atCap = img({ data: "a".repeat(3.5 * 1024 * 1024) });
    assert.equal(validateMessageImages([{ image: atCap }]), null);
  });

  test("a multi-screenshot m.images array (2-3 images) is valid", () => {
    assert.equal(validateMessageImages([{ r: "user", t: "scan these", images: [img(), img(), img()] }]), null);
  });

  test("an empty m.images array is rejected", () => {
    assert.match(validateMessageImages([{ images: [] }]), /non-empty array/);
  });

  test("m.images that isn't an array is rejected", () => {
    assert.match(validateMessageImages([{ images: "not-an-array" }]), /non-empty array/);
  });

  test("more than 6 images in one message is rejected", () => {
    const seven = Array.from({ length: 7 }, () => img());
    assert.match(validateMessageImages([{ images: seven }]), /Too many screenshots/);
  });

  test("exactly 6 images is accepted", () => {
    const six = Array.from({ length: 6 }, () => img());
    assert.equal(validateMessageImages([{ images: six }]), null);
  });

  test("images each under the per-image cap but over the combined 4MB total are rejected", () => {
    // Two images at 3MB each -- both comfortably under the 3.5MB per-image
    // cap individually, but 6MB combined blows well past the 4MB total cap
    // (and Vercel's real 4.5MB request-body ceiling this is guarding).
    const big = img({ data: "a".repeat(3 * 1024 * 1024) });
    assert.match(validateMessageImages([{ images: [big, big] }]), /Combined size/);
  });

  test("a bad image anywhere in the m.images array is caught, not just the first", () => {
    const bad = img({ mediaType: "image/bmp" });
    assert.match(validateMessageImages([{ images: [img(), img(), bad] }]), /Unsupported image type/);
  });

  test("a second message's bad image is still caught when the first message is clean", () => {
    const messages = [
      { r: "user", t: "first, fine", image: img() },
      { r: "user", t: "second, bad", image: img({ mediaType: "image/bmp" }) },
    ];
    assert.match(validateMessageImages(messages), /Unsupported image type/);
  });
});
