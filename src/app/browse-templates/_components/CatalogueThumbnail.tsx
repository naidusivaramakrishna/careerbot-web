"use client"
import React from "react"
import Image from "next/image"
import { STYLE_CATALOGUES } from "@/app/(resume)/builder/creation/_utils/templateStyles"
import { EclipseThumbnail } from "./thumbnails/EclipseThumbnail"
import { CrimsonThumbnail } from "./thumbnails/CrimsonThumbnail"
import { GalaxyThumbnail } from "./thumbnails/GalaxyThumbnail"
import { ForestThumbnail } from "./thumbnails/ForestThumbnail"
import { SlateThumbnail } from "./thumbnails/SlateThumbnail"
import { PillarThumbnail } from "./thumbnails/PillarThumbnail"
import { AmberThumbnail } from "./thumbnails/AmberThumbnail"
import { OceanThumbnail } from "./thumbnails/OceanThumbnail"
import { AetherThumbnail } from "./thumbnails/AetherThumbnail"
import { EmberThumbnail } from "./thumbnails/EmberThumbnail"

export const ECLIPSE_DEFAULT_SECTION_BG = '#ececec'

export const ECLIPSE_PALETTE = [
  '#ececec', // neutral gray (default)
  '#fde2e2', // soft pink
  '#dbeafe', // soft blue
  '#dcfce7', // soft green
  '#fed7aa', // soft peach
]

export const CRIMSON_DEFAULT_ACCENT = '#0f172a'

export const CRIMSON_PALETTE = [
  '#1a1a1a', // black
  '#dc2626', // red
  '#e11d48', // rose
  '#db2777', // pink
  '#9333ea', // purple
  '#f97316', // orange
]

export const GALAXY_DEFAULT_ACCENT = '#0f172a'

export const GALAXY_PALETTE = [
  '#1a1a1a', // black
  '#1d4ed8', // blue
  '#4f46e5', // indigo
  '#7c3aed', // violet
  '#0369a1', // sky blue
  '#6366f1', // periwinkle
]

export const FOREST_DEFAULT_ACCENT = '#0f172a'

export const FOREST_PALETTE = [
  '#1a1a1a', // black
  '#16a34a', // green
  '#0d9488', // teal
  '#059669', // emerald
  '#166534', // dark green
  '#0891b2', // cyan
]

export const SLATE_DEFAULT_ACCENT = '#0f172a'

export const SLATE_PALETTE = [
  '#1a1a1a', // black
  '#475569', // slate
  '#334155', // dark slate
  '#374151', // gray
  '#4f46e5', // indigo
  '#0369a1', // blue
]

export const PILLAR_DEFAULT_ACCENT = '#0f172a'

export const PILLAR_PALETTE = [
  '#1a1a1a', // black
  '#1d4ed8', // blue
  '#7c3aed', // purple
  '#16a34a', // green
  '#dc2626', // red
  '#0369a1', // sky
]

export const AMBER_DEFAULT_ACCENT = '#0f172a'
export const AMBER_PALETTE = [
  '#1a1a1a', // black
  '#b45309', // amber
  '#d97706', // yellow-orange
  '#ea580c', // orange
  '#c2410c', // dark orange
  '#92400e', // dark amber
]

export const OCEAN_DEFAULT_ACCENT = '#0f172a'
export const OCEAN_PALETTE = [
  '#1a1a1a', // black
  '#0369a1', // blue
  '#0891b2', // sky
  '#0e7490', // dark cyan
  '#2563eb', // bright blue
  '#0d9488', // teal
]

export const AETHER_DEFAULT_ACCENT = '#0f172a'
export const AETHER_PALETTE = [
  '#1a1a1a', // black
  '#475569', // slate
  '#374151', // gray
  '#1e293b', // dark slate
  '#4f46e5', // indigo
  '#0369a1', // blue
]

export const EMBER_DEFAULT_ACCENT = '#0f172a'
export const EMBER_PALETTE = [
  '#1a1a1a', // black
  '#ea580c', // orange
  '#dc2626', // red
  '#d97706', // amber
  '#b45309', // dark amber
  '#c2410c', // dark orange
]

export const CATALOGUE_PALETTES: Record<string, { palette: string[]; defaultColor: string }> = {
  eclipse: { palette: ECLIPSE_PALETTE, defaultColor: ECLIPSE_DEFAULT_SECTION_BG },
  crimson: { palette: CRIMSON_PALETTE, defaultColor: CRIMSON_DEFAULT_ACCENT },
  galaxy: { palette: GALAXY_PALETTE, defaultColor: GALAXY_DEFAULT_ACCENT },
  forest: { palette: FOREST_PALETTE, defaultColor: FOREST_DEFAULT_ACCENT },
  slate: { palette: SLATE_PALETTE, defaultColor: SLATE_DEFAULT_ACCENT },
  pillar: { palette: PILLAR_PALETTE, defaultColor: PILLAR_DEFAULT_ACCENT },
  amber: { palette: AMBER_PALETTE, defaultColor: AMBER_DEFAULT_ACCENT },
  ocean: { palette: OCEAN_PALETTE, defaultColor: OCEAN_DEFAULT_ACCENT },
  aether: { palette: AETHER_PALETTE, defaultColor: AETHER_DEFAULT_ACCENT },
  ember: { palette: EMBER_PALETTE, defaultColor: EMBER_DEFAULT_ACCENT },
}

export const CODE_THUMBNAIL_CATALOGUES = new Set([
  'eclipse', 'crimson', 'galaxy', 'forest', 'slate', 'pillar',
  'amber', 'ocean', 'aether', 'ember',
])

interface Props {
  catalogueKey: string
  fallbackImage?: string
  customColor?: string
}

export default function CatalogueThumbnail({ catalogueKey, fallbackImage, customColor }: Props) {
  if (catalogueKey === 'eclipse') return <EclipseThumbnail sectionBgColor={customColor} />
  if (catalogueKey === 'crimson') return <CrimsonThumbnail accentColor={customColor} />
  if (catalogueKey === 'galaxy') return <GalaxyThumbnail accentColor={customColor} />
  if (catalogueKey === 'forest') return <ForestThumbnail accentColor={customColor} />
  if (catalogueKey === 'slate') return <SlateThumbnail accentColor={customColor} />
  if (catalogueKey === 'pillar') return <PillarThumbnail accentColor={customColor} />
  if (catalogueKey === 'amber') return <AmberThumbnail accentColor={customColor} />
  if (catalogueKey === 'ocean') return <OceanThumbnail accentColor={customColor} />
  if (catalogueKey === 'aether') return <AetherThumbnail accentColor={customColor} />
  if (catalogueKey === 'ember') return <EmberThumbnail accentColor={customColor} />

  const catalogue = STYLE_CATALOGUES[catalogueKey]
  return (
    <Image
      src={catalogue?.preview_url || fallbackImage || '/assets/templates/template-1.png'}
      alt={catalogue?.label || 'Template'}
      fill
      className="object-contain"
    />
  )
}
