export default function OfflinePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-muted-foreground">Check your connection and try again.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Some features are available offline (cached pages).
      </p>
    </div>
  );
}
