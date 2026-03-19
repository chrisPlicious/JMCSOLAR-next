"use client"

import { type ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-[0.97] whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-solar-500 hover:bg-solar-400 text-navy-900 font-bold shadow-md hover:shadow-glow-solar",
        primary:
          "bg-solar-500 hover:bg-solar-400 text-navy-900 font-bold shadow-md hover:shadow-glow-solar",
        secondary:
          "bg-navy-900 hover:bg-navy-800 text-white font-bold shadow-md hover:shadow-elevated",
        outline:
          "border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold backdrop-blur-sm",
        ghost: "text-navy-700 hover:text-solar-500 font-medium",
      },
      size: {
        default: "px-7 py-3 text-base rounded-full",
        sm: "px-5 py-2 text-sm rounded-full",
        md: "px-7 py-3 text-base rounded-full",
        lg: "px-8 py-4 text-base rounded-full",
        "icon-sm": "h-7 w-7 rounded-md p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children?: ReactNode
  onClick?: () => void
  href?: string
  className?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
}

function Button({
  variant = "default",
  size = "default",
  children,
  onClick,
  href,
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }))

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  )
}

export { Button, buttonVariants }
export default Button
