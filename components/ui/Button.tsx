import { type ComponentPropsWithRef, type ReactNode } from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * The only button in the system. Every variant is a pill (DESIGN.md).
 * - `href` starting with "/" or "#" renders next/link (client navigation,
 *   no full reload); any other `href` renders a plain <a>.
 * - Focus styling comes from the global :focus-visible ring.
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full whitespace-nowrap select-none transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out-quart active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-solar-500 font-bold text-navy-950 shadow-soft hover:bg-solar-400 hover:shadow-glow-solar",
        secondary:
          "bg-navy-900 font-bold text-white shadow-soft hover:bg-navy-800 hover:shadow-elevated",
        outline:
          "border-2 border-navy-900/15 bg-white font-semibold text-navy-900 hover:border-navy-900/40 hover:bg-navy-50",
        "outline-dark":
          "border-2 border-white/30 font-semibold text-white hover:border-white/60 hover:bg-white/10",
        ghost: "font-semibold text-fg hover:bg-fg/5",
        link: "font-semibold text-solar-ink underline-offset-4 hover:underline",
        danger: "bg-red-600 font-bold text-white shadow-soft hover:bg-red-700",
        // Legacy alias kept so older call sites keep compiling.
        default:
          "bg-solar-500 font-bold text-navy-950 shadow-soft hover:bg-solar-400 hover:shadow-glow-solar",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-13 px-8 text-base",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
        inline: "h-auto p-0",
        // Legacy alias.
        default: "h-11 px-6 text-base",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    compoundVariants: [
      { variant: "link", className: "active:scale-100" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

type ButtonStyleProps = VariantProps<typeof buttonVariants> & {
  className?: string
  children?: ReactNode
  /** Shows a spinner and blocks interaction. */
  loading?: boolean
}

type ButtonAsButton = ButtonStyleProps &
  Omit<ComponentPropsWithRef<"button">, "className" | "children"> & { href?: undefined }

type ButtonAsLink = ButtonStyleProps &
  Omit<ComponentPropsWithRef<"a">, "className" | "children" | "href"> & { href: string }

export type ButtonProps = ButtonAsButton | ButtonAsLink

function isInternal(href: string) {
  return href.startsWith("/") || href.startsWith("#")
}

function Button(props: ButtonProps) {
  const { variant, size, fullWidth, className, children, loading = false, ...rest } = props
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className)
  const content = (
    <>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </>
  )

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest as Omit<ButtonAsLink, keyof ButtonStyleProps>
    // Links can't be `disabled`: aria-disabled + pointer-events-none (base
    // classes) block the click, and tabIndex -1 takes it out of the tab order.
    const ariaDisabled = loading || undefined
    const tabIndex = loading ? -1 : anchorProps.tabIndex
    if (isInternal(href)) {
      return (
        <Link href={href} className={classes} aria-disabled={ariaDisabled} {...anchorProps} tabIndex={tabIndex}>
          {content}
        </Link>
      )
    }
    return (
      <a href={href} className={classes} aria-disabled={ariaDisabled} {...anchorProps} tabIndex={tabIndex}>
        {content}
      </a>
    )
  }

  const { type = "button", disabled, ...buttonProps } = rest as Omit<ButtonAsButton, keyof ButtonStyleProps>
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...buttonProps}
    >
      {content}
    </button>
  )
}

export { Button, buttonVariants }
export default Button
