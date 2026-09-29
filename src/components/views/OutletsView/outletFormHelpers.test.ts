import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  validateOutletForm,
  buildOutletPayload,
  handleSaveOutletApi,
  getCurrentGpsLocation,
} from "./outletFormHelpers";
import type { OutletItem as MarcomOutlet } from "@/types";

describe("Outlet Form Helpers", () => {
  const sampleOutlet: Partial<MarcomOutlet> = {
    code: "OUT-001",
    name: "Toko Berkah Mandiri",
    type: "TRADITIONAL",
    tier: "TIER_1",
    branchId: "branch-smg",
    city: "Semarang",
    address: "Jl. Pemuda No. 10",
    picName: "Budi Santoso",
    picPhone: "081234567890",
    latitude: -6.9932,
    longitude: 110.4203,
  };

  describe("validateOutletForm", () => {
    it("validates a complete valid outlet with isValid: true", () => {
      const result = validateOutletForm(sampleOutlet);
      assert.equal(result.isValid, true);
      assert.equal(result.error, undefined);
      assert.deepEqual(result.errors, {});
    });

    it("requires outlet code", () => {
      const result = validateOutletForm({ ...sampleOutlet, code: "   " });
      assert.equal(result.isValid, false);
      assert.equal(result.errors.code, "Outlet code is required");
      assert.equal(result.error, "Code, name, type, tier, and branch are required");
    });

    it("requires outlet name", () => {
      const result = validateOutletForm({ ...sampleOutlet, name: "" });
      assert.equal(result.isValid, false);
      assert.equal(result.errors.name, "Outlet name is required");
      assert.equal(result.error, "Code, name, type, tier, and branch are required");
    });

    it("requires outlet type", () => {
      const result = validateOutletForm({ ...sampleOutlet, type: undefined });
      assert.equal(result.isValid, false);
      assert.equal(result.errors.type, "Outlet type is required");
      assert.equal(result.error, "Code, name, type, tier, and branch are required");
    });

    it("requires outlet tier", () => {
      const result = validateOutletForm({ ...sampleOutlet, tier: undefined });
      assert.equal(result.isValid, false);
      assert.equal(result.errors.tier, "Outlet tier is required");
      assert.equal(result.error, "Code, name, type, tier, and branch are required");
    });

    it("requires branch selection", () => {
      const result = validateOutletForm({ ...sampleOutlet, branchId: "" });
      assert.equal(result.isValid, false);
      assert.equal(result.errors.branchId, "Parent branch is required");
      assert.equal(result.error, "Code, name, type, tier, and branch are required");
    });

    it("returns errors for all required fields when submitting an empty form", () => {
      const result = validateOutletForm({});
      assert.equal(result.isValid, false);
      assert.equal(result.errors.code, "Outlet code is required");
      assert.equal(result.errors.name, "Outlet name is required");
      assert.equal(result.errors.type, "Outlet type is required");
      assert.equal(result.errors.tier, "Outlet tier is required");
      assert.equal(result.errors.branchId, "Parent branch is required");
      assert.equal(Object.keys(result.errors).length, 5);
      assert.equal(result.error, "Code, name, type, tier, and branch are required");
    });
  });

  describe("buildOutletPayload", () => {
    it("trims strings and builds correct payload", () => {
      const payload = buildOutletPayload({
        ...sampleOutlet,
        code: "  OUT-001  ",
        name: "  Toko Berkah Mandiri  ",
        city: "  Semarang  ",
        address: "  Jl. Pemuda No. 10  ",
        picName: "  Budi  ",
        picPhone: "  08123  ",
      });

      assert.equal(payload.code, "OUT-001");
      assert.equal(payload.name, "Toko Berkah Mandiri");
      assert.equal(payload.city, "Semarang");
      assert.equal(payload.address, "Jl. Pemuda No. 10");
      assert.equal(payload.picName, "Budi");
      assert.equal(payload.picPhone, "08123");
      assert.equal(payload.latitude, -6.9932);
      assert.equal(payload.longitude, 110.4203);
    });

    it("omits latitude and longitude when null, undefined, NaN, or empty string", () => {
      const payload = buildOutletPayload({
        ...sampleOutlet,
        latitude: null,
        longitude: undefined,
      });

      assert.equal("latitude" in payload, false);
      assert.equal("longitude" in payload, false);

      const payloadEmptyStr = buildOutletPayload({
        ...sampleOutlet,
        latitude: "" as unknown as number,
        longitude: NaN,
      });

      assert.equal("latitude" in payloadEmptyStr, false);
      assert.equal("longitude" in payloadEmptyStr, false);
    });
  });

  describe("handleSaveOutletApi", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("throws error if validation fails before sending fetch request", async () => {
      await assert.rejects(
        () => handleSaveOutletApi({ ...sampleOutlet, code: "" }),
        /Code, name, type, tier, and branch are required/
      );
    });

    it("sends POST to /api/marcom/outlets when creating new outlet", async () => {
      let calledUrl = "";
      let calledMethod = "";
      let calledBody = "";

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        calledUrl = String(url);
        calledMethod = init?.method || "GET";
        calledBody = String(init?.body || "");
        return new Response(JSON.stringify({ id: "out-new", ...sampleOutlet }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const result = await handleSaveOutletApi(sampleOutlet);
      assert.equal(result.success, true);
      assert.equal(calledUrl, "/api/marcom/outlets");
      assert.equal(calledMethod, "POST");
      const parsedBody = JSON.parse(calledBody);
      assert.equal(parsedBody.code, "OUT-001");
      assert.equal(parsedBody.name, "Toko Berkah Mandiri");
    });

    it("sends PATCH to /api/marcom/outlets/:id when editing existing outlet", async () => {
      let calledUrl = "";
      let calledMethod = "";

      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        calledUrl = String(url);
        calledMethod = init?.method || "GET";
        return new Response(JSON.stringify({ id: "out-existing" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const result = await handleSaveOutletApi({ ...sampleOutlet, id: "out-existing" });
      assert.equal(result.success, true);
      assert.equal(calledUrl, "/api/marcom/outlets/out-existing");
      assert.equal(calledMethod, "PATCH");
    });

    it("throws server error message if response is not ok", async () => {
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ error: "Outlet code already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      await assert.rejects(
        () => handleSaveOutletApi(sampleOutlet),
        /Outlet code already exists/
      );
    });
  });

  describe("getCurrentGpsLocation", () => {
    it("rejects when geolocation is not supported or window is undefined", async () => {
      await assert.rejects(
        () => getCurrentGpsLocation(),
        /Geolocation tidak didukung/
      );
    });

    it("resolves coords when geolocation getCurrentPosition succeeds", async () => {
      Object.defineProperty(globalThis, "window", { value: {}, configurable: true, writable: true });
      const originalGeolocationDesc = Object.getOwnPropertyDescriptor(navigator, "geolocation");

      Object.defineProperty(navigator, "geolocation", {
        value: {
          getCurrentPosition: (success: (pos: GeolocationPosition) => void) => {
            success({
              coords: {
                latitude: -6.99321456,
                longitude: 110.42031456,
              },
            } as unknown as GeolocationPosition);
          },
        },
        configurable: true,
      });

      try {
        const coords = await getCurrentGpsLocation();
        assert.equal(coords.latitude, -6.993215);
        assert.equal(coords.longitude, 110.420315);
      } finally {
        if (originalGeolocationDesc) {
          Object.defineProperty(navigator, "geolocation", originalGeolocationDesc);
        } else {
          // @ts-expect-error cleanup mock
          delete navigator.geolocation;
        }
        // @ts-expect-error cleanup mock
        delete globalThis.window;
      }
    });

    it("rejects when geolocation getCurrentPosition fails", async () => {
      Object.defineProperty(globalThis, "window", { value: {}, configurable: true, writable: true });
      const originalGeolocationDesc = Object.getOwnPropertyDescriptor(navigator, "geolocation");

      Object.defineProperty(navigator, "geolocation", {
        value: {
          getCurrentPosition: (
            _success: unknown,
            error: (err: GeolocationPositionError) => void
          ) => {
            error({
              code: 1,
              message: "User denied Geolocation",
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            });
          },
        },
        configurable: true,
      });

      try {
        await assert.rejects(
          () => getCurrentGpsLocation(),
          /Gagal mendeteksi lokasi GPS: User denied Geolocation/
        );
      } finally {
        if (originalGeolocationDesc) {
          Object.defineProperty(navigator, "geolocation", originalGeolocationDesc);
        } else {
          // @ts-expect-error cleanup mock
          delete navigator.geolocation;
        }
        // @ts-expect-error cleanup mock
        delete globalThis.window;
      }
    });
  });
});
