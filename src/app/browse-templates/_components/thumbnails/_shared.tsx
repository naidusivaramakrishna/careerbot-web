export const COLOR_TEXT = '#1f2937'
export const COLOR_NAME = '#0f172a'
export const COLOR_DIVIDER = '#cbd5e1'

export function SkillRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: '5.5px', marginBottom: '1.5px', lineHeight: 1.45 }}>
      <span style={{ fontWeight: 'bold' }}>{label}:</span>
      <span style={{ marginLeft: '3px' }}>{value}</span>
    </div>
  )
}
