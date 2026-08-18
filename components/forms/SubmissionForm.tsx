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
import { LocationPicker } from "@/components/map/LocationPicker";

export function SubmissionForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const location =
    typeof latitude === "number" && typeof longitude === "number" ? { latitude, longitude } : null;

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
      <div className="space-y-2">
        <p className="text-sm font-medium">Location</p>
        <p className="text-sm text-muted-foreground">
          Click on the map or search for an address to set where this is happening.
        </p>
        <LocationPicker
          value={location}
          onChange={({ latitude, longitude }) => {
            setValue("latitude", latitude, { shouldValidate: true });
            setValue("longitude", longitude, { shouldValidate: true });
          }}
        />
        {location && (
          <p className="text-xs text-muted-foreground">
            Selected: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </p>
        )}
        {(errors.latitude || errors.longitude) && (
          <span className="text-sm text-destructive">Please select a location on the map.</span>
        )}
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
