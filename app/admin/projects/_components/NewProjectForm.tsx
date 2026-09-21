"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProjectAction } from "../actions";
import DragDropImageUploader from "./DragDropImageUploader";
import { LOCATIONS } from "@/data/locations";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/Field";
import {
  AdminFormCard, AdminFormHeader, FormErrorBanner, FormSection, StickySaveBar,
} from "../../_components/AdminForm";

const categories = [
  "residential",
  "commercial",
  "industrial",
  "agricultural",
];

export default function NewProjectForm() {
  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    {},
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success("Project created successfully");
      router.push("/admin/projects");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div>
      <AdminFormHeader title="New Project" backHref="/admin/projects" />

      <AdminFormCard className="mb-24">
        <FormErrorBanner>{state?.error}</FormErrorBanner>

        <form id="main-form" action={formAction} className="space-y-5">
          <FormSection title="Basic Information" />

          <Field id="title" label="Title" required>
            <Input name="title" />
          </Field>

          <Field id="category" label="Category" required>
            <Select name="category">
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="city_slug" label="City / Area">
            <Select name="city_slug">
              <option value="">Other / unlisted</option>
              {LOCATIONS.filter((l) => l.tier === 'municipality').map((loc) => (
                <option key={loc.slug} value={loc.slug}>
                  {loc.name}{loc.province ? ` — ${loc.province}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="location" label="Location Detail">
            <Input name="location" placeholder="e.g. Brgy Cogon, Ormoc City" />
          </Field>

          <Field id="system_size" label="System Size">
            <Input name="system_size" placeholder="e.g. 10 kWp" />
          </Field>

          <Field id="completed_at" label="Completed At" hint="Month and year the project was completed">
            <Input name="completed_at" type="month" />
          </Field>

          <FormSection title="Details" />

          <Field id="description" label="Description">
            <Textarea name="description" rows={4} />
          </Field>

          <Field id="facebook_url" label="Facebook Post URL">
            <Input name="facebook_url" type="url" placeholder="https://facebook.com/..." />
          </Field>

          <FormSection title="Media" />

          <div>
            <Label>Project Photos</Label>
            <DragDropImageUploader name="images" />
          </div>
        </form>
      </AdminFormCard>

      <StickySaveBar cancelHref="/admin/projects" pending={isPending} label="Create Project" />
    </div>
  );
}
