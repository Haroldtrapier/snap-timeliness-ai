import { describe, it, expect } from "vitest";
import { en } from "@/lib/i18n/messages/en";
import { es } from "@/lib/i18n/messages/es";

// Recursively collect dotted key paths from a nested message object.
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      keyPaths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

// Collect [path, value] pairs for leaf strings.
function leaves(obj: unknown, prefix = ""): [string, unknown][] {
  if (obj && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      leaves(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [[prefix, obj]];
}

describe("i18n message parity", () => {
  it("Spanish has exactly the same keys as English", () => {
    const enKeys = keyPaths(en).sort();
    const esKeys = keyPaths(es).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it("no catalog has empty or non-string leaf values", () => {
    for (const [label, dict] of [
      ["en", en],
      ["es", es],
    ] as const) {
      for (const [path, value] of leaves(dict)) {
        expect(typeof value, `${label}.${path} should be a string`).toBe("string");
        expect((value as string).trim().length, `${label}.${path} should be non-empty`).toBeGreaterThan(0);
      }
    }
  });
});
