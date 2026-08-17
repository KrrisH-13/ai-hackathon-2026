import Link from "next/link";
import { ROUTES, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: Role;
}

const LINKS_BY_ROLE: Record<Role, { href: string; label: string }[]> = {
  citizen: [
    { href: ROUTES.dashboard("citizen"), label: "Dashboard" },
    { href: ROUTES.submissions, label: "My submissions" },
  ],
  staff: [
    { href: ROUTES.dashboard("staff"), label: "Dashboard" },
    { href: ROUTES.submissions, label: "District submissions" },
  ],
  admin: [
    { href: ROUTES.dashboard("admin"), label: "Dashboard" },
    { href: ROUTES.submissions, label: "All submissions" },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const links = LINKS_BY_ROLE[role];

  return (
    <aside className="hidden w-56 shrink-0 border-r px-3 py-4 md:block">
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
