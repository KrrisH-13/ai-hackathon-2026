import Link from "next/link";
import { Sparkles } from "lucide-react";
import { APP_NAME, ROUTES } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/logout/action";

interface HeaderProps {
  userEmail?: string;
  role?: Role;
}

/** Same gradient-badge logo treatment as EcopilotSidebar, so /submissions still reads as one product. */
export function Header({ userEmail, role }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <Link href={role ? ROUTES.dashboard(role) : ROUTES.home} className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900">{APP_NAME}</span>
        </Link>

        <div className="flex items-center gap-3">
          {userEmail && <span className="hidden text-sm text-slate-500 sm:inline">{userEmail}</span>}
          {userEmail ? (
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          ) : (
            <Link href={ROUTES.login} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
