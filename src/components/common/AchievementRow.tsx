import React from "react";

export interface AchievementRowData {
  title?: string;
  date?: string;
  description?: string;
}

interface AchievementRowProps {
  achievement: AchievementRowData;
  formatDate: (value?: string) => string;
  /** The template's own body text style (font, size, colour); applied to every part of the row. */
  textStyle: React.CSSProperties;
  /** Draws the description (HTML) the way the template already draws descriptions. */
  renderDescription: (html: string) => React.ReactNode;
  /** The template's own list bullet (a dash in some templates). */
  bullet?: string;
  /** Space below the row, matching the template's other list rows. */
  spacing?: string;
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

const stripTags = (html: string): string =>
  html
    .replace(/<\/(li|p|div)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();

/**
 * One achievement in the live preview, identical in every template: a bullet,
 * the achievement text in regular weight, its year/date at the right edge, and
 * any description indented under the text.
 *
 * The achievement text is a sentence ("Secured first place in ..."), not a
 * heading, so it is not bold. Entries used to switch between two layouts
 * depending on whether they had a date or description (plain bullet vs. bold
 * title with a separate date line), which left one section with mixed
 * alignment and weight.
 */
export default function AchievementRow({
  achievement, formatDate, textStyle, renderDescription, bullet = "•", spacing = "4px",
}: AchievementRowProps) {
  const description = (achievement.description ?? "").trim();
  // A description-only entry: its text is the achievement itself.
  const title = (achievement.title ?? "").trim() || (description ? stripTags(description) : "");
  const showDescription = Boolean(description) && Boolean((achievement.title ?? "").trim());
  const date = achievement.date ? formatDate(achievement.date) : "";

  return (
    <div data-bullet-row="achievement" style={{ marginBottom: spacing, breakInside: "avoid", pageBreakInside: "avoid", ...textStyle }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <span aria-hidden="true" style={{ flexShrink: 0 }}>{bullet}</span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <span>{title}</span>
          {date ? <span style={{ whiteSpace: "nowrap" }}>{date}</span> : null}
        </div>
      </div>
      {showDescription ? <div style={{ marginLeft: "16px" }}>{renderDescription(description)}</div> : null}
    </div>
  );
}
