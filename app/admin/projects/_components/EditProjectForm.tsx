"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProjectAction } from "../actions";
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

type Project = {
  id: string;
  title: string;
  category: string;
  system_size: string | null;
  description: string | null;
  location: string | null;
  city_slug?: string | null;
  facebook_url: string | null;
  cover_image_path: string | null;
  completed_at: string | null;
};

export default function EditProjectForm({ project }: { project: Project }) {
  const updateWithId = updateProjectAction.bind(null, project.id);
  const [state, formAction, isPending] = useActionState(updateWithId, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success("Project updated successfully");
      router.push("/admin/projects");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div>
      <AdminFormHeader title="Edit Project" backHref="/admin/projects" />

      <AdminFormCard className="mb-24">
        <FormErrorBanner>{state?.error}</FormErrorBanner>

        <form id="main-form" action={formAction} className="space-y-5">
          <FormSection title="Basic Information" />

          <Field id="title" label="Title" required>
            <Input name="title" defaultValue={project.title ?? ""} />
          </Field>

          <Field id="category" label="Category" required>
            <Select name="category" defaultValue={project.category ?? ""}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="city_slug" label="City / Area">
            <Select name="city_slug" defaultValue={project.city_slug ?? ""}>
              <option value="">Other / unlisted</option>
              {LOCATIONS.filter((l) => l.tier === 'municipality').map((loc) => (
                <option key={loc.slug} value={loc.slug}>
                  {loc.name}{loc.province ? ` — ${loc.province}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="location" label="Location Detail">
            <Input
              name="location"
              placeholder="e.g. Brgy Cogon, Ormoc City"
              defaultValue={project.location ?? ""}
            />
          </Field>

          <Field id="system_size" label="System Size">
            <Input name="system_size" placeholder="e.g. 10 kWp" defaultValue={project.system_size ?? ""} />
          </Field>

          <Field id="completed_at" label="Date Completed" hint="Month and year the project was completed">
            <Input name="completed_at" type="month" defaultValue={project.completed_at?.slice(0, 7) ?? ""} />
          </Field>

          <FormSection title="Details" />

          <Field id="description" label="Description">
            <Textarea name="description" rows={4} defaultValue={project.description ?? ""} />
          </Field>

          <Field id="facebook_url" label="Facebook Post URL">
            <Input
              name="facebook_url"
              type="url"
              placeholder="https://facebook.com/..."
              defaultValue={project.facebook_url ?? ""}
            />
          </Field>

          <FormSection title="Media" />

          <div>
            <Label>Add New Photos</Label>
            <DragDropImageUploader name="images" />
            <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm text-fg-muted">
              <input
                type="checkbox"
                name="set_as_cover"
                value="true"
                className="w-4 h-4 accent-solar-500"
              />
              Set first new image as cover
            </label>
          </div>
        </form>
      </AdminFormCard>

      <StickySaveBar cancelHref="/admin/projects" pending={isPending} label="Update Project" />
    </div>
  );
}
