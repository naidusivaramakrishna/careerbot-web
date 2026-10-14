import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="mi-heading"><div><p className="mi-eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="mi-description">{description}</p>}</div>{action && <div className="mi-heading-actions">{action}</div>}</header>;
}

export function PanelHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mi-panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}
