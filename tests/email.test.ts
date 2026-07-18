import { describe, it, expect } from "vitest";
import { duePhrase, reminderSubject, reminderBody, type ReminderEmail } from "@/lib/email";

describe("duePhrase", () => {
  it("reads naturally at each boundary", () => {
    expect(duePhrase(0)).toBe("due today");
    expect(duePhrase(-1)).toBe("due today"); // clamps past-due to today
    expect(duePhrase(1)).toBe("due tomorrow");
    expect(duePhrase(3)).toBe("due in 3 days");
    expect(duePhrase(90)).toBe("due in 90 days");
  });
});

describe("reminderSubject", () => {
  it("includes the item and the due phrase", () => {
    expect(reminderSubject(1, "Recertification interview")).toBe(
      "Reminder: Recertification interview is due tomorrow",
    );
  });
});

describe("reminderBody", () => {
  const base: ReminderEmail = {
    to: "jane@example.com",
    name: "Jane",
    what: "Upload proof of income",
    dueAt: new Date("2026-08-01T00:00:00Z"),
    daysBefore: 3,
  };

  it("greets by name and states the deadline in text + html", () => {
    const { text, html } = reminderBody(base);
    expect(text).toContain("Hi Jane,");
    expect(text).toContain("Upload proof of income");
    expect(text).toContain("due in 3 days");
    expect(html).toContain("Upload proof of income");
    // Always includes the not-a-decision disclaimer.
    expect(text).toMatch(/Final eligibility decisions are made by your state SNAP agency/);
    expect(html).toMatch(/Final eligibility decisions are made by your state SNAP agency/);
  });

  it("falls back to a nameless greeting", () => {
    const { text } = reminderBody({ ...base, name: null });
    expect(text).toContain("Hi,");
    expect(text).not.toContain("Hi ,");
  });

  it("escapes HTML in the deadline description", () => {
    const { html } = reminderBody({ ...base, what: "Fix <script>alert(1)</script> & stuff" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp; stuff");
  });
});
