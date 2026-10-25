import React from "react";
import { act, render, cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import MatchPenalties, { getFixImpactCounts, hasAutomaticFixes, type ApplyAllHandle } from "@/app/(jobs)/jobmatch/_components/analysis/MatchPenalties";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
afterEach(cleanup);

const penalty = (id: string, category = "technical_skills", fixType = "auto") => ({
  suggestion_id: id, category, fix_type: fixType, severity: "critical",
  target: id, penalty: -2, message: `Add ${id}`,
});

describe("Analysis apply-all control", () => {
  it("disables automatic fixes when only manual or already-applied items remain", () => {
    const result = { Match_Penalties: { penalties: [penalty("React"), penalty("manual", "experience", "manual")] } };
    expect(hasAutomaticFixes(result, [])).toBe(true);
    expect(hasAutomaticFixes(result, ["React"])).toBe(false);
  });
  it("counts fixes using the visible category impact and excludes bulk parents", () => {
    expect(getFixImpactCounts({
      Match_Penalties: { penalties: [penalty("React"), { ...penalty("SQL"), severity: "nice_to_have" }, { ...penalty("bulk"), is_bulk_parent: true }] },
      Formatting_Check: { missing_fields: ["technical_skills"] },
    })).toEqual({ all: 3, high: 2, medium: 0, low: 1 });
  });
  it("uses existing handlers, skips applied and manual fixes, and does not reapply on a second run", async () => {
    const ref = React.createRef<ApplyAllHandle>();
    const onAddSkill = vi.fn().mockResolvedValue(true);
    const onApplyFix = vi.fn().mockResolvedValue(true);
    render(<MatchPenalties applyAllRef={ref} onAddSkill={onAddSkill} onApplyFix={onApplyFix}
      appliedSuggestionIds={["existing"]} matchResult={{ Match_Penalties: { penalties: [
        penalty("existing"), penalty("React"), penalty("manual", "experience", "manual"), penalty("summary", "summary"),
      ] } }} />);
    await act(async () => { expect(await ref.current!.applyAll()).toBe(true); });
    expect(onAddSkill).toHaveBeenCalledTimes(1);
    expect(onAddSkill).toHaveBeenCalledWith("React", "React");
    expect(onApplyFix).toHaveBeenCalledWith("summary", "summary");
    expect(onApplyFix).toHaveBeenCalledTimes(1);
    await act(async () => { await ref.current!.applyAll(); });
    expect(onAddSkill).toHaveBeenCalledTimes(1);
    expect(onApplyFix).toHaveBeenCalledTimes(1);
  });

  it("stops when persistence fails, before applying later categories", async () => {
    const ref = React.createRef<ApplyAllHandle>();
    const onAddSkill = vi.fn().mockResolvedValue(false);
    const onApplyFix = vi.fn().mockResolvedValue(true);
    render(<MatchPenalties applyAllRef={ref} onAddSkill={onAddSkill} onApplyFix={onApplyFix}
      matchResult={{ Match_Penalties: { penalties: [penalty("React"), penalty("summary", "summary")] } }} />);
    await act(async () => { expect(await ref.current!.applyAll()).toBe(false); });
    expect(onApplyFix).not.toHaveBeenCalled();
  });
});


describe("Recommendations table", () => {
  it("places automatic fixes before manual edits across categories", () => {
    render(<MatchPenalties recommendations onAddSkill={vi.fn()} onApplyFix={vi.fn()} onOpenSection={vi.fn()} matchResult={{Match_Penalties: {penalties: [
      penalty("manual", "education", "manual"), penalty("summary", "summary"), penalty("React"),
    ]}}}/>);
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("button", {name: "Apply Fix"})).toBeTruthy();
    expect(within(rows[1]).getByRole("button", {name: "Apply Fix"})).toBeTruthy();
    expect(within(rows[2]).getByRole("button", {name: "Edit Education"})).toBeTruthy();
    rows.forEach((row, index) => expect(within(row).getAllByRole("cell")[0]).toHaveTextContent(String(index + 1)));
  });
  it("filters individual priorities, excludes bulk parents, and retains applied state", async () => {
    const onAddSkill = vi.fn().mockResolvedValue(true);
    render(<MatchPenalties recommendations onAddSkill={onAddSkill} matchResult={{Match_Penalties: {penalties: [
      penalty("React"), {...penalty("SQL"), severity: "nice_to_have"}, {...penalty("bulk"), is_bulk_parent: true},
    ]}}}/>);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    const reactRow = screen.getByText('Add "React" to your skills section.').closest("tr")!;
    await act(async () => { fireEvent.click(within(reactRow).getByRole("button", {name: "Apply Fix"})); });
    expect(onAddSkill).toHaveBeenCalledWith("React", "React");
    expect(within(reactRow).getByRole("button", {name: "Added"})).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox", {name: "Filter recommendations"}), {target: {value: "low"}});
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.queryByText('Add "React" to your skills section.')).toBeNull();
    expect(screen.getByText('Add "SQL" to your skills section.')).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox"), {target: {value: "all"}});
    expect(screen.getByRole("button", {name: "Added"})).toBeDisabled();
    expect(onAddSkill).toHaveBeenCalledOnce();
  });
  it("opens the section editor for manual recommendations and handles no recommendations", () => {
    const onOpenSection = vi.fn();
    const {rerender} = render(<MatchPenalties recommendations onAddSkill={vi.fn()} onOpenSection={onOpenSection} matchResult={{Match_Penalties: {penalties: [penalty("education", "education", "manual")]}}}/>);
    fireEvent.click(screen.getByRole("button", {name: "Edit Education"}));
    expect(onOpenSection).toHaveBeenCalledWith("education");
    rerender(<MatchPenalties recommendations onAddSkill={vi.fn()} matchResult={{}}/>);
    expect(screen.getByText("No recommendations were returned for this analysis.")).toBeTruthy();
  });
});

