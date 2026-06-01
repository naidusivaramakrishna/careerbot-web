import OverviewClient from "../_components/OverviewClient";

export default async function JobMatchAppPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="w-full">
      <OverviewClient sessionId={params.session} />
    </div>
  );
}
