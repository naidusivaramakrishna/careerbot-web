"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./KeywordAnalysis.module.css";

type Status = "matched" | "missing" | "partial";
type Priority = "High" | "Medium" | "Low" | "Not provided";
type KeywordRow = { keyword: string; status: Status; priority: Priority };
type DataRecord = Record<string, unknown>;
const record = (value: unknown): DataRecord => value && typeof value === "object" ? value as DataRecord : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const skillName = (value: unknown) => typeof value === "string" ? value.trim() : typeof record(value).skill === "string" ? String(record(value).skill).trim() : "";
const priorityRank: Record<Priority, number> = { High: 3, Medium: 2, Low: 1, "Not provided": 0 };

export function keywordRows(matchResult: unknown): KeywordRow[] {
  const match = record(matchResult);
  const tech = record(match.Technical_Skills_Check ?? match.Technical_Skills);
  const soft = record(match.Soft_Skills_Check ?? match.Soft_Skills);
  const penalties = list(record(match.Match_Penalties).penalties).map(record);
  const rows = new Map<string, KeywordRow>();
  const add = (values: unknown, status: Status, priority?: Priority) => {
    for (const value of list(values)) {
      const keyword = skillName(value);
      if (!keyword) continue;
      const key = keyword.toLocaleLowerCase();
      const severity = penalties.find(p => typeof p.target === "string" && p.target.trim().toLocaleLowerCase() === key)?.severity;
      // Priority describes action needed: an already matched keyword needs no fix.
      const resolved: Priority = status === "matched" ? "Low" : priority ?? (severity === "critical" ? "High" : severity === "important" ? "Medium" : severity === "nice_to_have" ? "Low" : "Not provided");
      const previous = rows.get(key);
      if (!previous || (previous.status === "missing" && status === "matched")) {
        rows.set(key, { keyword, status, priority: resolved });
      } else if (previous.status === status && priorityRank[resolved] > priorityRank[previous.priority]) {
        rows.set(key, { ...previous, priority: resolved });
      }
    }
  };
  add(tech.matched_critical_skills, "matched");
  add(tech.matched_important_skills, "matched");
  add(tech.matched_nice_to_have, "matched");
  add(soft.matched_skills, "matched");
  add(tech.missing_critical_skills, "missing", "High");
  add(tech.missing_important_skills, "missing", "Medium");
  add(tech.missing_nice_to_have, "missing", "Low");
  add(soft.missing_skills, "missing");
  // The current matcher contract has no partial-match collection. Never infer
  // partial matches from similar words or manufacture the reference's count.
  return [...rows.values()].sort((a, b) => Number(a.status !== "matched") - Number(b.status !== "matched"));
}

const statusLabels: Record<Status, string> = { matched: "Matched", missing: "Missing", partial: "Partial Match" };

export default function KeywordAnalysis({ matchResult }: { matchResult: unknown }) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const rows = useMemo(() => keywordRows(matchResult), [matchResult]);
  const filtered = rows.filter(row => filter === "all" || row.status === filter);
  const cards: { status: Status; label: string; description: string }[] = [
    {status: "matched", label: "Matched Keywords", description: "Present in your resume"},
    {status: "missing", label: "Missing Keywords", description: "Not found in your resume"},
    {status: "partial", label: "Partial Matches", description: "No partial matches reported"},
  ];
  return <section className={styles.panel} aria-labelledby="keyword-analysis-title">
    <header className={styles.header}>
      <div><h2 id="keyword-analysis-title">Keyword Analysis</h2><p>Key skills and terms from the job description and their presence in your resume.</p></div>
      <div className={styles.filter}><select aria-label="Filter keywords" value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option value="all">All Keywords</option><option value="matched">Matched Keywords</option><option value="missing">Missing Keywords</option><option value="partial">Partial Matches</option></select><ChevronDown aria-hidden="true" size={16}/></div>
    </header>
    <div className={styles.summary}>{cards.map(card => <article key={card.status} data-status={card.status}><h3>{card.label}</h3><strong>{rows.filter(row => row.status === card.status).length}</strong><p>{card.description}</p></article>)}</div>
    <div className={styles.tableScroll}><table className={styles.table}>
      <thead><tr><th scope="col">#</th><th scope="col">Keyword</th><th scope="col">Match Status</th><th scope="col">Priority</th><th scope="col">Source</th></tr></thead>
      <tbody>{filtered.map((row, index) => <tr key={row.keyword.toLocaleLowerCase()}><td>{index + 1}</td><th scope="row">{row.keyword}</th><td><span className={styles.badge} data-status={row.status}>{statusLabels[row.status]}</span></td><td><span className={styles.badge} data-priority={row.priority}>{row.priority === "Not provided" ? "—" : row.priority}</span></td><td>Job Description</td></tr>)}</tbody>
    </table>{!filtered.length && <p className={styles.empty} role="status">{filter === "partial" ? "Partial matches were not reported by this analysis." : filter === "all" ? "No keywords were returned for this analysis." : `No ${filter} keywords found.`}</p>}</div>
    <footer className={styles.footer} role="status">Showing {filtered.length}{filter !== "all" ? ` of ${rows.length}` : ""} {filtered.length === 1 && filter === "all" ? "keyword" : "keywords"}</footer>
  </section>;
}
