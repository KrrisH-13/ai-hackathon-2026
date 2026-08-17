"use client";

import type { ReactNode } from "react";

/**
 * Root client-side provider tree. Empty for now — add context providers
 * here (theme, toasts, query client, etc.) as the app grows.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
