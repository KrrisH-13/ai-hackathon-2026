import { GoogleAuthButton } from "@/components/forms/GoogleAuthButton";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Log in</h2>
      <GoogleAuthButton />
    </div>
  );
}
