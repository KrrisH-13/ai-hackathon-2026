import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";
import { ROUTES } from "@/lib/constants";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Log in</h2>
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.signup} className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
