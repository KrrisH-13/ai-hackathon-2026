import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/auth";
import { APP_NAME, APP_DESCRIPTION, ROUTES } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const profile = await getProfile();

  if (profile) {
    redirect(ROUTES.dashboard(profile.role));
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold">{APP_NAME}</h1>
        <p className="mt-2 text-muted-foreground">{APP_DESCRIPTION}</p>
      </div>
      <div className="flex gap-3">
        <Link href={ROUTES.login} className={cn(buttonVariants({ variant: "default" }))}>
          Log in
        </Link>
        <Link href={ROUTES.signup} className={cn(buttonVariants({ variant: "outline" }))}>
          Sign up
        </Link>
      </div>
    </div>
  );
}
