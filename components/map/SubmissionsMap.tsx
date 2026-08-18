"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Read-only overview map: one pin per submission, with a popup showing
 * its title/status. Dynamic + ssr:false — see SubmissionsMapImpl.tsx.
 */
export const SubmissionsMap = dynamic(() => import("./SubmissionsMapImpl"), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-lg" />,
});
