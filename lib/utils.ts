import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge the custom theme tokens from app/globals.css. Without
// this, `text-h1` is read as a text *colour* and `cn('text-h1', 'text-white')`
// silently drops the size; likewise `shadow-soft` would be read as a shadow
// colour.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "h1", "h2", "h3", "title", "lead"],
      radius: ["control", "card", "panel"],
      shadow: ["soft", "card", "card-hover", "elevated", "glow-solar"],
      color: ["fg", "fg-muted", "fg-subtle", "line", "solar-ink"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
