import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ resumeId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * v2 is an unfinished visual prototype: its export and persistence actions
 * are not wired to the production resume APIs. Keep the canonical editor as
 * the only supported public flow until v2 is feature-complete.
 */
export default async function Page({ params, searchParams }: Props) {
  const { resumeId } = await params;
  // The canonical editor reads its mode from the query (source=enhanced, from_ats, open_section, return_to): keep it.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries((await searchParams) ?? {})) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  }
  const search = query.toString();
  redirect(`/builder/creation/${encodeURIComponent(resumeId)}${search ? `?${search}` : ""}`);
}
