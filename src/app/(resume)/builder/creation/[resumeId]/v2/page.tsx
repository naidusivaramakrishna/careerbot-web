import { redirect } from "next/navigation";

type Props = { params: Promise<{ resumeId: string }> };

/**
 * v2 is an unfinished visual prototype: its export and persistence actions
 * are not wired to the production resume APIs. Keep the canonical editor as
 * the only supported public flow until v2 is feature-complete.
 */
export default async function Page({ params }: Props) {
  const { resumeId } = await params;
  redirect(`/builder/creation/${encodeURIComponent(resumeId)}`);
}
