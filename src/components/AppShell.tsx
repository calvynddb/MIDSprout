"use client";

import dynamic from "next/dynamic";

const SpatialCanvas = dynamic(
  () => import("@/components/SpatialCanvas").then((mod) => mod.SpatialCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="canopy-bg flex h-screen w-screen items-center justify-center text-sm text-slate-500">
        Opening the canopy…
      </div>
    ),
  },
);

export function AppShell() {
  return <SpatialCanvas />;
}
