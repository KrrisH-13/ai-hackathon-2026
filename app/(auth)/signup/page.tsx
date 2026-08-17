import Link from "next/link";
import { SignupForm } from "@/components/forms/SignupForm";
import { ROUTES } from "@/lib/constants";

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Sign up</h2>
      <SignupForm />
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
