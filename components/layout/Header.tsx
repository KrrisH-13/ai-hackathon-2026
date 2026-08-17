import Link from "next/link";
import { APP_NAME, ROUTES } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/logout/action";

interface HeaderProps {
  userEmail?: string;
  role?: Role;
}

export function Header({ userEmail, role }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3 md:px-6">
      <Link href={role ? ROUTES.dashboard(role) : ROUTES.home} className="text-lg font-semibold">
        {APP_NAME}
      </Link>

      <div className="flex items-center gap-3">
        {userEmail && <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail}</span>}
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
    </header>
  );
}
