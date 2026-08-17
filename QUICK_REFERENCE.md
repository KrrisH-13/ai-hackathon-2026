# Quick Reference - Copy & Paste Patterns

**Common code snippets for fast development. Always update types, variable names, and error messages.**

---

## Auth & User

### Get Current User (Server Component)
```typescript
import { createServerComponentClient } from "@supabase/ssr";

export default async function MyPage() {
  const supabase = createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return <div>Loading...</div>;
  
  return <div>Welcome, {user.email}</div>;
}
```

### Get Current User (Browser)
```typescript
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UserProfile() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return user ? <div>{user.email}</div> : <div>Not logged in</div>;
}
```

### Sign Out (Server Action)
```typescript
// app/auth/logout/action.ts
"use server";
import { createServerActionClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = createServerActionClient({ cookies });
  await supabase.auth.signOut();
  redirect("/auth/login");
}
```

---

## Database Queries

### Fetch Data (Server Component)
```typescript
import { createServerComponentClient } from "@supabase/ssr";
import { Submission } from "@/lib/db/types";

export default async function SubmissionsPage() {
  const supabase = createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div>
      {submissions?.map((sub: Submission) => (
        <div key={sub.id}>{sub.title}</div>
      ))}
    </div>
  );
}
```

### Insert Data (Route Handler)
```typescript
// app/api/submissions/route.ts
import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validated = schema.parse(body);

    const { data, error } = await supabase
      .from("submissions")
      .insert([{ ...validated, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (err) {
    console.error("POST /api/submissions:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create" },
      { status: 400 }
    );
  }
}
```

### Update Data (Route Handler)
```typescript
// app/api/submissions/[id]/route.ts
import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const { data, error } = await supabase
      .from("submissions")
      .update(body)
      .eq("id", params.id)
      .eq("user_id", user.id) // Enforce ownership
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (err) {
    console.error("PUT /api/submissions/[id]:", err);
    return Response.json(
      { error: "Failed to update" },
      { status: 400 }
    );
  }
}
```

### Delete Data (Route Handler)
```typescript
// app/api/submissions/[id]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/submissions/[id]:", err);
    return Response.json(
      { error: "Failed to delete" },
      { status: 400 }
    );
  }
}
```

---

## Forms

### Basic Form (React Hook Form + Zod)
```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2),
});

type FormData = z.infer<typeof schema>;

export function MyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      alert("Error submitting form");
      return;
    }

    alert("Success!");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input placeholder="Email" {...register("email")} />
        {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
      </div>
      <div>
        <Input placeholder="Name" {...register("name")} />
        {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
```

---

## Role-Based UI

### Render Component Based on Role
```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/db/types";

export function RoleBasedUI() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
    }

    load();
  }, []);

  if (profile?.role === "admin") {
    return <AdminPanel />;
  }

  if (profile?.role === "staff") {
    return <StaffPanel />;
  }

  return <CitizenView />;
}
```

### Protect Route by Role (Server Component)
```typescript
import { createServerComponentClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/unauthorized");
  }

  return <div>Admin Panel</div>;
}
```

---

## Hooks

### useAuth - Get Current User & Profile
```typescript
// lib/hooks.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/db/types";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }

      setLoading(false);
    }

    load();
  }, []);

  return { user, profile, loading };
}
```

### useOnlineStatus - Detect Online/Offline
```typescript
// lib/hooks.ts
"use client";

import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));

    return () => {
      window.removeEventListener("online", () => setIsOnline(true));
      window.removeEventListener("offline", () => setIsOnline(false));
    };
  }, []);

  return isOnline;
}
```

---

## Styling

### Button Variants (shadcn/ui)
```typescript
import { Button } from "@/components/ui/button";

// Primary
<Button variant="default">Click me</Button>

// Secondary
<Button variant="secondary">Secondary</Button>

// Outline
<Button variant="outline">Outline</Button>

// Ghost
<Button variant="ghost">Ghost</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Layout Patterns
```typescript
// Center content
<div className="flex items-center justify-center h-screen">
  <div>Content</div>
</div>

// Sidebar + Main
<div className="flex gap-4">
  <aside className="w-64 bg-gray-100">Sidebar</aside>
  <main className="flex-1">Main content</main>
</div>

// Card
<div className="p-6 bg-white rounded-lg border shadow">Card content</div>

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</div>
```

---

## Common Patterns

### Loading State
```typescript
"use client";
import { useEffect, useState } from "react";

export function DataList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/data")
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{data && data.map(item => <div key={item.id}>{item.name}</div>)}</div>;
}
```

### Modal/Dialog
```typescript
// Use shadcn/ui Dialog component
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogHeader>
        <p>Dialog content here</p>
      </DialogContent>
    </Dialog>
  );
}
```

### Toast Notifications
```typescript
// Use sonner or react-toastify
import { toast } from "sonner";

export function MyComponent() {
  const handleClick = () => {
    toast.success("Success message");
    toast.error("Error message");
    toast.loading("Loading...");
  };

  return <button onClick={handleClick}>Show Toast</button>;
}
```

---

## Environment Variables

### Access in Server Component
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

### Access in Route Handler
```typescript
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only
```

### Access in Browser Component
```typescript
// Only NEXT_PUBLIC_* variables
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

---

## Debugging

### Console Log with Context
```typescript
console.log("getSubmissions:", { userId, submissionsLength: submissions.length });
console.error("Database error:", { code: error?.code, message: error?.message });
```

### Check RLS Policies
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'submissions';
```

### Test Auth Locally
```typescript
// In browser console
const { data } = await supabase.auth.getUser();
console.log(data.user);
```

### Verify Offline Functionality
```typescript
// Chrome DevTools → Network → Offline
// App should still load cached pages
```

---

## Type Safety

### Define Component Props
```typescript
interface SubmissionCardProps {
  submission: Submission;
  onDelete?: (id: string) => Promise<void>;
  variant?: "compact" | "detailed";
}

export function SubmissionCard({ submission, onDelete, variant = "compact" }: SubmissionCardProps) {
  // ...
}
```

### Export Types from Database
```typescript
// lib/db/types.ts
export type Submission = Database["public"]["Tables"]["submissions"]["Row"];
export type SubmissionInsert = Database["public"]["Tables"]["submissions"]["Insert"];
export type SubmissionUpdate = Database["public"]["Tables"]["submissions"]["Update"];
```

---

## Deployment Checklist

- [ ] Environment variables set in Vercel dashboard
- [ ] Supabase project created and migrations run
- [ ] RLS policies tested with different roles
- [ ] PWA icons generated and placed in `public/icons/`
- [ ] `next build` runs without errors
- [ ] Forms tested end-to-end
- [ ] Offline page loads when offline
- [ ] Responsive design tested on mobile

---

## When Stuck

1. **Check the console** (browser + terminal).
2. **Verify environment variables** match Supabase project settings.
3. **Check auth status** with `supabase.auth.getUser()`.
4. **Test RLS policies** in Supabase dashboard.
5. **Refer to CODING_GUIDELINES.md** for the pattern you're implementing.
6. **Ask Claude** with the specific error and context.
