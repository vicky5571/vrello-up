import { describe, it } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import {
  parseCoordinatesFromText,
  parseGoogleMapsUrl,
  isValidCoordinate,
  buildGoogleMapsUrl,
} from "./locationUtils.ts";

describe("locationUtils", () => {
  it("parses raw comma-separated coordinates", () => {
    const res = parseCoordinatesFromText("-6.208763, 106.845599");
    assert.deepEqual(res, { latitude: -6.208763, longitude: 106.845599 });
  });

  it("parses raw coordinates with space or no space", () => {
    const res = parseCoordinatesFromText("-6.2088,106.8456");
    assert.deepEqual(res, { latitude: -6.2088, longitude: 106.8456 });
  });

  it("parses Google Maps URL with /@lat,lng format", () => {
    const url = "https://www.google.com/maps/@-6.2087634,106.845599,17z?entry=ttu";
    const res = parseGoogleMapsUrl(url);
    assert.ok(res);
    assert.equal(res.latitude, -6.2087634);
    assert.equal(res.longitude, 106.845599);
  });

  it("parses Google Maps URL with ?q=lat,lng query parameter", () => {
    const url = "https://maps.google.com/?q=-6.1753924,106.8271528";
    const res = parseGoogleMapsUrl(url);
    assert.ok(res);
    assert.equal(res.latitude, -6.1753924);
    assert.equal(res.longitude, 106.8271528);
  });

  it("parses Google Maps URL with ?ll=lat,lng query parameter", () => {
    const url = "https://maps.google.com/?ll=-7.2574719,112.7520883";
    const res = parseGoogleMapsUrl(url);
    assert.ok(res);
    assert.equal(res.latitude, -7.2574719);
    assert.equal(res.longitude, 112.7520883);
  });

  it("validates coordinate boundaries correctly", () => {
    assert.equal(isValidCoordinate(-6.2, 106.8), true);
    assert.equal(isValidCoordinate(91, 106.8), false);
    assert.equal(isValidCoordinate(-91, 106.8), false);
    assert.equal(isValidCoordinate(0, 181), false);
    assert.equal(isValidCoordinate(0, -181), false);
    assert.equal(isValidCoordinate(Number.NaN, 106.8), false);
  });

  it("builds valid Google Maps navigation directions link", () => {
    const link = buildGoogleMapsUrl(-6.208763, 106.845599);
    assert.equal(
      link,
      "https://www.google.com/maps/search/?api=1&query=-6.208763,106.845599",
    );
  });
});
