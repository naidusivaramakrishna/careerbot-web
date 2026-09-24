"use client";
import React, { useState, useRef, useEffect } from "react";
import { useResume } from "../../_context/ResumeContext";
import { STYLE_CATALOGUES } from "../../_utils/templateStyles";
import CatalogueThumbnail, { CATALOGUE_PALETTES, CODE_THUMBNAIL_CATALOGUES } from "@/app/browse-templates/_components/CatalogueThumbnail";
import { useCatalogues } from "@/hooks/useCatalogues";

const NATURAL_W = 300;
const NATURAL_H = 400;

const DENSITY_OPTIONS = [
  { label: "Compact", value: "1.2" },
  { label: "Normal", value: "1.45" },
  { label: "Spacious", value: "1.7" },
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
  const { setResumeStyle, sectionOrder, setSectionOrder, setPreviewCatalogueKey, resumeId } = useResume();
  const { catalogues, getCataloguesMap } = useCatalogues();

  const [selectedKey, setSelectedKey] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem("selected_catalogue") || "galaxy" : "galaxy")
  );
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

  const isSkillsFirst = (() => {
    if (!sectionOrder || sectionOrder.length === 0) return false;
    const si = sectionOrder.indexOf("Skills");
    const wi = sectionOrder.indexOf("Work Experience");
    return si !== -1 && wi !== -1 && si < wi;
  })();

  const handleSkillsFirstToggle = () => {
    const order = sectionOrder && sectionOrder.length > 0 ? [...sectionOrder] : [];
    if (order.length === 0) return;
    const si = order.indexOf("Skills");
    const wi = order.indexOf("Work Experience");
    if (si === -1 || wi === -1) return;

    if (si < wi) {
      // Move Work Experience before Skills
      order.splice(si, 0, order.splice(wi, 1)[0]);
    } else {
      // Move Skills before Work Experience
      order.splice(wi, 0, order.splice(si, 1)[0]);
    }
    setSectionOrder(order);
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
    const key = userEmail ? `sectionOrder_${userEmail}` : "sectionOrder";
    localStorage.setItem(key, JSON.stringify(order));
  };

  const _applyStyleForKey = (key: string, color?: string, persist = false) => {
    const cat = cataloguesMap[key];
    if (!cat) return;
    if (persist) {
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
      styleOverride.headingColor = "#000000";
      if (accent) styleOverride.accentColor = accent;
      setResumeStyle(prev => ({ ...prev, ...styleOverride, sectionHeaderBg: undefined }));
    }
  };

  const cataloguesMap = catalogues.length > 0 ? getCataloguesMap() : STYLE_CATALOGUES;

  const applyCatalogue = (key: string, color?: string) => {
    _applyStyleForKey(key, color, true);
    // Persist catalogue selection to resume via API
    if (resumeId) {
      fetch(`/api/v1/templates/catalogues/${resumeId}/apply?catalogue_key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => console.warn('[CatalogueTab] Failed to persist catalogue:', err));
    }
  };

  const previewCatalogue = (key: string) => _applyStyleForKey(key, undefined, false);

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

  const handleFontChange = (value: string) => {
    setSelectedFont(value);
    localStorage.setItem("selected_font", value);
    setResumeStyle(prev => ({ ...prev, fontFamily: value }));
  };

  return (
    <div className="flex flex-col gap-4 px-1 py-2">

      {/* ── Customize ── */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-gray-800">Customize</h3>

        {/* Density */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Spacing</p>
          <div className="flex gap-1.5">
            {DENSITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleDensityChange(opt.value)}
                className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition ${
                  selectedDensity === opt.value
                    ? "bg-[#2257a7] text-white border-[#2257a7]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Font</p>
          <div className="grid grid-cols-3 gap-1.5">
            {FONT_OPTIONS.map(font => (
              <button
                key={font.value}
                onClick={() => handleFontChange(font.value)}
                style={{ fontFamily: font.value }}
                className={`text-[11px] py-1.5 px-2 rounded-lg border font-medium transition truncate ${
                  selectedFont === font.value
                    ? "bg-[#EEF3FB] text-[#2257a7] border-[#2257a7]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section order */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Section Order</p>
          <button
            onClick={handleSkillsFirstToggle}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition ${
              isSkillsFirst
                ? "bg-[#EEF3FB] text-[#2257a7] border-[#2257a7]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span>Skills before Experience</span>
            <span className={`w-8 h-4 rounded-full transition-colors relative ${isSkillsFirst ? "bg-[#2257a7]" : "bg-gray-200"}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${isSkillsFirst ? "left-4.5" : "left-0.5"}`} />
            </span>
          </button>
        </div>
      </div>

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
                onMouseEnter={() => { setPreviewCatalogueKey(key); previewCatalogue(key); }}
                onMouseLeave={() => { setPreviewCatalogueKey(null); applyCatalogue(selectedKey); }}
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
