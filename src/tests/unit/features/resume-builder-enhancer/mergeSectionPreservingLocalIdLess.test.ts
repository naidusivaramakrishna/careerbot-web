import { describe, it, expect, vi } from "vitest";

vi.mock("@/api/resumeApi", () => ({}));
import { mergeSectionPreservingLocalIdLess as merge } from "@/app/(resume)/builder/creation/_context/ResumeContext";

const a = (title: string, id?: string) => ({ title, date: "", description: "", ...(id ? { id } : {}) });

describe("mergeSectionPreservingLocalIdLess — Achievements duplication", () => {
  it("does not append id-less local copies when the server items are id-less too", () => {
    const server = [a("Managed team"), a("VR project"), a("Social service")];
    const local = [a("Managed team"), a("VR project"), a("Social service")];
    expect(merge(server, local)).toEqual(server);
  });

  it("does not resurrect the stale original after a fix reworded an item", () => {
    const server = [a("Won April Code Challenge"), a("VR project")];
    const local = [a("Managed the team effort that won the April Code Challenge"), a("VR project")];
    expect(merge(server, local, true)).toEqual(server); // a fix/undo response
  });

  it("keeps an unsaved edit of an id-less entry on an ordinary sync", () => {
    // Same shapes as above, but not a fix response: the changed local entry is the
    // user's own edit, so keep it (a possible duplicate) rather than lose it.
    const server = [a("Won April Code Challenge")];
    const local = [a("Won April Code Challenge Finals")];
    expect(merge(server, local)).toEqual([...server, ...local]);
  });

  it("is stable across repeated syncs (no 3 -> 6 -> 9 growth)", () => {
    const server = [a("One"), a("Two"), a("Three")];
    let local = server;
    for (let i = 0; i < 4; i++) local = merge(server, local) as typeof server;
    expect(local).toHaveLength(3);
  });

  it("still keeps a genuinely new local entry when the server items have ids", () => {
    const server = [a("One", "1"), a("Two", "2")];
    const local = [a("One", "1"), a("Two", "2"), a("Brand new")];
    expect(merge(server, local)).toEqual([...server, a("Brand new")]);
  });

  it("drops a local id-less copy that the server already returned with an id", () => {
    const server = [a("One", "1")];
    expect(merge(server, [a("One")])).toEqual(server);
  });

  it("keeps a new unsaved entry whose title extends a saved entry's title", () => {
    const saved = a("Inventory Management System", "p1");
    const unsaved = a("Inventory Management System Mobile App");
    expect(merge([saved], [saved, unsaved], true)).toEqual([saved, unsaved]);
    expect(merge([saved], [saved, unsaved])).toEqual([saved, unsaved]);
  });

  it("keeps a new unsaved entry whose title is contained in a saved entry's title", () => {
    const saved = a("Inventory Management System Mobile App", "p1");
    const unsaved = a("Inventory Management System");
    expect(merge([saved], [saved, unsaved], true)).toEqual([saved, unsaved]);
  });

  it("keeps a new id-less entry that only extends an id-less entry the user still has", () => {
    // The server entry is not a rewording: the local list holds it unchanged.
    const server = [a("Won April Code Challenge")];
    const local = [a("Won April Code Challenge"), a("Won April Code Challenge Finals")];
    expect(merge(server, local, true)).toEqual([...server, a("Won April Code Challenge Finals")]);
  });
});
