import { describe, it, expect } from "vitest";
import { ROUTES, ROUTE_LABELS, BREADCRUMB_MAP } from "./routes";

describe("routes", () => {
  describe("ROUTES", () => {
    it("should have home route", () => {
      expect(ROUTES.HOME).toBe("/");
    });

    it("should have settings route", () => {
      expect(ROUTES.SETTINGS).toBe("/settings");
    });
  });

  describe("ROUTE_LABELS", () => {
    it("should have labels for main routes", () => {
      expect(ROUTE_LABELS[ROUTES.HOME]).toBe("Inicio");
      expect(ROUTE_LABELS[ROUTES.SETTINGS]).toBe("Configuración");
    });
  });

  describe("BREADCRUMB_MAP", () => {
    it("should have breadcrumb for home", () => {
      const breadcrumb = BREADCRUMB_MAP[ROUTES.HOME];
      expect(breadcrumb).toHaveLength(1);
      expect(breadcrumb[0].label).toBe("Inicio");
    });

    it("should have breadcrumb for settings", () => {
      const breadcrumb = BREADCRUMB_MAP[ROUTES.SETTINGS];
      expect(breadcrumb).toHaveLength(2);
      expect(breadcrumb[0].href).toBe("#/");
    });
  });
});
