import React from "react";
import { act, render, cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MatchPenalties, { getFixImpactCounts, hasAutomaticFixes, type ApplyAllHandle } from "@/app/(jobs)/jobmatch/_components/analysis/MatchPenalties";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
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
