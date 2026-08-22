import Link from "next/link";
import { ROUTES, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: Role;
}

const LINKS_BY_ROLE: Record<Role, { href: string; label: string }[]> = {
  citizen: [
    { href: ROUTES.dashboard("citizen"), label: "AI Copilot" },
    { href: ROUTES.submissions, label: "My submissions" },
  ],
  staff: [
    { href: ROUTES.dashboard("staff"), label: "AI Copilot" },
    { href: ROUTES.submissions, label: "District submissions" },
  ],
  admin: [
    { href: ROUTES.dashboard("admin"), label: "AI Copilot" },
    { href: ROUTES.submissions, label: "All submissions" },
  ],
};

/** Same slate/emerald pill styling as EcopilotSidebar's tabs, for visual consistency. */
export function Sidebar({ role }: SidebarProps) {
  const links = LINKS_BY_ROLE[role];

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-4 md:block">
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-emerald-700 hover:shadow-sm"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