describe("Apply all fixes button", () => {
  const props = (over: Record<string, unknown> = {}) => ({
    recommendations: true,
    onAddSkill: vi.fn().mockResolvedValue(true),
    onApplyFix: vi.fn().mockResolvedValue(true),
    onOpenSection: vi.fn(),
    matchResult: { Match_Penalties: { penalties: [
      penalty("React"), penalty("Docker"), penalty("summary", "summary"),
      penalty("manual", "education", "manual"),
      { ...penalty("all"), suggestion_id: "apply_all_fixes", is_bulk_parent: true, is_master: true },
    ] } },
    ...over,
  });

  it("counts only the automatic fixes: not the manual one, not the apply-all rows", () => {
    render(<MatchPenalties {...props()} />);
    expect(screen.getByRole("button", { name: "Apply all fixes (3)" })).toBeTruthy();
  });

  it("applies every automatic fix with the existing handlers and leaves the manual one", async () => {
    const p = props();
    render(<MatchPenalties {...p} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Apply all fixes (3)" })); });
    expect(p.onAddSkill).toHaveBeenCalledTimes(2);
    expect(p.onAddSkill).toHaveBeenCalledWith("React", "React");
    expect(p.onAddSkill).toHaveBeenCalledWith("Docker", "Docker");
    expect(p.onApplyFix).toHaveBeenCalledTimes(1);
    expect(p.onApplyFix).toHaveBeenCalledWith("summary", "summary", { deferBlank: true });
  });

  it("is not offered when nothing automatic is left", () => {
    render(<MatchPenalties {...props({ appliedSuggestionIds: ["React", "Docker", "summary"] })} />);
    expect(screen.queryByRole("button", { name: /Apply all fixes/ })).toBeNull();
  });

  it("is not offered in a read-only view", () => {
    render(<MatchPenalties {...props({ readOnly: true })} />);
    expect(screen.queryByRole("button", { name: /Apply all fixes/ })).toBeNull();
  });

  it("keeps the filter where it was", () => {
    render(<MatchPenalties {...props()} />);
    expect(screen.getByRole("combobox", { name: "Filter recommendations" })).toBeTruthy();
  });
});

describe("Apply all fixes: the ones that ask for a number come last", () => {
  const text = (id: string, after: string) => ({
    ...penalty(id, "experience"), before_example: `before ${id}`, after_example: after,
  });
  const rows = () => [
    text("blank_a", "Raised data quality by n%."),
    text("plain_b", "Built reusable components."),
    text("plain_c", "Documented sample-data limitations."),
    text("blank_d", "Handled n+ concurrent users."),
  ];
  const run = async (onApplyFix: (id: string) => Promise<unknown>) => {
    vi.mocked(toast.warning).mockClear();
    vi.mocked(toast.success).mockClear();
    render(<MatchPenalties recommendations onAddSkill={vi.fn()} onApplyFix={onApplyFix as never} onOpenSection={vi.fn()}
      matchResult={{ Match_Penalties: { penalties: rows() } }} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Apply all fixes (4)" })); });
  };

  it("applies the fixes with no blank first, then the blank ones", async () => {
    const order: string[] = [];
    await run(async (id) => { order.push(id); return true; });
    expect(order).toEqual(["plain_b", "plain_c", "blank_a", "blank_d"]);
    expect(toast.success).toHaveBeenCalledWith("All fixes applied.");
  });

  it("a cancelled number prompt skips only that fix; the rest still go through", async () => {
    const order: string[] = [];
    await run(async (id) => { order.push(id); return id !== "blank_a"; });
    expect(order).toEqual(["plain_b", "plain_c", "blank_a", "blank_d"]);   // blank_d still tried after blank_a was cancelled
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(toast.warning).mock.calls[0][0])).toContain("1 fix needs a number");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("two cancelled prompts are reported together", async () => {
    await run(async (id) => !id.startsWith("blank"));
    expect(String(vi.mocked(toast.warning).mock.calls[0][0])).toContain("2 fixes need a number");
  });

  it("a real failure among the plain fixes stops the run before any question is asked", async () => {
    const order: string[] = [];
    await run(async (id) => { order.push(id); return id !== "plain_b"; });
    expect(order).toEqual(["plain_b"]);
    expect(String(vi.mocked(toast.warning).mock.calls[0][0])).toContain("Some fixes were not applied");
  });
});

describe("Apply all fixes: a blank the text check misses (server says needs_number)", () => {
  // after_example carries no n% marker, so only the server's answer tells these need a number.
  const text = (id: string) => ({ ...penalty(id, "experience"), before_example: `before ${id}`, after_example: `Improved ${id} handling.` });
  const rows = () => [text("hidden_a"), text("plain_b"), text("hidden_c")];
  const run = async (onApplyFix: (id: string, category: string, opts?: { deferBlank?: boolean }) => Promise<unknown>) => {
    vi.mocked(toast.warning).mockClear();
    vi.mocked(toast.success).mockClear();
    render(<MatchPenalties recommendations onAddSkill={vi.fn()} onApplyFix={onApplyFix as never} onOpenSection={vi.fn()}
      matchResult={{ Match_Penalties: { penalties: rows() } }} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Apply all fixes (3)" })); });
  };
  const after = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  it("defers them without a prompt in pass one and asks for them in pass two", async () => {
    const calls: string[] = [];
    await run(async (id, _category, opts) => {
      calls.push(`${id}${opts?.deferBlank ? ":defer" : ""}`);
      return id.startsWith("hidden") && opts?.deferBlank ? "needs_number" : true;
    });
    expect(calls).toEqual(["hidden_a:defer", "plain_b:defer", "hidden_c:defer", "hidden_a", "hidden_c"]);
    expect(toast.success).toHaveBeenCalledWith("All fixes applied.");
  });

  it("does not say 'All fixes applied' when the number prompt is cancelled in pass two", async () => {
    await run(async (id, _category, opts) => {
      if (!id.startsWith("hidden")) return true;
      return opts?.deferBlank ? "needs_number" : false;
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(String(vi.mocked(toast.warning).mock.calls[0][0])).toContain("2 fixes need a number");
  });

  it("still asks for the last row's number when the requests take real time", async () => {
    const calls: string[] = [];
    await run(async (id, _category, opts) => {
      calls.push(`${id}${opts?.deferBlank ? ":defer" : ""}`);
      await after(15);
      return id === "hidden_c" && opts?.deferBlank ? "needs_number" : true;
    });
    await act(async () => { await after(120); });
    expect(calls).toEqual(["hidden_a:defer", "plain_b:defer", "hidden_c:defer", "hidden_c"]);
    expect(toast.success).toHaveBeenCalledWith("All fixes applied.");
  });
});
