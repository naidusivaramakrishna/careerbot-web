"use client";
import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { STYLE_CATALOGUES } from "../../_utils/templateStyles";
import CatalogueThumbnail, { CATALOGUE_PALETTES, CODE_THUMBNAIL_CATALOGUES } from "@/app/browse-templates/_components/CatalogueThumbnail";
import { useCatalogues } from "@/hooks/useCatalogues";
import { createCataloguePersister } from "@/app/(resume)/templates/_utils/cataloguePersister";
import logger from "@/lib/logger";

const NATURAL_W = 300;
const NATURAL_H = 400;

// Line spacing choices (the value is sent to the preview and the export as the line height)
const LINE_SPACING_OPTIONS = ["1.0", "1.15", "1.2", "1.3", "1.45", "1.6", "1.7", "1.8", "2.0"];

// Layout settings. Both the live preview and the PDF/DOCX export apply them (backend: font_size, page_margin,
// section_spacing, alignment). An empty value leaves the template's own setting.
const FONT_SIZE_OPTIONS = [
  { label: "Template default", value: "" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "10", value: "10" },
  { label: "10.5", value: "10.5" },
  { label: "11", value: "11" },
  { label: "12", value: "12" },
];
const PAGE_MARGIN_OPTIONS = [
  { label: "Narrow", value: "narrow" },
  { label: "Normal", value: "normal" },
  { label: "Wide", value: "wide" },
];
const SECTION_SPACING_OPTIONS = [
  { label: "Compact", value: "compact" },
  { label: "Medium", value: "medium" },
  { label: "Relaxed", value: "relaxed" },
];
const ALIGNMENT_OPTIONS = [
  { label: "Template default", value: "" },
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

type LayoutSettingKey = "fontSize" | "pageMargin" | "sectionSpacing" | "alignment";
const LAYOUT_STORAGE_KEYS: Record<LayoutSettingKey, string> = {
  fontSize: "selected_font_size",
  pageMargin: "selected_page_margin",
  sectionSpacing: "selected_section_spacing",
  alignment: "selected_alignment",
};
// Kept per user, like the resumeStyle_<email> they feed (another account on this browser must not get them)
const layoutStorageKey = (key: LayoutSettingKey): string => {
  const userEmail = localStorage.getItem("userEmail");
  return userEmail ? `${LAYOUT_STORAGE_KEYS[key]}_${userEmail}` : LAYOUT_STORAGE_KEYS[key];
};
const readLayoutSetting = (key: LayoutSettingKey): string =>
  (typeof window !== "undefined" ? localStorage.getItem(layoutStorageKey(key)) : null) || "";

// Colour themes: one accent colour for headings and highlights
const COLOR_THEMES = [
  { label: "Blue", value: "#1d4fa8" },
  { label: "Green", value: "#1f9d55" },
  { label: "Red", value: "#dc2f3a" },
  { label: "Gray", value: "#4b5563" },
  { label: "Black", value: "#111827" },
];

const FONT_OPTIONS = [
  { label: "Arial", value: "arial" },
  { label: "Helvetica", value: "helvetica" },
  { label: "Calibri", value: "calibri" },
  { label: "Times New Roman", value: "times new roman" },
  { label: "Georgia", value: "georgia" },
  { label: "Garamond", value: "garamond" },
];

const ATS_BADGE: Record<string, { label: string; classes: string }> = {
  safe:     { label: "ATS Safe",     classes: "bg-green-100 text-green-700" },
  friendly: { label: "ATS Friendly", classes: "bg-blue-100 text-blue-700" },
  creative: { label: "Creative",     classes: "bg-amber-100 text-amber-700" },
};

function SelectField({
  label, value, onChange, children,
}: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full appearance-none rounded-md border border-[#d5deec] bg-white pl-3 pr-8 text-[13px] text-gray-900 outline-none focus:border-[#1d4fa8]"
        >
          {children}
        </select>
        <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
      </span>
    </label>
  );
}

const sectionCard = "rounded-xl border border-[#e3e9f2] bg-white p-4";

function ScaledThumbnail({ catalogueKey, customColor }: { catalogueKey: string; customColor?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.offsetWidth;
    const h = containerRef.current.offsetHeight;
    const scaleW = w / NATURAL_W;
    const scaleH = h / NATURAL_H;
    setScale(Math.min(scaleW, scaleH));
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ aspectRatio: `${NATURAL_W}/${NATURAL_H}` }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${NATURAL_W}px`,
          height: `${NATURAL_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <CatalogueThumbnail catalogueKey={catalogueKey} customColor={customColor} />
      </div>
    </div>
  );
}

export default function CatalogueTab() {
  const { setResumeStyle, setPreviewCatalogueKey, resumeId, resumeSource, resumeStyle } = useResume();
  const { catalogues, getCataloguesMap } = useCatalogues();

  const [selectedKey, setSelectedKey] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem("selected_catalogue") || "galaxy" : "galaxy")
  );
  // Whether a style was really chosen. With none saved (e.g. after a template was applied, which removes
  // selected_catalogue), "galaxy" above is only the card shown by default and must not be applied or saved.
  const [styleChosen, setStyleChosen] = useState<boolean>(
    () => typeof window !== "undefined" && !!localStorage.getItem("selected_catalogue")
  );
  // The look before a style card was hovered while no style is chosen; leaving the card restores it.
  // styleOutsideHoverRef follows resumeStyle except while a card is hovered, so moving straight from one card
  // to the next (before a re-render) still restores the look from before any hover.
  const hoveringRef = useRef(false);
  const styleOutsideHoverRef = useRef(resumeStyle);
  useEffect(() => {
    if (!hoveringRef.current) styleOutsideHoverRef.current = resumeStyle;
  }, [resumeStyle]);
  const [hoverBg, setHoverBg] = useState<Record<string, string | undefined>>({});
  const [selectedBg, setSelectedBg] = useState<Record<string, string | undefined>>(() => {
    if (typeof window === "undefined") return {};
    const result: Record<string, string | undefined> = {};
    for (const key of Object.keys(CATALOGUE_PALETTES)) {
      const saved = localStorage.getItem(`selected_color_${key}`);
      if (saved) result[key] = saved;
    }
    const legacy = localStorage.getItem("selected_section_bg");
    if (legacy && !result.eclipse) result.eclipse = legacy;
    return result;
  });

  const [selectedDensity, setSelectedDensity] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem("selected_density") || "" : "")
  );
  const [selectedFont, setSelectedFont] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem("selected_font") || "" : "")
  );
  const [layoutSettings, setLayoutSettings] = useState<Record<LayoutSettingKey, string>>(() => ({
    fontSize: readLayoutSetting("fontSize"),
    pageMargin: readLayoutSetting("pageMargin"),
    sectionSpacing: readLayoutSetting("sectionSpacing"),
    alignment: readLayoutSetting("alignment"),
  }));

  const _applyStyleForKey = (key: string, color?: string, persist = false) => {
    const cat = cataloguesMap[key];
    if (!cat) return;
    if (persist) {
      setStyleChosen(true);
      setSelectedKey(key);
      localStorage.setItem("selected_catalogue", key);
    }
    // API catalogues (useCatalogues) carry `typography`/`colors`/`styling`, not the
    // ResumeStyle-shaped `style`; the builder style always comes from STYLE_CATALOGUES.
    const styleOverride = { ...(STYLE_CATALOGUES[key]?.style ?? {}) } as Record<string, string>;

    // Re-apply user's manual density/font overrides on top of the catalogue defaults
    const density = localStorage.getItem("selected_density");
    if (density) styleOverride.lineSpacing = density;
    const font = localStorage.getItem("selected_font");
    if (font) styleOverride.fontFamily = font;
    for (const key of Object.keys(LAYOUT_STORAGE_KEYS) as LayoutSettingKey[]) {
      const saved = localStorage.getItem(layoutStorageKey(key));
      if (saved) styleOverride[key] = saved;
    }

    if (key === "eclipse") {
      const bg = color ?? selectedBg[key] ?? CATALOGUE_PALETTES[key]?.defaultColor;
      if (bg) {
        setResumeStyle(prev => ({ ...prev, ...styleOverride, sectionHeaderBg: bg, accentColor: undefined }));
        if (persist) localStorage.setItem("selected_section_bg", bg);
      } else {
        setResumeStyle(prev => ({ ...prev, ...styleOverride, accentColor: undefined }));
      }
    } else {
      const accent = color ?? selectedBg[key] ?? CATALOGUE_PALETTES[key]?.defaultColor;
      if (accent) styleOverride.accentColor = accent;
      setResumeStyle(prev => ({ ...prev, ...styleOverride, sectionHeaderBg: undefined }));
    }
  };

  // List only API catalogues that have a local style: the builder style, the
  // preview and the export's catalogue template_id all come from STYLE_CATALOGUES.
  const renderableApiCatalogues = catalogues.length > 0
    ? Object.fromEntries(Object.entries(getCataloguesMap()).filter(([key]) => key in STYLE_CATALOGUES))
    : {};
  const cataloguesMap = Object.keys(renderableApiCatalogues).length > 0 ? renderableApiCatalogues : STYLE_CATALOGUES;

  // Regular vs enhanced endpoint, request ordering and coalescing live in the
  // shared persister (also used by the /templates page).
  const [persistToResume] = useState(() =>
    createCataloguePersister((err) => logger.warn('[CatalogueTab] Failed to persist catalogue:', err))
  );

  const persistCatalogue = (key: string) => {
    if (!resumeId) return;
    persistToResume(resumeId, key, resumeSource === "enhanced");
  };

  const applyCatalogue = (key: string, color?: string) => {
    _applyStyleForKey(key, color, true);
    persistCatalogue(key);
  };

  const previewCatalogue = (key: string) => _applyStyleForKey(key, undefined, false);

  const previewStyleCard = (key: string) => {
    hoveringRef.current = true;
    previewCatalogue(key);
  };

  const endStylePreview = () => {
    hoveringRef.current = false;
    if (styleChosen) previewCatalogue(selectedKey);
    else setResumeStyle(styleOutsideHoverRef.current);
  };

  // Color Theme: with a style chosen, re-apply it in the new colour; with none, change only the accent colour.
  const handleThemePick = (color: string) => {
    if (styleChosen) {
      handleColorPick(selectedKey, color);
      return;
    }
    setResumeStyle(prev => ({ ...prev, accentColor: color }));
  };

  const handleColorPick = (key: string, color: string) => {
    setSelectedBg(prev => ({ ...prev, [key]: color }));
    localStorage.setItem(`selected_color_${key}`, color);
    if (key === "eclipse") localStorage.setItem("selected_section_bg", color);
    applyCatalogue(key, color);
  };

  const handleDensityChange = (value: string) => {
    setSelectedDensity(value);
    localStorage.setItem("selected_density", value);
    setResumeStyle(prev => ({ ...prev, lineSpacing: value }));
  };

  const handleLayoutChange = (key: LayoutSettingKey, value: string) => {
    setLayoutSettings(prev => ({ ...prev, [key]: value }));
    if (value) localStorage.setItem(layoutStorageKey(key), value);
    else localStorage.removeItem(layoutStorageKey(key));
    setResumeStyle(prev => ({ ...prev, [key]: value || undefined }));
  };

  const handleFontChange = (value: string) => {
    setSelectedFont(value);
    localStorage.setItem("selected_font", value);
    setResumeStyle(prev => ({ ...prev, fontFamily: value }));
  };

  // The colour theme in use: the accent (or, for Eclipse, the section header colour) of the current style
  const activeAccent = (resumeStyle?.sectionHeaderBg || resumeStyle?.accentColor || "").toLowerCase();
  const activeTheme = COLOR_THEMES.find((theme) => theme.value.toLowerCase() === activeAccent)?.value;
  const fontValue = selectedFont || resumeStyle?.fontFamily || FONT_OPTIONS[0].value;
  const lineSpacingValue = selectedDensity || resumeStyle?.lineSpacing || "1.3";
  const lineSpacingChoices = LINE_SPACING_OPTIONS.includes(lineSpacingValue)
    ? LINE_SPACING_OPTIONS
    : [...LINE_SPACING_OPTIONS, lineSpacingValue].sort((x, y) => Number(x) - Number(y));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#e3e9f2] bg-white p-4">
      <div>
        <h3 className="text-[15px] font-bold text-gray-900">Customize the look and feel</h3>
        <p className="mt-0.5 text-xs text-gray-600">Adjust fonts, colors and layout to match your style. Changes will be reflected in the preview.</p>
      </div>

      {/* ── Typography ── */}
      <section className={sectionCard} aria-label="Typography">
        <h4 className="text-sm font-bold text-gray-900">Typography</h4>
        <p className="mt-0.5 text-xs text-gray-600">Set the font family, size and line spacing for your resume.</p>
        <div className="mt-3 flex gap-3">
          <SelectField label="Font Family" value={fontValue} onChange={handleFontChange}>
            {!FONT_OPTIONS.some((font) => font.value === fontValue) && <option value={fontValue}>{fontValue}</option>}
            {FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</option>
            ))}
          </SelectField>
          <SelectField label="Font Size" value={layoutSettings.fontSize} onChange={(value) => handleLayoutChange("fontSize", value)}>
            {FONT_SIZE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </SelectField>
          <SelectField label="Line Spacing" value={lineSpacingValue} onChange={handleDensityChange}>
            {lineSpacingChoices.map((value) => <option key={value} value={value}>{value}</option>)}
          </SelectField>
        </div>
      </section>

      {/* ── Color Theme ── */}
      <section className={sectionCard} aria-label="Color Theme">
        <h4 className="text-sm font-bold text-gray-900">Color Theme</h4>
        <p className="mt-0.5 text-xs text-gray-600">Choose a color to highlight headings and accents.</p>
        <div role="radiogroup" aria-label="Color theme" className="mt-3 flex gap-5">
          {COLOR_THEMES.map((theme) => {
            const isActive = activeTheme === theme.value;
            return (
              <button
                key={theme.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={theme.label}
                onClick={() => handleThemePick(theme.value)}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition ${
                    isActive ? "ring-2 ring-offset-2" : "ring-1 ring-transparent hover:ring-gray-300 hover:ring-offset-2"
                  }`}
                  style={{ backgroundColor: theme.value, ...(isActive ? { ["--tw-ring-color" as string]: theme.value } : {}) }}
                >
                  {isActive && <Check size={16} strokeWidth={3} />}
                </span>
                <span className={`text-xs ${isActive ? "font-semibold text-gray-900" : "text-gray-700"}`}>{theme.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Layout ── */}
      <section className={sectionCard} aria-label="Layout">
        <h4 className="text-sm font-bold text-gray-900">Layout</h4>
        <p className="mt-0.5 text-xs text-gray-600">Adjust page layout and spacing for a clean and professional look.</p>
        <div className="mt-3 flex gap-3">
          <SelectField label="Page Margin" value={layoutSettings.pageMargin || "normal"} onChange={(value) => handleLayoutChange("pageMargin", value)}>
            {PAGE_MARGIN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </SelectField>
          <SelectField label="Section Spacing" value={layoutSettings.sectionSpacing || "medium"} onChange={(value) => handleLayoutChange("sectionSpacing", value)}>
            {SECTION_SPACING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </SelectField>
          <SelectField label="Content Alignment" value={layoutSettings.alignment} onChange={(value) => handleLayoutChange("alignment", value)}>
            {ALIGNMENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </SelectField>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ── Style ── */}
      <div>
        <h3 className="text-sm font-bold text-gray-800">Choose a Style</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Select a colour theme to apply to your resume instantly.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(cataloguesMap).map(([key, catalogue]) => {
          const isSelected = selectedKey === key;
          const hasCodeThumbnail = CODE_THUMBNAIL_CATALOGUES.has(key);
          const paletteInfo = CATALOGUE_PALETTES[key];
          const colorForThumbnail = hoverBg[key] ?? selectedBg[key] ?? paletteInfo?.defaultColor;
          const primarySwatch = catalogue.accent_swatches?.[0] || catalogue.swatches?.[0] || '#000000';
          const atsLevel = catalogue.ats_level || catalogue.atsLevel;
          const atsBadge = ATS_BADGE[atsLevel];

          return (
            <div key={key} className="group flex flex-col">
              <div
                data-testid={`catalogue-card-${key}`}
                className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                style={{
                  boxShadow: isSelected
                    ? `0 0 0 2px ${primarySwatch}, 0 8px 24px ${primarySwatch}25`
                    : "0 1px 4px rgba(0,0,0,0.08)",
                  transform: isSelected ? "translateY(-2px)" : undefined,
                }}
                onClick={() => applyCatalogue(key)}
                onMouseEnter={() => { setPreviewCatalogueKey(key); previewStyleCard(key); }}
                onMouseLeave={() => { setPreviewCatalogueKey(null); endStylePreview(); }}
              >
                <div className="relative">
                  <ScaledThumbnail catalogueKey={key} customColor={colorForThumbnail} />

                  {isSelected && (
                    <div
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow z-10"
                      style={{ backgroundColor: primarySwatch }}
                    >
                      ✓
                    </div>
                  )}

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-center pb-2 pointer-events-none">
                    <div
                      className="rounded-md px-2 py-1 text-[10px] font-semibold text-white shadow"
                      style={{ backgroundColor: isSelected ? primarySwatch : "#1e293b" }}
                    >
                      {isSelected ? "✓ Selected" : "Select"}
                    </div>
                  </div>
                </div>

                {/* Colour dots footer */}
                <div className="px-2 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1">
                  {hasCodeThumbnail && paletteInfo ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {paletteInfo.palette.slice(0, 5).map(color => {
                        const isSel = selectedBg[key] === color || (!selectedBg[key] && color === paletteInfo.defaultColor);
                        return (
                          <button
                            key={color}
                            aria-label={`Select colour ${color}`}
                            onMouseEnter={() => setHoverBg(prev => ({ ...prev, [key]: color }))}
                            onMouseLeave={() => setHoverBg(prev => ({ ...prev, [key]: undefined }))}
                            onClick={e => { e.stopPropagation(); handleColorPick(key, color); }}
                            className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-all ${
                              isSel
                                ? "ring-2 ring-[#2257a7] ring-offset-1 scale-110"
                                : "ring-1 ring-slate-200 hover:scale-110 hover:ring-slate-400"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-medium">Mono</span>
                  )}
                </div>
              </div>

              {/* Label + ATS badge */}
              <div className="flex items-center justify-between mt-1.5 px-0.5 gap-1">
                <p className={`text-[11px] font-bold transition-colors truncate ${isSelected ? "text-[#2257a7]" : "text-slate-700"}`}>
                  {catalogue.label}
                </p>
                {atsBadge && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${atsBadge.classes}`}>
                    {atsBadge.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
