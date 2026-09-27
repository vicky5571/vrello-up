import { describe, it } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { parseCoordinatesFromText, parseGoogleMapsUrl, isValidCoordinate, buildGoogleMapsUrl, calculateHaversineDistanceMeters, evaluateGeofenceStatus, GEOFENCE_TOLERANCE_METERS, INDONESIA_BOUNDS, isWithinIndonesiaBounds } from "./locationUtils.ts";


describe("locationUtils", () => {
  const semarangSimpangLima = { latitude: -6.9904, longitude: 110.4229 };
  const semarangTuguMuda = { latitude: -6.9840, longitude: 110.4093 };

  it("calculates distance between Simpang Lima and Tugu Muda (~1.6km)", () => {
    const dist = calculateHaversineDistanceMeters(semarangSimpangLima, semarangTuguMuda);
    assert.ok(dist >= 1600 && dist <= 1700, `Expected ~1650m, got ${dist}`);
  });

  it("calculates distance of identical points as 0m", () => {
    const dist = calculateHaversineDistanceMeters(semarangSimpangLima, semarangSimpangLima);
    assert.equal(dist, 0);
  });

  it("evaluates geofence status within 100m tolerance as valid", () => {
    // Offset by ~40 meters
    const salesNearby = { latitude: -6.9901, longitude: 110.4229 };
    const status = evaluateGeofenceStatus(semarangSimpangLima, salesNearby);
    assert.equal(status.isValid, true);
    assert.ok(status.deviationMeters !== null && status.deviationMeters < 100);
    assert.ok(status.message.includes("Valid: Berada di lokasi"));
  });

  it("evaluates geofence status outside 100m tolerance as invalid", () => {
    const status = evaluateGeofenceStatus(semarangSimpangLima, semarangTuguMuda);
    assert.equal(status.isValid, false);
    assert.ok(status.deviationMeters !== null && status.deviationMeters > 100);
    assert.ok(status.message.includes("Peringatan: Posisi sales berjarak"));
  });

  it("handles missing or unregistered outlet coordinates gracefully", () => {
    const sales = { latitude: -6.9901, longitude: 110.4229 };
    const statusNull = evaluateGeofenceStatus(null, sales);
    assert.equal(statusNull.isValid, true);
    assert.equal(statusNull.deviationMeters, null);
    assert.ok(statusNull.message.includes("belum terdaftar"));

    const statusEmpty = evaluateGeofenceStatus({ latitude: null, longitude: null }, sales);
    assert.equal(statusEmpty.isValid, true);
    assert.equal(statusEmpty.deviationMeters, null);
  });

  it("handles missing sales GPS coordinates as invalid", () => {
    const statusNull = evaluateGeofenceStatus(semarangSimpangLima, null);
    assert.equal(statusNull.isValid, false);
    assert.equal(statusNull.deviationMeters, null);
    assert.ok(statusNull.message.includes("belum terdeteksi"));

    const statusEmpty = evaluateGeofenceStatus(semarangSimpangLima, { latitude: undefined, longitude: undefined });
    assert.equal(statusEmpty.isValid, false);
    assert.equal(statusEmpty.deviationMeters, null);
  });

  it("respects custom tolerance threshold", () => {
    // Distance between Simpang Lima and salesNearby (~40m)
    const salesNearby = { latitude: -6.9901, longitude: 110.4229 };
    const strictStatus = evaluateGeofenceStatus(semarangSimpangLima, salesNearby, 20);
    assert.equal(strictStatus.isValid, false);

    const generousStatus = evaluateGeofenceStatus(semarangSimpangLima, salesNearby, 50);
    assert.equal(generousStatus.isValid, true);
  });

  it("exports default GEOFENCE_TOLERANCE_METERS as 100", () => {
    assert.equal(GEOFENCE_TOLERANCE_METERS, 100);
  });
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

  it("builds valid Google Maps link from object params with coordinates", () => {
    const link = buildGoogleMapsUrl({ latitude: -6.208763, longitude: 106.845599 });
    assert.equal(link, "https://www.google.com/maps/search/?api=1&query=-6.208763,106.845599");
  });

  it("builds valid Google Maps link from object params with address fallback", () => {
    const link = buildGoogleMapsUrl({ address: "Jl. Sudirman No. 1", city: "Jakarta" });
    assert.equal(
      link,
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Jl. Sudirman No. 1, Jakarta")}`
    );
  });

  describe("INDONESIA_BOUNDS & isWithinIndonesiaBounds", () => {
    it("defines correct geographic bounding box constants", () => {
      assert.deepEqual(INDONESIA_BOUNDS, {
        minLat: -11.0,
        maxLat: 6.0,
        minLng: 95.0,
        maxLng: 141.0,
      });
    });

    it("accepts coordinates inside Indonesia", () => {
      assert.equal(isWithinIndonesiaBounds(-6.2088, 106.8456), true, "Jakarta");
      assert.equal(isWithinIndonesiaBounds(5.8943, 95.3182), true, "Sabang");
      assert.equal(isWithinIndonesiaBounds(-8.4991, 140.4011), true, "Merauke");
      assert.equal(isWithinIndonesiaBounds(-10.7326, 123.1232), true, "Rote Island");
      assert.equal(isWithinIndonesiaBounds(0, 109.3333), true, "Pontianak");
    });

    it("rejects coordinates outside Indonesia", () => {
      assert.equal(isWithinIndonesiaBounds(0, 0), false, "Null Island");
      assert.equal(isWithinIndonesiaBounds(35.6762, 139.6503), false, "Tokyo");
      assert.equal(isWithinIndonesiaBounds(-33.8688, 151.2093), false, "Sydney");
      assert.equal(isWithinIndonesiaBounds(37.422, -122.084), false, "Mountain View");
      assert.equal(isWithinIndonesiaBounds(106.8456, -6.2088), false, "Inverted lat/lng");
    });

    it("rejects invalid, NaN, or non-finite values", () => {
      assert.equal(isWithinIndonesiaBounds(Number.NaN, 106.8456), false);
      assert.equal(isWithinIndonesiaBounds(-6.2088, Number.NaN), false);
      assert.equal(isWithinIndonesiaBounds(Number.POSITIVE_INFINITY, 106.8456), false);
      assert.equal(isWithinIndonesiaBounds(-6.2088, Number.NEGATIVE_INFINITY), false);
      // @ts-expect-error Testing invalid runtime types
      assert.equal(isWithinIndonesiaBounds("invalid", 106.8456), false);
      // @ts-expect-error Testing undefined
      assert.equal(isWithinIndonesiaBounds(undefined, undefined), false);
    });
  });
});
