import { type ComponentPropsWithRef, type ElementType } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Surfaces. `interactive` is for whole-card links; `link-row` is the compact
 * list tile (locations, related services). For a card that *is* a link, put
 * `cardVariants(...)` on the <Link> itself.
 */
const cardVariants = cva("", {
  variants: {
    variant: {
      default: "rounded-card border border-line bg-white shadow-soft",
      interactive:
        "rounded-card border border-line bg-white shadow-soft transition-[box-shadow,transform,border-color] duration-300 ease-out-quart hover:-translate-y-1 hover:border-solar-300 hover:shadow-card-hover",
      tint: "rounded-card bg-navy-50",
      dark: "surface-dark rounded-card border border-white/10 bg-navy-900",
      "link-row":
        "group flex items-center gap-4 rounded-control border border-line bg-white px-4 py-3.5 transition-colors duration-200 hover:border-solar-300 hover:bg-solar-50",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-6 sm:p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "none",
  },
})

type CardProps<T extends ElementType> = VariantProps<typeof cardVariants> & {
  as?: T
} & Omit<ComponentPropsWithRef<T>, "as">

function Card<T extends ElementType = "div">({ as, variant, padding, className, ...props }: CardProps<T>) {
  const Component: ElementType = as ?? "div"
  return <Component className={cn(cardVariants({ variant, padding }), className)} {...props} />
}

export { Card, cardVariants }
export default Card
