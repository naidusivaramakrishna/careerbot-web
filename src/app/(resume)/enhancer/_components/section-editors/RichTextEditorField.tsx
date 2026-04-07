"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { setSafeInnerHTML } from "@/lib/setSafeInnerHTML";

interface RichTextEditorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditorField({
  label,
  value,
  onChange,
  placeholder = "Enter text here...",
  minHeight = "140px",
}: RichTextEditorFieldProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUserTyping = useRef(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    bulletList: false,
    numberedList: false,
  });

  useEffect(() => {
    if (editorRef.current && !isUserTyping.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        setSafeInnerHTML(editorRef.current, value || "");
      }
    }
  }, [value]);

  // Close color picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const updateFormatState = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikethrough: document.queryCommandState("strikeThrough"),
      bulletList: document.queryCommandState("insertUnorderedList"),
      numberedList: document.queryCommandState("insertOrderedList"),
    });
  }, []);

  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML || "");
    }
    updateFormatState();
  };

  const handleFocus = () => { isUserTyping.current = true; updateFormatState(); };
  const handleBlur = () => { isUserTyping.current = false; };
  const handleKeyUp = () => updateFormatState();
  const handleMouseUp = () => updateFormatState();

  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateFormatState();
    handleContentChange();
  };

  const applyColor = (color: string) => {
    setShowColorPicker(false);
    execFormat("foreColor", color);
  };

  const colors = [
    "#4A90E2", "#5CB85C", "#F0C040", "#E8873A", "#E05C5C", "#9B59B6",
    "#2563EB", "#16A34A", "#CA8A04", "#EA580C", "#DC2626", "#7C3AED",
    "#1E40AF", "#15803D", "#A16207", "#C2410C", "#B91C1C", "#6D28D9",
    "#1E3A5F", "#14532D", "#713F12", "#7C2D12", "#7F1D1D", "#3B0764",
    "#FFFFFF", "#D1D5DB", "#9CA3AF", "#6B7280", "#374151", "#111827",
  ];

  /* ---------- BUTTON STYLES ---------- */
  const btn = (active: boolean, extraClass = "") =>
    `relative flex items-center justify-center w-8 h-8 rounded-md text-sm transition-all select-none
    ${extraClass}
    ${active
      ? "bg-gray-200 text-gray-900 shadow-inner"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  const Divider = () => <div className="w-px h-5 bg-gray-200 mx-0.5 flex-shrink-0" />;

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold mb-2 text-gray-700">
          {label}
        </label>
      )}

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-[#2557a7] focus-within:border-2 transition-all duration-150">
        {/* ===== TOOLBAR ===== */}
        <div className="flex items-center gap-0.5 px-2.5 py-1.5 border-b border-gray-100 bg-white flex-wrap">

          {/* Bold */}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat("bold"); }}
            className={btn(activeFormats.bold, "font-bold text-base")} title="Bold (Ctrl+B)">
            B
          </button>

          {/* Italic */}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat("italic"); }}
            className={btn(activeFormats.italic, "italic font-serif text-base")} title="Italic (Ctrl+I)">
            I
          </button>

          {/* Underline */}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat("underline"); }}
            className={btn(activeFormats.underline, "underline text-base")} title="Underline (Ctrl+U)">
            U
          </button>

          <Divider />

          {/* Align Left */}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat("justifyLeft"); }}
            className={btn(false)} title="Align left">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M3 6h18M3 10h12M3 14h18M3 18h12" />
            </svg>
          </button>

          {/* Bullet List */}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat("insertUnorderedList"); }}
            className={btn(activeFormats.bulletList)} title="Bullet list">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="4" cy="7" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4" cy="17" r="1.5" fill="currentColor" stroke="none" />
              <path strokeLinecap="round" d="M8 7h13M8 12h13M8 17h13" />
            </svg>
          </button>

          {/* Numbered List */}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat("insertOrderedList"); }}
            className={btn(activeFormats.numberedList)} title="Numbered list">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M10 7h11M10 12h11M10 17h11" />
              <text x="2" y="8" fontSize="5" fill="currentColor" stroke="none" fontWeight="700">1</text>
              <text x="2" y="13" fontSize="5" fill="currentColor" stroke="none" fontWeight="700">2</text>
              <text x="2" y="18" fontSize="5" fill="currentColor" stroke="none" fontWeight="700">3</text>
            </svg>
          </button>

          {/* Strikethrough */}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat("strikeThrough"); }}
            className={btn(activeFormats.strikethrough)} title="Strikethrough">
            <span className="line-through text-sm font-medium">ab</span>
          </button>

          <Divider />

          {/* Text Color */}
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setShowColorPicker((v) => !v); }}
              className={`${btn(showColorPicker)} flex-col gap-0 px-1`}
              title="Text color"
            >
              <span className="text-sm font-bold leading-none" style={{ color: "#111827" }}>A</span>
              <span className="w-4 h-1 rounded-full mt-0.5 block" style={{ background: "#E05C5C" }} />
            </button>

            {showColorPicker && (
              <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-48">
                <div className="grid grid-cols-6 gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); applyColor(c); }}
                      className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform flex-shrink-0"
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Undo */}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat("undo"); }}
            className={btn(false)} title="Undo (Ctrl+Z)">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4" />
            </svg>
          </button>

          {/* Redo */}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execFormat("redo"); }}
            className={btn(false)} title="Redo (Ctrl+Y)">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v1M21 10l-4-4M21 10l-4 4" />
            </svg>
          </button>
        </div>

        {/* ===== EDITOR ===== */}
        <div
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyUp={handleKeyUp}
          onMouseUp={handleMouseUp}
          onSelect={updateFormatState}
          className="w-full px-4 py-3 text-sm leading-6 outline-none text-gray-900 focus:ring-0 bg-white empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
          data-placeholder={placeholder}
          style={{
            minHeight,
            userSelect: "text",
            WebkitUserSelect: "text",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
          role="textbox"
          aria-label={label}
        />

      </div>
    </div>
  );
}
