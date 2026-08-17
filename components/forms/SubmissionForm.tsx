"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submissionSchema, type SubmissionFormData } from "@/lib/validation";
import { API_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SubmissionForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
  });

  async function onSubmit(data: SubmissionFormData) {
    setFormError(null);

    try {
      const res = await fetch(API_ROUTES.submissions, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to submit");
      }

      reset();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setFormError(message);
      console.error("SubmissionForm submit error:", message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input placeholder="Title" {...register("title")} />
        {errors.title && <span className="text-sm text-destructive">{errors.title.message}</span>}
      </div>
      <div>
        <Textarea placeholder="Describe the issue" {...register("description")} />
        {errors.description && (
          <span className="text-sm text-destructive">{errors.description.message}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            type="number"
            step="any"
            placeholder="Latitude"
            {...register("latitude", { valueAsNumber: true })}
          />
          {errors.latitude && <span className="text-sm text-destructive">{errors.latitude.message}</span>}
        </div>
        <div>
          <Input
            type="number"
            step="any"
            placeholder="Longitude"
            {...register("longitude", { valueAsNumber: true })}
          />
          {errors.longitude && (
            <span className="text-sm text-destructive">{errors.longitude.message}</span>
          )}
        </div>
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
