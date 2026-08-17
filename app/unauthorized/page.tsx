import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-bold">Not authorized</h1>
      <p className="text-muted-foreground">You don&apos;t have access to this page.</p>
      <Link href={ROUTES.home} className="text-sm underline">
        Back home
      </Link>
    </div>
  );
}
