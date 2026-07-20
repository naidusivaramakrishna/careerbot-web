import { Suspense } from "react";
import JobsContents from "./_components/JobsContents";

export default function JobsLoginPage() {
  return (
    <Suspense fallback={null}>
      <JobsContents />
    </Suspense>
  );
}
