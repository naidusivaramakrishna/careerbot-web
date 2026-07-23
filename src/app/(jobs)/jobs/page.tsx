import { Suspense } from "react";
import JobsContents from "./_components/JobsContents";

export default function JobsPage() {
  return (
    <Suspense>
      <JobsContents />
    </Suspense>
  );
}
