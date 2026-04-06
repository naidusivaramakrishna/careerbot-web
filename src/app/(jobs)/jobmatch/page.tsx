import React from "react";
import OverviewClient from "./_components/OverviewClient";

export default function JobMatchPage({
  searchParams,
}: {
  searchParams: { session?: string };
}) {
  return (
    <div className="w-full">
      <OverviewClient sessionId={searchParams.session} />
    </div>
  );
}
