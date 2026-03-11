"use client";

import { Suspense } from "react";
import EnhancerPage from "./_components/EnhancerPage";

export default function Enhancer() {
  return (
    <Suspense>
      <EnhancerPage />
    </Suspense>
  );
}