"use client";
import React, { useRef, useState } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { GripVertical, LayoutGrid } from "lucide-react";
import { sectionIcons } from "../../_utils/sectionsConfig";

interface SectionOrderPanelProps {
  /** The resume's sections in their current order (the same list the Editor tab shows). */
  sections: { name: string }[];
  /** Called with the finished move; it must update the shared section order. */
  onReorder: (result: DropResult) => void;
}

const toResult = (from: number, to: number) =>
  ({ source: { index: from, droppableId: "section-order" }, destination: { index: to, droppableId: "section-order" } }) as DropResult;

/**
 * Customize › Section Order. Drag a row (or focus its handle and press the arrow keys) to move a
 * section; the order is the one the preview and the PDF / DOCX export use, and it is the same
 * order the Editor tab lists the sections in.
 *
 * Pointer events are used directly instead of a drag-and-drop library, so dragging works inside
 * the page's nested scroll containers and on touch screens.
 */
const SectionOrderPanel: React.FC<SectionOrderPanelProps> = ({ sections, onReorder }) => {
  const listRef = useRef<HTMLUListElement>(null);
  // While dragging: where the grabbed row started and where it currently sits
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);

  const names = sections.map((s) => s.name);
  const shown = [...names];
  if (drag) {
    const [moved] = shown.splice(drag.from, 1);
    shown.splice(drag.over, 0, moved);
  }

  const indexAt = (clientY: number, fallback: number) => {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("li[data-row]") ?? []);
    if (!rows.length) return fallback;
    for (let i = 0; i < rows.length; i += 1) {
      const rect = rows[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return rows.length - 1;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>, from: number) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ from, over: from });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!drag) return;
    const over = indexAt(e.clientY, drag.over);
    if (over !== drag.over) setDrag({ from: drag.from, over });
  };

  const finish = (commit: boolean) => {
    if (drag && commit && drag.over !== drag.from) onReorder(toResult(drag.from, drag.over));
    setDrag(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>, index: number) => {
    const to = e.key === "ArrowUp" ? index - 1 : e.key === "ArrowDown" ? index + 1 : index;
    if (to === index || to < 0 || to >= names.length) return;
    e.preventDefault();
    onReorder(toResult(index, to));
    // keep focus on the moved row's handle after the list re-renders
    const name = names[index];
    requestAnimationFrame(() =>
      listRef.current?.querySelector<HTMLElement>(`[data-handle="${CSS.escape(name)}"]`)?.focus(),
    );
  };

  return (
    <div className="rounded-xl border border-[#e3e9f2] bg-white p-4">
      <h3 className="text-[15px] font-bold text-gray-900">Manage section order</h3>
      <p className="mt-1 text-xs text-gray-600">
        Drag and drop to reorder the sections. The order will be reflected in the resume preview.
      </p>

      <ul ref={listRef} className="mt-3 flex select-none flex-col gap-1.5" aria-label="Section order">
        {shown.map((name, index) => {
          const Icon = sectionIcons[name] ?? LayoutGrid;
          const isDragging = drag !== null && drag.over === index;
          const originalIndex = names.indexOf(name);
          return (
            <li key={name} data-row>
            <div
              data-handle={name}
              role="button"
              tabIndex={0}
              aria-label={`Drag to move ${name}`}
              onPointerDown={(e) => onPointerDown(e, originalIndex)}
              onPointerMove={onPointerMove}
              onPointerUp={() => finish(true)}
              onPointerCancel={() => finish(false)}
              onKeyDown={(e) => onKeyDown(e, originalIndex)}
              style={{ touchAction: "none" }}
              className={`flex w-full items-center gap-2 outline-none focus-visible:[&>div]:border-[#1d4fa8] ${
                drag ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <span className="flex h-8 w-6 shrink-0 items-center justify-center text-gray-800" aria-hidden="true">
                <GripVertical size={16} />
              </span>
              <div
                className={`flex min-w-0 flex-1 items-center gap-4 rounded-lg border bg-white px-4 py-1.5 text-[13px] text-gray-900 transition-shadow ${
                  isDragging
                    ? "border-[#9db9e6] shadow-[0_8px_24px_rgba(29,79,168,0.18)]"
                    : "border-[#e3e9f2]"
                }`}
              >
                <Icon size={18} className="shrink-0 text-gray-900" aria-hidden="true" />
                <span className="truncate">{name}</span>
              </div>
            </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SectionOrderPanel;
