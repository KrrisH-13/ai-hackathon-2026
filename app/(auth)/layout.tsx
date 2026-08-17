import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-xl font-semibold">{APP_NAME}</h1>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
