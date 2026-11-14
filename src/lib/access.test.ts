import { describe, it, expect } from "vitest";
import { getAccess, canEdit, canShare } from "./access";

const doc = { owner_id: "u_alice" };

describe("getAccess", () => {
  it("owner gets owner", () => expect(getAccess("u_alice", doc)).toBe("owner"));
  it("editor share", () =>
    expect(getAccess("u_bob", doc, { role: "editor" })).toBe("editor"));
  it("viewer share", () =>
    expect(getAccess("u_bob", doc, { role: "viewer" })).toBe("viewer"));
  it("stranger gets null", () =>
    expect(getAccess("u_carol", doc, null)).toBeNull());
  it("owner wins over a stray share row", () =>
    expect(getAccess("u_alice", doc, { role: "viewer" })).toBe("owner"));
});

describe("capabilities", () => {
  it("only owner/editor can edit", () => {
    expect(canEdit("owner")).toBe(true);
    expect(canEdit("editor")).toBe(true);
    expect(canEdit("viewer")).toBe(false);
    expect(canEdit(null)).toBe(false);
  });
  it("only owner can share", () => {
    expect(canShare("owner")).toBe(true);
    expect(canShare("editor")).toBe(false);
  });
});
