"use client";
import React, { useState, useRef, useEffect } from "react";
import { useResume } from "../../_context/ResumeContext";
import { STYLE_CATALOGUES } from "../../_utils/templateStyles";
import CatalogueThumbnail, { CATALOGUE_PALETTES, CODE_THUMBNAIL_CATALOGUES } from "@/app/browse-templates/_components/CatalogueThumbnail";

const NATURAL_W = 300;
const NATURAL_H = 400;

function ScaledThumbnail({ catalogueKey, customColor }: { catalogueKey: string; customColor?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.43);

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.offsetWidth;
    setScale(w / NATURAL_W);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden" style={{ aspectRatio: `${NATURAL_W}/${NATURAL_H}` }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${NATURAL_W}px`,
          height: `${NATURAL_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <CatalogueThumbnail catalogueKey={catalogueKey} customColor={customColor} />
      </div>
    </div>
  );
}

export default function CatalogueTab() {
  const { setResumeStyle } = useResume();

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

  const applyCatalogue = (key: string, color?: string) => {
    const cat = STYLE_CATALOGUES[key];
    if (!cat) return;
    setSelectedKey(key);
    localStorage.setItem("selected_catalogue", key);
    const styleOverride = { ...cat.style } as Record<string, string>;
    if (key === "eclipse") {
      const bg = color ?? selectedBg[key] ?? CATALOGUE_PALETTES[key]?.defaultColor;
      if (bg) {
        setResumeStyle(prev => ({ ...prev, ...styleOverride, sectionHeaderBg: bg, accentColor: undefined }));
        localStorage.setItem("selected_section_bg", bg);
      } else {
        setResumeStyle(prev => ({ ...prev, ...styleOverride, accentColor: undefined }));
      }
    } else if (["galaxy", "amber", "ocean", "ember"].includes(key)) {
      // These catalogues apply palette color ONLY to name + section headers.
      // headingColor stays dark so job titles, education degrees, etc. remain neutral.
      const accent = color ?? selectedBg[key] ?? CATALOGUE_PALETTES[key]?.defaultColor;
      styleOverride.headingColor = "#1A1A1A";
      if (accent) styleOverride.accentColor = accent;
      setResumeStyle(prev => ({ ...prev, ...styleOverride }));
    } else {
      // All other catalogues apply palette color to all heading-level elements.
      const accent = color ?? selectedBg[key] ?? CATALOGUE_PALETTES[key]?.defaultColor;
      if (accent) styleOverride.headingColor = accent;
      setResumeStyle(prev => ({ ...prev, ...styleOverride, accentColor: undefined }));
    }
  };

  const handleColorPick = (key: string, color: string) => {
    setSelectedBg(prev => ({ ...prev, [key]: color }));
    localStorage.setItem(`selected_color_${key}`, color);
    if (key === "eclipse") localStorage.setItem("selected_section_bg", color);
    applyCatalogue(key, color);
  };

  return (
    <div className="flex flex-col gap-4 px-1 py-2">
      <div>
        <h3 className="text-sm font-bold text-gray-800">Choose a Style</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Select a colour theme to apply to your resume instantly.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(STYLE_CATALOGUES).map(([key, catalogue]) => {
          const isSelected = selectedKey === key;
          const hasCodeThumbnail = CODE_THUMBNAIL_CATALOGUES.has(key);
          const paletteInfo = CATALOGUE_PALETTES[key];
          const colorForThumbnail = hoverBg[key] ?? selectedBg[key] ?? paletteInfo?.defaultColor;
          const primarySwatch = catalogue.swatches[0];

          return (
            <div key={key} className="group flex flex-col">
              <div
                className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                style={{
                  boxShadow: isSelected
                    ? `0 0 0 2px ${primarySwatch}, 0 8px 24px ${primarySwatch}25`
                    : "0 1px 4px rgba(0,0,0,0.08)",
                  transform: isSelected ? "translateY(-2px)" : undefined,
                }}
                onClick={() => applyCatalogue(key)}
              >
                {/* Thumbnail — scaled to show full resume content */}
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

              {/* Label */}
              <p className={`text-[11px] font-bold mt-1.5 px-0.5 transition-colors ${isSelected ? "text-[#2257a7]" : "text-slate-700"}`}>
                {catalogue.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
