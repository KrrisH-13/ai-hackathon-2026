"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupFormData) {
    setFormError(null);
    const supabase = createClient();

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    if (!signUpData.session) {
      setConfirmationSent(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (confirmationSent) {
    return (
      <p className="text-sm text-muted-foreground">
        Check your inbox to confirm your email, then log in.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input type="email" placeholder="Email" {...register("email")} />
        {errors.email && <span className="text-sm text-destructive">{errors.email.message}</span>}
      </div>
      <div>
        <Input type="password" placeholder="Password" {...register("password")} />
        {errors.password && <span className="text-sm text-destructive">{errors.password.message}</span>}
      </div>
      <div>
        <Input type="password" placeholder="Confirm password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <span className="text-sm text-destructive">{errors.confirmPassword.message}</span>
        )}
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing up..." : "Sign up"}
      </Button>
    </form>
  );
}
